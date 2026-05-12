# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Generate quiz questions for a lesson using DeepSeek.

Outputs JSON suitable for human review then merge_generated_questions.py.

Usage:
  python scripts/generate_questions.py --lesson <UUID> --count 5 --out questions.json
"""

import argparse
import asyncio
import json
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker  # noqa: E402

from app.ai.deepseek import DEFAULT_MODEL, chat  # noqa: E402
from app.ai.prompts.generate_questions import (  # noqa: E402
    SYSTEM_PROMPT,
    build_user_prompt,
)
from app.config import settings  # noqa: E402
from app.models import Chapter, Lesson  # noqa: E402


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Generate quiz questions for a lesson.")
    p.add_argument('--lesson', type=str, required=True, help='Lesson UUID')
    p.add_argument('--count', type=int, default=5)
    p.add_argument('--out', type=str, required=True)
    p.add_argument('--model', type=str, default=DEFAULT_MODEL)
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
    lesson_id = uuid.UUID(args.lesson)

    engine = create_async_engine(settings.async_database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    try:
        async with session_factory() as session:
            lesson = (await session.execute(
                select(Lesson).where(Lesson.id == lesson_id)
            )).scalar_one_or_none()
            if not lesson:
                print(f"Lesson {lesson_id} not found")
                return

            chapter = (await session.execute(
                select(Chapter).where(Chapter.id == lesson.chapter_id)
            )).scalar_one_or_none()
            if not chapter:
                print(f"Chapter for lesson {lesson_id} not found")
                return

            print(f"Lesson: {lesson.title or '(untitled)'} (Chapter {chapter.number})")
            print(f"Requesting {args.count} questions from {args.model}...")

            result = await chat(
                [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": build_user_prompt(
                        lesson_title=lesson.title or "(untitled)",
                        lesson_content=lesson.content,
                        chapter_number=chapter.number,
                        count=args.count,
                    )},
                ],
                model=args.model,
                temperature=0.5,
                max_tokens=3000,
            )
            print(f"DeepSeek: {result.tokens_in} → {result.tokens_out} tokens, {result.latency_ms}ms")

            parsed = _parse_json_response(result.content)
            output = {
                "state_code": chapter.state_code,
                "chapter": chapter.number,
                "lesson_id": str(lesson.id),
                "lesson_title": lesson.title,
                "questions": parsed.get("questions", []),
            }
            with open(args.out, "w") as f:
                json.dump(output, f, indent=2)
            print(f"Wrote {len(output['questions'])} questions to {args.out}")
    finally:
        await engine.dispose()


if __name__ == '__main__':
    asyncio.run(main())
