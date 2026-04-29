# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import strawberry
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from strawberry.types import Info

from app.models import User, Question, Answer, Chapter, Lesson, UserProgress
from app.graphql.types.all_types import (
    QuestionType, AnswerType, UserType, ChapterType,
    LessonType, ChapterProgressType, ReadinessScoreType,
    StateConfigType,
)
from app.config import get_state_config, STATE_CONFIGS
from app.db import cache_get, cache_set, CacheKey, TTL
import random


def map_question(q: Question) -> QuestionType:
    return QuestionType(
        id=str(q.id),
        state_code=q.state_code,
        chapter=q.chapter,
        category=q.category,
        difficulty=q.difficulty,
        question_text=q.question_text,
        correct_count=q.correct_count,
        explanation=q.explanation,
        hint_text=q.hint_text,
        image_url=q.image_url,
        source_page=q.source_page,
        tags=q.tags or [],
        source=q.source,
        answers=[
            AnswerType(
                id=str(a.id),
                text=a.text,
                is_correct=a.is_correct,
                sort_order=a.sort_order,
            )
            for a in q.answers
        ],
    )


def map_user(u: User) -> UserType:
    return UserType(
        id=str(u.id),
        email=u.email,
        display_name=u.display_name,
        avatar_url=u.avatar_url,
        role=u.role,
        state_code=u.state_code,
        xp_total=u.xp_total,
        level=u.level,
        streak_days=u.streak_days,
        freeze_tokens=u.freeze_tokens,
        test_date=u.test_date,
        created_at=u.created_at,
    )


@strawberry.type
class Query:

    @strawberry.field
    async def me(self, info: Info) -> Optional[UserType]:
        """Return the currently authenticated user."""
        user: User | None = info.context.get("user")
        if not user:
            return None
        return map_user(user)

    @strawberry.field
    async def questions(
        self,
        info: Info,
        state_code: str,
        count: int,
        chapters: Optional[list[int]] = None,
        difficulty: Optional[str] = None,
        exclude_ids: Optional[list[str]] = None,
    ) -> list[QuestionType]:
        """
        DB-first question fetching.
        - Always reads from DB
        - If DB coverage is below threshold, schedules background AI generation
        - Never blocks the user waiting for AI
        """
        db: AsyncSession = info.context["db"]

        from app.ai.question_gen import get_or_generate_questions

        all_questions: list[Question] = []

        if chapters:
            # Fetch per chapter so the DB-first logic can check coverage per chapter
            for chapter in chapters:
                q = await get_or_generate_questions(
                    db=db,
                    state_code=state_code,
                    chapter=chapter,
                    difficulty=difficulty or "pawn",
                    count=count,
                    exclude_ids=exclude_ids,
                )
                all_questions.extend(q)
        else:
            # No chapter filter — pull from full DB, no coverage check needed
            stmt = select(Question).where(Question.state_code == state_code)
            if difficulty:
                stmt = stmt.where(Question.difficulty == difficulty)
            if exclude_ids:
                stmt = stmt.where(Question.id.not_in(exclude_ids))

            result = await db.execute(stmt)
            all_questions = list(result.scalars().all())

        # Shuffle and cap
        import random
        random.shuffle(all_questions)
        selected = all_questions[:count]

        return [map_question(q) for q in selected]

    @strawberry.field
    async def chapters(
        self, info: Info, state_code: str
    ) -> list[ChapterType]:
        """List all chapters for a given state."""
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(Chapter)
            .where(Chapter.state_code == state_code)
            .order_by(Chapter.number)
        )
        chapters = result.scalars().all()
        return [
            ChapterType(
                id=str(c.id),
                state_code=c.state_code,
                number=c.number,
                title=c.title,
                description=c.description,
            )
            for c in chapters
        ]

    @strawberry.field
    async def my_progress(self, info: Info) -> list[ChapterProgressType]:
        """Return per-chapter progress for the current user."""
        user: User | None = info.context.get("user")
        if not user:
            return []
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(UserProgress)
            .where(
                UserProgress.user_id == user.id,
                UserProgress.state_code == user.state_code,
            )
            .order_by(UserProgress.chapter)
        )
        progress_rows = result.scalars().all()
        return [
            ChapterProgressType(
                chapter=p.chapter,
                state_code=p.state_code,
                questions_seen=p.questions_seen,
                questions_correct=p.questions_correct,
                accuracy=p.accuracy,
                lessons_completed=p.lessons_completed,
                lessons_total=p.lessons_total,
                last_studied_at=p.last_studied_at,
            )
            for p in progress_rows
        ]

    @strawberry.field
    def state_config(self, state_code: str) -> Optional[StateConfigType]:
        """Return configuration for a given state."""
        config = STATE_CONFIGS.get(state_code.lower())
        if not config:
            return None
        return StateConfigType(
            code=config.code,
            name=config.name,
            full_name=config.full_name,
            primary_color=config.primary_color,
            secondary_color=config.secondary_color,
            passing_score=config.passing_score,
            real_test_count=config.real_test_count,
            chapters=config.chapters,
        )
