# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import json
import secrets

from app.db.redis import get_redis

TTL_SECONDS = 72 * 3600  # 72 hours


def _key(token: str) -> str:
    return f"consent:token:{token}"


async def create_consent_token(user_id: str, parent_email: str) -> str:
    token = secrets.token_urlsafe(32)
    r = await get_redis()
    await r.setex(
        _key(token),
        TTL_SECONDS,
        json.dumps({"user_id": user_id, "parent_email": parent_email}),
    )
    return token


async def resolve_consent_token(token: str) -> dict | None:
    """Return {user_id, parent_email} or None if expired/invalid."""
    r = await get_redis()
    raw = await r.get(_key(token))
    if not raw:
        return None
    return json.loads(raw)


async def delete_consent_token(token: str) -> None:
    r = await get_redis()
    await r.delete(_key(token))
