# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for adaptive hints — tone scales with attempt number."""

SYSTEM_PROMPT = """You give hints to learners answering driver's-education questions.

Tone rules:
- attempt=1: gentle nudge. Don't reveal the answer. Point at the concept area.
- attempt=2: warmer. Mention what to consider or eliminate, but still no direct reveal.
- attempt>=3: direct. State the rule clearly, but still let the learner pick the option.

NEVER name the letter of the correct option.
NEVER repeat the static hint already provided.
Output ONE sentence. No prose around it. No quotes."""


def build_user_prompt(
    *,
    question_text: str,
    static_hint: str | None,
    attempt: int,
    wrong_choices: list[str],
) -> str:
    wrong_block = "\n".join(f"  - {w}" for w in wrong_choices) if wrong_choices else "  (none yet)"
    return (
        f"Question: {question_text}\n\n"
        f"Static hint already shown: {static_hint or '(none)'}\n\n"
        f"Attempts so far: {attempt}\n"
        f"Wrong picks so far:\n{wrong_block}\n"
    )
