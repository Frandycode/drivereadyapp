# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import strawberry
from strawberry.fastapi import GraphQLRouter

from app.config import settings
from app.db import get_redis, close_redis
from app.db.connection import engine
from app.graphql.queries.queries import Query
from app.graphql.mutations.mutations import Mutation
from app.graphql.subscriptions.subscriptions import Subscription


# ── GraphQL schema ────────────────────────────────────────────────────────────
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
)


# ── Context builder (HTTP) ────────────────────────────────────────────────────
async def get_context(request: Request) -> dict:
    """
    Build the GraphQL context for every HTTP request.
    Attaches db session and authenticated user (if any).
    """
    from app.db.connection import AsyncSessionLocal

    db   = AsyncSessionLocal()
    user = None

    auth_header = request.headers.get("Authorization")
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
                    select(User).where(User.id == user_id)
                )
                user = result.scalar_one_or_none()
        except Exception:
            pass

    return {
        "request":    request,
        "db":         db,
        "user":       user,
        "state_code": request.headers.get("X-State-Code", settings.state_code),
        "commit":     db.commit,
    }


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 DriveReady API starting — state={settings.state_code} env={settings.environment}")
    redis = await get_redis()
    await redis.ping()
    print("✓ Redis connected")
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

    # Global error handler
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(
            status_code=400,
            content={"error": str(exc)},
        )

    return app


app = create_app()