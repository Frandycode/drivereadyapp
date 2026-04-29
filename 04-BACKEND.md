# DriveReady — Backend Tech Stack & Build Plan

## Philosophy
- Python-first — clean, readable, excellent AI library ecosystem
- GraphQL as the single API contract — one endpoint, typed, versioning-free
- Managed services where possible — focus on product, not infrastructure
- Containerized from day one — same environment local and production

---

## Core Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Language | Python | 3.12 | Backend logic |
| Framework | FastAPI | 0.111+ | Async HTTP server |
| GraphQL | Strawberry | 0.235+ | Code-first GraphQL schema |
| ORM | SQLAlchemy | 2.0 (async) | Database access layer |
| Migrations | Alembic | 1.13+ | Schema version control |
| Validation | Pydantic | 2.x | Data validation and serialization |

### Why Strawberry for GraphQL?
Strawberry uses Python type hints and dataclasses to generate the GraphQL schema automatically. The schema and the Python types are always in sync. No SDL files to maintain separately.

```python
# Example: schema defined entirely in Python types
import strawberry
from typing import List

@strawberry.type
class Question:
    id: strawberry.ID
    chapter: int
    difficulty: str
    question_text: str
    answers: List['Answer']
    correct_count: int
    explanation: str
    image_url: str | None = None
    hint_text: str | None = None

@strawberry.type
class Query:
    @strawberry.field
    async def questions(
        self,
        state_code: str,
        count: int,
        chapters: List[int] | None = None,
        difficulty: str | None = None,
    ) -> List[Question]:
        return await question_service.get_session_questions(...)
```

---

## Database Layer

| Tool | Purpose |
|---|---|
| PostgreSQL 16 (Supabase) | Primary relational database |
| SQLAlchemy 2.0 async | ORM — maps Python classes to tables |
| Alembic | Database migration management |
| Redis (Upstash) | Cache, sessions, rate limiting, game state, queues |

### Database Schema

#### users
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'learner',  -- learner | parent | admin
    state_code  TEXT NOT NULL DEFAULT 'ok',
    xp_total    INTEGER NOT NULL DEFAULT 0,
    level       INTEGER NOT NULL DEFAULT 1,
    streak_days INTEGER NOT NULL DEFAULT 0,
    streak_last_date DATE,
    freeze_tokens INTEGER NOT NULL DEFAULT 0,
    test_date   DATE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
```

#### questions
```sql
CREATE TABLE questions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code  TEXT NOT NULL,
    chapter     INTEGER NOT NULL,
    category    TEXT NOT NULL,
    difficulty  TEXT NOT NULL,  -- pawn | rogue | king
    question_text TEXT NOT NULL,
    correct_count INTEGER NOT NULL DEFAULT 1,
    explanation TEXT NOT NULL,
    hint_text   TEXT,
    image_url   TEXT,
    source_page INTEGER,
    tags        TEXT[] DEFAULT '{}',
    source      TEXT NOT NULL DEFAULT 'manual',  -- manual | ai_generated
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_questions_state_chapter ON questions(state_code, chapter);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
```

#### answers
```sql
CREATE TABLE answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT false,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_answers_question ON answers(question_id);
```

#### sessions
```sql
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    state_code      TEXT NOT NULL,
    mode            TEXT NOT NULL,   -- quiz | puzzle | flipper | trivia | bot_battle | peer_battle
    difficulty      TEXT NOT NULL,
    question_count  INTEGER NOT NULL,
    chapters        INTEGER[] DEFAULT '{}',
    score           INTEGER NOT NULL DEFAULT 0,
    total           INTEGER NOT NULL DEFAULT 0,
    xp_earned       INTEGER NOT NULL DEFAULT 0,
    hints_used      INTEGER NOT NULL DEFAULT 0,
    skips_used      INTEGER NOT NULL DEFAULT 0,
    time_seconds    INTEGER,
    completed       BOOLEAN NOT NULL DEFAULT false,
    started_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
```

#### session_answers
```sql
CREATE TABLE session_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES questions(id),
    selected_ids    UUID[] NOT NULL DEFAULT '{}',
    is_correct      BOOLEAN NOT NULL,
    hint_used       BOOLEAN NOT NULL DEFAULT false,
    skipped         BOOLEAN NOT NULL DEFAULT false,
    time_taken_ms   INTEGER,
    answered_at     TIMESTAMPTZ DEFAULT now()
);
```

#### user_progress
```sql
CREATE TABLE user_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    chapter         INTEGER NOT NULL,
    state_code      TEXT NOT NULL,
    questions_seen  INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER NOT NULL DEFAULT 0,
    accuracy        FLOAT GENERATED ALWAYS AS
                    (CASE WHEN questions_seen = 0 THEN 0
                     ELSE questions_correct::float / questions_seen END) STORED,
    lessons_completed INTEGER NOT NULL DEFAULT 0,
    lessons_total   INTEGER NOT NULL DEFAULT 0,
    last_studied_at TIMESTAMPTZ,
    UNIQUE(user_id, chapter, state_code)
);
```

#### bookmarks
```sql
CREATE TABLE bookmarks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    question_id UUID REFERENCES questions(id),
    lesson_id   UUID REFERENCES lessons(id),
    note        TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, question_id),
    UNIQUE(user_id, lesson_id)
);
```

#### flashcard_decks
```sql
CREATE TABLE flashcard_decks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    name        TEXT NOT NULL,
    question_ids UUID[] NOT NULL DEFAULT '{}',
    is_smart    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);
```

#### achievements
```sql
CREATE TABLE achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key         TEXT UNIQUE NOT NULL,  -- 'first_flip', 'beat_apex', etc.
    name        TEXT NOT NULL,
    description TEXT NOT NULL,
    icon        TEXT NOT NULL,
    xp_reward   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE user_achievements (
    user_id         UUID NOT NULL REFERENCES users(id),
    achievement_id  UUID NOT NULL REFERENCES achievements(id),
    earned_at       TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY(user_id, achievement_id)
);
```

#### parent_links
```sql
CREATE TABLE parent_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID NOT NULL REFERENCES users(id),
    learner_id  UUID NOT NULL REFERENCES users(id),
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending | active | revoked
    link_code   TEXT UNIQUE,  -- 6-digit code for linking
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(parent_id, learner_id)
);
```

#### battles
```sql
CREATE TABLE battles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            TEXT NOT NULL,  -- bot | peer
    player_id       UUID NOT NULL REFERENCES users(id),
    opponent_id     UUID REFERENCES users(id),  -- NULL for bot battles
    bot_type        TEXT,  -- rusty | dash | apex
    question_ids    UUID[] NOT NULL,
    player_score    INTEGER NOT NULL DEFAULT 0,
    opponent_score  INTEGER NOT NULL DEFAULT 0,
    winner          TEXT,  -- 'player' | 'opponent' | 'tie'
    state           TEXT NOT NULL DEFAULT 'waiting',  -- waiting | active | complete
    created_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);
```

#### chapters & lessons
```sql
CREATE TABLE chapters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code  TEXT NOT NULL,
    number      INTEGER NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    UNIQUE(state_code, number)
);

CREATE TABLE lessons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id  UUID NOT NULL REFERENCES chapters(id),
    sort_order  INTEGER NOT NULL,
    title       TEXT,
    content     TEXT NOT NULL,
    image_url   TEXT,
    fact_tags   TEXT[] DEFAULT '{}'
);
```

### Row Level Security (Supabase RLS)
```sql
-- Users can only read their own data
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sessions" ON sessions
    FOR ALL USING (auth.uid() = user_id);

-- Parents can read linked learner data
CREATE POLICY "parents_read_learner_progress" ON user_progress
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM parent_links
            WHERE parent_id = auth.uid()
            AND learner_id = user_progress.user_id
            AND status = 'active'
        )
    );
```

---

## API Layer — GraphQL Schema Structure

### Query Types
```python
@strawberry.type
class Query:
    # Questions
    questions: List[Question]        # session questions (filtered)
    question: Question               # single question by id
    daily_challenge: Question        # today's featured question

    # User
    me: User                         # current user profile
    my_progress: List[ChapterProgress>
    my_readiness: ReadinessScore
    my_bookmarks: List[Bookmark]
    my_decks: List[FlashcardDeck]
    my_achievements: List[UserAchievement]

    # Chapters & Lessons
    chapters: List[Chapter]
    chapter: Chapter
    lessons: List[Lesson]

    # Leaderboard
    leaderboard: List[LeaderboardEntry>

    # Parent
    learner_progress: LearnerProgress  # parent-only, linked learner
```

### Mutation Types
```python
@strawberry.type
class Mutation:
    # Sessions
    start_session: Session
    submit_answer: AnswerResult
    end_session: SessionResult

    # Bookmarks
    save_bookmark: Bookmark
    remove_bookmark: Boolean
    add_bookmark_note: Bookmark

    # Decks
    create_deck: FlashcardDeck
    update_deck: FlashcardDeck
    delete_deck: Boolean

    # Battle
    create_battle: Battle
    join_battle: Battle
    submit_battle_answer: BattleAnswerResult

    # Account
    update_profile: User
    set_test_date: User
    use_streak_freeze: User
    link_parent: ParentLink
    approve_parent_link: ParentLink

    # Sync (offline)
    sync_offline_events: SyncResult
```

### Subscription Types
```python
@strawberry.type
class Subscription:
    battle_updates: BattleUpdate       # real-time battle state
    peer_joined: Battle                # opponent joined lobby
    battle_ended: BattleResult         # battle complete event
```

---

## AI Integration

| Tool | Purpose |
|---|---|
| Anthropic Python SDK | Claude API access |
| Instructor | Structured outputs from Claude (Pydantic models) |
| LangChain | Complex multi-step AI workflows |

### Instructor Usage — Structured AI Outputs
```python
import anthropic
import instructor
from pydantic import BaseModel

client = instructor.from_anthropic(anthropic.Anthropic())

class GeneratedQuestion(BaseModel):
    question_text: str
    answers: list[GeneratedAnswer]
    correct_count: int
    explanation: str
    difficulty: Literal['pawn', 'rogue', 'king']
    hint_text: str
    tags: list[str]
    source_page: int | None = None

class GeneratedAnswer(BaseModel):
    text: str
    is_correct: bool

async def generate_question(chapter: int, context: str) -> GeneratedQuestion:
    return client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        response_model=GeneratedQuestion,
        messages=[{
            "role": "user",
            "content": f"Generate a permit test question for chapter {chapter}.\n\nContext: {context}"
        }]
    )
```

### AI Features by Endpoint

| Feature | Trigger | Claude Task |
|---|---|---|
| Question hints | User taps hint button | Given question + difficulty, generate a hint that narrows without revealing |
| Flipper evaluation | User submits free-text answer | Compare user response to correct answer, return true/false + feedback |
| Deck balancing | User clicks "Balance deck" | Analyze selected questions, suggest additions/removals for coverage |
| Readiness message | Readiness score calculated | Generate personalized study recommendation |
| Night Before summary | Night Before Mode starts | Analyze history, generate targeted 20-question review list |
| Question generation | Background job | Generate new questions from manual text, return structured GeneratedQuestion |

---

## Background Jobs — Celery

| Queue | Job | Schedule |
|---|---|---|
| `default` | Send push notification | Triggered by event |
| `default` | Award achievement | Triggered by session end |
| `default` | Update streak | Daily at midnight per timezone |
| `ai` | Generate questions | Nightly 2am |
| `ai` | Calculate readiness scores | Every 30 minutes |
| `reports` | Send weekly parent report | Mondays 8am |
| `reports` | Send weekly user summary | Sundays 10am |
| `maintenance` | Clean expired battle rooms | Every hour |
| `maintenance` | Sync leaderboard to Redis | Every 5 minutes |

### Celery Configuration
```python
# celery_config.py
from celery import Celery

app = Celery('driveready')
app.config_from_object({
    'broker_url': REDIS_URL,
    'result_backend': REDIS_URL,
    'task_routes': {
        'tasks.ai.*': {'queue': 'ai'},
        'tasks.reports.*': {'queue': 'reports'},
        'tasks.maintenance.*': {'queue': 'maintenance'},
    },
    'beat_schedule': {
        'generate-questions-nightly': {
            'task': 'tasks.ai.generate_questions',
            'schedule': crontab(hour=2, minute=0),
        },
        'update-readiness-scores': {
            'task': 'tasks.ai.calculate_readiness',
            'schedule': 1800,  # 30 minutes
        },
        'sync-leaderboard': {
            'task': 'tasks.maintenance.sync_leaderboard',
            'schedule': 300,  # 5 minutes
        },
    }
})
```

---

## Caching Strategy — Redis

```python
# Key patterns
CACHE_KEYS = {
    'questions': 'questions:{state_code}:{chapter}:{difficulty}',
    'daily_challenge': 'daily:{state_code}:{date}',
    'readiness': 'readiness:{user_id}',
    'leaderboard': 'leaderboard:{state_code}:{period}',
    'session': 'session:{session_id}',
    'battle': 'battle:{battle_id}',
    'rate_limit': 'ratelimit:{user_id}:{endpoint}',
}

# TTLs
CACHE_TTL = {
    'questions': 3600,          # 1 hour (questions rarely change)
    'daily_challenge': 86400,   # 24 hours (changes daily)
    'readiness': 1800,          # 30 minutes (recalculated by Celery)
    'leaderboard': 300,         # 5 minutes
    'session': 3600,            # 1 hour (active session)
    'battle': 1800,             # 30 minutes (active battle)
}
```

---

## Authentication

| Layer | Tool | Purpose |
|---|---|---|
| Auth provider | Supabase Auth | Email, Google, Apple |
| Token format | JWT | Stateless, works across web + mobile |
| Token validation | FastAPI middleware | Validates JWT on every request |
| Authorization | Row Level Security | Database-level data isolation |
| Role enforcement | FastAPI dependency | Route-level role checks |

```python
# auth/dependencies.py
from fastapi import Depends, HTTPException
from .jwt import decode_token

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token)
    user = await user_service.get_by_id(payload['sub'])
    if not user:
        raise HTTPException(status_code=401)
    return user

async def require_parent(user: User = Depends(get_current_user)) -> User:
    if user.role not in ('parent', 'admin'):
        raise HTTPException(status_code=403, detail="Parent role required")
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != 'admin':
        raise HTTPException(status_code=403)
    return user
```

---

## Rate Limiting

```python
# Implemented via Redis sliding window
RATE_LIMITS = {
    '/graphql':              (100, 60),    # 100 requests per 60 seconds
    '/graphql#hint':         (20, 60),     # 20 hints per minute (AI cost control)
    '/graphql#generate':     (5, 3600),    # 5 AI generations per hour
}
```

---

## Folder Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory, middleware, routes
│   ├── schema.py               # Strawberry GraphQL schema (Query, Mutation, Subscription)
│   │
│   ├── graphql/
│   │   ├── types/              # Strawberry type definitions
│   │   │   ├── question.py
│   │   │   ├── user.py
│   │   │   ├── session.py
│   │   │   ├── battle.py
│   │   │   └── progress.py
│   │   ├── queries/
│   │   │   ├── questions.py
│   │   │   ├── users.py
│   │   │   └── progress.py
│   │   ├── mutations/
│   │   │   ├── sessions.py
│   │   │   ├── bookmarks.py
│   │   │   ├── battles.py
│   │   │   └── accounts.py
│   │   └── subscriptions/
│   │       └── battles.py
│   │
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── question.py
│   │   ├── session.py
│   │   ├── battle.py
│   │   └── progress.py
│   │
│   ├── services/               # Business logic layer
│   │   ├── question_service.py
│   │   ├── session_service.py
│   │   ├── battle_service.py
│   │   ├── progress_service.py
│   │   ├── readiness_service.py
│   │   ├── achievement_service.py
│   │   └── notification_service.py
│   │
│   ├── ai/
│   │   ├── client.py           # Anthropic + Instructor setup
│   │   ├── hints.py            # Hint generation
│   │   ├── question_gen.py     # Question generation pipeline
│   │   ├── flipper_eval.py     # Free-text answer evaluation
│   │   └── readiness.py        # Readiness message generation
│   │
│   ├── auth/
│   │   ├── jwt.py              # Token decode + validate
│   │   ├── dependencies.py     # FastAPI auth dependencies
│   │   └── supabase.py         # Supabase auth client
│   │
│   ├── db/
│   │   ├── connection.py       # Async SQLAlchemy engine
│   │   ├── session.py          # DB session dependency
│   │   └── redis.py            # Redis connection
│   │
│   ├── tasks/                  # Celery tasks
│   │   ├── celery_app.py
│   │   ├── ai.py               # AI generation tasks
│   │   ├── notifications.py    # Push notification tasks
│   │   ├── reports.py          # Weekly report tasks
│   │   └── maintenance.py      # Cleanup tasks
│   │
│   ├── config/
│   │   ├── settings.py         # Pydantic Settings (env vars)
│   │   └── states.py           # Multi-state configuration
│   │
│   └── utils/
│       ├── cache.py            # Redis cache helpers
│       ├── pagination.py       # Cursor pagination
│       └── xp.py               # XP calculation logic
│
├── migrations/                 # Alembic migrations
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial_schema.py
│
├── scripts/
│   ├── seed_questions.py       # Seed database from JSON
│   ├── seed_achievements.py    # Seed achievement definitions
│   └── import_signs.py        # Import extracted sign images
│
├── tests/
│   ├── conftest.py             # Pytest fixtures
│   ├── test_questions.py
│   ├── test_sessions.py
│   ├── test_auth.py
│   └── test_ai.py
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── alembic.ini
└── pyproject.toml
```

---

## Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@db:5432/driveready
      REDIS_URL: redis://redis:6379/0
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
      JWT_SECRET: ${JWT_SECRET}
      STATE_CODE: ok
    depends_on: [db, redis]
    volumes: ["./:/app"]  # hot reload in dev
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

  worker:
    build: .
    command: celery -A app.tasks.celery_app worker -l info -Q default,ai
    environment: *api-env
    depends_on: [db, redis]

  beat:
    build: .
    command: celery -A app.tasks.celery_app beat -l info
    environment: *api-env
    depends_on: [redis]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: driveready
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]

  adminer:
    image: adminer
    ports: ["8080:8080"]
    depends_on: [db]

volumes:
  postgres_data:
```

---

## Testing Strategy

| Type | Tool | Target |
|---|---|---|
| Unit tests | pytest + pytest-asyncio | Services, utils, AI logic |
| Integration tests | pytest + httpx | GraphQL resolvers end-to-end |
| Database tests | pytest + factory_boy | Model relationships, RLS |
| Load tests | Locust | API under battle/concurrent session load |

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html

# Run only fast unit tests
pytest tests/ -m "not integration"
```

---

## Phase-by-Phase Backend Build Plan

### Phase 0 — Foundation (Week 1–2)
- [ ] FastAPI project scaffold with Strawberry
- [ ] Docker Compose local environment
- [ ] Database connection (SQLAlchemy async)
- [ ] Alembic migration for initial schema
- [ ] Supabase Auth JWT validation middleware
- [ ] Basic Query: `me`, `questions`
- [ ] Basic Mutation: `start_session`, `submit_answer`
- [ ] Redis connection and caching helpers
- [ ] Environment variables via Pydantic Settings
- [ ] Health check endpoint `/health`

### Phase 1 — Core Data (Week 2–3)
- [ ] Full question schema with answers
- [ ] Session start / answer / end flow
- [ ] User progress tracking on session end
- [ ] Bookmark mutations
- [ ] Achievement check + award on session end
- [ ] XP calculation and level-up detection

### Phase 2 — AI Features (Week 3–5)
- [ ] Anthropic client with Instructor setup
- [ ] Hint generation endpoint
- [ ] Flipper answer evaluation
- [ ] Question generation pipeline (manual trigger)
- [ ] Readiness score calculation (Celery task)
- [ ] Deck balance suggestion

### Phase 3 — Battle System (Week 5–7)
- [ ] Battle creation and joining (peer)
- [ ] GraphQL subscriptions for real-time battle
- [ ] Bot answer simulation logic
- [ ] Battle score tracking and completion
- [ ] Battle result persistence

### Phase 4 — Background Jobs (Week 7–8)
- [ ] Celery + Redis queue setup
- [ ] Push notification tasks (Web Push)
- [ ] Weekly parent report emails
- [ ] Nightly question generation job
- [ ] Streak update job (midnight)
- [ ] Leaderboard sync job

### Phase 5 — Parent & Admin (Week 8–9)
- [ ] Parent link flow (code generation + approval)
- [ ] Parent-gated queries (learner progress)
- [ ] RLS policies for parent data access
- [ ] Admin question management endpoints

### Phase 6 — Hardening (Week 9–10)
- [ ] Rate limiting on all AI endpoints
- [ ] Full test suite (unit + integration)
- [ ] Load testing with Locust
- [ ] Structured logging (Logfire)
- [ ] Sentry error tracking integration
- [ ] Railway deployment configuration

---

## Author

**Frandy Slueue** — Software Engineering · DevOps Security · IT Ops
📍 Tulsa, OK & Dallas, TX (Central Time)
🌐 [frandycode.dev](https://frandycode.dev) · 💼 [github.com/frandycode](https://github.com/frandycode) · ✉️ frandyslueue@gmail.com

*Project: DriveReady — AI-Powered Multi-State Driver Education Platform*
