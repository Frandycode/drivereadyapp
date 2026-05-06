# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Session smoke tests: start, submit answer, complete."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Question, User

from .conftest import err_code, gql, user_token

# ── GraphQL mutations ─────────────────────────────────────────────────────────

START_SESSION = """
  mutation StartSession($input: StartSessionInput!) {
    startSession(input: $input) {
      id mode difficulty questionCount score total xpEarned completed
    }
  }
"""

SUBMIT_ANSWER = """
  mutation SubmitAnswer($input: SubmitAnswerInput!) {
    submitAnswer(input: $input) {
      isCorrect correctAnswerIds explanation xpEarned
    }
  }
"""

COMPLETE_SESSION = """
  mutation CompleteSession($sessionId: ID!) {
    completeSession(sessionId: $sessionId) {
      session { score total xpEarned completed }
      xpEarned
    }
  }
"""


# ── Helpers ───────────────────────────────────────────────────────────────────


def _start_input(chapters: list[int] | None = None) -> dict:
    return {
        "mode": "practice",
        "difficulty": "pawn",
        "questionCount": 5,
        "chapters": chapters or [4],
        "stateCode": "ok",
    }


# ── Tests ─────────────────────────────────────────────────────────────────────


async def test_start_session_anonymous(client: AsyncClient):
    """Sessions work without authentication (anonymous learners)."""
    result = await gql(client, START_SESSION, {"input": _start_input()})
    session = (result.get("data") or {}).get("startSession")
    assert session is not None, result.get("errors")
    assert session["id"]
    assert session["completed"] is False
    assert session["score"] == 0


async def test_start_session_authenticated(client: AsyncClient, seeded_user: User):
    token = user_token(seeded_user)
    result = await gql(client, START_SESSION, {"input": _start_input()}, token=token)
    session = (result.get("data") or {}).get("startSession")
    assert session is not None, result.get("errors")
    assert session["id"]


async def test_submit_correct_answer(
    client: AsyncClient, seeded_question: Question
):
    """Submitting the correct answer returns isCorrect=True and xpEarned > 0."""
    sess_result = await gql(client, START_SESSION, {"input": _start_input([4])})
    session_id = sess_result["data"]["startSession"]["id"]

    correct_answer = next(a for a in seeded_question.answers if a.is_correct)
    result = await gql(
        client,
        SUBMIT_ANSWER,
        {"input": {
            "sessionId": session_id,
            "questionId": str(seeded_question.id),
            "selectedAnswerIds": [str(correct_answer.id)],
            "timeTakenMs": 3000,
        }},
    )
    data = (result.get("data") or {}).get("submitAnswer")
    assert data is not None, result.get("errors")
    assert data["isCorrect"] is True
    assert data["xpEarned"] > 0
    assert str(correct_answer.id) in data["correctAnswerIds"]


async def test_submit_wrong_answer(
    client: AsyncClient, seeded_question: Question
):
    """Submitting a wrong answer returns isCorrect=False and xpEarned=0."""
    sess_result = await gql(client, START_SESSION, {"input": _start_input([4])})
    session_id = sess_result["data"]["startSession"]["id"]

    wrong_answer = next(a for a in seeded_question.answers if not a.is_correct)
    result = await gql(
        client,
        SUBMIT_ANSWER,
        {"input": {
            "sessionId": session_id,
            "questionId": str(seeded_question.id),
            "selectedAnswerIds": [str(wrong_answer.id)],
            "timeTakenMs": 2000,
        }},
    )
    data = (result.get("data") or {}).get("submitAnswer")
    assert data is not None, result.get("errors")
    assert data["isCorrect"] is False
    assert data["xpEarned"] == 0


async def test_submit_answer_bad_question_id(client: AsyncClient):
    """Submitting an answer for a non-existent question returns an error."""
    sess_result = await gql(client, START_SESSION, {"input": _start_input()})
    session_id = sess_result["data"]["startSession"]["id"]

    import uuid
    result = await gql(
        client,
        SUBMIT_ANSWER,
        {"input": {
            "sessionId": session_id,
            "questionId": str(uuid.uuid4()),
            "selectedAnswerIds": [str(uuid.uuid4())],
        }},
    )
    assert result.get("errors"), "Expected error for missing question"


async def test_complete_session(
    client: AsyncClient, seeded_question: Question
):
    """Full cycle: start → submit → complete."""
    sess_result = await gql(client, START_SESSION, {"input": _start_input([4])})
    session_id = sess_result["data"]["startSession"]["id"]

    correct_answer = next(a for a in seeded_question.answers if a.is_correct)
    await gql(
        client,
        SUBMIT_ANSWER,
        {"input": {
            "sessionId": session_id,
            "questionId": str(seeded_question.id),
            "selectedAnswerIds": [str(correct_answer.id)],
        }},
    )

    result = await gql(client, COMPLETE_SESSION, {"sessionId": session_id})
    data = (result.get("data") or {}).get("completeSession")
    assert data is not None, result.get("errors")
    assert data["session"]["completed"] is True
    assert data["session"]["score"] == 1
    assert data["xpEarned"] > 0
