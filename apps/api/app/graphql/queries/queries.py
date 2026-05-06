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
from sqlalchemy.orm import selectinload, contains_eager

from app.models import User, Question, Answer, Chapter, Lesson, UserProgress, Bookmark, FlashcardDeck, ChapterGroup, Battle, ParentLink
from app.graphql.types.all_types import (
    QuestionType, AnswerType, UserType, ChapterType,
    LessonType, ChapterProgressType, ReadinessScoreType,
    StateConfigType, BookmarkType, FlashcardDeckType, ChapterGroupType, BattleType,
    LinkedLearnerType, ParentLinkType,
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
        email_verified=u.email_verified,
        phone_number=u.phone_number,
        phone_verified=u.phone_verified,
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
    async def readiness_score(self, info: Info) -> Optional[ReadinessScoreType]:
        """Return an overall exam readiness score based on chapter accuracy."""
        user: User | None = info.context.get("user")
        if not user:
            return None
        db: AsyncSession = info.context["db"]

        state_cfg = STATE_CONFIGS.get(user.state_code)
        passing = state_cfg.passing_score if state_cfg else 0.80

        result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id   == user.id,
                UserProgress.state_code == user.state_code,
                UserProgress.questions_seen > 0,
            )
        )
        rows = result.scalars().all()

        if not rows:
            return ReadinessScoreType(
                score=0.0, percentage=0,
                level="not_ready",
                message="Start studying to see your readiness score.",
                growth_chapters=[],
            )

        total_seen    = sum(r.questions_seen    for r in rows)
        total_correct = sum(r.questions_correct for r in rows)
        score = total_correct / total_seen if total_seen else 0.0
        percentage = round(score * 100)

        growth_chapters = [r.chapter for r in rows if r.accuracy < 0.65]

        if score >= passing + 0.10:
            level, message = "very_ready",    "You're well above the passing threshold. Keep it up!"
        elif score >= passing:
            level, message = "likely_ready",  f"You're at or above the {round(passing * 100)}% passing mark."
        elif score >= passing - 0.15:
            level, message = "getting_there", "Almost there — focus on your growth chapters."
        else:
            level, message = "not_ready",     "Keep studying — you'll get there."

        return ReadinessScoreType(
            score=round(score, 4),
            percentage=percentage,
            level=level,
            message=message,
            growth_chapters=sorted(growth_chapters),
        )

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
    async def battle(
        self, info: Info, battle_id: strawberry.ID
    ) -> Optional[BattleType]:
        """Fetch a single battle by ID — used by PeerBattleSession to load state."""
        import uuid as _uuid
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(Battle).where(Battle.id == _uuid.UUID(str(battle_id)))
        )
        b = result.scalar_one_or_none()
        if not b:
            return None
        from app.graphql.mutations.mutations import map_battle
        return map_battle(b)

    @strawberry.field
    async def battle_questions(
        self, info: Info, battle_id: strawberry.ID
    ) -> list[QuestionType]:
        """
        Return the questions for a peer battle in their original shuffled order.
        Both players receive identical question sets in the same sequence.
        """
        import uuid as _uuid
        db: AsyncSession = info.context["db"]
        b_result = await db.execute(
            select(Battle).where(Battle.id == _uuid.UUID(str(battle_id)))
        )
        battle = b_result.scalar_one_or_none()
        if not battle or not battle.question_ids:
            return []

        q_result = await db.execute(
            select(Question)
            .where(Question.id.in_([_uuid.UUID(qid) for qid in battle.question_ids]))
            .options(selectinload(Question.answers))
        )
        by_id = {str(q.id): q for q in q_result.scalars().all()}
        # Preserve the original battle order
        return [map_question(by_id[qid]) for qid in battle.question_ids if qid in by_id]

    @strawberry.field
    async def chapter_groups(
        self, info: Info, state_code: str
    ) -> list[ChapterGroupType]:
        """Return preset groups + groups created by the current user for a given state."""
        from sqlalchemy import or_
        user: User | None = info.context.get("user")
        db: AsyncSession = info.context["db"]
        stmt = (
            select(ChapterGroup)
            .where(ChapterGroup.state_code == state_code)
            .where(
                or_(
                    ChapterGroup.is_preset == True,  # noqa: E712
                    ChapterGroup.user_id == (user.id if user else None),
                )
            )
            .order_by(ChapterGroup.is_preset.desc(), ChapterGroup.created_at)
        )
        result = await db.execute(stmt)
        groups = result.scalars().all()
        return [
            ChapterGroupType(
                id=str(g.id),
                name=g.name,
                state_code=g.state_code,
                chapter_numbers=g.chapter_numbers or [],
                is_preset=g.is_preset,
                created_at=g.created_at,
            )
            for g in groups
        ]

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

    @strawberry.field
    async def my_linked_learners(self, info: Info) -> list[LinkedLearnerType]:
        """Return all active learners linked to the current parent account."""
        user: User | None = info.context.get("user")
        if not user:
            return []
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(ParentLink)
            .where(
                ParentLink.parent_id == user.id,
                ParentLink.status == "active",
            )
            .options(selectinload(ParentLink.learner))
            .order_by(ParentLink.updated_at.desc())
        )
        links = result.scalars().all()
        return [
            LinkedLearnerType(
                link_id=str(lnk.id),
                learner_id=str(lnk.learner_id),
                display_name=lnk.learner.display_name,
                avatar_url=lnk.learner.avatar_url,
                level=lnk.learner.level,
                xp_total=lnk.learner.xp_total,
                streak_days=lnk.learner.streak_days,
                state_code=lnk.learner.state_code,
                linked_at=lnk.updated_at,
            )
            for lnk in links
        ]

    @strawberry.field
    async def my_parent_links(self, info: Info) -> list[ParentLinkType]:
        """Return all parent links for the current learner (pending, active, or revoked)."""
        user: User | None = info.context.get("user")
        if not user:
            return []
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(ParentLink)
            .where(
                ParentLink.learner_id == user.id,
                ParentLink.status.in_(["pending", "active"]),
            )
            .order_by(ParentLink.created_at.desc())
        )
        links = result.scalars().all()
        return [
            ParentLinkType(
                id=str(lnk.id),
                status=lnk.status,
                link_code=lnk.link_code,
                link_code_expires_at=lnk.link_code_expires_at,
                created_at=lnk.created_at,
            )
            for lnk in links
        ]
