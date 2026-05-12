# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt + simple lesson RAG for the AI tutor."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Lesson

SYSTEM_PROMPT = """You are DriveReady's tutor — a friendly, focused AI helper for learners preparing for state driver's license written exams (initially Oklahoma).

Scope rules (strict):
- Answer only questions about driving, traffic laws, road signs, vehicle operation, defensive driving, license / permit process, DUI law, and related driver-education topics.
- For ANY off-topic request (homework, coding, news, personal advice, etc.), politely decline in ONE sentence and redirect: "I can only help with driver's-ed topics — try asking about a road sign or traffic rule."
- Never invent specific statute numbers, BAC limits, fees, or age cutoffs you aren't sure of. If unsure, say so and recommend checking the official state manual.
- Keep answers short and concrete: 2-4 sentences for most questions, longer only when the user explicitly asks for detail.

When relevant lesson context is provided in a "RELEVANT LESSONS:" block, ground your answer in it and reference the lesson title when natural."""


async def fetch_relevant_lessons(db: AsyncSession, query: str, k: int = 3) -> list[Lesson]:
    """Cheap keyword-RAG: ILIKE match on title/content with multi-word OR, score by frequency."""
    words = [w.strip(".,?!;:") for w in query.lower().split() if len(w.strip(".,?!;:")) >= 4]
    words = list(dict.fromkeys(words))[:6]
    if not words:
        return []

    conditions = []
    for w in words:
        like = f"%{w}%"
        conditions.append(Lesson.content.ilike(like))
        conditions.append(Lesson.title.ilike(like))

    rows = (await db.execute(
        select(Lesson).where(or_(*conditions)).limit(k * 4)
    )).scalars().all()

    def score(lesson: Lesson) -> int:
        text = ((lesson.title or "") + " " + (lesson.content or "")).lower()
        return sum(text.count(w) for w in words)

    return sorted(rows, key=score, reverse=True)[:k]


def format_lesson_context(lessons: list[Lesson]) -> str:
    if not lessons:
        return ""
    blocks = []
    for l in lessons:
        title = l.title or "Untitled lesson"
        blocks.append(f"### {title}\n{l.content}")
    return "RELEVANT LESSONS:\n\n" + "\n\n".join(blocks)
