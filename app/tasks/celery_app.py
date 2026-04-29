# ─────────────────────────────────────────────────────────────────────────────
# Author   : Frandy Slueue
# Title    : Software Engineering · DevOps Security · IT Ops
# Portfolio: https://frandycode.dev
# GitHub   : https://github.com/frandycode
# Email    : frandyslueue@gmail.com
# Location : Tulsa, OK & Dallas, TX (Central Time)
# Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
# ─────────────────────────────────────────────────────────────────────────────

from celery import Celery
from celery.schedules import crontab
from app.config import settings

app = Celery("driveready")

app.conf.update(
    broker_url=settings.redis_url,
    result_backend=settings.redis_url,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.ai.*":          {"queue": "ai"},
        "app.tasks.reports.*":     {"queue": "reports"},
        "app.tasks.maintenance.*": {"queue": "maintenance"},
    },
    beat_schedule={
        "update-readiness-scores": {
            "task": "app.tasks.ai.calculate_readiness_scores",
            "schedule": 1800,  # every 30 minutes
        },
        "sync-leaderboard": {
            "task": "app.tasks.maintenance.sync_leaderboard",
            "schedule": 300,   # every 5 minutes
        },
        "update-streaks-midnight": {
            "task": "app.tasks.maintenance.update_streaks",
            "schedule": crontab(hour=0, minute=5),  # 12:05am UTC
        },
        "generate-questions-nightly": {
            "task": "app.tasks.ai.generate_questions",
            "schedule": crontab(hour=2, minute=0),  # 2am UTC
        },
        "send-weekly-parent-reports": {
            "task": "app.tasks.reports.weekly_parent_report",
            "schedule": crontab(hour=8, minute=0, day_of_week=1),  # Monday 8am
        },
    },
)


# ── Stub tasks (implemented in Phase 4) ──────────────────────────────────────

@app.task(name="app.tasks.ai.calculate_readiness_scores")
def calculate_readiness_scores():
    """Recalculate readiness scores for all active users. Implemented in Phase 4."""
    pass


@app.task(name="app.tasks.ai.generate_questions")
def generate_questions():
    """
    Nightly job: scan all chapters for coverage gaps and fill them.
    Runs at 2am UTC. Calls Claude only where DB is below threshold.
    """
    async def _run():
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from app.config import settings, get_state_config
        from app.ai.question_gen import check_coverage_gaps, generate_and_save_questions

        engine = create_async_engine(settings.database_url)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)

        state_config = get_state_config(settings.state_code)

        async with session_factory() as db:
            gaps = await check_coverage_gaps(db, settings.state_code, state_config.chapters)

            if not gaps:
                print("✓ No coverage gaps found — question bank is complete")
                return

            print(f"Found {len(gaps)} coverage gaps, generating questions...")
            for gap in gaps:
                # Minimal context stub — replace with real manual text in Phase 4
                context = f"Chapter {gap['chapter']} of the Oklahoma Driver Manual"
                await generate_and_save_questions(
                    db=db,
                    state_code=settings.state_code,
                    chapter=gap["chapter"],
                    difficulty=gap["difficulty"],
                    chapter_context=context,
                    count=gap["deficit"],
                )

        await engine.dispose()

    asyncio.get_event_loop().run_until_complete(_run())


@app.task(name="app.tasks.ai.generate_questions_for_chapter")
def generate_questions_for_chapter(
    state_code: str,
    chapter: int,
    difficulty: str,
    target: int,
    existing_count: int,
):
    """
    Background task: fill a specific chapter/difficulty gap.
    Triggered automatically when a user session finds below-threshold coverage.
    """
    async def _run():
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from app.config import settings
        from app.ai.question_gen import generate_and_save_questions

        engine = create_async_engine(settings.database_url)
        session_factory = async_sessionmaker(engine, expire_on_commit=False)

        deficit = target - existing_count
        if deficit <= 0:
            return

        context = f"Chapter {chapter} of the {state_code.upper()} Driver Manual"

        async with session_factory() as db:
            await generate_and_save_questions(
                db=db,
                state_code=state_code,
                chapter=chapter,
                difficulty=difficulty,
                chapter_context=context,
                count=deficit,
            )

        await engine.dispose()

    asyncio.get_event_loop().run_until_complete(_run())


@app.task(name="app.tasks.maintenance.sync_leaderboard")
def sync_leaderboard():
    """Sync leaderboard rankings to Redis. Implemented in Phase 5."""
    pass


@app.task(name="app.tasks.maintenance.update_streaks")
def update_streaks():
    """Reset streaks for users with no activity today. Implemented in Phase 5."""
    pass


@app.task(name="app.tasks.reports.weekly_parent_report")
def weekly_parent_report():
    """Send weekly progress emails to linked parents. Implemented in Phase 6."""
    pass


@app.task(name="app.tasks.notifications.send_push")
def send_push(user_id: str, title: str, body: str, data: dict | None = None):
    """Send a push notification to a user. Implemented in Phase 6."""
    pass
