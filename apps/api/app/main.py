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
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import BackgroundTasks, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
import strawberry
from strawberry.fastapi import GraphQLRouter
from sqlalchemy import delete

_log = logging.getLogger(__name__)

from app.config import settings
from app.db import get_redis, close_redis
from app.db.connection import engine, AsyncSessionLocal
from app.graphql.queries.queries import Query
from app.graphql.mutations.mutations import Mutation
from app.graphql.subscriptions.subscriptions import Subscription
from app.models.auth import RefreshToken, KnownDevice
from app.models.user import ParentLink


# ── GraphQL schema ────────────────────────────────────────────────────────────
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
)


# ── Context builder ───────────────────────────────────────────────────────────
async def get_context(
    request: Request = None,
    response: Response = None,
    background_tasks: BackgroundTasks = None,
) -> dict:
    """
    Build the GraphQL context for HTTP requests.

    `request: Request` causes FastAPI to inject the live HTTP Request, giving
    access to Authorization headers and httpOnly cookies.  Strawberry merges
    the returned dict with its own default context keys.
    """
    import uuid
    from app.db.connection import AsyncSessionLocal

    db   = AsyncSessionLocal()
    if background_tasks is not None:
        background_tasks.add_task(db.close)
    user = None

    auth_header = request.headers.get("Authorization") if request else None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            from app.auth.jwt import decode_token
            from app.models import User
            from sqlalchemy import select

            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                result = await db.execute(
                    select(User).where(User.id == uuid.UUID(user_id))
                )
                user = result.scalar_one_or_none()
        except Exception as _exc:
            _log.warning("get_context user lookup failed: %s", _exc, exc_info=True)

    state_code = (
        request.headers.get("X-State-Code", settings.state_code)
        if request else settings.state_code
    )

    return {
        "request":    request,
        "response":   response,
        "db":         db,
        "user":       user,
        "state_code": state_code,
        "commit":     db.commit,
    }


async def _purge_stale_records() -> None:
    """Delete expired/revoked DB rows that accumulate over time."""
    cutoff_90d  = datetime.now(timezone.utc) - timedelta(days=90)
    cutoff_7d   = datetime.now(timezone.utc) - timedelta(days=7)
    async with AsyncSessionLocal() as db:
        # Refresh tokens: revoked or expired more than 90 days ago
        await db.execute(
            delete(RefreshToken).where(
                (RefreshToken.revoked_at  < cutoff_90d) |
                (RefreshToken.expires_at  < cutoff_90d)
            )
        )
        # Known devices: not seen in 90 days
        await db.execute(
            delete(KnownDevice).where(KnownDevice.last_seen_at < cutoff_90d)
        )
        # Parent link codes: pending and expired more than 7 days ago
        await db.execute(
            delete(ParentLink).where(
                ParentLink.status == "pending",
                ParentLink.link_code_expires_at < cutoff_7d,
            )
        )
        await db.commit()


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 DriveReady API starting — state={settings.state_code} env={settings.environment}")
    redis = await get_redis()
    await redis.ping()
    print("✓ Redis connected")
    asyncio.create_task(_purge_stale_records())
    yield
    await close_redis()
    await engine.dispose()
    print("👋 DriveReady API shut down")


# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="DriveReady API",
        description="Oklahoma Driver's Permit Study Platform",
        version="0.1.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    # CORS
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://driveready-ok.com",
        "https://www.driveready-ok.com",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # GraphQL endpoint — handles both HTTP and WebSocket
    graphql_app = GraphQLRouter(
        schema,
        context_getter=get_context,
        graphiql=settings.debug,
    )
    app.include_router(graphql_app, prefix="/graphql")

    # Health check
    @app.get("/health")
    async def health():
        return {
            "status":      "ok",
            "version":     "0.1.0",
            "state":       settings.state_code,
            "environment": settings.environment,
        }

    # ── Parental consent endpoints ────────────────────────────────────────────

    @app.get("/consent/approve/{token}", response_class=HTMLResponse)
    async def consent_approve(token: str):
        from sqlalchemy import select, update
        from app.db.connection import AsyncSessionLocal
        from app.models import User
        from app.services.consent import resolve_consent_token, delete_consent_token

        data = await resolve_consent_token(token)
        if not data:
            return _consent_page(
                title="Link Expired",
                message="This consent link has expired or already been used.",
                success=False,
            )

        async with AsyncSessionLocal() as db:
            await db.execute(
                update(User)
                .where(User.id == data["user_id"])
                .values(parental_consent_status="approved")
            )
            await db.commit()

        await delete_consent_token(token)
        return _consent_page(
            title="Account Approved",
            message="The account has been approved. Your child can now sign in to DriveReady.",
            success=True,
        )

    @app.get("/consent/deny/{token}", response_class=HTMLResponse)
    async def consent_deny(token: str):
        from app.db.connection import AsyncSessionLocal
        from app.models import User
        from sqlalchemy import select, delete as sql_delete
        from app.services.consent import resolve_consent_token, delete_consent_token

        data = await resolve_consent_token(token)
        if not data:
            return _consent_page(
                title="Link Expired",
                message="This consent link has expired or already been used.",
                success=False,
            )

        async with AsyncSessionLocal() as db:
            await db.execute(
                sql_delete(User).where(User.id == data["user_id"])
            )
            await db.commit()

        await delete_consent_token(token)
        return _consent_page(
            title="Account Removed",
            message="The account and all associated data have been deleted as requested.",
            success=True,
        )

    # Global error handler
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(
            status_code=400,
            content={"error": str(exc)},
        )

    return app


def _consent_page(*, title: str, message: str, success: bool) -> str:
    color = "#22C55E" if success else "#EF4444"
    icon  = "✓" if success else "✕"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>{title} — DriveReady</title>
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{background:#0A0F0D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}}
    .card{{background:#111A14;border:1px solid #1E2D22;border-radius:16px;padding:40px 36px;
           max-width:420px;width:100%;text-align:center}}
    .icon{{width:64px;height:64px;border-radius:50%;background:{color}22;border:1px solid {color}55;
           display:flex;align-items:center;justify-content:center;margin:0 auto 24px;
           font-size:28px;color:{color}}}
    h1{{font-size:20px;font-weight:700;color:#E8F0EB;margin-bottom:12px}}
    p{{font-size:14px;line-height:1.6;color:#9DB8A4}}
    .brand{{margin-top:28px;font-size:12px;color:#4A6B54}}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">{icon}</div>
    <h1>{title}</h1>
    <p>{message}</p>
    <p class="brand">DriveReady · driveready.app</p>
  </div>
</body>
</html>"""


app = create_app()