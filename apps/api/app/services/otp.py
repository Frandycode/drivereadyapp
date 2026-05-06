# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import random
from app.db.redis import get_redis

OTP_TTL        = 600   # 10 minutes
MAX_ATTEMPTS   = 5
RESEND_WINDOW  = 3600  # 1 hour
MAX_RESENDS    = 3


def _code_key(user_id: str, channel: str) -> str:
    return f"otp:{user_id}:{channel}:code"

def _attempts_key(user_id: str, channel: str) -> str:
    return f"otp:{user_id}:{channel}:attempts"

def _resend_key(user_id: str, channel: str) -> str:
    return f"otp:{user_id}:{channel}:resends"


async def create_otp(user_id: str, channel: str) -> str:
    """Generate a 6-digit OTP, enforce resend rate limit, store in Redis."""
    r = await get_redis()

    resends = await r.get(_resend_key(user_id, channel))
    if resends and int(resends) >= MAX_RESENDS:
        raise ValueError("Too many OTP requests. Please try again in an hour.")

    code = f"{random.SystemRandom().randint(0, 999999):06d}"
    await r.setex(_code_key(user_id, channel), OTP_TTL, code)
    await r.delete(_attempts_key(user_id, channel))

    pipe = r.pipeline()
    pipe.incr(_resend_key(user_id, channel))
    pipe.expire(_resend_key(user_id, channel), RESEND_WINDOW)
    await pipe.execute()

    return code


async def verify_otp(user_id: str, channel: str, submitted: str) -> bool:
    """Return True if code matches. Raises ValueError on lockout or expiry."""
    r = await get_redis()

    stored = await r.get(_code_key(user_id, channel))
    if not stored:
        raise ValueError("OTP expired. Please request a new code.")

    attempts = await r.incr(_attempts_key(user_id, channel))
    if attempts > MAX_ATTEMPTS:
        await r.delete(_code_key(user_id, channel))
        raise ValueError("Too many incorrect attempts. Please request a new code.")

    if submitted.strip() != stored:
        remaining = MAX_ATTEMPTS - int(attempts)
        raise ValueError(f"Incorrect code. {remaining} attempt{'s' if remaining != 1 else ''} remaining.")

    await r.delete(_code_key(user_id, channel))
    await r.delete(_attempts_key(user_id, channel))
    return True


async def clear_otp(user_id: str, channel: str) -> None:
    r = await get_redis()
    await r.delete(_code_key(user_id, channel), _attempts_key(user_id, channel))
