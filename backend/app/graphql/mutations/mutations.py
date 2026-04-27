import strawberry
import uuid
import json
import random
import string
from datetime import datetime, timezone
from typing import Optional
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from strawberry.types import Info

from app.models import (
    User, Session, SessionAnswer, Question, Answer,
    UserProgress, Bookmark, FlashcardDeck, Battle,
)
from app.models.question import Chapter, Lesson
from app.auth.jwt import create_access_token
from app.graphql.types.all_types import (
    AuthPayloadType, UserType, SessionType, SessionResultType,
    AnswerResultType, BookmarkType, FlashcardDeckType, BattleType,
    ChapterProgressType,
    RegisterInput, LoginInput, StartSessionInput, SubmitAnswerInput,
    CreateDeckInput,
)
from app.db.redis import get_redis, TTL

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


# ── Mappers ───────────────────────────────────────────────────────────────────

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


def map_session(s: Session) -> SessionType:
    return SessionType(
        id=str(s.id),
        mode=s.mode,
        difficulty=s.difficulty,
        question_count=s.question_count,
        score=s.score,
        total=s.total,
        xp_earned=s.xp_earned,
        completed=s.completed,
        started_at=s.created_at,
        completed_at=s.completed_at,
    )


def map_battle(b: Battle) -> BattleType:
    return BattleType(
        id=str(b.id),
        type=b.type,
        bot_type=b.bot_type,
        player_score=b.player_score,
        opponent_score=b.opponent_score,
        winner=b.winner,
        state=b.state,
        question_ids=b.question_ids or [],
        room_code=b.room_code,
        timer_seconds=b.timer_seconds,
        created_at=b.created_at,
    )


# XP constants
XP_PER_CORRECT = 5
XP_DIFFICULTY_MULTIPLIER = {"pawn": 1, "rogue": 2, "king": 3}
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200]


def calculate_level(xp: int) -> int:
    for i, threshold in enumerate(reversed(LEVEL_THRESHOLDS)):
        if xp >= threshold:
            return len(LEVEL_THRESHOLDS) - i
    return 1


# ── Mutation class ────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:

    @strawberry.mutation
    async def register(
        self, info: Info, input: RegisterInput
    ) -> AuthPayloadType:
        """Register a new user account."""
        db: AsyncSession = info.context["db"]

        existing = await db.execute(
            select(User).where(User.email == input.email.lower())
        )
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        pwd_context.hash(input.password)

        user = User(
            email=input.email.lower(),
            display_name=input.display_name,
            state_code=input.state_code,
            role="learner",
        )
        db.add(user)
        await db.flush()
        await db.commit()

        token = create_access_token(str(user.id), user.role)
        return AuthPayloadType(access_token=token, user=map_user(user))

    @strawberry.mutation
    async def login(
        self, info: Info, input: LoginInput
    ) -> AuthPayloadType:
        """Login with email and password."""
        db: AsyncSession = info.context["db"]

        result = await db.execute(
            select(User).where(User.email == input.email.lower())
        )
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("Invalid email or password")

        token = create_access_token(str(user.id), user.role)
        return AuthPayloadType(access_token=token, user=map_user(user))

    @strawberry.mutation
    async def start_session(
        self, info: Info, input: StartSessionInput
    ) -> SessionType:
        """Begin a new quiz or study session."""
        db: AsyncSession = info.context["db"]
        user: User | None = info.context.get("user")

        session = Session(
            user_id=user.id if user else uuid.uuid4(),
            state_code=input.state_code,
            mode=input.mode,
            difficulty=input.difficulty,
            question_count=input.question_count,
            chapters=input.chapters,
        )
        db.add(session)
        await db.flush()
        await db.commit()
        return map_session(session)

    @strawberry.mutation
    async def submit_answer(
        self, info: Info, input: SubmitAnswerInput
    ) -> AnswerResultType:
        """Submit an answer for a question in an active session."""
        db: AsyncSession = info.context["db"]

        q_result = await db.execute(
            select(Question)
            .where(Question.id == uuid.UUID(str(input.question_id)))
            .options(selectinload(Question.answers))
        )
        question = q_result.scalar_one_or_none()
        if not question:
            raise ValueError("Question not found")

        answers      = question.answers
        correct_ids  = {str(a.id) for a in answers if a.is_correct}
        selected_ids = {str(i) for i in input.selected_answer_ids}
        is_correct   = correct_ids == selected_ids

        session_result = await db.execute(
            select(Session).where(Session.id == uuid.UUID(str(input.session_id)))
        )
        session    = session_result.scalar_one_or_none()
        multiplier = XP_DIFFICULTY_MULTIPLIER.get(session.difficulty if session else "pawn", 1)
        xp         = XP_PER_CORRECT * multiplier if is_correct else 0

        session_answer = SessionAnswer(
            session_id=uuid.UUID(str(input.session_id)),
            question_id=question.id,
            selected_ids=[str(i) for i in input.selected_answer_ids],
            is_correct=is_correct,
            hint_used=input.hint_used,
            skipped=False,
            time_taken_ms=input.time_taken_ms,
            answered_at=datetime.now(timezone.utc),
        )
        db.add(session_answer)

        if session:
            session.total += 1
            if is_correct:
                session.score += 1
                session.xp_earned += xp

        user: User | None = info.context.get("user")
        if user and xp > 0:
            user.xp_total += xp
            user.level = calculate_level(user.xp_total)

        if user:
            await _upsert_progress(db, user, question, is_correct)

        await db.commit()

        return AnswerResultType(
            is_correct=is_correct,
            correct_answer_ids=[str(i) for i in correct_ids],
            explanation=question.explanation,
            xp_earned=xp,
        )

    @strawberry.mutation
    async def save_bookmark(
        self, info: Info, question_id: strawberry.ID
    ) -> BookmarkType:
        """Bookmark a question for later study."""
        db: AsyncSession = info.context["db"]
        user: User = info.context["user"]

        bookmark = Bookmark(
            user_id=user.id,
            question_id=uuid.UUID(str(question_id)),
        )
        db.add(bookmark)
        await db.flush()
        await db.commit()

        return BookmarkType(
            id=str(bookmark.id),
            question_id=str(bookmark.question_id) if bookmark.question_id else None,
            lesson_id=None,
            note=None,
            created_at=bookmark.created_at,
        )

    @strawberry.mutation
    async def create_deck(
        self, info: Info, input: CreateDeckInput
    ) -> FlashcardDeckType:
        """Create a custom named flashcard deck."""
        db: AsyncSession = info.context["db"]
        user: User = info.context["user"]

        deck = FlashcardDeck(
            user_id=user.id,
            name=input.name,
            question_ids=input.question_ids,
            is_smart=False,
        )
        db.add(deck)
        await db.flush()
        await db.commit()

        return FlashcardDeckType(
            id=str(deck.id),
            name=deck.name,
            question_ids=deck.question_ids,
            is_smart=deck.is_smart,
            created_at=deck.created_at,
            updated_at=deck.updated_at,
        )

    @strawberry.mutation
    async def complete_lesson(
        self, info: Info, lesson_id: strawberry.ID
    ) -> ChapterProgressType:
        """Mark a lesson as complete and upsert chapter progress."""
        db: AsyncSession = info.context["db"]
        user: User | None = info.context.get("user")

        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == uuid.UUID(str(lesson_id)))
        )
        lesson = lesson_result.scalar_one_or_none()
        if not lesson:
            raise ValueError("Lesson not found")

        chapter_result = await db.execute(
            select(Chapter).where(Chapter.id == lesson.chapter_id)
        )
        chapter = chapter_result.scalar_one_or_none()
        if not chapter:
            raise ValueError("Chapter not found")

        count_result = await db.execute(
            select(func.count()).where(Lesson.chapter_id == chapter.id)
        )
        lessons_total = count_result.scalar() or 0

        if user:
            progress_result = await db.execute(
                select(UserProgress).where(
                    UserProgress.user_id == user.id,
                    UserProgress.chapter == chapter.number,
                    UserProgress.state_code == chapter.state_code,
                )
            )
            progress = progress_result.scalar_one_or_none()
            if progress:
                progress.lessons_completed = min(progress.lessons_completed + 1, lessons_total)
                progress.lessons_total = lessons_total
            else:
                progress = UserProgress(
                    user_id=user.id,
                    chapter=chapter.number,
                    state_code=chapter.state_code,
                    lessons_completed=1,
                    lessons_total=lessons_total,
                )
                db.add(progress)
            await db.commit()

            return ChapterProgressType(
                chapter=chapter.number,
                state_code=chapter.state_code,
                questions_seen=progress.questions_seen,
                questions_correct=progress.questions_correct,
                accuracy=progress.accuracy,
                lessons_completed=progress.lessons_completed,
                lessons_total=lessons_total,
                last_studied_at=progress.last_studied_at,
            )

        return ChapterProgressType(
            chapter=chapter.number,
            state_code=chapter.state_code,
            questions_seen=0,
            questions_correct=0,
            accuracy=0.0,
            lessons_completed=1,
            lessons_total=lessons_total,
            last_studied_at=None,
        )

    @strawberry.mutation
    async def complete_session(
        self, info: Info, session_id: strawberry.ID
    ) -> SessionResultType:
        """Mark a session as complete and return final results."""
        db: AsyncSession = info.context["db"]

        result = await db.execute(
            select(Session).where(Session.id == uuid.UUID(str(session_id)))
        )
        session = result.scalar_one_or_none()
        if not session:
            raise ValueError("Session not found")

        session.completed    = True
        session.completed_at = datetime.now(timezone.utc)
        await db.commit()

        accuracy = session.score / session.total if session.total > 0 else 0.0

        return SessionResultType(
            session=map_session(session),
            xp_earned=session.xp_earned,
            badges_unlocked=[],
            level_up=False,
            new_level=None,
            accuracy=accuracy,
        )

    @strawberry.mutation
    async def create_battle(
        self,
        info: Info,
        question_count: int,
        state_code: str = "ok",
        timer_seconds: Optional[int] = None,
        chapter: Optional[int] = None,
    ) -> BattleType:
        """Host creates a peer battle room. Returns a 6-digit room code."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        # Generate unique 6-digit room code
        code = "000000"
        for _ in range(20):
            code = "".join(random.choices(string.digits, k=6))
            existing = await db.execute(
                select(Battle).where(
                    Battle.room_code == code,
                    Battle.state == "waiting",
                )
            )
            if not existing.scalar_one_or_none():
                break

        # Fetch questions
        stmt = select(Question).where(Question.state_code == state_code)
        if chapter:
            stmt = stmt.where(Question.chapter == chapter)
        q_result = await db.execute(stmt.options(selectinload(Question.answers)))
        all_questions = q_result.scalars().all()
        selected      = random.sample(list(all_questions), min(question_count, len(all_questions)))
        question_ids  = [str(q.id) for q in selected]

        battle = Battle(
            type="peer",
            player_id=user.id,
            question_ids=question_ids,
            state="waiting",
            room_code=code,
            timer_seconds=timer_seconds,
        )
        db.add(battle)
        await db.flush()
        await db.commit()

        # Cache in Redis
        r = await get_redis()
        await r.setex(
            f"battle:{str(battle.id)}",
            TTL.BATTLE,
            json.dumps({
                "player_id":      str(user.id),
                "opponent_id":    None,
                "player_score":   0,
                "opponent_score": 0,
                "question_index": 0,
                "question_ids":   question_ids,
                "state":          "waiting",
                "timer_seconds":  timer_seconds,
            }),
        )

        return map_battle(battle)

    @strawberry.mutation
    async def join_battle(
        self,
        info: Info,
        room_code: str,
    ) -> BattleType:
        """Opponent joins an existing peer battle room by 6-digit code."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(
                Battle.room_code == room_code,
                Battle.state == "waiting",
            )
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Room not found or already started")
        if str(battle.player_id) == str(user.id):
            raise ValueError("Cannot join your own battle room")

        battle.opponent_id = user.id
        battle.state       = "active"
        await db.commit()

        # Update Redis
        r         = await get_redis()
        cache_key = f"battle:{str(battle.id)}"
        raw = await r.get(cache_key)
        if raw:
            data = json.loads(raw)
            data["opponent_id"] = str(user.id)
            data["state"]       = "active"
            await r.setex(cache_key, TTL.BATTLE, json.dumps(data))

        # Publish join event
        await r.publish(cache_key, json.dumps({
            "event":          "joined",
            "player_id":      str(user.id),
            "question_index": 0,
            "is_correct":     None,
            "player_score":   0,
            "opponent_score": 0,
            "battle_state":   "active",
            "winner":         None,
        }))

        return map_battle(battle)

    @strawberry.mutation
    async def submit_battle_answer(
        self,
        info: Info,
        battle_id: strawberry.ID,
        question_id: strawberry.ID,
        selected_answer_ids: list[strawberry.ID],
        question_index: int,
    ) -> BattleType:
        """Submit an answer in a peer battle. Publishes real-time update via Redis."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.id == uuid.UUID(str(battle_id)))
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Battle not found")

        q_result = await db.execute(
            select(Question)
            .where(Question.id == uuid.UUID(str(question_id)))
            .options(selectinload(Question.answers))
        )
        question = q_result.scalar_one_or_none()
        if not question:
            raise ValueError("Question not found")

        correct_ids  = {str(a.id) for a in question.answers if a.is_correct}
        selected_set = {str(i) for i in selected_answer_ids}
        is_correct   = correct_ids == selected_set

        is_player = str(battle.player_id) == str(user.id)
        if is_player and is_correct:
            battle.player_score += 1
        elif not is_player and is_correct:
            battle.opponent_score += 1

        await db.commit()

        r = await get_redis()
        await r.publish(f"battle:{str(battle.id)}", json.dumps({
            "event":          "answer_submitted",
            "player_id":      str(user.id),
            "question_index": question_index,
            "is_correct":     is_correct,
            "player_score":   battle.player_score,
            "opponent_score": battle.opponent_score,
            "battle_state":   battle.state,
            "winner":         battle.winner,
        }))

        return map_battle(battle)


# ── Helper ────────────────────────────────────────────────────────────────────

async def _upsert_progress(
    db: AsyncSession,
    user: User,
    question: Question,
    is_correct: bool,
) -> None:
    """Upsert user_progress row for a chapter."""
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == user.id,
            UserProgress.chapter == question.chapter,
            UserProgress.state_code == question.state_code,
        )
    )
    progress = result.scalar_one_or_none()
    if progress:
        progress.questions_seen += 1
        if is_correct:
            progress.questions_correct += 1
        progress.last_studied_at = datetime.now(timezone.utc)
    else:
        progress = UserProgress(
            user_id=user.id,
            chapter=question.chapter,
            state_code=question.state_code,
            questions_seen=1,
            questions_correct=1 if is_correct else 0,
            last_studied_at=datetime.now(timezone.utc),
        )
        db.add(progress)