"""
Pytest configuration and shared fixtures for all tests.
"""
import asyncio
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.connection import Base, get_db
from app.models import User, Question, Answer, Chapter
from app.auth.jwt import create_access_token

# ── Use an in-memory SQLite DB for tests ──────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine):
    """Provide a clean database session per test, rolled back after."""
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    """AsyncClient with the test DB injected via dependency override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ── Factory fixtures ──────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def learner_user(db_session: AsyncSession) -> User:
    """A basic learner user."""
    user = User(
        id=uuid.uuid4(),
        email="learner@test.com",
        display_name="Test Learner",
        role="learner",
        state_code="ok",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
async def parent_user(db_session: AsyncSession) -> User:
    """A parent user."""
    user = User(
        id=uuid.uuid4(),
        email="parent@test.com",
        display_name="Test Parent",
        role="parent",
        state_code="ok",
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture
def learner_token(learner_user: User) -> str:
    return create_access_token(str(learner_user.id), learner_user.role)


@pytest_asyncio.fixture
def auth_headers(learner_token: str) -> dict:
    return {"Authorization": f"Bearer {learner_token}"}


@pytest_asyncio.fixture
async def sample_question(db_session: AsyncSession) -> Question:
    """A question with 4 answers (1 correct)."""
    question = Question(
        id=uuid.uuid4(),
        state_code="ok",
        chapter=4,
        category="regulatory",
        difficulty="pawn",
        question_text="What does a red octagon sign mean?",
        correct_count=1,
        explanation="A red octagon is always a STOP sign.",
        hint_text="Think about the shape and color together.",
        source="manual",
    )
    db_session.add(question)
    await db_session.flush()

    answers = [
        Answer(question_id=question.id, text="Stop",  is_correct=True,  sort_order=0),
        Answer(question_id=question.id, text="Yield", is_correct=False, sort_order=1),
        Answer(question_id=question.id, text="Speed limit 30", is_correct=False, sort_order=2),
        Answer(question_id=question.id, text="No entry",       is_correct=False, sort_order=3),
    ]
    for a in answers:
        db_session.add(a)
    await db_session.flush()

    return question
