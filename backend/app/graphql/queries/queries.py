# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import strawberry
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from strawberry.types import Info
from sqlalchemy.orm import selectinload

from app.models import User, Question, Answer, Chapter, Lesson, UserProgress, Bookmark, FlashcardDeck
from app.graphql.types.all_types import (
    QuestionType, AnswerType, UserType, ChapterType,
    LessonType, ChapterProgressType, ReadinessScoreType,
    StateConfigType, BookmarkType, FlashcardDeckType
)
from app.config import get_state_config, STATE_CONFIGS
from app.db import cache_get, cache_set, CacheKey, TTL
import random


def map_question(q: Question) -> QuestionType:
    return QuestionType(
        id=str(q.id),
        state_code=q.state_code,
        chapter=q.chapter,
        category=q.category,
        difficulty=q.difficulty,
        question_text=q.question_text,
        correct_count=q.correct_count,
        explanation=q.explanation,
        hint_text=q.hint_text,
        image_url=q.image_url,
        source_page=q.source_page,
        tags=q.tags or [],
        source=q.source,
        answers=[
            AnswerType(
                id=str(a.id),
                text=a.text,
                is_correct=a.is_correct,
                sort_order=a.sort_order,
            )
            for a in q.answers
        ],
    )


def map_user(u: User) -> UserType:
    return UserType(
        id=str(u.id),
        email=u.email,
        display_name=u.display_name,
        avatar_url=u.avatar_url,
        role=u.role,
        state_code=u.state_code,
        xp_total=u.xp_total,
        level=u.level,
        streak_days=u.streak_days,
        freeze_tokens=u.freeze_tokens,
        test_date=u.test_date,
        created_at=u.created_at,
    )


@strawberry.type
class Query:

    @strawberry.field
    async def me(self, info: Info) -> Optional[UserType]:
        """Return the currently authenticated user."""
        user: User | None = info.context.get("user")
        if not user:
            return None
        return map_user(user)

    @strawberry.field
    async def questions(
        self,
        info: Info,
        state_code: str,
        count: int,
        chapters: Optional[list[int]] = None,
        difficulty: Optional[str] = None,
        exclude_ids: Optional[list[str]] = None,
    ) -> list[QuestionType]:
        """
        Fetch questions for a quiz/study session.
        Randomised, filtered by chapter and difficulty.
        Already-answered questions can be excluded.
        """
        db: AsyncSession = info.context["db"]

        stmt = select(Question).where(Question.state_code == state_code)

        if chapters:
            stmt = stmt.where(Question.chapter.in_(chapters))
        if difficulty:
            stmt = stmt.where(Question.difficulty == difficulty)
        if exclude_ids:
            stmt = stmt.where(Question.id.not_in(exclude_ids))

        result = await db.execute(stmt.options(selectinload(Question.answers)))
        all_questions = result.scalars().all()

        # Shuffle and cap at requested count
        random.shuffle(list(all_questions))
        selected = list(all_questions)[:count]

        return [map_question(q) for q in selected]

    @strawberry.field
    async def chapters(
        self, info: Info, state_code: str
    ) -> list[ChapterType]:
        """List all chapters for a given state."""
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(Chapter)
            .where(Chapter.state_code == state_code)
            .order_by(Chapter.number)
        )
        chapters = result.scalars().all()
        return [
            ChapterType(
                id=str(c.id),
                state_code=c.state_code,
                number=c.number,
                title=c.title,
                description=c.description,
            )
            for c in chapters
        ]
        
    @strawberry.field
    async def lessons(
        self, info: Info, chapter_id: strawberry.ID
    ) -> list[LessonType]:
        """Fetch all lessons for a chapter, ordered by sort_order."""
        import uuid
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(Lesson)
            .where(Lesson.chapter_id == uuid.UUID(str(chapter_id)))
            .order_by(Lesson.sort_order)
        )
        lessons = result.scalars().all()
        return [
            LessonType(
                id=str(l.id),
                chapter_id=str(l.chapter_id),
                sort_order=l.sort_order,
                title=l.title,
                content=l.content,
                image_url=l.image_url,
                fact_tags=l.fact_tags or [],
            )
            for l in lessons
        ]

    @strawberry.field
    async def my_progress(self, info: Info) -> list[ChapterProgressType]:
        """Return per-chapter progress for the current user."""
        user: User | None = info.context.get("user")
        if not user:
            return []
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(UserProgress)
            .where(
                UserProgress.user_id == user.id,
                UserProgress.state_code == user.state_code,
            )
            .order_by(UserProgress.chapter)
        )
        progress_rows = result.scalars().all()
        return [
            ChapterProgressType(
                chapter=p.chapter,
                state_code=p.state_code,
                questions_seen=p.questions_seen,
                questions_correct=p.questions_correct,
                accuracy=p.accuracy,
                lessons_completed=p.lessons_completed,
                lessons_total=p.lessons_total,
                last_studied_at=p.last_studied_at,
            )
            for p in progress_rows
        ]

    @strawberry.field
    def state_config(self, state_code: str) -> Optional[StateConfigType]:
        """Return configuration for a given state."""
        config = STATE_CONFIGS.get(state_code.lower())
        if not config:
            return None
        return StateConfigType(
            code=config.code,
            name=config.name,
            full_name=config.full_name,
            primary_color=config.primary_color,
            secondary_color=config.secondary_color,
            passing_score=config.passing_score,
            real_test_count=config.real_test_count,
            chapters=config.chapters,
        )
    
    @strawberry.field
    async def my_bookmarks(self, info: Info) -> list[QuestionType]:
        """Return all questions the current user has bookmarked."""
        user: User | None = info.context.get("user")
        if not user:
            return []
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(Question)
            .join(Bookmark, Bookmark.question_id == Question.id)
            .where(Bookmark.user_id == user.id)
            .order_by(Bookmark.created_at.desc())
        )
        questions = result.scalars().all()
        return [map_question(q) for q in questions]

    @strawberry.field
    async def my_decks(self, info: Info) -> list[FlashcardDeckType]:
        """Return all saved flashcard decks for the current user."""
        user: User | None = info.context.get("user")
        if not user:
            return []
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(FlashcardDeck)
            .where(FlashcardDeck.user_id == user.id)
            .order_by(FlashcardDeck.created_at.desc())
        )
        decks = result.scalars().all()
        return [
            FlashcardDeckType(
                id=str(d.id),
                name=d.name,
                question_ids=d.question_ids or [],
                is_smart=d.is_smart,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in decks
        ]
