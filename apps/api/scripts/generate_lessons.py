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
