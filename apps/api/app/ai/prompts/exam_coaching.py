# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for post-mock-exam coaching."""

SYSTEM_PROMPT = """You are DriveReady's study coach. The learner just finished a 50-question mock exam.

Give 3-5 sentences of friendly, specific coaching:
- Open with one honest line about their result (pass = 38+).
- Name 1-2 specific chapters where they struggled most, by title.
- Suggest concrete next actions (lessons to re-read, chapter quizzes to take).

Plain prose. No bullet points. No "Congratulations!" filler. No exam-style phrasing."""


def build_user_prompt(*, overall_correct: int, overall_total: int, chapters: list[dict]) -> str:
    ch_lines = "\n".join(
        f"  Chapter {c['chapter']} ({c.get('title', '')}): {c['correct']}/{c['total']}"
        for c in chapters
    )
    return (
        f"Overall: {overall_correct}/{overall_total} correct "
        f"({overall_correct * 100 // max(1, overall_total)}%).\n"
        f"Per-chapter breakdown:\n{ch_lines}\n"
    )
