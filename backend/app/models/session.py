# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import uuid
from datetime import datetime
from sqlalchemy import (
    String, Integer, Boolean, Float, Text,
    ForeignKey, ARRAY, UniqueConstraint, DateTime
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.connection import Base
from .base import UUIDMixin, TimestampMixin


class Session(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    state_code: Mapped[str] = mapped_column(String(5), nullable=False)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    # quiz | puzzle | flipper | trivia | bot_battle | peer_battle | flashcard_drill | flashcard_blitz
    difficulty: Mapped[str] = mapped_column(String(10), nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    chapters: Mapped[list[int]] = mapped_column(ARRAY(Integer), default=list)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    hints_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skips_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    time_seconds: Mapped[int | None] = mapped_column(Integer)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="sessions")
    answers: Mapped[list["SessionAnswer"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class SessionAnswer(Base, UUIDMixin):
    __tablename__ = "session_answers"

    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    selected_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(String), default=list)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    hint_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    skipped: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    time_taken_ms: Mapped[int | None] = mapped_column(Integer)
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    session: Mapped["Session"] = relationship(back_populates="answers")
    question: Mapped["Question"] = relationship()


class UserProgress(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "chapter", "state_code", name="uq_user_chapter_state"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    chapter: Mapped[int] = mapped_column(Integer, nullable=False)
    state_code: Mapped[str] = mapped_column(String(5), nullable=False)
    questions_seen: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    questions_correct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lessons_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lessons_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_studied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="progress")

    @property
    def accuracy(self) -> float:
        if self.questions_seen == 0:
            return 0.0
        return self.questions_correct / self.questions_seen


class Bookmark(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_bookmark_user_question"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    question_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE")
    )
    lesson_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    note: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="bookmarks")
    question: Mapped["Question | None"] = relationship()


class Achievement(Base, UUIDMixin):
    __tablename__ = "achievements"

    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="achievement"
    )


class UserAchievement(Base, UUIDMixin):
    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    achievement_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False
    )
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="user_achievements")


class FlashcardDeck(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "flashcard_decks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    question_ids: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    is_smart: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    user: Mapped["User"] = relationship(back_populates="decks")


class ChapterGroup(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "chapter_groups"

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    state_code: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    chapter_numbers: Mapped[list[int]] = mapped_column(ARRAY(Integer), nullable=False, default=list)
    is_preset: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Battle(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "battles"

    type: Mapped[str] = mapped_column(String(10), nullable=False)  # bot | peer
    player_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    opponent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    bot_type: Mapped[str | None] = mapped_column(String(10))       # rusty | dash | apex
    question_ids: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    player_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    opponent_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    winner: Mapped[str | None] = mapped_column(String(10))         # player | opponent | tie
    state: Mapped[str] = mapped_column(
        String(10), nullable=False, default="waiting"
    )  # waiting | active | complete
    room_code: Mapped[str | None] = mapped_column(String(6), unique=True, index=True)
    timer_seconds: Mapped[int | None] = mapped_column(Integer)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    player: Mapped["User"] = relationship(foreign_keys=[player_id])
    opponent: Mapped["User | None"] = relationship(foreign_keys=[opponent_id])


# Import User here to avoid circular imports
from .user import User  # noqa: E402, F401