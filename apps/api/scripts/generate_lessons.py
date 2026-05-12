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
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.ai.deepseek import DEFAULT_MODEL  # noqa: E402


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


async def main() -> None:
    args = parse_args()
    print(
        f"[stub] chapter={args.chapter} count={args.count} state={args.state_code} "
        f"model={args.model} out={args.out}"
    )
    print("DeepSeek wiring lands in sub-step 1.3.")


if __name__ == '__main__':
    asyncio.run(main())
