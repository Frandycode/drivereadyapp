# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Generate topic-based lessons for a chapter using DeepSeek.

Outputs a JSON file with shape:
  {
    "state_code": "ok",
    "chapter": 4,
    "lessons": [
      {"sort_order": 1, "title": "...", "content": "...", "question_ids": ["uuid", "uuid", ...]},
      ...
    ]
  }

Human review the JSON, then run merge_generated_lessons.py to write to DB.
"""

import argparse
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker  # noqa: E402

from app.ai.deepseek import DEFAULT_MODEL, chat  # noqa: E402
from app.config import settings  # noqa: E402
from app.models import Chapter, Question  # noqa: E402


SYSTEM_PROMPT = """You are an expert author of state driver-education materials. Your output is used to teach learners preparing for the Oklahoma driver's license written exam.

Write lesson content that:
- Teaches the underlying concept needed to answer 3-5 closely related questions.
- Uses clear, plain English suitable for adult learners and 16-18 year olds.
- Cites the Oklahoma Driver Manual rules accurately. Never invent laws or numbers.
- Is 100-220 words per lesson. No bullet lists unless natural for the topic.
- Avoids exam-style language ("which of the following"). Lessons explain; quizzes test.

Group the input questions into N coherent topics. One lesson per topic. Cover every question by including its index in question_indices.

Output STRICT JSON only — no prose before or after, no markdown fences."""

OUTPUT_SCHEMA_NOTE = """Output schema (strict):
{
  "lessons": [
    {
      "title": "<short topic title, Title Case>",
      "content": "<lesson body 100-220 words>",
      "question_indices": [<1-based indices into the questions list>]
    }
  ]
}"""


def build_user_prompt(
    *,
    chapter_number: int,
    chapter_title: str,
    state_code: str,
    questions: list[str],
    target_lessons: int,
) -> str:
    qlist = "\n".join(f"{i + 1}. {q}" for i, q in enumerate(questions))
    return (
        f"State: {state_code.upper()}\n"
        f"Chapter {chapter_number}: {chapter_title}\n"
        f"Target lesson count: ~{target_lessons}\n\n"
        f"Questions to cover (numbered 1..{len(questions)}):\n"
        f"{qlist}\n\n"
        f"{OUTPUT_SCHEMA_NOTE}"
    )


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate DriveReady lessons for a chapter.")
    p.add_argument('--chapter', type=int, required=True, help='Chapter number (1-12)')
    p.add_argument('--count', type=int, default=20, help='Approx number of lessons to generate')
    p.add_argument('--out', type=str, required=True, help='Output JSON path')
    p.add_argument('--model', type=str, default=DEFAULT_MODEL)
    p.add_argument('--state-code', type=str, default='ok')
    return p.parse_args()


def _parse_json_response(content: str) -> dict:
    raw = content.strip()
    if raw.startswith("```"):
        raw = raw.strip("`").lstrip()
        if raw.lower().startswith("json"):
            raw = raw[4:].lstrip()
    return json.loads(raw)


async def main() -> None:
    args = parse_args()

    engine = create_async_engine(settings.async_database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    try:
        async with session_factory() as session:
            ch = (await session.execute(
                select(Chapter).where(
                    Chapter.state_code == args.state_code,
                    Chapter.number == args.chapter,
                )
            )).scalar_one_or_none()
            if not ch:
                print(f"Chapter {args.chapter} not found for state {args.state_code}")
                return

            qs = (await session.execute(
                select(Question)
                .where(
                    Question.state_code == args.state_code,
                    Question.chapter == args.chapter,
                )
                .order_by(Question.id)
            )).scalars().all()
            if not qs:
                print(f"No questions for chapter {args.chapter} / {args.state_code}")
                return

            question_texts = [q.question_text for q in qs]
            question_ids = [str(q.id) for q in qs]

            print(f"Chapter {args.chapter}: {ch.title} — {len(qs)} questions")
            print(f"Requesting ~{args.count} lessons from {args.model}...")

            user_prompt = build_user_prompt(
                chapter_number=args.chapter,
                chapter_title=ch.title,
                state_code=args.state_code,
                questions=question_texts,
                target_lessons=args.count,
            )

            result = await chat(
                [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                model=args.model,
                temperature=0.4,
                max_tokens=8000,
            )
            print(f"DeepSeek: {result.tokens_in} → {result.tokens_out} tokens, {result.latency_ms}ms")

            parsed = _parse_json_response(result.content)

            output_lessons = []
            for i, lesson in enumerate(parsed.get("lessons", []), start=1):
                indices = lesson.get("question_indices", [])
                lesson_question_ids = [
                    question_ids[idx - 1]
                    for idx in indices
                    if isinstance(idx, int) and 0 < idx <= len(question_ids)
                ]
                output_lessons.append({
                    "sort_order": i,
                    "title": lesson.get("title", ""),
                    "content": lesson.get("content", ""),
                    "question_ids": lesson_question_ids,
                })

            output = {
                "state_code": args.state_code,
                "chapter": args.chapter,
                "chapter_id": str(ch.id),
                "chapter_title": ch.title,
                "lessons": output_lessons,
            }

            with open(args.out, "w") as f:
                json.dump(output, f, indent=2)
            print(f"Wrote {len(output_lessons)} lessons to {args.out}")
    finally:
        await engine.dispose()


if __name__ == '__main__':
    asyncio.run(main())
