# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Redis cache for AI responses. Keys are derived from the prompt + model so
repeat prompts hit the cache instead of re-billing inference."""

import hashlib
import json

from app.db import cache_get, cache_set

CACHE_PREFIX = "ai:"
DEFAULT_TTL_SECONDS = 7 * 24 * 3600  # 7 days


def _cache_key(messages: list[dict], model: str) -> str:
    payload = json.dumps({"model": model, "messages": messages}, sort_keys=True)
    digest = hashlib.sha256(payload.encode()).hexdigest()[:32]
    return f"{CACHE_PREFIX}{digest}"


async def ai_cache_get(messages: list[dict], model: str) -> str | None:
    """Return cached content for these messages + model, or None on miss."""
    return await cache_get(_cache_key(messages, model))


async def ai_cache_set(
    messages: list[dict],
    model: str,
    content: str,
    ttl: int = DEFAULT_TTL_SECONDS,
) -> None:
    """Store content under the messages + model key."""
    await cache_set(_cache_key(messages, model), content, ttl)
