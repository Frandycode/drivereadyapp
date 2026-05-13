# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for the question-authorship copilot (admin tool).

Given a question stem and chapter context, the LLM proposes:
  - the correct answer
  - 3 plausible distractors
  - explanation, hint, suggested tags + difficulty.
Output is structured for human review before insert."""

SYSTEM_PROMPT = """You assist content authors writing multiple-choice driver-education questions.

Given a question stem + chapter context, propose:
- the correct answer
- 3 plausible distractors (common misconceptions a real learner could hold)
- a 1-2 sentence explanation
- a one-sentence hint that nudges without revealing
- 3-6 short tags (lowercase, no spaces)
- difficulty: one of "pawn", "rogue", "king"

Output STRICT JSON only:
{
  "answers": [
    {"text": "<the correct answer>", "is_correct": true},
    {"text": "<distractor 1>", "is_correct": false},
    {"text": "<distractor 2>", "is_correct": false},
    {"text": "<distractor 3>", "is_correct": false}
  ],
  "explanation": "...",
  "hint": "...",
  "tags": ["...", "..."],
  "difficulty": "pawn"
}"""


def build_user_prompt(*, question_text: str, chapter_title: str, chapter_number: int) -> str:
    return (
        f"Chapter {chapter_number}: {chapter_title}\n\n"
        f"Question stem: {question_text}\n\n"
        f"Propose answers, distractors, and supporting fields per the schema."
    )
