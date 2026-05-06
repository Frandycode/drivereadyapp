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
Smoke-test fixtures and shared helpers.

Run against the live Docker dev stack:
    docker compose run --rm api pytest tests/ -v

db + redis containers must be up. Test records use @driveready.test emails
and are deleted in fixture teardown.
"""

import uuid
from contextlib import ExitStack
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from passlib.context import CryptContext
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload
from sqlalchemy.pool import NullPool

import app.db.connection as _db_module
import app.main as _main_module
from app.auth.jwt import create_access_token
from app.db.redis import close_redis
from app.main import app
from app.models import Answer, Question, User

# ── NullPool engine for tests ─────────────────────────────────────────────────
# Each test gets its own event loop (pytest-asyncio default). Reusing asyncpg
# connections across loops causes "attached to a different loop" crashes.
# NullPool disables connection reuse entirely.

_test_engine = create_async_engine(
    _db_module.engine.url,
    poolclass=NullPool,
    echo=False,
)
_TestSession = async_sessionmaker(
    _test_engine, class_=AsyncSession, expire_on_commit=False
)

# Patch ALL locations where the pool-based session factory or engine is used:
#  - app.db.connection: picked up by get_context's dynamic re-import
#  - app.main: top-level import used by _purge_stale_records background task
_db_module.AsyncSessionLocal = _TestSession
_main_module.AsyncSessionLocal = _TestSession

_pwd = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# ── Reset loop-bound singletons between tests ────────────────────────────────
# get_redis() and the original DB pool hold connections/clients bound to a
# specific event loop. Each test runs on a new loop, so we must release these
# before the loop closes.


@pytest_asyncio.fixture(autouse=True)
async def _reset_singletons():
    yield
    await close_redis()  # next test's lifespan will create a fresh client


# ── Suppress rate limiting and all outbound I/O for every test ────────────────

_MOCK_TARGETS = [
    "app.graphql.mutations.mutations.check_rate_limit",
    "app.graphql.mutations.mutations.send_otp_email",
    "app.graphql.mutations.mutations.send_parental_consent_email",
    "app.graphql.mutations.mutations.send_new_device_email",
    "app.graphql.mutations.mutations.send_password_reset_email",
    "app.graphql.mutations.mutations.send_email_change_otp",
    "app.graphql.mutations.mutations.send_parent_linked_email",
    "app.graphql.mutations.mutations.send_otp_sms",
]


@pytest.fixture(autouse=True)
def _silence_external_calls():
    with ExitStack() as stack:
        for target in _MOCK_TARGETS:
            stack.enter_context(patch(target, new=AsyncMock(return_value=None)))
        yield


# ── HTTP client (function-scoped for cookie isolation) ────────────────────────


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ── Direct DB session ─────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with _TestSession() as session:
        yield session


# ── GraphQL helpers ───────────────────────────────────────────────────────────


async def gql(
    client: AsyncClient,
    query: str,
    variables: dict | None = None,
    token: str | None = None,
) -> dict:
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = await client.post(
        "/graphql",
        json={"query": query, "variables": variables or {}},
        headers=headers,
    )
    return resp.json()


def err_code(payload: dict) -> str | None:
    errors = payload.get("errors") or []
    return (errors[0].get("extensions") or {}).get("code") if errors else None


def err_msg(payload: dict) -> str | None:
    errors = payload.get("errors") or []
    return errors[0].get("message") if errors else None


# ── Test-data factories ───────────────────────────────────────────────────────

TEST_PASSWORD = "Test#Pass1"


@pytest_asyncio.fixture
async def seeded_user(db: AsyncSession) -> AsyncGenerator[User, None]:
    """Fully-verified learner with a known password. Removed after each test."""
    user = User(
        email=f"test_{uuid.uuid4().hex[:8]}@driveready.test",
        password_hash=_pwd.hash(TEST_PASSWORD),
        display_name="Test Learner",
        role="learner",
        state_code="ok",
        email_verified=True,
        parental_consent_status="not_required",
        tos_version_accepted="1.0",
        privacy_version_accepted="1.0",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    yield user
    await db.execute(delete(User).where(User.id == user.id))
    await db.commit()


def user_token(user: User) -> str:
    return create_access_token(str(user.id), user.role)


@pytest_asyncio.fixture
async def seeded_question(db: AsyncSession) -> AsyncGenerator[Question, None]:
    """One question with 4 answers (first is correct). Removed after each test."""
    q = Question(
        state_code="ok",
        chapter=4,
        category="regulatory",
        difficulty="pawn",
        question_text="What does a red octagon sign mean?",
        correct_count=1,
        explanation="A red octagon is always a STOP sign.",
        hint_text="Think about the shape and color.",
        source="manual",
    )
    db.add(q)
    await db.flush()
    for text, correct, order in [
        ("Stop",           True,  0),
        ("Yield",          False, 1),
        ("Speed limit 30", False, 2),
        ("No entry",       False, 3),
    ]:
        db.add(Answer(question_id=q.id, text=text, is_correct=correct, sort_order=order))
    await db.commit()
    result = await db.execute(
        select(Question).options(selectinload(Question.answers)).where(Question.id == q.id)
    )
    q = result.scalar_one()
    yield q
    await db.execute(delete(Question).where(Question.id == q.id))
    await db.commit()
