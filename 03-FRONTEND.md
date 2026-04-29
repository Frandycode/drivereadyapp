# DriveReady — Frontend Tech Stack & Build Plan

## Philosophy
- TypeScript from day one — catches bugs before they happen, mandatory for GraphQL type safety
- Mobile-first, PWA-first — native app comes later but shares all business logic
- Component-driven — every UI element is a composable, testable piece
- State discipline — server state and UI state are never mixed

---

## Core Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 18 | UI rendering |
| Language | TypeScript | 5.x | Type safety |
| Build tool | Vite | 5.x | Fast dev server + builds |
| Package manager | pnpm | 8.x | Faster, disk-efficient npm alternative |
| Routing | TanStack Router | 1.x | Type-safe routing with file-based routes |

### Why TanStack Router over React Router?
- Routes are fully type-safe — no string-based path errors
- Built-in loader pattern (fetch data before render)
- Search params are typed (quiz settings in URL stay valid)
- Easier to migrate to React Native later

---

## Styling

| Tool | Purpose |
|---|---|
| Tailwind CSS v4 | Utility classes, design token system |
| shadcn/ui | Copy-paste component primitives (owned, not a dependency) |
| Framer Motion | Animations — card flips, transitions, feedback |
| clsx + tailwind-merge | Conditional class merging without conflicts |

### Tailwind Config — Design Tokens
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: '#0A0F0D',
        surface: { DEFAULT: '#111A14', 2: '#1A2B1F', 3: '#243D29' },
        border: { DEFAULT: '#243D29', subtle: '#1A2B1F' },
        green: { 400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D' },
        gold: { 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706' },
        correct: '#22C55E',
        wrong: '#EF4444',
        hint: '#818CF8',
        info: '#38BDF8',
        growth: '#F97316',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px',
      },
    },
  },
}
```

### shadcn/ui Components Used
Only install components actually needed:
- `Button`, `Card`, `Badge`, `Progress`
- `Dialog` (modals), `Sheet` (mobile drawers)
- `Tabs`, `Select`, `Switch`, `Slider`
- `Toast` (notifications), `Tooltip`
- `Avatar`, `Skeleton` (loading states)

---

## State Management

| Tool | Manages | Why |
|---|---|---|
| Zustand | UI/app state | Minimal boilerplate, no context hell |
| TanStack Query | Server/async state | Caching, background refetch, optimistic updates |
| React Hook Form | Form state | Performant, validation built-in |

### Zustand Stores (separate per domain)

```typescript
// stores/useUserStore.ts — authenticated user data
interface UserStore {
  user: User | null
  role: 'learner' | 'parent' | 'admin' | null
  stateCode: string
  theme: 'dark' | 'light' | 'system'
  setUser: (user: User) => void
  setTheme: (theme: string) => void
}

// stores/useSessionStore.ts — active quiz/study session
interface SessionStore {
  mode: AssessmentMode | null
  questions: Question[]
  currentIndex: number
  answers: Record<string, AnswerResult>
  hintsRemaining: number
  skipsRemaining: number
  timeStarted: Date | null
  startSession: (config: SessionConfig) => void
  submitAnswer: (questionId: string, answer: AnswerInput) => void
  useHint: () => void
  skipQuestion: () => void
  endSession: () => SessionResult
}

// stores/useStreakStore.ts — streak and XP
interface StreakStore {
  currentStreak: number
  longestStreak: number
  totalXP: number
  level: number
  freezesAvailable: number
  addXP: (amount: number) => void
  useFreeze: () => void
}
```

### TanStack Query Key Convention
```typescript
// Consistent query keys prevent cache conflicts
const queryKeys = {
  questions: (stateCode: string, chapter?: number) =>
    ['questions', stateCode, chapter] as const,
  userProgress: (userId: string) =>
    ['progress', userId] as const,
  readinessScore: (userId: string) =>
    ['readiness', userId] as const,
  leaderboard: (stateCode: string, period: string) =>
    ['leaderboard', stateCode, period] as const,
}
```

---

## GraphQL Client

| Tool | Purpose |
|---|---|
| Apollo Client 3 | GraphQL queries, mutations, subscriptions |
| GraphQL Code Generator | Auto-generates TypeScript types from schema |
| graphql-ws | WebSocket transport for subscriptions (real-time) |

### Apollo Client Setup
```typescript
// lib/apollo.ts
import { ApolloClient, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

const httpLink = new HttpLink({ uri: '/graphql' })

const wsLink = new GraphQLWsLink(createClient({
  url: 'wss://api.driveready-ok.com/graphql',
}))

// Route queries to HTTP, subscriptions to WebSocket
const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query)
    return def.kind === 'OperationDefinition' && def.operation === 'subscription'
  },
  wsLink,
  httpLink,
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
```

### Code Generator Config
```yaml
# codegen.yml — run: pnpm codegen
schema: "https://api.driveready-ok.com/graphql"
documents: "src/**/*.graphql"
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

Every `.graphql` file in the project automatically gets TypeScript types. No manual interface writing.

---

## PWA & Offline Support

| Tool | Purpose |
|---|---|
| Workbox | Service worker management, caching strategies |
| Dexie.js | IndexedDB wrapper for offline data storage |
| vite-plugin-pwa | PWA manifest + service worker integration |

### Caching Strategy by Resource Type
```
Question bank JSON:      Cache First (update in background)
Lesson content:          Cache First
Sign images:             Cache First (after first load)
User progress:           Network First (fallback to cache)
AI hints:                Network Only (no offline)
Real-time (WebSocket):   Network Only (no offline)
```

### Offline Data Schema (IndexedDB via Dexie)
```typescript
// lib/db.ts
class DriveReadyDB extends Dexie {
  questions!: Table<Question>
  chapters!: Table<Chapter>
  userProgress!: Table<ProgressEntry>
  savedDecks!: Table<FlashcardDeck>
  pendingSync!: Table<SyncEvent>  // queued when offline
}

const db = new DriveReadyDB()
db.version(1).stores({
  questions: 'id, chapter, difficulty, state_code',
  chapters: 'id, state_code',
  userProgress: 'id, chapter, updatedAt',
  savedDecks: 'id, name, createdAt',
  pendingSync: '++id, type, createdAt',
})
```

### Sync Logic
```typescript
// When back online: flush pendingSync table
async function syncPendingEvents() {
  const events = await db.pendingSync.toArray()
  for (const event of events) {
    await apolloClient.mutate({ mutation: SYNC_EVENT, variables: event })
    await db.pendingSync.delete(event.id)
  }
}

// Register sync on reconnect
window.addEventListener('online', syncPendingEvents)
```

---

## Animation Architecture

All animations use **Framer Motion**. Global animation variants ensure consistency.

```typescript
// lib/animations.ts
export const cardFlip = {
  front: { rotateY: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
  back:  { rotateY: 180, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
}

export const correctPulse = {
  animate: {
    scale: [1, 1.04, 1],
    transition: { duration: 0.3 }
  }
}

export const wrongShake = {
  animate: {
    x: [0, -8, 8, -4, 4, 0],
    transition: { duration: 0.4 }
  }
}

export const timerPulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 1 }
  }
}

export const pageTransition = {
  initial:  { opacity: 0, x: 20 },
  animate:  { opacity: 1, x: 0 },
  exit:     { opacity: 0, x: -20 },
  transition: { duration: 0.3 }
}

// Respect reduced motion
export const useReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

---

## Folder Structure

```
src/
├── app/                        # Route files (TanStack Router file-based routing)
│   ├── __root.tsx              # Root layout (nav, theme, auth gate)
│   ├── index.tsx               # Home / Dashboard
│   ├── learn/
│   │   ├── index.tsx           # Chapter list
│   │   └── $chapterId.tsx      # Chapter detail + lessons + pop quiz
│   ├── study/
│   │   ├── index.tsx           # Mode selector + deck picker
│   │   └── session.tsx         # Active flashcard session
│   ├── assessment/
│   │   ├── index.tsx           # Mode picker + settings
│   │   └── session.tsx         # Active quiz session (all modes)
│   ├── challenge/
│   │   ├── index.tsx           # Bot/Peer selector
│   │   ├── bot.tsx             # Robot Battle setup + battle
│   │   └── peer.tsx            # Peer Battle lobby + battle
│   ├── profile/
│   │   ├── index.tsx           # Profile overview
│   │   ├── achievements.tsx    # Badge grid
│   │   └── decks.tsx           # Saved flashcard decks
│   ├── parent/
│   │   └── index.tsx           # Parent dashboard (role-gated)
│   ├── settings.tsx            # Settings page
│   └── status.tsx              # System status page
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (owned, not dependency)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── BottomNav.tsx       # Mobile navigation
│   │   ├── SideNav.tsx         # Desktop navigation
│   │   └── PageWrapper.tsx     # Consistent page padding + transitions
│   ├── learn/
│   │   ├── ChapterCard.tsx     # Chapter list item with progress
│   │   ├── LessonCard.tsx      # Swipeable lesson content card
│   │   └── PopQuiz.tsx         # End-of-chapter quiz wrapper
│   ├── study/
│   │   ├── Flashcard.tsx       # The 3D flip card
│   │   ├── DrillControls.tsx   # Got it / Still learning buttons
│   │   └── BlitzTimer.tsx      # Timer Blitz countdown
│   ├── assessment/
│   │   ├── QuizOption.tsx      # Single answer option (radio or checkbox)
│   │   ├── QuizQuestion.tsx    # Question container + options list
│   │   ├── PuzzleDrop.tsx      # Drag-and-drop answer zone
│   │   ├── FlipperCard.tsx     # Flipper mode card
│   │   ├── TriviaCard.tsx      # Jeopardy-style question picker
│   │   ├── SessionHeader.tsx   # Timer + counter + hint + skip bar
│   │   ├── HintPanel.tsx       # Expandable hint display
│   │   └── ResultsScreen.tsx   # Post-session results + breakdown
│   ├── challenge/
│   │   ├── BotSelector.tsx     # Rusty / Dash / Apex picker
│   │   ├── BotAvatar.tsx       # Animated bot display
│   │   ├── BattleView.tsx      # Split-screen battle layout
│   │   └── PeerLobby.tsx       # Waiting room for peer battles
│   ├── dashboard/
│   │   ├── ReadinessMeter.tsx  # Circular progress ring
│   │   ├── StreakChip.tsx      # Flame + streak count
│   │   ├── DailyChallenge.tsx  # Daily challenge card
│   │   └── GrowthAreas.tsx     # Weak chapter callouts
│   └── shared/
│       ├── SignImage.tsx        # Traffic sign image with fallback
│       ├── Timer.tsx           # Reusable countdown timer
│       ├── XPToast.tsx         # Flying XP animation
│       ├── LevelUpModal.tsx    # Full-screen level up celebration
│       └── EmptyState.tsx      # Consistent empty states
│
├── hooks/
│   ├── useSession.ts           # Active assessment session logic
│   ├── useFlashcards.ts        # Flashcard deck management
│   ├── useTimer.ts             # Countdown timer logic
│   ├── useStreak.ts            # Streak tracking
│   ├── useOfflineSync.ts       # Offline queue management
│   ├── useReadiness.ts         # Readiness score fetching
│   └── useStateConfig.ts       # Current state (OK, TX, etc.) config
│
├── stores/
│   ├── useUserStore.ts
│   ├── useSessionStore.ts
│   └── useStreakStore.ts
│
├── graphql/
│   ├── queries/
│   │   ├── questions.graphql
│   │   ├── progress.graphql
│   │   └── leaderboard.graphql
│   ├── mutations/
│   │   ├── submitAnswer.graphql
│   │   ├── saveBookmark.graphql
│   │   └── saveDeck.graphql
│   └── subscriptions/
│       ├── battleUpdates.graphql
│       └── peerChallenge.graphql
│
├── generated/
│   └── graphql.ts              # Auto-generated (never edit manually)
│
├── lib/
│   ├── apollo.ts               # Apollo Client configuration
│   ├── db.ts                   # Dexie IndexedDB setup
│   ├── animations.ts           # Framer Motion variants
│   ├── stateConfig.ts          # Multi-state configuration
│   └── utils.ts                # Shared utilities
│
├── types/
│   └── index.ts                # Shared TypeScript types (non-generated)
│
└── main.tsx                    # Entry point
```

---

## Key GraphQL Queries

```graphql
# Get questions for a session
query GetSessionQuestions(
  $stateCode: String!
  $chapters: [Int!]
  $difficulty: Difficulty
  $count: Int!
  $excludeIds: [ID!]
) {
  questions(
    stateCode: $stateCode
    chapters: $chapters
    difficulty: $difficulty
    count: $count
    excludeIds: $excludeIds
  ) {
    id chapter difficulty question_text image_url hint_text
    answers { id text is_correct }
    correct_count explanation
  }
}

# Submit a session result
mutation SubmitSession($input: SessionResultInput!) {
  submitSession(input: $input) {
    id score xpEarned badgesUnlocked { id name }
  }
}

# Real-time peer battle subscription
subscription BattleUpdates($battleId: ID!) {
  battleUpdates(battleId: $battleId) {
    event         # "answer_submitted" | "question_advance" | "battle_end"
    playerId
    questionId
    isCorrect
    playerScores { playerId score }
  }
}
```

---

## Testing Strategy

| Type | Tool | Coverage Target |
|---|---|---|
| Unit tests | Vitest | Hooks, utilities, store logic |
| Component tests | React Testing Library | All shared components |
| E2E tests | Playwright | Critical user paths |
| Visual regression | Chromatic (Storybook) | Design system components |

### Critical E2E Paths
1. Sign up → complete first lesson → pop quiz → see readiness score
2. Start Quiz session → answer all → see results → XP awarded
3. Start Bot Battle → complete → see win/loss screen
4. Flashcard Drill Mode → full deck → results
5. Offline → answer questions → reconnect → verify sync

---

## Build & Deployment

### Local Development
```bash
pnpm install
pnpm dev              # Vite dev server on :5173
pnpm codegen          # Regenerate GraphQL types
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright E2E tests
pnpm build            # Production build
pnpm preview          # Preview production build locally
```

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### Environment Variables
```bash
VITE_API_URL=https://api.driveready-ok.com
VITE_WS_URL=wss://api.driveready-ok.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_STATE_CODE=ok
VITE_SENTRY_DSN=xxx
VITE_POSTHOG_KEY=xxx
```

---

## Phase-by-Phase Frontend Build Plan

### Phase 0 — Foundation (Week 1–2)
- [ ] Vite + TypeScript + TanStack Router scaffolding
- [ ] Tailwind + design tokens configured
- [ ] shadcn/ui components installed and themed
- [ ] Apollo Client connected to backend
- [ ] GraphQL Code Generator running
- [ ] Zustand stores wired up
- [ ] Auth flow (login, register, guest mode)
- [ ] Bottom nav + page layout shell
- [ ] Dark/light theme toggle working
- [ ] PWA manifest + service worker baseline

### Phase 1 — Learn Section (Week 3–4)
- [ ] Chapter list screen with progress bars
- [ ] Lesson card swipe/tap flow
- [ ] Bookmark functionality
- [ ] Pop quiz integration (uses Quiz component)
- [ ] Chapter completion tracking

### Phase 2 — Study Section (Week 4–5)
- [ ] Flashcard 3D flip component
- [ ] Free Study mode
- [ ] Drill Mode (got it / still learning)
- [ ] Timer Blitz mode
- [ ] Deck picker (Smart, Custom, Saved)
- [ ] Custom deck builder UI

### Phase 3 — Assessment Core (Week 6–8)
- [ ] Session settings panel (shared)
- [ ] Session header (timer + counter + hint + skip)
- [ ] Quiz mode (radio + checkbox answer options)
- [ ] Results screen with breakdown
- [ ] XP award animation
- [ ] Hint panel

### Phase 4 — All Assessment Modes (Week 8–10)
- [ ] Puzzle mode (drag and drop / tap-to-place on mobile)
- [ ] Flipper mode (card + drag answer onto card)
- [ ] Trivia mode (Jeopardy style)

### Phase 5 — Challenge Section (Week 10–12)
- [ ] Bot selector screen (Rusty / Dash / Apex)
- [ ] Bot avatar + thinking animation
- [ ] Battle split-view layout
- [ ] Bot answer simulation logic (client-side)
- [ ] Peer lobby (share code + waiting room)
- [ ] Real-time battle via GraphQL subscription

### Phase 6 — Engagement Layer (Week 12–14)
- [ ] Dashboard readiness meter
- [ ] Streak chip + streak freeze
- [ ] Daily challenge card
- [ ] Achievements / badge grid
- [ ] Level-up full-screen celebration
- [ ] XP flying animation
- [ ] Night Before Mode flow
- [ ] Parent dashboard view
- [ ] Settings page (all preferences)
- [ ] Status page

### Phase 7 — Polish & Mobile (Week 14–16)
- [ ] Offline mode full testing
- [ ] Push notification setup (Web Push API)
- [ ] E2E test suite
- [ ] Performance audit (Lighthouse > 90)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] React Native / Expo migration begins

---

## Author

**Frandy Slueue** — Software Engineering · DevOps Security · IT Ops
📍 Tulsa, OK & Dallas, TX (Central Time)
🌐 [frandycode.dev](https://frandycode.dev) · 💼 [github.com/frandycode](https://github.com/frandycode) · ✉️ frandyslueue@gmail.com

*Project: DriveReady — AI-Powered Multi-State Driver Education Platform*
