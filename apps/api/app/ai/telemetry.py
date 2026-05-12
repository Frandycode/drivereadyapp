# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Telemetry for AI calls. Emits a structured log line and, when a session is
passed, persists a row to ai_call_log for cost / latency reporting."""

import logging
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.deepseek import AICallResult
from app.models import AICallLog

_log = logging.getLogger("driveready.ai")


async def ai_log(
    *,
    db: Optional[AsyncSession],
    user_id: Optional[str],
    route: str,
    cached: bool,
    result: Optional[AICallResult] = None,
    error: Optional[str] = None,
) -> None:
    """Record an AI call. Always logs; persists to ai_call_log when db is provided.
    The caller controls the transaction (commit happens at the surrounding mutation)."""
    fields = {
        "event": "ai_call",
        "user_id": user_id or "",
        "route": route,
        "cached": cached,
        "tokens_in": result.tokens_in if result else 0,
        "tokens_out": result.tokens_out if result else 0,
        "latency_ms": result.latency_ms if result else 0,
        "model": result.model if result else "",
        "error": error or "",
    }
    _log.info(" ".join(f"{k}={v}" for k, v in fields.items()))

    if db is not None:
        db.add(AICallLog(
            user_id=uuid.UUID(user_id) if user_id else None,
            route=route,
            cached=cached,
            model=result.model if result else "",
            tokens_in=result.tokens_in if result else 0,
            tokens_out=result.tokens_out if result else 0,
            latency_ms=result.latency_ms if result else 0,
            error=(error or "")[:500],
        ))
