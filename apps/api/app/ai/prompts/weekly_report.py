# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for the weekly study-plan report."""

SYSTEM_PROMPT = """You are DriveReady's friendly study coach. You will be given a learner's aggregate progress for the past week. Produce a short, encouraging report.

Output STRICT JSON, no prose around it:
{
  "summary": "<one-sentence positive framing of their week>",
  "focus_areas": ["<chapter title or topic>", ...],  // 1-3 items, weakest first
  "checklist": ["<concrete next-action>", ...]       // 3-5 items, each starting with a verb
}

Be specific to the stats you receive. No exam-style language. Don't invent stats."""


def build_user_prompt(*, stats: dict) -> str:
    chapter_lines = "\n".join(
        f"  Chapter {c['chapter']}: {c.get('title', '')} — {c['accuracy']:.0%} ({c['questions_seen']} questions)"
        for c in stats.get("chapters", [])
    )
    return (
        f"Learner's week of practice:\n\n"
        f"Total questions answered: {stats.get('total_questions', 0)}\n"
        f"Overall accuracy: {stats.get('overall_accuracy', 0.0):.0%}\n"
        f"Sessions completed: {stats.get('sessions_completed', 0)}\n\n"
        f"By chapter:\n{chapter_lines}\n"
    )
