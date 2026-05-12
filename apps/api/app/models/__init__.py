# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

from app.db.connection import Base  # noqa: F401
from .user import User, ParentLink  # noqa: F401
from .question import Chapter, Lesson, Question, Answer  # noqa: F401
from .session import (  # noqa: F401
    Session,
    SessionAnswer,
    UserProgress,
    LessonProgress,
    Bookmark,
    Achievement,
    UserAchievement,
    FlashcardDeck,
    ChapterGroup,
    Battle,
)
from .stats import PlayerBehaviorLog, PlayerStats  # noqa: F401
from .legal import UserConsent  # noqa: F401
from .auth import RefreshToken, KnownDevice  # noqa: F401

__all__ = [
    "Base",
    "User", "ParentLink",
    "Chapter", "Lesson", "Question", "Answer",
    "Session", "SessionAnswer", "UserProgress", "LessonProgress",
    "Bookmark", "Achievement", "UserAchievement",
    "FlashcardDeck", "ChapterGroup", "Battle",
    "PlayerBehaviorLog", "PlayerStats",
    "UserConsent",
    "RefreshToken", "KnownDevice",
]
