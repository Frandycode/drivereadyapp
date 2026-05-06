# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import secrets
from app.db.redis import get_redis

TTL_SECONDS = 3600  # 1 hour


def _key(token: str) -> str:
    return f"pwd_reset:token:{token}"


async def create_reset_token(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    r = await get_redis()
    await r.setex(_key(token), TTL_SECONDS, user_id)
    return token


async def resolve_reset_token(token: str) -> str | None:
    """Return user_id or None if expired/invalid."""
    r = await get_redis()
    return await r.get(_key(token))


async def delete_reset_token(token: str) -> None:
    r = await get_redis()
    await r.delete(_key(token))
