# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

import asyncio
import hashlib
import json
import random
import re
import string
import time
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import strawberry
from passlib.context import CryptContext
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from strawberry.types import Info

from app.auth.jwt import create_access_token, generate_refresh_token, hash_token
from app.config import settings
from app.db.redis import CacheKey, TTL, get_redis
from app.services.captcha import verify_captcha
from app.services.consent import create_consent_token
from app.services.email import send_new_device_email, send_otp_email, send_parental_consent_email
from app.services.otp import clear_otp, create_otp, verify_otp
from app.services.rate_limit import check_rate_limit
from app.services.sms import send_otp_sms
from app.graphql.types.all_types import (
    AnswerResultType,
    AuthPayloadType,
    BattleType,
    BookmarkType,
    ChapterGroupType,
    ChapterProgressType,
    CreateDeckInput,
    FlashcardDeckType,
    AcceptLegalInput,
    LegalVersionsType,
    LoginInput,
    RegisterInput,
    SendPhoneOtpInput,
    SessionResultType,
    SessionType,
    StartSessionInput,
    SubmitAnswerInput,
    UserType,
    VerifyOtpInput,
)
from app.models import (
    Answer,
    Battle,
    Bookmark,
    ChapterGroup,
    FlashcardDeck,
    KnownDevice,
    Question,
    RefreshToken,
    Session,
    SessionAnswer,
    User,
    UserConsent,
    UserProgress,
)
from app.models.question import Chapter, Lesson

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

# ── Constants ─────────────────────────────────────────────────────────────────

MAX_DRAW_REQUESTS   = 2      # per player per battle
MAX_SCREEN_LEAVES   = 2      # strikes before auto-defeat on the next leave
LEAVE_FORGIVE_MS    = 5000   # < 5s away = forgiven, no strike applied
FIRST_LEAVE_GRACE_S = 45     # grace seconds on first strike
LATER_LEAVE_GRACE_S = 30     # grace seconds on subsequent strikes
DRAW_TIMEOUT_S      = 30     # seconds opponent has to respond to a draw request
HEARTBEAT_EXPIRY_S  = 30     # seconds of silence before heartbeat_lost fires

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


def map_battle(b: Battle, chapter_ids: list[int] | None = None) -> BattleType:
    return BattleType(
        id=str(b.id),
        type=b.type,
        player_id=str(b.player_id),
        opponent_id=str(b.opponent_id) if b.opponent_id else None,
        bot_type=b.bot_type,
        player_score=b.player_score,
        opponent_score=b.opponent_score,
        winner=b.winner,
        state=b.state,
        question_ids=b.question_ids or [],
        room_code=b.room_code,
        timer_seconds=b.timer_seconds,
        chapter_ids=chapter_ids or [],
        created_at=b.created_at,
    )


# ── Refresh token helpers ─────────────────────────────────────────────────────

_REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days in seconds


async def _issue_refresh_token(
    user_id: str,
    db: AsyncSession,
    response,
    family_id: uuid.UUID | None = None,
) -> None:
    raw, token_hash = generate_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    stored = RefreshToken(
        user_id=uuid.UUID(user_id),
        token_hash=token_hash,
        family_id=family_id or uuid.uuid4(),
        expires_at=expires_at,
    )
    db.add(stored)
    if response is not None:
        response.set_cookie(
            key="refresh_token",
            value=raw,
            httponly=True,
            secure=settings.cookie_secure,
            samesite="lax",
            max_age=_REFRESH_COOKIE_MAX_AGE,
            path="/graphql",
        )


# ── Device fingerprint helpers ───────────────────────────────────────────────

def _get_user_agent(info: Info) -> str:
    req = info.context.get("request")
    if req and hasattr(req, "headers"):
        return req.headers.get("user-agent", "unknown") or "unknown"
    return "unknown"


def _parse_device_label(ua: str) -> str:
    if "Edg/" in ua or "EdgA/" in ua:
        browser = "Edge"
    elif "OPR/" in ua or "Opera" in ua:
        browser = "Opera"
    elif "Chrome/" in ua:
        browser = "Chrome"
    elif "Firefox/" in ua:
        browser = "Firefox"
    elif "Safari/" in ua:
        browser = "Safari"
    else:
        browser = "Unknown Browser"

    if "Windows NT" in ua:
        os_name = "Windows"
    elif "iPhone" in ua or "iPad" in ua:
        os_name = "iOS"
    elif "Android" in ua:
        os_name = "Android"
    elif "Mac OS X" in ua:
        os_name = "macOS"
    elif "Linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Unknown OS"

    return f"{browser} on {os_name}"


def _device_fingerprint(ip: str, ua: str) -> str:
    return hashlib.sha256(f"{ip}|{ua}".encode()).hexdigest()


async def _check_new_device(
    user: User,
    db: AsyncSession,
    ip: str,
    ua: str,
    notify: bool,
) -> None:
    fingerprint = _device_fingerprint(ip, ua)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(KnownDevice).where(
            KnownDevice.user_id == user.id,
            KnownDevice.fingerprint == fingerprint,
        )
    )
    device = result.scalar_one_or_none()

    if device:
        device.last_seen_at = now
        db.add(device)
        return

    label = _parse_device_label(ua)
    db.add(KnownDevice(
        user_id=user.id,
        fingerprint=fingerprint,
        label=label,
        ip_address=ip,
        last_seen_at=now,
    ))

    if notify:
        try:
            await send_new_device_email(
                to=user.email,
                display_name=user.display_name,
                device_label=label,
                ip_address=ip,
                login_time=now,
                change_password_url=f"{settings.frontend_url}/profile",
            )
        except Exception:
            pass  # never block login if email fails


# ── XP helpers ────────────────────────────────────────────────────────────────

XP_PER_CORRECT = 5
XP_DIFFICULTY_MULTIPLIER = {"pawn": 1, "rogue": 2, "king": 3}
LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200]


def calculate_level(xp: int) -> int:
    for i, threshold in enumerate(reversed(LEVEL_THRESHOLDS)):
        if xp >= threshold:
            return len(LEVEL_THRESHOLDS) - i
    return 1


# ── Redis cache helpers ───────────────────────────────────────────────────────

def _is_player(battle: Battle, user: User) -> bool:
    return str(battle.player_id) == str(user.id)


async def _get_cache(battle_id: str) -> dict:
    r = await get_redis()
    raw = await r.get(CacheKey.battle(battle_id))
    return json.loads(raw) if raw else {}


async def _save_cache(battle_id: str, data: dict) -> None:
    r = await get_redis()
    await r.setex(CacheKey.battle(battle_id), TTL.BATTLE, json.dumps(data))


async def _publish(battle_id: str, payload: dict) -> None:
    r = await get_redis()
    await r.publish(CacheKey.battle(battle_id), json.dumps(payload))


def _base_payload(
    battle: Battle,
    user: User,
    event: str,
    question_index: int = 0,
    **extra,
) -> dict:
    """Build the standard subscription payload dict."""
    return {
        "event":          event,
        "player_id":      str(user.id),
        "question_index": question_index,
        "is_correct":     None,
        "player_score":   battle.player_score,
        "opponent_score": battle.opponent_score,
        "battle_state":   battle.state,
        "winner":         battle.winner,
        **extra,
    }


def _legal_versions() -> LegalVersionsType:
    return LegalVersionsType(
        tos_version=settings.tos_version,
        privacy_version=settings.privacy_version,
    )


def _requires_legal_consent(user: User) -> bool:
    return (
        user.tos_version_accepted != settings.tos_version
        or user.privacy_version_accepted != settings.privacy_version
    )


def _age_from_dob(dob: date) -> int:
    today = date.today()
    years = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        years -= 1
    return years


def validate_password(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[#$&!*\-]", password):
        raise ValueError("Password must contain at least one special character: # $ & ! * -")
    if re.search(r"(.)\1\1", password):
        raise ValueError("Password must not contain 3 or more consecutive identical characters.")


def _get_ip(info: Info) -> str:
    req = info.context.get("request")
    if req and hasattr(req, "client") and req.client:
        return req.client.host or "unknown"
    return "unknown"


# ── Mutation class ────────────────────────────────────────────────────────────

@strawberry.type
class Mutation:

    # ── Auth ──────────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def register(self, info: Info, input: RegisterInput) -> AuthPayloadType:
        """Register a new user account."""
        db:  AsyncSession = info.context["db"]
        ip   = _get_ip(info)

        await check_rate_limit(f"register:{ip}", max_requests=5,  window_seconds=3600)
        await verify_captcha(input.captcha_token)

        validate_password(input.password)

        age = _age_from_dob(input.date_of_birth)
        if age < 13:
            raise ValueError("COPPA_UNDER_13")
        if age < 18:
            if not input.parent_email:
                raise ValueError("Parent email is required for users under 18.")
            consent_status = "pending"
        else:
            consent_status = "not_required"

        existing = await db.execute(select(User).where(User.email == input.email.lower()))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        user = User(
            email=input.email.lower(),
            password_hash=pwd_context.hash(input.password),
            display_name=input.display_name,
            state_code=input.state_code,
            role="learner",
            date_of_birth=input.date_of_birth,
            parental_consent_status=consent_status,
            parent_email=input.parent_email if age < 18 else None,
        )
        db.add(user)
        await db.flush()
        await db.commit()

        if consent_status == "pending":
            consent_token = await create_consent_token(str(user.id), input.parent_email)
            approve_url = f"{settings.api_url}/consent/approve/{consent_token}"
            deny_url    = f"{settings.api_url}/consent/deny/{consent_token}"
            await send_parental_consent_email(
                parent_email=input.parent_email,
                child_name=input.display_name,
                approve_url=approve_url,
                deny_url=deny_url,
            )

        # Always send email OTP after registration
        otp_code = await create_otp(str(user.id), "email")
        await send_otp_email(to=user.email, code=otp_code, display_name=user.display_name)

        await _issue_refresh_token(str(user.id), db, info.context.get("response"))
        await _check_new_device(user, db, ip, _get_user_agent(info), notify=False)
        await db.commit()

        jwt_token = create_access_token(str(user.id), user.role)
        return AuthPayloadType(
            access_token=jwt_token,
            user=map_user(user),
            consent_status=consent_status,
            email_verified=False,
            requires_legal_consent=True,
            legal_versions=_legal_versions(),
        )

    @strawberry.mutation
    async def login(self, info: Info, input: LoginInput) -> AuthPayloadType:
        """Login with email and password."""
        db: AsyncSession = info.context["db"]
        ip  = _get_ip(info)

        await check_rate_limit(f"login:{ip}", max_requests=10, window_seconds=900)
        await verify_captcha(input.captcha_token)

        result = await db.execute(select(User).where(User.email == input.email.lower()))
        user = result.scalar_one_or_none()
        if not user or not user.password_hash or not pwd_context.verify(input.password, user.password_hash):
            raise ValueError("Invalid email or password")

        await _issue_refresh_token(str(user.id), db, info.context.get("response"))
        await _check_new_device(user, db, ip, _get_user_agent(info), notify=True)
        await db.commit()

        token = create_access_token(str(user.id), user.role)
        return AuthPayloadType(
            access_token=token,
            user=map_user(user),
            consent_status=user.parental_consent_status,
            email_verified=user.email_verified,
            requires_legal_consent=_requires_legal_consent(user),
            legal_versions=_legal_versions(),
        )

    @strawberry.mutation
    async def update_profile(
        self,
        info: Info,
        state_code: Optional[str] = None,
        test_date: Optional[str] = None,
    ) -> UserType:
        """Update user profile (state and test date) after onboarding."""
        from datetime import date as date_type
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        if state_code is not None:
            user.state_code = state_code.lower().strip()
        if test_date is not None:
            try:
                user.test_date = date_type.fromisoformat(test_date)
            except ValueError:
                pass

        db.add(user)
        await db.commit()
        await db.refresh(user)
        return map_user(user)

    # ── Legal consent ─────────────────────────────────────────────────────────

    @strawberry.mutation
    async def accept_legal_documents(self, info: Info, input: AcceptLegalInput) -> bool:
        """Record the user's acceptance of the current ToS and Privacy Policy versions."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]
        if not user:
            raise ValueError("Authentication required.")

        if input.tos_version != settings.tos_version:
            raise ValueError("ToS version mismatch. Please refresh and try again.")
        if input.privacy_version != settings.privacy_version:
            raise ValueError("Privacy Policy version mismatch. Please refresh and try again.")

        now = datetime.now(timezone.utc)
        ip  = None
        req = info.context.get("request")
        if req and hasattr(req, "client") and req.client:
            ip = req.client.host

        for doc_type, version in [("tos", input.tos_version), ("privacy", input.privacy_version)]:
            db.add(UserConsent(
                user_id=user.id,
                document_type=doc_type,
                version=version,
                accepted_at=now,
                ip_address=ip,
            ))

        user.tos_version_accepted     = input.tos_version
        user.privacy_version_accepted = input.privacy_version
        db.add(user)
        await db.commit()
        return True

    # ── Token rotation ────────────────────────────────────────────────────────

    @strawberry.mutation
    async def refresh_access_token(self, info: Info) -> str:
        """Exchange a valid refresh token cookie for a new access token + rotated refresh cookie."""
        db:       AsyncSession = info.context["db"]
        request                = info.context.get("request")
        response               = info.context.get("response")

        raw = request.cookies.get("refresh_token") if request else None
        if not raw:
            raise ValueError("No refresh token")

        token_hash = hash_token(raw)
        now = datetime.now(timezone.utc)

        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored = result.scalar_one_or_none()

        if not stored:
            raise ValueError("Invalid refresh token")

        if stored.revoked_at is not None:
            # Reuse detected — entire token family is compromised; revoke all
            await db.execute(
                update(RefreshToken)
                .where(RefreshToken.family_id == stored.family_id)
                .values(revoked_at=now)
            )
            await db.commit()
            if response is not None:
                response.delete_cookie("refresh_token", path="/graphql")
            raise ValueError("Refresh token reuse detected — please log in again")

        if stored.expires_at < now:
            raise ValueError("Refresh token expired")

        result = await db.execute(select(User).where(User.id == stored.user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        stored.revoked_at = now
        db.add(stored)

        await _issue_refresh_token(str(stored.user_id), db, response, family_id=stored.family_id)
        await db.commit()

        return create_access_token(str(user.id), user.role)

    @strawberry.mutation
    async def logout(self, info: Info) -> bool:
        """Revoke the active refresh token and clear the cookie."""
        db:      AsyncSession = info.context["db"]
        request               = info.context.get("request")
        response              = info.context.get("response")

        raw = request.cookies.get("refresh_token") if request else None
        if raw:
            token_hash = hash_token(raw)
            result = await db.execute(
                select(RefreshToken).where(RefreshToken.token_hash == token_hash)
            )
            stored = result.scalar_one_or_none()
            if stored and stored.revoked_at is None:
                stored.revoked_at = datetime.now(timezone.utc)
                db.add(stored)
                await db.commit()

        if response is not None:
            response.delete_cookie("refresh_token", path="/graphql")
        return True

    # ── OTP ───────────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def resend_email_otp(self, info: Info) -> bool:
        """Re-send email OTP to the authenticated user."""
        user: User = info.context["user"]
        if not user:
            raise ValueError("Authentication required.")
        if user.email_verified:
            raise ValueError("Email is already verified.")
        ip = _get_ip(info)
        await check_rate_limit(f"email_otp:{ip}", max_requests=3, window_seconds=3600)
        code = await create_otp(str(user.id), "email")
        await send_otp_email(to=user.email, code=code, display_name=user.display_name)
        return True

    @strawberry.mutation
    async def verify_email_otp(self, info: Info, input: VerifyOtpInput) -> bool:
        """Verify the email OTP and mark email as verified."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]
        if not user:
            raise ValueError("Authentication required.")
        await verify_otp(str(user.id), "email", input.code)
        user.email_verified = True
        db.add(user)
        await db.commit()
        return True

    @strawberry.mutation
    async def send_phone_otp(self, info: Info, input: SendPhoneOtpInput) -> bool:
        """Send an OTP to the given phone number."""
        user: User = info.context["user"]
        if not user:
            raise ValueError("Authentication required.")
        ip = _get_ip(info)
        await check_rate_limit(f"phone_otp:{ip}", max_requests=3, window_seconds=3600)
        import re
        phone = re.sub(r"[^\d+]", "", input.phone_number)
        if not re.match(r"^\+?[1-9]\d{7,14}$", phone):
            raise ValueError("Invalid phone number format.")
        code = await create_otp(str(user.id), "phone")
        await send_otp_sms(to=phone, code=code)
        return True

    @strawberry.mutation
    async def verify_phone_otp(self, info: Info, input: VerifyOtpInput, phone_number: str) -> bool:
        """Verify the phone OTP and store the verified number."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]
        if not user:
            raise ValueError("Authentication required.")
        import re
        phone = re.sub(r"[^\d+]", "", phone_number)
        await verify_otp(str(user.id), "phone", input.code)
        user.phone_number  = phone
        user.phone_verified = True
        db.add(user)
        await db.commit()
        return True

    # ── Sessions ──────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def start_session(self, info: Info, input: StartSessionInput) -> SessionType:
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
    async def submit_answer(self, info: Info, input: SubmitAnswerInput) -> AnswerResultType:
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

        correct_ids  = {str(a.id) for a in question.answers if a.is_correct}
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
    async def complete_session(self, info: Info, session_id: strawberry.ID) -> SessionResultType:
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

    # ── Bookmarks & Decks ─────────────────────────────────────────────────────

    @strawberry.mutation
    async def save_bookmark(self, info: Info, question_id: strawberry.ID) -> BookmarkType:
        """Bookmark a question for later study."""
        db: AsyncSession = info.context["db"]
        user: User = info.context["user"]

        bookmark = Bookmark(user_id=user.id, question_id=uuid.UUID(str(question_id)))
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
    async def create_deck(self, info: Info, input: CreateDeckInput) -> FlashcardDeckType:
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

    # ── Lessons ───────────────────────────────────────────────────────────────

    @strawberry.mutation
    async def complete_lesson(self, info: Info, lesson_id: strawberry.ID) -> ChapterProgressType:
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

    # ── Battle — setup ────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_battle(
        self,
        info: Info,
        question_count: int,
        state_code: str = "ok",
        timer_seconds: Optional[int] = None,
        chapter_ids: Optional[list[int]] = None,
    ) -> BattleType:
        """Host creates a peer battle room. Returns a 6-digit room code."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        code = "000000"
        for _ in range(20):
            code = "".join(random.choices(string.digits, k=6))
            existing = await db.execute(
                select(Battle).where(Battle.room_code == code, Battle.state == "waiting")
            )
            if not existing.scalar_one_or_none():
                break

        stmt = select(Question).where(Question.state_code == state_code)
        if chapter_ids:
            stmt = stmt.where(Question.chapter.in_(chapter_ids))
        q_result      = await db.execute(stmt.options(selectinload(Question.answers)))
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

        r = await get_redis()
        await r.setex(
            CacheKey.battle(str(battle.id)),
            TTL.BATTLE,
            json.dumps({
                "player_id":              str(user.id),
                "opponent_id":            None,
                "player_score":           0,
                "opponent_score":         0,
                "question_index":         0,
                "question_ids":           question_ids,
                "state":                  "waiting",
                "timer_seconds":          timer_seconds,
                # End-of-game tracking
                "player_done":            False,
                "opponent_done":          False,
                # Draw request tracking
                "player_draws_used":      0,
                "opponent_draws_used":    0,
                "pending_draw_by":        None,
                # Screen leave tracking
                "player_leave_strikes":   0,
                "opponent_leave_strikes": 0,
                "player_leave_started":   None,
                "opponent_leave_started": None,
                # Heartbeat tracking
                "player_heartbeat":       None,
                "opponent_heartbeat":     None,
                "chapter_ids":            chapter_ids or [],
            }),
        )

        return map_battle(battle, chapter_ids=chapter_ids or [])

    @strawberry.mutation
    async def join_battle(self, info: Info, room_code: str) -> BattleType:
        """Opponent joins an existing peer battle room by 6-digit code."""
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.room_code == room_code, Battle.state == "waiting")
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Room not found or already started")
        if str(battle.player_id) == str(user.id):
            raise ValueError("Cannot join your own battle room")

        battle.opponent_id = user.id
        battle.state       = "active"
        await db.commit()

        cache = await _get_cache(str(battle.id))
        chapter_ids: list[int] = cache.get("chapter_ids", [])
        cache["opponent_id"] = str(user.id)
        cache["state"]       = "active"
        await _save_cache(str(battle.id), cache)

        await _publish(str(battle.id), _base_payload(battle, user, "joined"))
        return map_battle(battle, chapter_ids=chapter_ids)

    # ── Battle — gameplay ─────────────────────────────────────────────────────

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

        is_player = _is_player(battle, user)
        if is_player and is_correct:
            battle.player_score += 1
        elif not is_player and is_correct:
            battle.opponent_score += 1

        total_questions  = len(battle.question_ids or [])
        is_last_question = question_index + 1 >= total_questions

        cache = await _get_cache(str(battle.id))

        if is_player:
            cache["player_score"] = battle.player_score
            if is_last_question:
                cache["player_done"] = True
        else:
            cache["opponent_score"] = battle.opponent_score
            if is_last_question:
                cache["opponent_done"] = True

        both_done = cache.get("player_done", False) and cache.get("opponent_done", False)

        if both_done:
            if battle.player_score > battle.opponent_score:
                winner = "player"
            elif battle.opponent_score > battle.player_score:
                winner = "opponent"
            else:
                winner = "tie"

            battle.state  = "complete"
            battle.winner = winner
            cache["state"]  = "complete"
            cache["winner"] = winner

        await db.commit()
        await _save_cache(str(battle.id), cache)

        event = "battle_end" if both_done else "answer_submitted"
        payload = _base_payload(battle, user, event, question_index)
        payload["is_correct"] = is_correct
        await _publish(str(battle.id), payload)

        return map_battle(battle)

    # ── Battle — forfeit ──────────────────────────────────────────────────────

    @strawberry.mutation
    async def forfeit_battle(
        self,
        info: Info,
        battle_id: strawberry.ID,
    ) -> BattleType:
        """
        Player manually forfeits the battle.
        Opponent is declared the winner immediately.
        The game timer keeps running — this is a deliberate quit.
        """
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.id == uuid.UUID(str(battle_id)))
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Battle not found")
        if battle.state != "active":
            raise ValueError("Battle is not active")

        is_player     = _is_player(battle, user)
        battle.winner = "opponent" if is_player else "player"
        battle.state  = "complete"

        cache = await _get_cache(str(battle.id))
        cache["state"]  = "complete"
        cache["winner"] = battle.winner
        await db.commit()
        await _save_cache(str(battle.id), cache)

        await _publish(str(battle.id), _base_payload(battle, user, "forfeit"))
        return map_battle(battle)

    # ── Battle — rejoin ───────────────────────────────────────────────────────

    @strawberry.mutation
    async def rejoin_battle(
        self,
        info: Info,
        battle_id: strawberry.ID,
    ) -> BattleType:
        """
        Player reconnects after a brief network drop.
        Resets their heartbeat, publishes player_reconnected so both sides can sync,
        and returns the current battle state (scores, state).
        """
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.id == uuid.UUID(str(battle_id)))
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Battle not found")
        if battle.state not in ("active", "waiting"):
            raise ValueError("Battle is no longer active")

        is_player   = _is_player(battle, user)
        is_opponent = (battle.opponent_id is not None and battle.opponent_id == user.id)
        if not is_player and not is_opponent:
            raise ValueError("You are not a participant in this battle")

        cache = await _get_cache(str(battle.id))
        hb_key = "player_heartbeat" if is_player else "opponent_heartbeat"
        cache[hb_key] = time.time()
        await _save_cache(str(battle.id), cache)

        await _publish(str(battle.id), _base_payload(battle, user, "player_reconnected"))
        return map_battle(battle)

    # ── Battle — draw request ─────────────────────────────────────────────────

    @strawberry.mutation
    async def request_draw(
        self,
        info: Info,
        battle_id: strawberry.ID,
    ) -> BattleType:
        """
        Player requests a draw.
        - Max 2 draw requests per player per battle.
        - If the limit is reached, raises an error so the frontend
          can show forfeit-only options to the player.
        - Opponent has 30s to respond. Neither player's timer pauses.
        """
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.id == uuid.UUID(str(battle_id)))
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Battle not found")
        if battle.state != "active":
            raise ValueError("Battle is not active")

        cache      = await _get_cache(str(battle.id))
        is_player  = _is_player(battle, user)
        draws_key  = "player_draws_used" if is_player else "opponent_draws_used"
        draws_used = cache.get(draws_key, 0)

        if draws_used >= MAX_DRAW_REQUESTS:
            raise ValueError(
                "Draw request limit reached. Your only option is to forfeit."
            )
        if cache.get("pending_draw_by"):
            raise ValueError("A draw request is already pending.")

        cache[draws_key]       = draws_used + 1
        cache["pending_draw_by"] = str(user.id)
        await _save_cache(str(battle.id), cache)

        draws_left = MAX_DRAW_REQUESTS - cache[draws_key]

        await _publish(str(battle.id), {
            **_base_payload(battle, user, "draw_requested"),
            "draw_requests_used": cache[draws_key],
            "draw_requests_left": draws_left,
        })

        return map_battle(battle)

    # ── Battle — respond to draw ──────────────────────────────────────────────

    @strawberry.mutation
    async def respond_to_draw(
        self,
        info: Info,
        battle_id: strawberry.ID,
        accepted: bool,
    ) -> BattleType:
        """
        Opponent responds to a pending draw request.
        - accepted=True  → battle ends immediately as a tie.
        - accepted=False → draw declined; requester sees forfeit warning
                           with 15s countdown. Timer keeps running.
        """
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.id == uuid.UUID(str(battle_id)))
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Battle not found")
        if battle.state != "active":
            raise ValueError("Battle is not active")

        cache = await _get_cache(str(battle.id))
        if not cache.get("pending_draw_by"):
            raise ValueError("No pending draw request.")
        if cache["pending_draw_by"] == str(user.id):
            raise ValueError("You cannot respond to your own draw request.")

        # Clear the pending flag regardless of outcome
        cache["pending_draw_by"] = None

        if accepted:
            battle.state  = "complete"
            battle.winner = "tie"
            cache["state"]  = "complete"
            cache["winner"] = "tie"
            await db.commit()
            await _save_cache(str(battle.id), cache)
            await _publish(str(battle.id), _base_payload(battle, user, "draw_accepted"))
        else:
            await _save_cache(str(battle.id), cache)
            await _publish(str(battle.id), _base_payload(battle, user, "draw_declined"))

        return map_battle(battle)

    # ── Battle — screen leave / return ────────────────────────────────────────

    @strawberry.mutation
    async def record_screen_leave(
        self,
        info: Info,
        battle_id: strawberry.ID,
    ) -> BattleType:
        """
        Called when the player navigates away from the battle screen
        (Page Visibility API fires on the frontend).

        Strike logic:
          - 0–1 current strikes → log leave timestamp, start grace period
          - 2 current strikes   → 3rd offense, immediate auto_defeat

        The game timer keeps running regardless.
        Grace period enforcement happens in record_screen_return.
        """
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.id == uuid.UUID(str(battle_id)))
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Battle not found")
        if battle.state != "active":
            raise ValueError("Battle is not active")

        cache       = await _get_cache(str(battle.id))
        is_player   = _is_player(battle, user)
        strikes_key = "player_leave_strikes"   if is_player else "opponent_leave_strikes"
        leave_key   = "player_leave_started"   if is_player else "opponent_leave_started"

        current_strikes = cache.get(strikes_key, 0)

        # 3rd offense — immediate auto_defeat, no grace period
        if current_strikes >= MAX_SCREEN_LEAVES:
            battle.winner = "opponent" if is_player else "player"
            battle.state  = "complete"
            cache["state"]  = "complete"
            cache["winner"] = battle.winner
            await db.commit()
            await _save_cache(str(battle.id), cache)

            await _publish(str(battle.id), {
                **_base_payload(battle, user, "auto_defeat"),
                "screen_leave_strikes": current_strikes,
            })
            return map_battle(battle)

        # Log leave timestamp for grace period calculation on return
        cache[leave_key] = datetime.now(timezone.utc).isoformat()
        await _save_cache(str(battle.id), cache)

        await _publish(str(battle.id), {
            **_base_payload(battle, user, "screen_leave"),
            "screen_leave_strikes": current_strikes,
        })

        return map_battle(battle)

    @strawberry.mutation
    async def record_screen_return(
        self,
        info: Info,
        battle_id: strawberry.ID,
    ) -> BattleType:
        """
        Called when the player comes back to the battle screen.

        Forgiveness rules:
          - Away < 5s        → forgiven, no strike applied
          - Away >= 5s       → strike +1 (within grace period)
          - Away > grace     → auto_defeat (exceeded grace limit)

        Grace periods:
          - 1st strike       → 45 seconds
          - 2nd strike       → 30 seconds
        """
        db:   AsyncSession = info.context["db"]
        user: User         = info.context["user"]

        result = await db.execute(
            select(Battle).where(Battle.id == uuid.UUID(str(battle_id)))
        )
        battle = result.scalar_one_or_none()
        if not battle:
            raise ValueError("Battle not found")
        if battle.state != "active":
            raise ValueError("Battle is not active")

        cache       = await _get_cache(str(battle.id))
        is_player   = _is_player(battle, user)
        strikes_key = "player_leave_strikes"  if is_player else "opponent_leave_strikes"
        leave_key   = "player_leave_started"  if is_player else "opponent_leave_started"

        current_strikes  = cache.get(strikes_key, 0)
        leave_started    = cache.get(leave_key)
        was_forgiven     = False
        duration_away_ms = 0

        if leave_started:
            left_at          = datetime.fromisoformat(leave_started)
            now              = datetime.now(timezone.utc)
            duration_away_ms = int((now - left_at).total_seconds() * 1000)

            grace_ms = (
                FIRST_LEAVE_GRACE_S * 1000
                if current_strikes == 0
                else LATER_LEAVE_GRACE_S * 1000
            )

            if duration_away_ms < LEAVE_FORGIVE_MS:
                # Under 5s — forgiven, no strike
                was_forgiven = True

            elif duration_away_ms > grace_ms:
                # Exceeded grace period — auto_defeat
                battle.winner = "opponent" if is_player else "player"
                battle.state  = "complete"
                cache["state"]   = "complete"
                cache["winner"]  = battle.winner
                cache[leave_key] = None
                await db.commit()
                await _save_cache(str(battle.id), cache)

                await _publish(str(battle.id), {
                    **_base_payload(battle, user, "auto_defeat"),
                    "screen_leave_strikes": current_strikes + 1,
                    "duration_away_ms":     duration_away_ms,
                    "was_forgiven":         False,
                })
                return map_battle(battle)

            else:
                # Returned within grace period — apply strike
                cache[strikes_key] = current_strikes + 1

        cache[leave_key] = None
        await _save_cache(str(battle.id), cache)

        await _publish(str(battle.id), {
            **_base_payload(battle, user, "screen_return"),
            "screen_leave_strikes": cache.get(strikes_key, 0),
            "was_forgiven":         was_forgiven,
            "duration_away_ms":     duration_away_ms,
        })

        return map_battle(battle)

    # ── Battle — heartbeat ────────────────────────────────────────────────────

    @strawberry.mutation
    async def player_heartbeat(
        self,
        info: Info,
        battle_id: strawberry.ID,
    ) -> bool:
        """
        Frontend pings this every 5–10 seconds to prove the player is connected.
        Returns True on success.

        If a player's heartbeat goes silent for HEARTBEAT_EXPIRY_S seconds,
        the Celery background task (Phase 5c) will auto-forfeit them and
        publish a heartbeat_lost event to the subscription.
        """
        user: User = info.context["user"]

        cache     = await _get_cache(str(battle_id))
        is_player = str(cache.get("player_id")) == str(user.id)
        hb_key    = "player_heartbeat" if is_player else "opponent_heartbeat"

        cache[hb_key] = datetime.now(timezone.utc).isoformat()
        await _save_cache(str(battle_id), cache)

        return True

    # ── Chapter groups ────────────────────────────────────────────────────────

    @strawberry.mutation
    async def create_chapter_group(
        self,
        info: Info,
        name: str,
        state_code: str,
        chapter_numbers: list[int],
    ) -> ChapterGroupType:
        """Create a user-owned chapter group for Study/Challenge filtering."""
        user: User = info.context["user"]
        db: AsyncSession = info.context["db"]
        group = ChapterGroup(
            user_id=user.id,
            state_code=state_code,
            name=name,
            chapter_numbers=chapter_numbers,
            is_preset=False,
        )
        db.add(group)
        await db.commit()
        await db.refresh(group)
        return ChapterGroupType(
            id=str(group.id),
            name=group.name,
            state_code=group.state_code,
            chapter_numbers=group.chapter_numbers or [],
            is_preset=group.is_preset,
            created_at=group.created_at,
        )

    @strawberry.mutation
    async def delete_chapter_group(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        """Delete a user-owned chapter group. Returns True on success."""
        import uuid as _uuid
        user: User = info.context["user"]
        db: AsyncSession = info.context["db"]
        result = await db.execute(
            select(ChapterGroup).where(
                ChapterGroup.id == _uuid.UUID(str(id)),
                ChapterGroup.user_id == user.id,
            )
        )
        group = result.scalar_one_or_none()
        if not group:
            raise Exception("Group not found or access denied")
        await db.delete(group)
        await db.commit()
        return True


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
