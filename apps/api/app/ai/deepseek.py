# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""DeepSeek API client. OpenAI-compatible endpoint at api.deepseek.com.

All AI calls in the app route through this module so swapping providers
later (Anthropic, OpenAI, etc.) is a one-file change.
"""

import time
from dataclasses import dataclass

import httpx

from app.config import settings

DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEFAULT_MODEL = "deepseek-chat"


class AIModelError(Exception):
    """Raised when the AI provider returns an error or unexpected response."""


@dataclass(frozen=True)
class AICallResult:
    content: str
    model: str
    tokens_in: int
    tokens_out: int
    latency_ms: int
    raw: dict


async def chat(
    messages: list[dict],
    *,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    timeout: float = 30.0,
) -> AICallResult:
    """Call DeepSeek chat completions and return a typed envelope."""
    if not settings.deepseek_api_key:
        raise AIModelError("DEEPSEEK_API_KEY is not configured")

    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{DEEPSEEK_BASE_URL}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.deepseek_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPError as e:
        raise AIModelError(f"DeepSeek HTTP error: {e}") from e

    latency_ms = int((time.perf_counter() - started) * 1000)

    try:
        content = payload["choices"][0]["message"]["content"]
        usage = payload.get("usage", {})
        return AICallResult(
            content=content,
            model=payload.get("model", model),
            tokens_in=int(usage.get("prompt_tokens", 0)),
            tokens_out=int(usage.get("completion_tokens", 0)),
            latency_ms=latency_ms,
            raw=payload,
        )
    except (KeyError, IndexError, TypeError) as e:
        raise AIModelError(f"DeepSeek returned unexpected payload: {e}") from e
