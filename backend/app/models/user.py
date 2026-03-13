import uuid
from datetime import date, datetime
from sqlalchemy import String, Integer, Boolean, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.connection import Base
from .base import UUIDMixin, TimestampMixin


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="learner")
    state_code: Mapped[str] = mapped_column(String(5), nullable=False, default="ok")

    # Progression
    xp_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Streaks
    streak_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak_last_date: Mapped[date | None] = mapped_column(Date)
    freeze_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Test date (optional, for Night Before Mode)
    test_date: Mapped[date | None] = mapped_column(Date)

    # Relationships
    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    progress: Mapped[list["UserProgress"]] = relationship(back_populates="user")
    bookmarks: Mapped[list["Bookmark"]] = relationship(back_populates="user")
    achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="user")
    decks: Mapped[list["FlashcardDeck"]] = relationship(back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"


class ParentLink(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "parent_links"
    __table_args__ = (
        UniqueConstraint("parent_id", "learner_id", name="uq_parent_learner"),
    )

    parent_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    learner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending | active | revoked
    link_code: Mapped[str | None] = mapped_column(String(10), unique=True)

    parent: Mapped["User"] = relationship(foreign_keys=[parent_id])
    learner: Mapped["User"] = relationship(foreign_keys=[learner_id])
