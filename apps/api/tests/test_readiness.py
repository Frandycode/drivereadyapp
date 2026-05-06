# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Readiness score smoke tests."""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, UserProgress

from .conftest import gql, user_token

READINESS_SCORE = """
  query {
    readinessScore {
      score percentage level message growthChapters
    }
  }
"""


async def test_readiness_score_unauthenticated_returns_null(client: AsyncClient):
    """Unauthenticated callers get null — no error, just null."""
    result = await gql(client, READINESS_SCORE)
    assert result.get("errors") is None or result["errors"] == []
    assert result["data"]["readinessScore"] is None


async def test_readiness_score_no_history(client: AsyncClient, seeded_user: User):
    """A new user with no study history gets not_ready at 0%."""
    token = user_token(seeded_user)
    result = await gql(client, READINESS_SCORE, token=token)
    data = (result.get("data") or {}).get("readinessScore")
    assert data is not None, result.get("errors")
    assert data["level"] == "not_ready"
    assert data["score"] == 0.0
    assert data["percentage"] == 0
    assert data["growthChapters"] == []


async def test_readiness_score_above_passing(
    client: AsyncClient, seeded_user: User, db: AsyncSession
):
    """Seed 90% accuracy progress → level should be very_ready."""
    db.add(UserProgress(
        user_id=seeded_user.id,
        chapter=4,
        state_code="ok",
        questions_seen=10,
        questions_correct=9,   # 90% — above 80% passing + 10% buffer
        last_studied_at=datetime.now(timezone.utc),
    ))
    await db.commit()

    token = user_token(seeded_user)
    result = await gql(client, READINESS_SCORE, token=token)
    data = (result.get("data") or {}).get("readinessScore")
    assert data is not None, result.get("errors")
    assert data["level"] == "very_ready"
    assert data["percentage"] == 90
    assert data["growthChapters"] == []


async def test_readiness_score_below_passing(
    client: AsyncClient, seeded_user: User, db: AsyncSession
):
    """Seed 50% accuracy → not_ready with ch.4 in growth_chapters."""
    db.add(UserProgress(
        user_id=seeded_user.id,
        chapter=4,
        state_code="ok",
        questions_seen=10,
        questions_correct=5,   # 50% — below passing
        last_studied_at=datetime.now(timezone.utc),
    ))
    await db.commit()

    token = user_token(seeded_user)
    result = await gql(client, READINESS_SCORE, token=token)
    data = (result.get("data") or {}).get("readinessScore")
    assert data is not None, result.get("errors")
    assert data["level"] == "not_ready"
    assert 4 in data["growthChapters"]


async def test_readiness_score_multiple_chapters(
    client: AsyncClient, seeded_user: User, db: AsyncSession
):
    """Multi-chapter weighted average and growth_chapters list are correct."""
    progress = [
        UserProgress(user_id=seeded_user.id, chapter=1, state_code="ok",
                     questions_seen=10, questions_correct=9,
                     last_studied_at=datetime.now(timezone.utc)),
        UserProgress(user_id=seeded_user.id, chapter=2, state_code="ok",
                     questions_seen=10, questions_correct=4,
                     last_studied_at=datetime.now(timezone.utc)),
    ]
    for p in progress:
        db.add(p)
    await db.commit()

    token = user_token(seeded_user)
    result = await gql(client, READINESS_SCORE, token=token)
    data = (result.get("data") or {}).get("readinessScore")
    assert data is not None, result.get("errors")
    # weighted: (9+4)/(10+10) = 65%
    assert data["percentage"] == 65
    # ch.2 is at 40% — below the 65% growth threshold
    assert 2 in data["growthChapters"]
    assert 1 not in data["growthChapters"]
