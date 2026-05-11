"""Redis-backed pending signup store.

Holds unverified signup data with a 48h TTL. A pending signup only becomes a
real User row in Postgres after the email OTP is successfully verified.
Unverified signups expire automatically — no cleanup cron needed.
"""

import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.db.redis import get_redis

PENDING_SIGNUP_TTL = 48 * 3600  # 48 hours


def _key(token: str) -> str:
    return f"pending_signup:{token}"


def _email_lookup_key(email: str) -> str:
    return f"pending_signup_email:{email.lower()}"


async def create_pending_signup(data: dict) -> tuple[str, datetime]:
    """Store a pending signup; return (token, expires_at). Email is also indexed
    for uniqueness checks against concurrent in-flight signups."""
    r = await get_redis()
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=PENDING_SIGNUP_TTL)

    pipe = r.pipeline()
    pipe.setex(_key(token), PENDING_SIGNUP_TTL, json.dumps(data))
    pipe.setex(_email_lookup_key(data["email"]), PENDING_SIGNUP_TTL, token)
    await pipe.execute()
    return token, expires_at


async def get_pending_signup(token: str) -> Optional[dict]:
    r = await get_redis()
    raw = await r.get(_key(token))
    return json.loads(raw) if raw else None


async def delete_pending_signup(token: str, email: str) -> None:
    r = await get_redis()
    pipe = r.pipeline()
    pipe.delete(_key(token))
    pipe.delete(_email_lookup_key(email))
    await pipe.execute()


async def email_has_pending_signup(email: str) -> bool:
    r = await get_redis()
    return bool(await r.get(_email_lookup_key(email)))
