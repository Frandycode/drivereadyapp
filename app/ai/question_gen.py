# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""
AI Question Generation Pipeline
================================
Flow:
  1. Check DB first — if enough questions exist for the chapter/difficulty, return them
  2. Only call Claude if DB is below the minimum threshold
  3. All Claude-generated questions are saved to DB immediately (source='ai_generated')
  4. Next request for the same chapter/difficulty hits DB, never Claude again

This means Claude is called ONCE per coverage gap, not per user request.
Token cost is a one-time seeding cost, not a recurring per-user cost.
"""

import asyncio
import uuid
import logging
from typing import Literal

import anthropic
import instructor
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import Question, Answer
from app.config import settings

logger = logging.getLogger(__name__)

# ── Pydantic models for structured AI output (via Instructor) ─────────────────

class GeneratedAnswer(BaseModel):
    text: str = Field(description="The answer text, concise and clear")
    is_correct: bool = Field(description="Whether this is a correct answer")


class GeneratedQuestion(BaseModel):
    question_text: str = Field(description="The question to ask the student")
    answers: list[GeneratedAnswer] = Field(
        min_length=4,
        max_length=6,
        description="Answer options. Exactly 1 to 2 should be correct.",
    )
    correct_count: int = Field(
        ge=1, le=2,
        description="How many answers are correct (1 for single-select, 2 for multi-select)",
    )
    explanation: str = Field(
        description="Clear explanation of why the correct answer(s) are right. 1-2 sentences."
    )
    hint_text: str = Field(
        description="A hint that narrows the answer without giving it away. 1 sentence."
    )
    difficulty: Literal["pawn", "rogue", "king"] = Field(
        description="pawn=easy/factual, rogue=requires reasoning, king=nuanced/edge-case"
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Relevant tags e.g. ['signs', 'right_of_way', 'speed_limits']"
    )


class GeneratedQuestionBatch(BaseModel):
    questions: list[GeneratedQuestion] = Field(
        description="List of generated questions"
    )


# ── Coverage thresholds — minimum questions per chapter/difficulty ─────────────
MIN_QUESTIONS_PER_DIFFICULTY = {
    "pawn": 20,
    "rogue": 20,
    "king": 10,
}
TARGET_QUESTIONS_PER_DIFFICULTY = {
    "pawn": 30,
    "rogue": 30,
    "king": 15,
}


# ── Main generation functions ─────────────────────────────────────────────────

async def get_or_generate_questions(
    db: AsyncSession,
    state_code: str,
    chapter: int,
    difficulty: str,
    count: int,
    exclude_ids: list[str] | None = None,
) -> list[Question]:
    """
    DB-first question retrieval.

    1. Query DB for available questions matching filters
    2. If enough questions exist → return them (no AI call)
    3. If below threshold → trigger background generation, return what we have
    4. Never blocks a user session waiting for AI generation
    """
    stmt = (
        select(Question)
        .where(
            Question.state_code == state_code,
            Question.chapter == chapter,
            Question.difficulty == difficulty,
        )
    )
    if exclude_ids:
        stmt = stmt.where(Question.id.not_in(exclude_ids))

    result = await db.execute(stmt)
    available = list(result.scalars().all())

    # Check if we're below the minimum threshold (background generation trigger)
    total_count_result = await db.execute(
        select(func.count(Question.id)).where(
            Question.state_code == state_code,
            Question.chapter == chapter,
            Question.difficulty == difficulty,
        )
    )
    total_in_db = total_count_result.scalar_one()
    min_threshold = MIN_QUESTIONS_PER_DIFFICULTY.get(difficulty, 20)

    if total_in_db < min_threshold:
        # Schedule background generation — don't block the user
        logger.info(
            f"Below threshold for ch{chapter}/{difficulty}: "
            f"{total_in_db}/{min_threshold}. Scheduling generation."
        )
        # Import here to avoid circular imports
        from app.tasks.celery_app import app as celery_app
        celery_app.send_task(
            "app.tasks.ai.generate_questions_for_chapter",
            kwargs={
                "state_code": state_code,
                "chapter": chapter,
                "difficulty": difficulty,
                "target": TARGET_QUESTIONS_PER_DIFFICULTY.get(difficulty, 30),
                "existing_count": total_in_db,
            },
        )

    import random
    random.shuffle(available)
    return available[:count]


async def generate_and_save_questions(
    db: AsyncSession,
    state_code: str,
    chapter: int,
    difficulty: str,
    chapter_context: str,
    count: int = 10,
) -> list[Question]:
    """
    Call Claude via Instructor → get structured questions → save to DB.

    This is ONLY called when:
    - Running the initial seed script
    - Celery background job detects coverage gap
    - Admin manually triggers generation

    NEVER called per user request.
    """
    if not settings.anthropic_api_key:
        logger.warning("ANTHROPIC_API_KEY not set — skipping AI generation")
        return []

    client = instructor.from_anthropic(anthropic.Anthropic(api_key=settings.anthropic_api_key))

    difficulty_guidance = {
        "pawn": "factual recall, directly stated in the manual, single correct answer",
        "rogue": "requires understanding and reasoning, may have 1-2 correct answers",
        "king": "nuanced edge cases, exceptions, or situations requiring careful judgment",
    }

    prompt = f"""You are generating Oklahoma driver's permit test questions for a study app.

Chapter: {chapter}
Difficulty: {difficulty} — {difficulty_guidance.get(difficulty, '')}
State: Oklahoma

Chapter content summary:
{chapter_context}

Generate exactly {count} unique multiple-choice questions for this chapter and difficulty level.

Requirements:
- Questions must be based ONLY on the chapter content provided
- Each question needs 4-6 answer options
- Pawn questions: 1 correct answer, directly from text
- Rogue questions: 1-2 correct answers, requires understanding
- King questions: 1 correct answer, edge case or nuanced application
- Explanations must cite WHY the answer is correct (brief, 1-2 sentences)
- Hints must help narrow the answer without giving it away
- No duplicate questions
- Tags should reflect the topic (signs, speed_limits, right_of_way, signals, etc.)

Return a JSON object with a "questions" array."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            response_model=GeneratedQuestionBatch,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        logger.error(f"Claude API error during question generation: {e}")
        return []

    saved_questions = []
    for q_data in response.questions:
        # Verify answer count matches correct_count
        actual_correct = sum(1 for a in q_data.answers if a.is_correct)
        if actual_correct == 0:
            logger.warning(f"Skipping question with no correct answers: {q_data.question_text[:50]}")
            continue

        question = Question(
            id=uuid.uuid4(),
            state_code=state_code,
            chapter=chapter,
            category=q_data.tags[0] if q_data.tags else "general",
            difficulty=q_data.difficulty,
            question_text=q_data.question_text,
            correct_count=actual_correct,
            explanation=q_data.explanation,
            hint_text=q_data.hint_text,
            tags=q_data.tags,
            source="ai_generated",
        )
        db.add(question)
        await db.flush()  # get the id

        for i, a_data in enumerate(q_data.answers):
            answer = Answer(
                id=uuid.uuid4(),
                question_id=question.id,
                text=a_data.text,
                is_correct=a_data.is_correct,
                sort_order=i,
            )
            db.add(answer)

        saved_questions.append(question)
        logger.info(
            f"Saved AI question: ch{chapter}/{difficulty} — {q_data.question_text[:60]}..."
        )

    await db.commit()
    logger.info(
        f"Generated and saved {len(saved_questions)} questions "
        f"for ch{chapter}/{difficulty} ({state_code})"
    )
    return saved_questions


async def check_coverage_gaps(
    db: AsyncSession,
    state_code: str,
    total_chapters: int,
) -> list[dict]:
    """
    Audit the question bank and return a list of coverage gaps.
    Used by the nightly Celery job to decide what needs generation.
    """
    gaps = []
    for chapter in range(1, total_chapters + 1):
        for difficulty, min_count in MIN_QUESTIONS_PER_DIFFICULTY.items():
            result = await db.execute(
                select(func.count(Question.id)).where(
                    Question.state_code == state_code,
                    Question.chapter == chapter,
                    Question.difficulty == difficulty,
                )
            )
            count = result.scalar_one()
            if count < min_count:
                gaps.append({
                    "chapter": chapter,
                    "difficulty": difficulty,
                    "have": count,
                    "need": min_count,
                    "deficit": min_count - count,
                })

    return gaps
