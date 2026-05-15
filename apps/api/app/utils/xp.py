# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""
XP calculation and level utilities.
Single source of truth — used by mutations, tasks, and tests.
"""

# ── Constants ─────────────────────────────────────────────────────────────────

XP_PER_CORRECT_ANSWER = 5
XP_SESSION_COMPLETION = 10
XP_DAILY_CHALLENGE = 25
XP_CHAPTER_COMPLETE = 20
XP_CHAPTER_ACE = 30          # 100% on pop quiz
XP_LESSON_CARD = 2

XP_BEAT_RUSTY = 20
XP_BEAT_DASH = 40
XP_BEAT_APEX = 80
XP_WIN_PEER_BATTLE = 50

XP_STREAK_7_DAY = 50
XP_STREAK_30_DAY = 200

DIFFICULTY_MULTIPLIER = {
    "beginner": 1,
    "pro": 2,
    "expert": 3,
}

# XP required to reach each level (index = level number, level 1 starts at 0)
LEVEL_THRESHOLDS = [
    0,      # Level 1 — Learner
    100,    # Level 2 — Student
    300,    # Level 3 — Driver in Training
    600,    # Level 4 — Road Scholar
    1000,   # Level 5 — Highway Pro
    1500,   # Level 6 — Permit Ready
    2200,   # Level 7 — License Bound
]

LEVEL_NAMES = [
    "",                  # index 0 unused
    "Learner",
    "Student",
    "Driver in Training",
    "Road Scholar",
    "Highway Pro",
    "Permit Ready",
    "License Bound",
]


# ── Hint / skip allowances by difficulty ─────────────────────────────────────

def get_hint_allowance(difficulty: str, question_count: int) -> int:
    """Returns the number of hints allowed for a session."""
    if difficulty == "beginner":
        return 9999       # unlimited
    if difficulty == "pro":
        return max(1, question_count // 5)
    return 0


def get_skip_allowance(difficulty: str, question_count: int) -> int:
    """Returns the number of skips allowed for a session."""
    return get_hint_allowance(difficulty, question_count)  # same rule


# ── XP calculation ────────────────────────────────────────────────────────────

def xp_for_answer(is_correct: bool, difficulty: str, hint_used: bool = False) -> int:
    """XP awarded for a single answer."""
    if not is_correct:
        return 0
    base = XP_PER_CORRECT_ANSWER * DIFFICULTY_MULTIPLIER.get(difficulty, 1)
    # Hint reduces XP by half in Pro sessions.
    if hint_used and difficulty == "pro":
        return base // 2
    return base


def xp_for_session(score: int, total: int, difficulty: str) -> int:
    """XP awarded for completing a session (base + per-correct)."""
    per_correct = sum(
        xp_for_answer(True, difficulty) for _ in range(score)
    )
    return XP_SESSION_COMPLETION + per_correct


def xp_for_battle_win(bot_type: str | None, is_peer: bool) -> int:
    """XP for winning a battle."""
    if is_peer:
        return XP_WIN_PEER_BATTLE
    mapping = {"rusty": XP_BEAT_RUSTY, "dash": XP_BEAT_DASH, "apex": XP_BEAT_APEX}
    return mapping.get(bot_type or "", 0)


# ── Level utilities ───────────────────────────────────────────────────────────

def level_for_xp(xp: int) -> int:
    """Return the level (1–7) for a given XP total."""
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if xp >= threshold:
            level = i + 1
    return min(level, len(LEVEL_THRESHOLDS))


def xp_to_next_level(xp: int) -> int | None:
    """Return XP needed to reach the next level, or None if max level."""
    current_level = level_for_xp(xp)
    if current_level >= len(LEVEL_THRESHOLDS):
        return None
    return LEVEL_THRESHOLDS[current_level] - xp


def level_name(level: int) -> str:
    """Human-readable name for a level number."""
    if 1 <= level <= len(LEVEL_NAMES) - 1:
        return LEVEL_NAMES[level]
    return "License Bound"
