# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for LLM-driven bot battle moves."""

from app.ai.bot_personalities import BotPersonality

SYSTEM_PROMPT_TEMPLATE = """{persona}

You are answering a multiple-choice question from an Oklahoma driver's-license practice test.
You will see the question, its options (lettered A, B, C, ...), and the number of correct answers.

Output STRICT JSON only, no prose around it:
{{
  "selected_indices": [<0-based indices into the options list>],
  "reasoning": "<one sentence, in character, explaining your choice>"
}}

Pick exactly {correct_count} option(s). Stay in character — your accuracy target shapes how often you should pick the correct answer overall."""


def build_system_prompt(personality: BotPersonality, correct_count: int) -> str:
    return SYSTEM_PROMPT_TEMPLATE.format(
        persona=personality.persona_blurb,
        correct_count=correct_count,
    )


def build_user_prompt(*, question_text: str, options: list[str], correct_count: int) -> str:
    options_block = "\n".join(f"{chr(65 + i)}. {opt}" for i, opt in enumerate(options))
    return (
        f"Question: {question_text}\n\n"
        f"Options:\n{options_block}\n\n"
        f"Correct answers to pick: {correct_count}"
    )
