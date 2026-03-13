# DriveReady — Full Stack Architecture

## The Complete Picture

This document shows how every layer connects end-to-end. Read this alongside
`03-FRONTEND.md` and `04-BACKEND.md` for implementation details.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│                                                                  │
│   React PWA (Vercel)              React Native App (Expo)        │
│   driveready-ok.com               iOS + Android (Phase 7)        │
│                                                                  │
│   Apollo Client ─────────────────────────────────────────────►  │
│   TanStack Query (server state)                                  │
│   Zustand (UI state)                                             │
│   Dexie/IndexedDB (offline cache)                                │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS + WSS
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                                    │
│          CDN · DDoS Protection · Edge Caching                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│              BACKEND — Railway (Docker containers)               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FastAPI + Strawberry GraphQL                              │ │
│  │  Single endpoint: POST /graphql                            │ │
│  │  WebSocket: WSS /graphql (subscriptions)                   │ │
│  │  Health check: GET /health                                 │ │
│  └──────┬─────────────┬──────────────┬────────────────────────┘ │
│         │             │              │                           │
│         ▼             ▼              ▼                           │
│   Services        AI Layer        Auth Layer                     │
│   (business       (Anthropic      (JWT validation                │
│   logic)          + Instructor)   + Supabase)                    │
│         │                                                        │
│  ┌──────┴──────────────────────────────────────────────────────┐ │
│  │  Celery Workers + Beat Scheduler (async background jobs)   │ │
│  │  Queues: default | ai | reports | maintenance              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
┌──────────────┐ ┌───────────┐  ┌─────────────────────┐
│  Supabase    │ │  Upstash  │  │  Anthropic Claude   │
│              │ │   Redis   │  │  API                │
│ PostgreSQL   │ │           │  │                     │
│ Auth         │ │ Cache     │  │ Hints               │
│ Storage      │ │ Sessions  │  │ Question gen        │
│ Realtime     │ │ Rate limit│  │ Flipper eval        │
│ RLS          │ │ Game state│  │ Readiness msg       │
│              │ │ Job queue │  │ Deck balance        │
└──────────────┘ └───────────┘  └─────────────────────┘
```

---

## Request Lifecycle — Typical API Call

### Example: User submits a quiz answer

```
1. User clicks answer in React component
   └─ useSessionStore.submitAnswer() called

2. Apollo Client sends GraphQL mutation
   └─ POST /graphql
   └─ Headers: Authorization: Bearer <JWT>
   └─ Body: mutation SubmitAnswer { ... }

3. Cloudflare passes through (non-cacheable mutation)

4. FastAPI receives request
   └─ JWT middleware validates token
   └─ User extracted from token payload

5. Strawberry routes to SubmitAnswer resolver
   └─ session_service.submit_answer(session_id, question_id, answer_ids)

6. session_service checks answer correctness
   └─ Queries answers table (cache-first via Redis)
   └─ Writes result to session_answers table
   └─ Updates user_progress table (atomic upsert)

7. achievement_service checks if any badge earned
   └─ Compares progress against achievement criteria
   └─ Awards if threshold met (insert user_achievements)

8. XP calculated
   └─ xp = base_xp * difficulty_multiplier
   └─ Updates users.xp_total
   └─ Checks for level up

9. Response returned to Apollo Client
   └─ { isCorrect, xpEarned, badgesUnlocked, explanation }

10. React updates UI
    └─ Correct/wrong animation plays (Framer Motion)
    └─ XP flies to counter (Framer Motion)
    └─ Badge toast appears if unlocked
    └─ Session store advances to next question
```

---

## Real-time Lifecycle — Peer Battle

```
1. Player A creates battle room
   └─ POST /graphql: createBattle mutation
   └─ Battle record created (state: 'waiting')
   └─ Share code / link generated

2. Player B joins via code
   └─ POST /graphql: joinBattle mutation
   └─ Battle state → 'active'
   └─ Supabase Realtime fires database change event

3. Both clients subscribe
   └─ WSS /graphql: subscription BattleUpdates(battleId)
   └─ Apollo Client opens WebSocket connection

4. Question served (same question to both players)
   └─ Questions pre-loaded from question bank
   └─ Stored in Redis as battle:{battleId} with TTL

5. Player A answers
   └─ POST /graphql: submitBattleAnswer mutation
   └─ Redis battle state updated
   └─ Subscription event published: { playerId, isCorrect, scores }
   └─ Both clients receive update simultaneously

6. Player B answers (or timer expires)
   └─ Same flow
   └─ After both answer: advance event published

7. All questions complete
   └─ battle_service determines winner
   └─ Battle record updated (state: 'complete', winner)
   └─ XP awarded to both players (more for winner)
   └─ Final subscription event: battleEnded { result }

8. Both clients show results screen
```

---

## Data Flow — Offline Mode

```
ONLINE STATE:
User answers quiz → Apollo mutation → API → DB → response

OFFLINE STATE:
User answers quiz → apolloClient detects offline
  → Operation queued in Apollo's offline queue
  → Optimistic response shown to user immediately
  → Dexie pendingSync table written with event

RECONNECTION:
Browser online event fires
  → useOfflineSync hook triggers
  → Reads Dexie pendingSync table
  → Flushes events to API in order
  → Server processes and confirms
  → pendingSync table cleared
  → TanStack Query invalidates cached data
  → UI silently updates with server truth
```

---

## Multi-State Flow

```
driveready-ok.com loads
  → Vite reads VITE_STATE_CODE=ok
  → stateConfig = STATE_CONFIGS['ok']
  → All API calls include header: X-State-Code: ok
  → Apollo Client middleware attaches header

FastAPI receives request
  → Middleware reads X-State-Code header
  → context.state_code = 'ok'
  → All service calls pass state_code
  → All queries WHERE state_code = 'ok'
  → Only Oklahoma questions returned

Adding Texas:
  1. Deploy driveready-tx.com on Vercel
     → Set VITE_STATE_CODE=tx
     → Same build, different env var

  2. Seed Texas questions
     → python scripts/seed_questions.py --state tx

  3. Done — no backend code changes
```

---

## Complete Technology Reference

### Frontend

| Category | Tool | Version |
|---|---|---|
| Framework | React | 18 |
| Language | TypeScript | 5.x |
| Build | Vite | 5.x |
| Package mgr | pnpm | 8.x |
| Routing | TanStack Router | 1.x |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui | latest |
| Animation | Framer Motion | 11.x |
| Class utils | clsx + tailwind-merge | latest |
| Global state | Zustand | 4.x |
| Server state | TanStack Query | 5.x |
| Forms | React Hook Form | 7.x |
| GraphQL client | Apollo Client | 3.x |
| Type generation | GraphQL Code Generator | latest |
| WS transport | graphql-ws | latest |
| PWA | Workbox + vite-plugin-pwa | latest |
| Offline DB | Dexie.js | 4.x |
| Icons | Lucide React | latest |
| Testing | Vitest + RTL + Playwright | latest |
| Hosting | Vercel | — |

### Backend

| Category | Tool | Version |
|---|---|---|
| Language | Python | 3.12 |
| Framework | FastAPI | 0.111+ |
| GraphQL | Strawberry | 0.235+ |
| ORM | SQLAlchemy | 2.0 |
| Migrations | Alembic | 1.13+ |
| Validation | Pydantic | 2.x |
| AI client | Anthropic SDK | latest |
| AI structure | Instructor | latest |
| AI workflow | LangChain | latest |
| Job queue | Celery | 5.x |
| Job scheduler | Celery Beat | 5.x |
| Database | PostgreSQL 16 (Supabase) | — |
| Cache | Redis (Upstash) | — |
| Auth | Supabase Auth + JWT | — |
| Storage | Supabase Storage | — |
| Realtime | Supabase Realtime | — |
| Container | Docker + Compose | latest |
| ASGI server | Uvicorn | latest |
| HTTP client | httpx | latest |
| Testing | pytest + pytest-asyncio | latest |
| Hosting | Railway | — |

### Infrastructure

| Category | Tool |
|---|---|
| CDN / Security | Cloudflare |
| Frontend hosting | Vercel |
| Backend hosting | Railway |
| Database | Supabase (PostgreSQL) |
| Cache | Upstash (Redis) |
| AI | Anthropic Claude API |
| Error tracking | Sentry (frontend + backend) |
| Analytics | PostHog |
| Uptime monitoring | Uptime Robot |
| Logging | Logfire (backend) |
| CI/CD | GitHub Actions |
| Container registry | Docker Hub |

---

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - run: pytest tests/ --cov=app

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm tsc --noEmit
      - run: pnpm test

  deploy-backend:
    needs: test-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t driveready-api .
          docker push registry/driveready-api:${{ github.sha }}
      - name: Deploy to Railway
        run: railway up

  deploy-frontend:
    needs: test-frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        run: vercel --prod
```

---

## Environment Variables — Complete List

### Frontend (.env)
```bash
VITE_API_URL=https://api.driveready-ok.com
VITE_WS_URL=wss://api.driveready-ok.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_STATE_CODE=ok
VITE_SENTRY_DSN=xxx
VITE_POSTHOG_KEY=xxx
VITE_VAPID_PUBLIC_KEY=xxx
```

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host/driveready
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Cache
REDIS_URL=redis://xxx.upstash.io:6379

# Auth
JWT_SECRET=xxx
JWT_ALGORITHM=HS256

# AI
ANTHROPIC_API_KEY=xxx

# Push Notifications
VAPID_PRIVATE_KEY=xxx
VAPID_EMAIL=admin@driveready-ok.com
FCM_SERVER_KEY=xxx

# App
STATE_CODE=ok
ENVIRONMENT=production
SENTRY_DSN=xxx
```

---

## Monorepo Structure (Full Project)

```
driveready/
├── frontend/                   # React PWA
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                    # FastAPI + Strawberry
│   ├── app/
│   ├── migrations/
│   ├── tests/
│   ├── scripts/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pyproject.toml
│
├── mobile/                     # React Native + Expo (Phase 7)
│   ├── app/
│   ├── package.json
│   └── app.json
│
├── shared/                     # Shared types between frontend + backend
│   └── types/
│       └── state-config.ts
│
├── docs/                       # This documentation
│   ├── 01-DESIGN.md
│   ├── 02-LOGIC.md
│   ├── 03-FRONTEND.md
│   ├── 04-BACKEND.md
│   ├── 05-FULLSTACK.md
│   └── README.md
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── docker-compose.yml          # Local full-stack development
└── README.md
```

---

## Phase Roadmap — Full Project

| Phase | Duration | Milestone |
|---|---|---|
| 0 | Weeks 1–2 | Foundation: Docker running, DB schema live, GraphQL + React wired |
| 1 | Weeks 3–4 | Learn section live, Auth working, Pop quiz functional |
| 2 | Weeks 4–6 | Study section: all 3 flashcard modes, custom decks |
| 3 | Weeks 6–9 | Assessment: all 4 modes (Quiz, Puzzle, Flipper, Trivia) |
| 4 | Weeks 9–11 | AI features: hints, Flipper eval, readiness score |
| 5 | Weeks 11–13 | Challenge: Bot Battle + Peer Battle (real-time) |
| 6 | Weeks 13–15 | Engagement: streaks, XP, achievements, parent dashboard |
| 7 | Weeks 15–18 | Mobile: React Native + Expo + App Store submission |
| 8 | Week 18+ | Multi-state: Texas or second state launch |
