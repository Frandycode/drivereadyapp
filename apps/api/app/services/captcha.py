# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

from typing import Optional

import httpx
from graphql import GraphQLError

from app.config import settings

_VERIFY_URL = "https://hcaptcha.com/siteverify"


async def verify_captcha(token: Optional[str]) -> None:
    """
    Verify an hCaptcha token with the hCaptcha API.

    Skips verification entirely when hcaptcha_secret is empty (dev / CI mode).
    Raises ValueError("CAPTCHA_REQUIRED") if no token was submitted in prod.
    Raises ValueError("CAPTCHA_INVALID")  if hCaptcha rejects the token.
    """
    if not settings.hcaptcha_secret:
        return

    if not token:
        raise GraphQLError("CAPTCHA_REQUIRED", extensions={"code": "CAPTCHA_REQUIRED"})

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            _VERIFY_URL,
            data={"secret": settings.hcaptcha_secret, "response": token},
        )

    if not resp.json().get("success"):
        raise GraphQLError("CAPTCHA_INVALID", extensions={"code": "CAPTCHA_INVALID"})
