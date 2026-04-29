# DriveReady — Architecture & Build Decisions

> Last updated: April 28, 2026
> Status: Phase 5b in progress

---

## Platform Targets

DriveReady will ship on three platforms, built in this order:

| Order | Platform | Stack | Status |
|-------|----------|-------|--------|
| 1 | Web App | React + Vite | 🔄 In progress |
| 2 | Mobile App | React Native + Expo | ⏳ Pending |
| 3 | Desktop App | Tauri | ⏳ Pending |

---

## Monorepo Structure (Post Phase 5b)

```
driveready/
  ├── apps/
  │     ├── web/          ← React + Vite (current frontend)
  │     ├── mobile/       ← React Native + Expo
  │     └── desktop/      ← Tauri (wraps web app)
  ├── packages/
  │     ├── shared/       ← TypeScript types, constants, game logic
  │     ├── api-client/   ← Apollo Client + GraphQL queries/mutations/subscriptions
  │     ├── hooks/        ← useGame, useBattle, useAuth (platform-agnostic)
  │     └── ui/           ← Design tokens only (colors, spacing, fonts)
  └── backend/            ← FastAPI (unchanged)
```

### What is shared across all platforms
- All GraphQL queries, mutations, and subscriptions
- All business logic (game state, scoring, reputation rules)
- All custom hooks
- TypeScript types
- Constants and config
- Design tokens

### What is platform-specific
- **Web** → HTML/CSS components (Tailwind)
- **Mobile** → React Native components (StyleSheet)
- **Desktop** → Web components reused inside Tauri shell

---

## Tech Stack Decisions

### Desktop — Tauri (not Electron)

| | Electron | Tauri |
|--|----------|-------|
| App size | ~150MB | ~10MB |
| RAM usage | High | Near-native |
| Backend | Node.js | Rust (optional) |
| Engine | Bundles Chrome | Uses OS webview |

**Reason:** DriveReady targets teens on school devices with limited storage. Tauri's lean footprint wins.

### Mobile — Expo (not bare React Native)

- Handles iOS + Android from one codebase
- CallKit (iOS) + PhoneStateListener (Android) both accessible via expo-modules
- Expo Go for instant testing on real devices
- EAS Build for production iOS/Android builds
- Over-the-air updates without app store resubmission

---

## Frontend Rules (apply from day one)

1. **Keep business logic out of components** — all logic lives in `packages/hooks/`. These hooks will be reused on mobile verbatim.
2. **No hardcoded pixel values** — use design tokens so mobile can consume the same values with different units.

---

## Backend — Current Stack

```
FastAPI + PostgreSQL + Redis + Celery
Docker Compose (7 services)
Strawberry GraphQL
SQLAlchemy 2.0 async + Alembic
```

---

## Peer Battle System — Design Decisions

### Phase 5b Scope
- GraphQL Subscriptions (Strawberry) — live game state pushed to frontend
- Redis pub/sub — message bus between players
- Forfeit / Draw / Disconnect handling

---

### Draw Request Rules
- Max **2 draw requests** per player per battle
- After 2 requests used, player's only option is forfeit (counts as a loss)
- Opponent has **30 seconds** to respond to a draw request
- If opponent doesn't respond in 30s → auto-declined
- Game timer keeps running for both players during a draw request

```
Player requests draw (requests remaining > 0)
  └─> Opponent has 30s to respond (timers keep running)
        ├─> Accepted  → battle_end: tie
        └─> Declined  → quitting player gets 15s forfeit warning
                          ├─> Quit          → battle_end: quitter loses
                          └─> Return / 15s  → game resumes

Player hits draw with 0 requests remaining
  └─> Only option shown is forfeit (loss)
```

---

### Screen Leave Rules
- Max **2 screen leaves** per player per battle
- **First leave** → 45s grace period
- **Subsequent leaves** → 30s grace period
- Returns within **5 seconds** → no strike (accidental tap forgiveness)
- **3rd leave** → immediate auto-defeat, no grace period
- Game timer keeps running while player is off screen

```
Leave #1 → 45s grace
  └─> Back within 5s  → no strike (forgiven)
  └─> Back after 5s   → strike +1

Leave #2 → 30s grace → strike +1

Leave #3 → immediate auto-defeat
```

---

### Disconnect / Heartbeat
- Heartbeat ping every 5–10 seconds via subscription
- No heartbeat for 30 seconds → auto-forfeit (leaver loses)
- All leaves logged with:
  - `timestamp_out` / `timestamp_back`
  - `duration_away_ms`
  - `leave_reason`: `"unknown"` (web) | `"phone_call"` (native, future)
  - `was_forgiven`: bool

### Phone Call Detection
- **Web app** → cannot detect (all leaves logged as `"unknown"`)
- **Mobile (Expo)** → CallKit (iOS) + PhoneStateListener (Android)
  - Sets `leave_reason: "phone_call"` automatically
  - Screen leave strike waived for phone calls
- `leave_reason` field pre-built in DB now — mobile populates it later, no retrofitting needed

---

## Reputation System

### Reputation Score
- Starts at **100**
- Visible to the player as an exact score + standing label
- Public sees: standing label + rank
- Admin sees: exact score + full behavior log

### Score Changes
| Event | Change |
|-------|--------|
| Forfeit | -5 |
| Screen leave strike | -3 |
| Draw request used | -2 |
| Auto-defeat (disconnect) | -10 |
| Clean game completed | +2 |
| 24hrs of clean play | +1 |

### Standing Labels (shown to player)
| Score | Label |
|-------|-------|
| 85–100 | Excellent Standing |
| 70–84 | Good Standing |
| 50–69 | Fair Standing ⚠️ |
| 30–49 | Poor Standing ⚠️⚠️ |
| 0–29 | At Risk 🚨 |

### Recovery
- Play-gated recovery — earned by playing clean, not just waiting
- +1 per 24hrs of clean play (no strikes, no forfeits)
- +2 per clean game completed

---

## Game Rank System

| Rank | Wins Required | Reputation Required |
|------|--------------|---------------------|
| Diamond | 50+ | ≥ 80 |
| Platinum | 30+ | ≥ 65 |
| Gold | 15+ | ≥ 50 |
| Silver | 5+ | ≥ 35 |
| Bronze | — | — |

### Reputation Reset (Grace System)
- First time a player reaches **Gold** → reputation resets (Gold reputation track begins)
- First time a player reaches **Diamond** → reputation resets (Diamond reputation track begins)
- Only applies **the first time** each level is reached — re-promotion does not grant another reset

### 4-Track Reputation Display (visible to player)
```
Original reputation  → where they started, never changes
Gold reputation      → fresh start at Gold (first time only)
Diamond reputation   → fresh start at Diamond (first time only)
All-time reputation  → unforgiving truth, never resets
```

### Demotion
- Players can be demoted on 2nd ban and beyond
- Demoted rank's reputation reset is marked as ⚠️ Forfeited (not erased)
- Re-reaching a previously held rank does NOT grant another reset
- Bronze players cannot be demoted further — extended ban duration instead

---

## Ban System

### Ban Progression
| Offense | Duration | Demotion | Admin Flag |
|---------|----------|----------|------------|
| 1st ban | 30 mins | ❌ | ❌ |
| 2nd ban | 1 hour | ✅ -1 rank | ❌ |
| 3rd ban | 3 hours | ✅ -1 rank | ❌ |
| 4th ban+ | 6 hours | ✅ -1 rank | ✅ |

### Ban Rules
- Bronze players on ban → no demotion, extended ban duration (+30mins per offense)
- Bans are both **automatic** (reputation hits 0) and **admin-manual**
- Players can file **one dispute per month** for admin review

### Auto-ban Trigger
- Reputation score hits **0** → automatic ban review triggered

---

## Data Visibility

| Data | Player (own) | Public | Admin |
|------|-------------|--------|-------|
| Game rank | ✅ | ✅ | ✅ |
| Reputation score (exact) | ✅ | ❌ | ✅ |
| Reputation label | ✅ | ✅ | ✅ |
| Wins / losses / ties | ✅ | ✅ | ✅ |
| Behavior chart (summary) | ✅ | ✅ | ✅ |
| Full behavior log | ❌ | ❌ | ✅ |
| Play frequency | ❌ | ❌ | ✅ |
| Session durations | ❌ | ❌ | ✅ |
| Ban history | ✅ (own) | ❌ | ✅ |
| All-time reputation | ✅ (own) | ❌ | ✅ |

---

## New DB Tables Needed (Phase 5b+)

### `player_behavior_log`
```
id, user_id, battle_id, event_type, detail (JSON),
leave_reason, was_forgiven, created_at
```

### `player_stats`
```
user_id (FK, unique)
games_played, games_won, games_lost, games_tied, games_forfeited
draw_requests_sent, draw_requests_accepted
screen_leave_count, disconnect_count
reputation_score
reputation_original, reputation_gold, reputation_diamond, reputation_all_time
game_rank
ban_count, ban_until, is_banned
total_play_time_seconds     ← admin only
avg_session_duration_ms     ← admin only
last_active_at
```

---

## Build Order (Remaining)

```
Phase 5b  → Peer Battle backend complete (in progress)
           → forfeit / draw / disconnect mutations + subscription events
           → player_behavior_log + player_stats migrations

Phase 5c  → Apollo WebSocket link (frontend)
           → PeerBattle UI component

Phase 6   → Monorepo restructure
           → Move web into apps/web
           → Create packages/ (shared, api-client, hooks, ui)

Phase 7   → React Native mobile app (Expo)

Phase 8   → Desktop app (Tauri)
```

---

## Author

**Frandy Slueue** — Software Engineering · DevOps Security · IT Ops
📍 Tulsa, OK & Dallas, TX (Central Time)
🌐 [frandycode.dev](https://frandycode.dev) · 💼 [github.com/frandycode](https://github.com/frandycode) · ✉️ frandyslueue@gmail.com

*Project: DriveReady — AI-Powered Multi-State Driver Education Platform*
