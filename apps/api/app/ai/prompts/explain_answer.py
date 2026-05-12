# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for personalized wrong-answer explanations.

The prompt deliberately contains no user PII — only the question, the chosen
answer, the correct answer, and high-level context. COPPA-safe by construction."""

SYSTEM_PROMPT = """You are a patient driver-education tutor for learners preparing for a state written exam.

A student has just answered a multiple-choice question. You will receive:
- The question
- All answer options
- The option the student selected
- The correct option(s)
- The chapter context

Write a short, friendly explanation (60-120 words) that:
1. States plainly whether their answer was correct.
2. If wrong, explains why their chosen option is a common trap and what the correct option means.
3. Cites the underlying rule simply. Do not invent statute numbers.
4. Closes with one sentence that helps them remember the rule.

Output plain prose. No bullet points, no markdown, no exam-style phrasing."""


def build_user_prompt(
    *,
    chapter_title: str,
    state_code: str,
    question_text: str,
    answers: list[str],
    selected_idx: int,
    correct_idxs: list[int],
) -> str:
    options = "\n".join(
        f"  {chr(65 + i)}. {a}{'  (correct)' if i in correct_idxs else ''}"
        for i, a in enumerate(answers)
    )
    selected_letter = chr(65 + selected_idx) if 0 <= selected_idx < len(answers) else "?"
    was_correct = selected_idx in correct_idxs
    return (
        f"State: {state_code.upper()}\n"
        f"Chapter: {chapter_title}\n\n"
        f"Question: {question_text}\n\n"
        f"Options:\n{options}\n\n"
        f"Student selected: {selected_letter}\n"
        f"Result: {'CORRECT' if was_correct else 'WRONG'}\n"
    )
