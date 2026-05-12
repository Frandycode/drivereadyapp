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
answer, the correct answer, and high-level context. COPPA-safe by construction.
The _assert_no_pii guard at the end is belt-and-suspenders against regressions."""

import re

_PII_PATTERNS = [
    re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
    re.compile(r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    re.compile(r"\bdisplay[_\s]?name\b", re.I),
    re.compile(r"\bdate[_\s]?of[_\s]?birth\b", re.I),
]


def _assert_no_pii(text: str) -> None:
    for pat in _PII_PATTERNS:
        if pat.search(text):
            raise ValueError(f"PII-shaped content found in explain_answer prompt: {pat.pattern}")

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
    rendered = (
        f"State: {state_code.upper()}\n"
        f"Chapter: {chapter_title}\n\n"
        f"Question: {question_text}\n\n"
        f"Options:\n{options}\n\n"
        f"Student selected: {selected_letter}\n"
        f"Result: {'CORRECT' if was_correct else 'WRONG'}\n"
    )
    _assert_no_pii(rendered)
    return rendered
