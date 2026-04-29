# DriveReady

> **"Learn it. Know it. Drive it."**

A multi-state, AI-powered driver's permit study platform. Currently built for Oklahoma
(`driveready-ok.com`), designed from the ground up to scale to all 50 states with
minimal effort.

---

## What Is DriveReady?

DriveReady helps new drivers study for their written permit test through five
interconnected learning modes, a gamified progression system, and AI assistance
throughout. It's built for the 15–17 year-old demographic but usable by anyone
preparing for a permit or license knowledge test.

---

## Documentation

| File | Description |
|---|---|
| [`01-DESIGN.md`](./docs/01-DESIGN.md) | Brand identity, color system, typography, animations, component design, screen-by-screen layout |
| [`02-LOGIC.md`](./docs/02-LOGIC.md) | Full feature logic — how every section works, scoring rules, AI features, offline sync, multi-state system |
| [`03-FRONTEND.md`](./docs/03-FRONTEND.md) | React tech stack, folder structure, state management, GraphQL client, PWA setup, phase build plan |
| [`04-BACKEND.md`](./docs/04-BACKEND.md) | Python/FastAPI tech stack, database schema, GraphQL API, AI integration, Celery jobs, Docker setup |
| [`05-FULLSTACK.md`](./docs/05-FULLSTACK.md) | How frontend and backend connect, full architecture diagram, CI/CD, monorepo structure, complete tech reference |

---

## Core Concept: One Question Bank, Many Modes

All assessment types pull from the **same question database**. A question is written once
and automatically works in every mode. Each mode just presents it differently:

| Mode | How It Works |
|---|---|
| **Quiz** | Multiple choice — radio (1 answer) or checkbox (multiple answers) |
| **Puzzle** | Drag and drop answers into a target zone |
| **Flipper** | Drag answer onto a card face, flip to reveal if correct |
| **Trivia** | Answer is given — pick the correct question (Jeopardy style) |
| **Bot Battle** | Compete vs AI bot (Rusty 30% / Dash 60% / Apex 95%) |
| **Peer Battle** | Real-time vs a friend via shareable link |

Bot Battle and Peer Battle randomly sample across all question types for variety.

---

## App Sections

```
🏠 Home        Dashboard — streak, readiness score, daily challenge, growth areas
📖 Learn       Chapter lessons → bookmark → end-of-chapter pop quiz
🃏 Study        Free Study / Drill Mode / Timer Blitz — smart or custom decks
⚡ Challenge    Assessment modes (Quiz/Puzzle/Flipper/Trivia) + Battle modes
👤 Profile     XP, level, achievements, saved decks, history
⚙️ Settings    Theme, notifications, study defaults, accessibility, privacy
📡 Status      System health, version, known issues, roadmap
👨‍👧 Parent      Separate view for linked parent accounts
```

---

## Key Features

### Learning
- Chapter-by-chapter lessons with bite-sized cards
- Bookmark any fact for later study
- End-of-chapter pop quiz (10 questions, optional timer)
- Growth Areas auto-identified from quiz performance

### Study
- **Free Study** — flip at your own pace, no pressure
- **Drill Mode** — sort into Got It / Still Learning (spaced repetition)
- **Timer Blitz** — flip as many cards as possible in 30–120 seconds
- Custom deck builder with AI balance suggestion
- Save and name your own decks

### Assessment
- **Difficulty levels:** Pawn (unlimited hints/skips) / Rogue (limited) / King (none)
- **Timer:** Off / 15s / 30s / 45s / 60s per question
- **Question count:** 5 / 10 / 15 / 20 / 25 / 30
- Skip and hint allowances scale with question count on Rogue difficulty

### Challenge
- **Robot Battle** — three bot personalities with distinct accuracy levels
- **Peer Battle** — real-time head-to-head via shareable code
- No hints or skips in any battle mode (competitive integrity)

### Progression
- XP earned for every activity
- 7 levels from "Learner" to "License Bound"
- Achievement badges with unlock conditions
- Daily streak with freeze token protection
- Readiness score (0–100%) that decays if inactive

### Special Modes
- **Night Before Mode** — AI-curated 20-question rapid-fire review targeting weak spots
- **Daily Challenge** — one featured question per day at 2× XP
- **Offline Mode** — full question bank available without connection

### Parent Dashboard
- Link via 6-digit code (learner approval required)
- See study activity, progress, scores, readiness score
- Weekly report emails
- Does not access learner's specific answers or private notes

---

## Tech Stack Summary

### Frontend
- **React 18** + TypeScript + Vite
- **TanStack Router** (file-based, type-safe routes)
- **Tailwind CSS v4** + shadcn/ui + Framer Motion
- **Apollo Client** (GraphQL) + **Zustand** (state) + **TanStack Query** (server state)
- **Dexie.js** (IndexedDB offline) + **Workbox** (PWA service worker)
- Hosted on **Vercel**

### Backend
- **Python 3.12** + **FastAPI** + **Strawberry** (GraphQL)
- **SQLAlchemy 2.0** (async ORM) + **Alembic** (migrations)
- **Celery** + **Redis** (background jobs + cache)
- **Anthropic Claude** + **Instructor** (structured AI outputs)
- **Docker** + **Docker Compose** (containerized everywhere)
- Hosted on **Railway**

### Data
- **PostgreSQL 16** via **Supabase** (with Row Level Security)
- **Redis** via **Upstash** (serverless, free tier)
- **Supabase Storage** (sign images, user avatars)
- **Supabase Realtime** (peer battle, live leaderboards)

### Infrastructure
- **Cloudflare** — CDN, DDoS protection, edge caching
- **GitHub Actions** — CI/CD (test → build → deploy on every push)
- **Sentry** — error tracking (frontend + backend)
- **PostHog** — product analytics
- **Uptime Robot** — uptime monitoring

---

## Multi-State Architecture

DriveReady is built as a **platform**, not a single app. Adding a new state requires:

1. Seed the question bank with state-specific content
2. Deploy `driveready-[state].com` on Vercel with `VITE_STATE_CODE=[state]`
3. No backend code changes required

Each state gets its own color accent (Oklahoma: green + gold, Texas: red + silver, etc.)
while sharing the same dark base theme, codebase, and infrastructure.

---

## Bot Personalities

| Bot | Accuracy | Personality | Color |
|---|---|---|---|
| **Rusty** | 30% | Slow, friendly, makes obvious mistakes | Gray + Orange |
| **Dash** | 60% | Fast, confident, sometimes wrong | Sky Blue + White |
| **Apex** | 95% | Cold, precise, mechanical — rarely fails | Gold + Deep Green |

---

## Brand

- **Colors:** Oklahoma Green `#22C55E` + Prairie Gold `#F59E0B` on near-black `#0A0F0D`
- **Fonts:** Syne (display) + DM Sans (body) + JetBrains Mono (timers/scores)
- **Default:** Dark mode
- **Tagline:** "Learn it. Know it. Drive it."

---

## Build Phases

| Phase | Focus |
|---|---|
| 0 | Foundation — Docker, DB schema, GraphQL skeleton, React shell |
| 1 | Learn section — chapters, lessons, pop quiz, auth |
| 2 | Study section — all flashcard modes, deck builder |
| 3 | Assessment — Quiz mode complete with full session flow |
| 4 | All Assessment modes — Puzzle, Flipper, Trivia |
| 5 | AI features — hints, readiness score, question generation |
| 6 | Challenge — Bot Battle + Peer Battle (real-time) |
| 7 | Engagement — streaks, XP, achievements, parent dashboard |
| 8 | Mobile — React Native + Expo + App Store |
| 9 | Multi-state — second state launch |

---

## Local Development

### Prerequisites
- Docker + Docker Compose
- Node.js 20+ and pnpm
- Python 3.12

### Start everything
```bash
# Clone the repo
git clone https://github.com/frandy-slueue/driveready
cd driveready

# Start backend services (API + DB + Redis + Worker)
docker compose up

# Start frontend
cd frontend
pnpm install
pnpm dev
```

### Backend available at
- GraphQL API: `http://localhost:8000/graphql`
- GraphQL Playground: `http://localhost:8000/graphql` (GET)
- Database GUI: `http://localhost:8080` (Adminer)
- Health check: `http://localhost:8000/health`

### Frontend available at
- `http://localhost:5173`

---

## License

Private. All rights reserved.
DriveReady is a commercial product. Source is not open source.

---

## Author

**Frandy Slueue** — Software Engineering · DevOps Security · IT Ops
📍 Tulsa, OK & Dallas, TX (Central Time)
🌐 [frandycode.dev](https://frandycode.dev) · 💼 [github.com/frandycode](https://github.com/frandycode) · ✉️ frandyslueue@gmail.com

*Project: DriveReady — AI-Powered Multi-State Driver Education Platform*
