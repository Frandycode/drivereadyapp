# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

from dataclasses import dataclass


@dataclass
class StateConfig:
    code: str
    name: str
    full_name: str
    domain: str
    primary_color: str
    secondary_color: str
    passing_score: float      # e.g. 0.80 = 80%
    real_test_count: int      # questions on the real exam
    chapters: int             # number of chapters in the manual


STATE_CONFIGS: dict[str, StateConfig] = {
    "ok": StateConfig(
        code="ok",
        name="Oklahoma",
        full_name="DriveReady Oklahoma",
        domain="driveready-ok.com",
        primary_color="#22C55E",
        secondary_color="#F59E0B",
        passing_score=0.80,
        real_test_count=50,
        chapters=12,
    ),
    "tx": StateConfig(
        code="tx",
        name="Texas",
        full_name="DriveReady Texas",
        domain="driveready-tx.com",
        primary_color="#DC2626",
        secondary_color="#94A3B8",
        passing_score=0.70,
        real_test_count=30,
        chapters=10,
    ),
    "ca": StateConfig(
        code="ca",
        name="California",
        full_name="DriveReady California",
        domain="driveready-ca.com",
        primary_color="#1D4ED8",
        secondary_color="#CA8A04",
        passing_score=0.83,
        real_test_count=46,
        chapters=11,
    ),
}


def get_state_config(state_code: str) -> StateConfig:
    config = STATE_CONFIGS.get(state_code.lower())
    if not config:
        raise ValueError(f"Unknown state code: {state_code}")
    return config
