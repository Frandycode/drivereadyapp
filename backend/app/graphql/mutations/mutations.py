import strawberry
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from strawberry.types import Info

from app.models import User, Session, Lesson, Chapter, SessionAnswer, Question, Answer, UserProgress, Bookmark, FlashcardDeck
from app.auth.jwt import create_access_token
from app.graphql.types.all_types import (
    AuthPayloadType, UserType, SessionType, SessionResultType,
    AnswerResultType, BookmarkType, FlashcardDeckType,
    RegisterInput, LoginInput, StartSessionInput, SubmitAnswerInput,
    CreateDeckInput, LessonType, ChapterProgressType, ChapterType
)

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


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


# XP constants
XP_PER_CORRECT = 5
XP_DIFFICULTY_MULTIPLIER = {"pawn": 1, "rogue": 2, "king": 3}
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200]


def calculate_level(xp: int) -> int:
    for i, threshold in enumerate(reversed(LEVEL_THRESHOLDS)):
        if xp >= threshold:
            return len(LEVEL_THRESHOLDS) - i
    return 1


@strawberry.type
class Mutation:

    @strawberry.mutation
    async def register(
        self, info: Info, input: RegisterInput
    ) -> AuthPayloadType:
        """Register a new user account."""
        db: AsyncSession = info.context["db"]

        # Check email not taken
        existing = await db.execute(
            select(User).where(User.email == input.email.lower())
        )
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        # Hash password
        hashed = pwd_context.hash(input.password)

        user = User(
            email=input.email.lower(),
            display_name=input.display_name,
            state_code=input.state_code,
            role="learner",
        )
        # NOTE: In production, password hash is stored in Supabase Auth.
        # For Phase 0 local dev, we store it on user model.
        # TODO: replace with Supabase Auth once SUPABASE_URL is configured.
        db.add(user)
        await db.flush()  # get the id without committing

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
            user_id=user.id if user else uuid.uuid4(),  # guest sessions allowed
            state_code=input.state_code,
            mode=input.mode,
            difficulty=input.difficulty,
            question_count=input.question_count,
            chapters=input.chapters,
        )
        db.add(session)
        await db.flush()
        return map_session(session)

    @strawberry.mutation
    async def submit_answer(
        self, info: Info, input: SubmitAnswerInput
    ) -> AnswerResultType:
        """Submit an answer for a question in an active session."""
        db: AsyncSession = info.context["db"]

        # Load question with answers
        q_result = await db.execute(
            select(Question).where(Question.id == uuid.UUID(str(input.question_id)))
        )
        question = q_result.scalar_one_or_none()
        if not question:
            raise ValueError("Question not found")

        # Load answers for this question
        a_result = await db.execute(
            select(Answer).where(Answer.question_id == question.id)
        )
        answers = a_result.scalars().all()

        correct_ids = {str(a.id) for a in answers if a.is_correct}
        selected_ids = set(str(i) for i in input.selected_answer_ids)
        is_correct = correct_ids == selected_ids

        # Calculate XP
        multiplier = XP_DIFFICULTY_MULTIPLIER.get(
            (await db.execute(
                select(Session).where(Session.id == uuid.UUID(str(input.session_id)))
            )).scalar_one().difficulty,
            1
        )
        xp = XP_PER_CORRECT * multiplier if is_correct else 0

        # Record the answer
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

        # Update session score
        session_result = await db.execute(
            select(Session).where(Session.id == uuid.UUID(str(input.session_id)))
        )
        session = session_result.scalar_one_or_none()
        if session:
            session.total += 1
            if is_correct:
                session.score += 1
                session.xp_earned += xp

        # Update user XP if authenticated
        user: User | None = info.context.get("user")
        if user and xp > 0:
            user.xp_total += xp
            old_level = user.level
            user.level = calculate_level(user.xp_total)

        # Update chapter progress
        if user:
            await _upsert_progress(db, user, question, is_correct)

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
        """Mark a lesson complete and update chapter progress."""
        import uuid
        from datetime import datetime, timezone
        from sqlalchemy import func, select
        db: AsyncSession = info.context["db"]
        user: User | None = info.context.get("user")

        if not user:
            raise ValueError("Authentication required")

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

        total_result = await db.execute(
            select(func.count()).where(Lesson.chapter_id == chapter.id)
        )
        total_lessons = total_result.scalar() or 0

        progress_result = await db.execute(
            select(UserProgress).where(
                UserProgress.user_id == user.id,
                UserProgress.chapter == chapter.number,
                UserProgress.state_code == chapter.state_code,
            )
        )
        progress = progress_result.scalar_one_or_none()

        if progress:
            progress.lessons_completed = min(progress.lessons_completed + 1, total_lessons)
            progress.lessons_total = total_lessons
            progress.last_studied_at = datetime.now(timezone.utc)
        else:
            progress = UserProgress(
                user_id=user.id,
                chapter=chapter.number,
                state_code=chapter.state_code,
                questions_seen=0,
                questions_correct=0,
                lessons_completed=1,
                lessons_total=total_lessons,
                last_studied_at=datetime.now(timezone.utc),
            )
            db.add(progress)

        await db.flush()

        return ChapterProgressType(
            chapter=progress.chapter,
            state_code=progress.state_code,
            questions_seen=progress.questions_seen,
            questions_correct=progress.questions_correct,
            accuracy=progress.accuracy,
            lessons_completed=progress.lessons_completed,
            lessons_total=progress.lessons_total,
            last_studied_at=progress.last_studied_at,
        )


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
