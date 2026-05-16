# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

"""Auth smoke tests: register, signup completion, login, refresh, logout, change password."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import get_redis
from app.models import User
from app.services.pending_signup import delete_pending_signup

from .conftest import TEST_PASSWORD, err_code, err_msg, gql, seeded_user, user_token

# ── GraphQL fragments ─────────────────────────────────────────────────────────

_AUTH_FIELDS = """
  accessToken
  emailVerified
  consentStatus
  user { id email displayName role }
"""

REGISTER = """
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      pendingToken
      email
      expiresAt
    }
  }
"""

COMPLETE_SIGNUP = f"""
  mutation CompleteSignup($input: CompleteSignupInput!) {{
    completeSignup(input: $input) {{ {_AUTH_FIELDS} }}
  }}
"""

LOGIN = f"""
  mutation Login($input: LoginInput!) {{
    login(input: $input) {{ {_AUTH_FIELDS} }}
  }}
"""

REFRESH = """
  mutation { refreshAccessToken }
"""

LOGOUT = """
  mutation { logout }
"""

CHANGE_PASSWORD = """
  mutation ChangePassword($cur: String!, $new: String!) {
    changePassword(currentPassword: $cur, newPassword: $new)
  }
"""

REQUEST_RESET = """
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
"""


def _unique_phone() -> str:
    return f"+1555{uuid.uuid4().int % 10_000_000:07d}"


def _register_input(email: str, display_name: str = "Reg User") -> dict:
    return {
        "email": email,
        "password": TEST_PASSWORD,
        "displayName": display_name,
        "phoneNumber": _unique_phone(),
        "dateOfBirth": "2000-06-01",
        "stateCode": "ok",
        "captchaToken": None,
    }


async def _cleanup_pending_signup(pending_token: str, email: str) -> None:
    await delete_pending_signup(pending_token, email)
    r = await get_redis()
    await r.delete(
        f"otp:pending:{pending_token}:email:code",
        f"otp:pending:{pending_token}:email:attempts",
        f"otp:pending:{pending_token}:email:resends",
    )


# ── Register ──────────────────────────────────────────────────────────────────


async def test_register_returns_pending_signup(client: AsyncClient, db: AsyncSession):
    email = f"reg_{uuid.uuid4().hex[:8]}@driveready.test"
    payload = await gql(
        client,
        REGISTER,
        {"input": _register_input(email)},
    )
    data = payload.get("data", {}).get("register")
    assert data is not None, payload.get("errors")
    assert data["pendingToken"]
    assert data["email"] == email
    assert data["expiresAt"]

    user = (
        await db.execute(select(User).where(User.email == email))
    ).scalar_one_or_none()
    assert user is None

    await _cleanup_pending_signup(data["pendingToken"], email)


async def test_register_duplicate_email_returns_email_taken(
    client: AsyncClient, seeded_user: User
):
    payload = await gql(
        client,
        REGISTER,
        {"input": {
            "email": seeded_user.email,
            "password": TEST_PASSWORD,
            "displayName": "Dup",
            "phoneNumber": _unique_phone(),
            "dateOfBirth": "2000-06-01",
            "stateCode": "ok",
            "captchaToken": None,
        }},
    )
    assert err_code(payload) == "EMAIL_TAKEN"


# ── Email OTP ─────────────────────────────────────────────────────────────────


async def test_email_otp_verify_flow(client: AsyncClient, db: AsyncSession):
    """Register → read OTP from Redis → completeSignup succeeds."""
    email = f"otp_{uuid.uuid4().hex[:8]}@driveready.test"

    reg = await gql(
        client,
        REGISTER,
        {"input": _register_input(email, "OTP User")},
    )
    pending_token = reg["data"]["register"]["pendingToken"]

    # OTP is stored in Redis even though the email send was mocked
    r = await get_redis()
    code = await r.get(f"otp:pending:{pending_token}:email:code")
    assert code, "OTP not found in Redis"

    result = await gql(
        client,
        COMPLETE_SIGNUP,
        {"input": {"pendingToken": pending_token, "code": code}},
    )
    data = result.get("data", {}).get("completeSignup")
    assert data is not None, result.get("errors")
    assert data["accessToken"]
    assert data["emailVerified"] is True
    assert data["user"]["email"] == email

    await db.execute(delete(User).where(User.email == email))
    await db.commit()


async def test_email_otp_wrong_code_fails(client: AsyncClient, db: AsyncSession):
    email = f"otp2_{uuid.uuid4().hex[:8]}@driveready.test"
    reg = await gql(
        client,
        REGISTER,
        {"input": _register_input(email, "OTP2")},
    )
    pending_token = reg["data"]["register"]["pendingToken"]
    result = await gql(
        client,
        COMPLETE_SIGNUP,
        {"input": {"pendingToken": pending_token, "code": "000000"}},
    )
    assert result.get("errors"), "Expected an error for wrong OTP"

    await _cleanup_pending_signup(pending_token, email)


# ── Login ─────────────────────────────────────────────────────────────────────


async def test_login_success(client: AsyncClient, seeded_user: User):
    payload = await gql(
        client,
        LOGIN,
        {"input": {"email": seeded_user.email, "password": TEST_PASSWORD, "captchaToken": None}},
    )
    data = payload.get("data", {}).get("login")
    assert data is not None, payload.get("errors")
    assert data["accessToken"]
    assert data["user"]["id"] == str(seeded_user.id)


async def test_login_wrong_password_returns_invalid_credentials(
    client: AsyncClient, seeded_user: User
):
    payload = await gql(
        client,
        LOGIN,
        {"input": {"email": seeded_user.email, "password": "WrongPass#9", "captchaToken": None}},
    )
    assert err_code(payload) == "INVALID_CREDENTIALS"


async def test_login_unknown_email_returns_invalid_credentials(client: AsyncClient):
    payload = await gql(
        client,
        LOGIN,
        {"input": {"email": "nobody@driveready.test", "password": TEST_PASSWORD, "captchaToken": None}},
    )
    assert err_code(payload) == "INVALID_CREDENTIALS"


# ── Refresh token ─────────────────────────────────────────────────────────────


async def test_refresh_token_rotation(client: AsyncClient, seeded_user: User):
    """Login sets the httpOnly cookie; refreshAccessToken returns a new JWT."""
    await gql(
        client,
        LOGIN,
        {"input": {"email": seeded_user.email, "password": TEST_PASSWORD, "captchaToken": None}},
    )
    # HTTPX stores the Set-Cookie from login automatically
    result = await gql(client, REFRESH)
    new_token = (result.get("data") or {}).get("refreshAccessToken")
    assert new_token, f"Expected new token, got: {result}"


async def test_refresh_without_cookie_returns_unauthenticated(client: AsyncClient):
    result = await gql(client, REFRESH)
    assert err_code(result) == "UNAUTHENTICATED"


# ── Logout ────────────────────────────────────────────────────────────────────


async def test_logout_succeeds(client: AsyncClient, seeded_user: User):
    await gql(
        client,
        LOGIN,
        {"input": {"email": seeded_user.email, "password": TEST_PASSWORD, "captchaToken": None}},
    )
    result = await gql(client, LOGOUT)
    assert result.get("data", {}).get("logout") is True


async def test_refresh_after_logout_fails(client: AsyncClient, seeded_user: User):
    """Refresh token is revoked on logout; subsequent refresh should fail."""
    await gql(
        client,
        LOGIN,
        {"input": {"email": seeded_user.email, "password": TEST_PASSWORD, "captchaToken": None}},
    )
    await gql(client, LOGOUT)
    result = await gql(client, REFRESH)
    assert err_code(result) == "UNAUTHENTICATED"


# ── Change password ───────────────────────────────────────────────────────────


async def test_change_password_success(client: AsyncClient, seeded_user: User):
    token = user_token(seeded_user)
    result = await gql(
        client,
        CHANGE_PASSWORD,
        {"cur": TEST_PASSWORD, "new": "NewPass#2"},
        token=token,
    )
    assert result.get("data", {}).get("changePassword") is True


async def test_change_password_wrong_current(client: AsyncClient, seeded_user: User):
    token = user_token(seeded_user)
    result = await gql(
        client,
        CHANGE_PASSWORD,
        {"cur": "WrongPass#9", "new": "NewPass#2"},
        token=token,
    )
    assert result.get("errors"), "Expected error for wrong current password"


async def test_change_password_unauthenticated(client: AsyncClient):
    result = await gql(
        client,
        CHANGE_PASSWORD,
        {"cur": TEST_PASSWORD, "new": "NewPass#2"},
    )
    assert err_code(result) == "UNAUTHENTICATED"


# ── Password reset ────────────────────────────────────────────────────────────


async def test_request_password_reset_always_returns_true(
    client: AsyncClient, seeded_user: User
):
    """Server never reveals whether the email exists."""
    result = await gql(client, REQUEST_RESET, {"email": seeded_user.email})
    assert result.get("data", {}).get("requestPasswordReset") is True


async def test_request_password_reset_unknown_email(client: AsyncClient):
    result = await gql(client, REQUEST_RESET, {"email": "ghost@driveready.test"})
    assert result.get("data", {}).get("requestPasswordReset") is True
