# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Bot personalities for the LLM-driven bot battle. Skill targets and
persona blurbs are tuned to give visibly different play styles."""

from dataclasses import dataclass


@dataclass(frozen=True)
class BotPersonality:
    id: str
    name: str
    target_accuracy: int   # 0-100, the rough hit rate this bot should aim for
    persona_blurb: str     # injected into the prompt to shape behavior


BOT_PERSONALITIES: dict[str, BotPersonality] = {
    "rusty": BotPersonality(
        id="rusty",
        name="Rusty",
        target_accuracy=30,
        persona_blurb=(
            "You are Rusty — a new driver who has only briefly skimmed the handbook. "
            "You frequently confuse similar rules, guess when unsure, and fall for common "
            "exam traps. Aim to answer correctly about 30% of the time. When unsure, pick "
            "an answer that sounds plausible but is a typical beginner mistake."
        ),
    ),
    "dash": BotPersonality(
        id="dash",
        name="Dash",
        target_accuracy=60,
        persona_blurb=(
            "You are Dash — an average learner who has studied the handbook once. "
            "You know the basics confidently but still miss edge cases, unusual rules, "
            "or questions that hinge on a single technical detail. Aim to answer correctly "
            "about 60% of the time."
        ),
    ),
    "apex": BotPersonality(
        id="apex",
        name="Apex",
        target_accuracy=95,
        persona_blurb=(
            "You are Apex — a strong test-taker who has thoroughly studied the Oklahoma "
            "Driver Manual. You read carefully and reason through each option. Aim to "
            "answer correctly about 95% of the time. You rarely make mistakes and only "
            "miss when a question is genuinely ambiguous."
        ),
    ),
}
