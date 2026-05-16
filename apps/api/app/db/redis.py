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
from typing import Any
import redis.asyncio as aioredis
from app.config import settings

# ── Client ────────────────────────────────────────────────────────────────────
redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return redis_client


async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.aclose()
        redis_client = None


# ── Cache TTLs (seconds) ──────────────────────────────────────────────────────
class TTL:
    QUESTIONS = 3600        # 1 hour
    DAILY_CHALLENGE = 86400 # 24 hours
    READINESS = 1800        # 30 minutes
    LEADERBOARD = 300       # 5 minutes
    SESSION = 3600          # 1 hour active session
    BATTLE = 1800           # 30 minutes active battle
    USER_PROFILE = 600      # 10 minutes


# ── Cache key builders ────────────────────────────────────────────────────────
class CacheKey:
    @staticmethod
    def questions(state_code: str, chapter: int | None = None, difficulty: str | None = None) -> str:
        parts = ["questions", state_code]
        if chapter is not None:
            parts.append(str(chapter))
        if difficulty:
            parts.append(difficulty)
        return ":".join(parts)

    @staticmethod
    def daily_challenge(state_code: str, date: str) -> str:
        return f"daily:{state_code}:{date}"

    @staticmethod
    def readiness(user_id: str) -> str:
        return f"readiness:{user_id}"

    @staticmethod
    def leaderboard(state_code: str, period: str) -> str:
        return f"leaderboard:{state_code}:{period}"

    @staticmethod
    def session(session_id: str) -> str:
        return f"session:{session_id}"

    @staticmethod
    def battle(battle_id: str) -> str:
        return f"battle:{battle_id}"

    @staticmethod
    def rate_limit(user_id: str, endpoint: str) -> str:
        return f"ratelimit:{user_id}:{endpoint}"

    @staticmethod
    def user_profile(user_id: str) -> str:
        return f"user:{user_id}"


# ── Helper functions ──────────────────────────────────────────────────────────
async def cache_get(key: str) -> Any | None:
    r = await get_redis()
    value = await r.get(key)
    if value is None:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    r = await get_redis()
    serialized = json.dumps(value) if not isinstance(value, str) else value
    await r.setex(key, ttl, serialized)


async def cache_delete(key: str) -> None:
    r = await get_redis()
    await r.delete(key)


async def cache_delete_pattern(pattern: str) -> None:
    r = await get_redis()
    keys = await r.keys(pattern)
    if keys:
        await r.delete(*keys)
