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
from sqlalchemy import String, Integer, Boolean, Text, ForeignKey, ARRAY, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.connection import Base
from .base import UUIDMixin, TimestampMixin


class Chapter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "chapters"
    __table_args__ = (
        UniqueConstraint("state_code", "number", name="uq_chapter_state_number"),
    )

    state_code: Mapped[str] = mapped_column(String(5), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="chapter", order_by="Lesson.sort_order"
    )
    questions: Mapped[list["Question"]] = relationship(back_populates="chapter_rel")


class Lesson(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lessons"

    chapter_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("chapters.id", ondelete="CASCADE"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    title: Mapped[str | None] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    fact_tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)

    chapter: Mapped["Chapter"] = relationship(back_populates="lessons")


class Question(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "questions"

    state_code: Mapped[str] = mapped_column(String(5), nullable=False, index=True)
    chapter: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    chapter_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("chapters.id", ondelete="SET NULL")
    )
    lesson_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty: Mapped[str] = mapped_column(
        String(10), nullable=False, index=True
    )  # beginner | pro | expert

    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    hint_text: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    source_page: Mapped[int | None] = mapped_column(Integer)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    source: Mapped[str] = mapped_column(
        String(20), nullable=False, default="manual"
    )  # manual | ai_generated

    # Relationships
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="Answer.sort_order",
    )
    chapter_rel: Mapped["Chapter | None"] = relationship(back_populates="questions")

    def __repr__(self) -> str:
        return f"<Question ch={self.chapter} difficulty={self.difficulty}>"


class Answer(Base, UUIDMixin):
    __tablename__ = "answers"

    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    question: Mapped["Question"] = relationship(back_populates="answers")
