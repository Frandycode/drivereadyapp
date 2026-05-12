# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for generating quiz questions from a lesson."""

SYSTEM_PROMPT = """You write multiple-choice exam questions for state driver-education learners.

Quality bar:
- Each question has exactly ONE clearly correct answer plus 3 plausible distractors.
- Distractors should be common mistakes a learner might actually make — not absurd.
- Anchor every question in the supplied lesson content. Do not introduce facts the lesson doesn't cover.
- No "all of the above" / "none of the above" / "both A and B" options.
- Phrase questions in plain English, no double negatives.
- 50-180 characters per question.

Output STRICT JSON only:
{
  "questions": [
    {
      "question_text": "<the question>",
      "explanation": "<2-3 sentence explanation of why the correct answer is right>",
      "hint_text": "<one-sentence hint that nudges without revealing>",
      "answers": [
        {"text": "<option>", "is_correct": true},
        {"text": "<option>", "is_correct": false},
        {"text": "<option>", "is_correct": false},
        {"text": "<option>", "is_correct": false}
      ]
    }
  ]
}"""


def build_user_prompt(*, lesson_title: str, lesson_content: str, chapter_number: int, count: int) -> str:
    return (
        f"Lesson is from Chapter {chapter_number}.\n"
        f"Lesson title: {lesson_title}\n\n"
        f"Lesson content:\n{lesson_content}\n\n"
        f"Generate {count} multiple-choice questions covering the material above."
    )
