# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

from app.db.redis import get_redis


async def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> None:
    """
    Fixed-window rate limiter backed by Redis.
    Raises ValueError("RATE_LIMITED") when the caller has exceeded max_requests
    within the current window_seconds window.

    key            – unique identifier, e.g. "login:203.0.113.5"
    max_requests   – inclusive ceiling (>= this count triggers the error)
    window_seconds – window length in seconds; TTL resets on first hit each window
    """
    redis    = await get_redis()
    full_key = f"ratelimit:{key}"

    count = await redis.incr(full_key)
    if count == 1:
        await redis.expire(full_key, window_seconds)

    if count > max_requests:
        raise ValueError("RATE_LIMITED")
