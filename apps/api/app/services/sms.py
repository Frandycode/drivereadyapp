# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import asyncio
import logging
from app.config import settings

logger = logging.getLogger(__name__)


async def send_sms(*, to: str, body: str) -> None:
    """Send an SMS. Falls back to console logging in dev when Twilio is not configured."""
    if not settings.twilio_account_sid:
        logger.info("\n━━━ [DEV SMS] ━━━\nTo: %s\n%s\n━━━━━━━━━━━━━━━━━", to, body)
        return

    from twilio.rest import Client

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    await asyncio.to_thread(
        client.messages.create,
        to=to,
        from_=settings.twilio_from_number,
        body=body,
    )


async def send_otp_sms(*, to: str, code: str) -> None:
    await send_sms(
        to=to,
        body=f"Your DriveReady verification code is {code}. It expires in 10 minutes. Do not share this code.",
    )
