# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Telemetry for AI calls. Single entry point so cost / latency / cache-hit
metrics live in one place. Persistence to a DB table arrives in Phase 0.7."""

import logging
from typing import Optional

from app.ai.deepseek import AICallResult

_log = logging.getLogger("driveready.ai")


def ai_log(
    *,
    user_id: Optional[str],
    route: str,
    cached: bool,
    result: Optional[AICallResult] = None,
    error: Optional[str] = None,
) -> None:
    """Structured log line per AI call. Pass `result` on success, `error` on failure."""
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
