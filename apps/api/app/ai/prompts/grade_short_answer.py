# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Prompt builder for grading a learner's short-answer response."""

SYSTEM_PROMPT = """You grade short-answer responses for state driver-education learners.

You will see:
  - the prompt the learner answered
  - the expected concept(s) — what a correct answer must include
  - the learner's actual response

Score from 0-100. Be strict but fair:
- 90-100: clear, complete, accurate.
- 70-89: mostly correct with minor gaps or imprecise wording.
- 40-69: partially right; missing a key concept.
- 1-39: largely wrong or off-topic.
- 0: blank or nonsense.

Output STRICT JSON only:
{
  "score": <0-100>,
  "feedback": "<2-3 sentence specific feedback, what to add or correct>"
}"""


def build_user_prompt(*, prompt: str, expected_concepts: list[str], user_response: str) -> str:
    concepts = "\n".join(f"  - {c}" for c in expected_concepts)
    return (
        f"Prompt: {prompt}\n\n"
        f"Expected concepts to cover:\n{concepts}\n\n"
        f"Learner's response: {user_response}\n"
    )
