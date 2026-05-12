# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Merge a generate_lessons.py JSON output into the database.

Safe semantics:
- Inserts new Lesson rows only when no existing lesson in that chapter has
  identical content (prevents duplicates if run twice).
- Sets Question.lesson_id for each question listed in question_ids (only when
  it's currently NULL, so manually-curated links are preserved).
- Never deletes Lesson, Question, or any user-touching row.

Usage:
  python scripts/merge_generated_lessons.py --in lessons_ch1.json [--dry-run]
"""

import argparse
import asyncio
import json
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import select, update  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker  # noqa: E402

from app.config import settings  # noqa: E402
from app.models import Chapter, Lesson, Question  # noqa: E402


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Merge generated lessons JSON into the DB.")
    p.add_argument('--in', dest='input_path', type=str, required=True)
    p.add_argument('--dry-run', action='store_true', help='Show what would change without writing')
    return p.parse_args()


async def main() -> None:
    args = parse_args()

    with open(args.input_path) as f:
        data = json.load(f)

    state_code = data['state_code']
    chapter_num = data['chapter']
    chapter_id = uuid.UUID(data['chapter_id'])
    generated_lessons = data['lessons']

    engine = create_async_engine(settings.async_database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    inserted = 0
    skipped = 0
    questions_linked = 0

    try:
        async with session_factory() as session:
            chapter = (await session.execute(
                select(Chapter).where(Chapter.id == chapter_id)
            )).scalar_one_or_none()
            if not chapter:
                print(f"Chapter id {chapter_id} not found")
                return

            existing = (await session.execute(
                select(Lesson).where(Lesson.chapter_id == chapter_id)
            )).scalars().all()
            existing_contents = {l.content.strip(): l for l in existing}
            next_sort = (max((l.sort_order for l in existing), default=0)) + 1

            for gen in generated_lessons:
                content = (gen.get('content') or '').strip()
                if not content:
                    continue
                question_ids = [uuid.UUID(q) for q in gen.get('question_ids', [])]

                if content in existing_contents:
                    lesson = existing_contents[content]
                    skipped += 1
                else:
                    lesson = Lesson(
                        chapter_id=chapter_id,
                        sort_order=next_sort,
                        title=gen.get('title') or None,
                        content=content,
                    )
                    next_sort += 1
                    if args.dry_run:
                        print(f"[dry] would insert: {lesson.title or '(untitled)'}  ({len(question_ids)} questions)")
                    else:
                        session.add(lesson)
                        await session.flush()
                        inserted += 1

                # Link questions (only when their lesson_id is currently NULL)
                if question_ids:
                    if args.dry_run:
                        print(f"[dry] would link {len(question_ids)} questions to '{lesson.title}'")
                    else:
                        res = await session.execute(
                            update(Question)
                            .where(
                                Question.id.in_(question_ids),
                                Question.lesson_id.is_(None),
                            )
                            .values(lesson_id=lesson.id)
                        )
                        questions_linked += res.rowcount or 0

            if not args.dry_run:
                await session.commit()

            print(
                f"Chapter {chapter_num} ({state_code}): inserted={inserted} skipped={skipped} "
                f"questions_linked={questions_linked}"
            )
    finally:
        await engine.dispose()


if __name__ == '__main__':
    asyncio.run(main())
