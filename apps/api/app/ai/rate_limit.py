# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Per-user AI rate limits. Buckets let different AI features have independent
budgets (e.g. explanations vs chat vs hints)."""

from app.services.rate_limit import check_rate_limit


async def ai_rate_limit(
    user_id: str,
    bucket: str,
    *,
    max_requests: int,
    window_seconds: int,
) -> None:
    """Raise GraphQLError(RATE_LIMITED) if this user has exceeded the AI bucket."""
    await check_rate_limit(f"ai:{bucket}:{user_id}", max_requests, window_seconds)
