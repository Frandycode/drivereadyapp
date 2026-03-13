# DriveReady — App Logic & Feature Specification

## Core Principle: One Question Bank, Many Display Modes

All assessment types (Quiz, Puzzle, Flipper, Trivia, Robot Battle, Peer Battle) pull from
the **same underlying question database**. A question is stored once. Each assessment type
renders that question using its own unique interaction pattern.

This means:
- Adding a new question automatically makes it available in all modes
- Difficulty, chapter, and category tags apply universally
- Progress and performance data is tied to the question, not the mode
- Bot Battle and Peer Battle randomly sample across all question types for variety

---

## Question Data Model

Every question in the bank has this shape:

```
Question
├── id                  unique identifier
├── state_code          "ok", "tx", etc.
├── chapter             1–12
├── category            "regulatory" | "warning" | "speed" | "right_of_way" | etc.
├── difficulty          "pawn" | "rogue" | "king"
├── question_text       the question string
├── answers[]           array of answer objects
│   ├── id
│   ├── text            answer text
│   └── is_correct      boolean
├── correct_count       number of correct answers (1 to N)
├── explanation         why the correct answer(s) are right
├── image_url           optional — sign image or diagram
├── hint_text           AI-generated or manually written hint
├── source_page         page number in the manual
├── tags[]              ["signs", "night_driving", "school_zone", etc.]
└── created_at / updated_at
```

### Answer Count Rules
- `correct_count = 1` → renders as radio buttons (single select)
- `correct_count > 1` → renders as checkboxes (multi-select), user is notified
- The UI shows: *"This question has more than one correct answer"* banner when applicable
- Clicking anywhere on the answer row selects it (not just the button)

---

## Section Logic

### 1. Home / Dashboard

**Readiness Score** — calculated async (background job, not per-request):
```
readiness_score = weighted_average(
  chapter_scores[],          weight: 0.5
  recent_quiz_accuracy[],    weight: 0.3
  days_since_last_study,     weight: -0.1  (decays if inactive)
  questions_seen_coverage,   weight: 0.1
)
```
Score is shown as a percentage. Color mapping:
- 0–49%: red (not ready)
- 50–69%: gold (getting there)
- 70–84%: green (likely ready)
- 85–100%: bright green (very ready)

Oklahoma permit test: 80% passing threshold, 50 questions on real exam.

**Daily Challenge:**
- One featured question served per day (same question for all users in state)
- Rotates at midnight local time
- Completing it awards 2× XP
- Streak is maintained by answering Daily Challenge OR completing any study session

**Growth Areas:**
- Chapters where the user's accuracy is below 65%
- Updated after every completed session
- Shown as orange-tagged cards on dashboard
- Clicking a Growth Area chapter starts a targeted study session

---

### 2. Learn Section Logic

**Chapter Structure:**
```
Chapter
├── lessons[]         ordered array of lesson cards
│   ├── title
│   ├── content       3 sentences max per card
│   ├── image_url     optional sign/diagram
│   └── fact_tags[]   links to relevant questions
├── pop_quiz[]        5 questions drawn from chapter question bank
└── completion_state  not_started | in_progress | completed
```

**Lesson Progression:**
- User swipes or taps forward through lesson cards
- Any card can be bookmarked (swipe left or tap bookmark icon)
- Bookmarked content feeds into Study section's default deck
- Chapter is marked `in_progress` on first card view
- Chapter is marked `completed` after pop quiz attempt (pass or fail)
- Chapters do not lock each other — all accessible from day one

**Pop Quiz (end of chapter):**
- Always 5 questions, always from that chapter's question bank
- Optional timer toggle (user sets before starting)
- Questions not previously seen in this chapter are prioritized
- After completion: show score, flag any missed questions as Growth Areas
- User can retry immediately (new random 5 from chapter bank)

**Bookmarks:**
- Stored per-user in database
- Taggable: user can add a personal note to a bookmark
- Appear in Study section's default "Smart Deck"

---

### 3. Study Section Logic

#### Deck Sources (priority order for Smart Deck)
1. Questions from bookmarked lesson cards
2. Questions from Growth Area chapters (accuracy < 65%)
3. Questions missed in last 3 sessions
4. Random questions from chapters with lowest completion

#### Flashcard Modes

**Free Study:**
- No timer, no scoring
- Flip card to see answer
- Progress indicator (X of Y) but no pass/fail
- Session ends when deck is exhausted or user exits
- No data written to progress tracking (casual mode)

**Drill Mode:**
- Present card front (question side)
- User thinks, then reveals answer
- User self-reports: "Got It" (swipe right / green button) or "Still Learning" (swipe left / red button)
- Cards marked "Still Learning" re-enter the deck
- Session ends when all cards are in "Got It" pile
- Score written to progress: % got on first attempt
- Updates Growth Areas accordingly

**Timer Blitz:**
- User selects duration: 30 / 60 / 90 / 120 seconds
- Countdown timer displayed prominently
- Flip card → got it / still learning → next card auto-advances after 1s
- Cards cycle randomly — no deck exhaustion
- Score: total cards completed in time limit
- Personal best tracked and shown at end

#### Custom Deck Builder
- User selects chapters (any combination)
- User selects question count (up to all available)
- AI assist button: "Balance this deck" — Claude analyzes selection and suggests adjustments for coverage
- Deck is saved with a user-chosen name
- Saved decks appear in Study section deck picker

---

### 4. Assessment Section Logic

**All assessment types share:**
- Same question pool (filtered by chapter and difficulty selection)
- Same settings panel (questions, timer, difficulty, chapter filter)
- Same hint system
- Same skip system
- Same scoring formula
- Same results screen

**Questions are never repeated within a single session.**
Answered questions are flagged in session state and excluded from the draw pool.

#### Settings Logic

**Question Count:** 5 (default) | 10 | 15 | 20 | 25 | 30

**Timer Options:** Off (default) | 15s | 30s | 45s | 60s
- Timer is per-question, not per-session
- Timer runs out = question marked wrong, auto-advances
- Timer color transitions: green → gold (< 50%) → red (< 20%) → pulses at < 10%

**Difficulty — Hint & Skip Allowances:**

| Difficulty | Hints | Skips | XP Multiplier |
|---|---|---|---|
| Pawn | Unlimited | Unlimited | 1× |
| Rogue | (question_count ÷ 5) each | (question_count ÷ 5) each | 2× |
| King | 0 | 0 | 3× |

Rogue examples:
- 5 questions → 1 hint, 1 skip
- 10 questions → 2 hints, 2 skips
- 30 questions → 6 hints, 6 skips

**Skip behavior:**
- Skipped question is removed from session pool entirely (may not return)
- Skip count decrements immediately on use
- Skipped questions are not marked wrong (they are marked "skipped" in results)
- Skipped questions are added to Growth Areas for future study

**Hint behavior:**
- Hint shows AI-generated guidance that narrows the answer without giving it away
- Pawn hints: can reveal which answers are wrong
- Rogue hints: narrows to 2 choices
- King: not available
- Hint used = answer marked "hinted" in results (still counts as correct if right)
- Hint count decrements on use

#### Quiz Mode
- Standard multiple choice
- 4–6 answer options per question
- Single correct: radio buttons
- Multiple correct: checkboxes + notification banner
- Click anywhere on answer row to select
- "Submit" button appears after selection
- After submit: reveal correct/wrong, show explanation, advance button

#### Puzzle Mode
- Same questions as Quiz
- Instead of clicking, user **drags and drops** answers into a drop zone
- Drop zone labeled: "Drop your answer(s) here"
- Answers displayed as draggable chips
- Mobile: tap to select → tap drop zone to place (no drag required on mobile)
- Submit after placing answers in zone
- Correct chips glow green, wrong chips glow red after reveal

#### Flipper Mode
- Flashcard-style assessment
- Card front: question text displayed BELOW the card
- Card is blank on front, waiting for answer
- User drags/taps answer chips ONTO the card face
- "Submit" button reveals: card flips
- Card back shows: correct answers highlighted + explanation
- If user answer matches: green checkmark
- If wrong: red X + correct answer revealed

#### Trivia Mode (Jeopardy-style)
- The **answer** is shown, user must identify the **correct question**
- Example: Answer shown: "16 years old" — user selects: "What is the minimum age to apply for an Oklahoma driver's license?"
- 4 question options shown (only one is the right question for that answer)
- Radio buttons only (always single select in trivia)
- Hint: shows a related keyword from the answer
- Same timer, skip, difficulty rules apply

---

### 5. Challenge Section Logic

#### Robot Battle

**Setup:**
- User selects bot: Rusty (Pawn, 30%) / Dash (Rogue, 60%) / Apex (King, 95%)
- User selects question count: 5 / 10 / 15 / 20 / 25 / 30
- Question mix: randomly pulled from all assessment types (Quiz, Puzzle, Flipper, Trivia)
- No hints, no skips — regardless of difficulty setting

**Bot Accuracy Implementation:**
```
For each question the bot answers:
  roll = random(0, 100)
  if roll < bot.accuracy_percent:
    bot_answer = correct_answer
  else:
    bot_answer = random(wrong_answers)
```

**Battle Flow:**
- Questions presented simultaneously to player and bot
- Bot has a "thinking" animation (varies by bot personality)
- Bot answer time is randomized within a range per bot:
  - Rusty: 3–8 seconds (slow, deliberate)
  - Dash: 1–3 seconds (fast, sometimes too fast)
  - Apex: 2–4 seconds (precise, never rushed)
- Player must answer before bot reveals (or timer runs out)
- After both answer: reveal both answers simultaneously
- Score updates: +1 point for correct, 0 for wrong

**Scoring:**
- Final score: player_correct vs bot_correct
- Win: player > bot
- Tie: player = bot
- Loss: player < bot
- XP awarded regardless of outcome (more for win, some for attempt)

**No hints, no skips in any bot battle.**

#### Peer Battle

**Setup:**
- Challenger creates a room (generates shareable link or 6-digit code)
- Challenger sets: question count, timer, chapter filter, question type mix
- Opponent joins via link/code
- Both see waiting lobby

**Real-time Battle Flow:**
- Both players see same questions simultaneously
- Both answer independently
- After both submit (or timer runs out): reveal both answers
- Live score updates in split-view
- Celebration/reaction system (limited emoji reactions)

**Connection handling:**
- If opponent disconnects: 30-second reconnect window
- After 30s: battle ends, remaining player wins by default
- Results saved for both players regardless

**Peer Battle rules:**
- No hints (always King-level for competitive integrity)
- No skips allowed
- Timer always on (must select before starting: 15/30/45/60s)

---

### 6. Progression System

#### XP (Experience Points)

| Action | XP |
|---|---|
| Complete a lesson card | 2 XP |
| Complete a chapter | 20 XP |
| Complete pop quiz (any score) | 15 XP |
| Ace pop quiz (100%) | 30 XP |
| Complete any assessment session | 10 XP base |
| Each correct answer in assessment | 5 XP × difficulty_multiplier |
| Daily challenge completed | 25 XP |
| Beat Rusty (bot battle) | 20 XP |
| Beat Dash (bot battle) | 40 XP |
| Beat Apex (bot battle) | 80 XP |
| Win peer battle | 50 XP |
| Maintain 7-day streak | 50 XP bonus |
| Maintain 30-day streak | 200 XP bonus |

#### Levels
```
Level 1: 0–100 XP        "Learner"
Level 2: 101–300 XP      "Student"
Level 3: 301–600 XP      "Driver in Training"
Level 4: 601–1000 XP     "Road Scholar"
Level 5: 1001–1500 XP    "Highway Pro"
Level 6: 1501–2200 XP    "Permit Ready"
Level 7: 2200+ XP        "License Bound"
```

Level up triggers a full-screen celebration animation + badge award.

#### Streaks
- Streak increments by completing any study activity per day
- Minimum qualifying activities: complete 1 lesson OR 1 session OR daily challenge
- Streak resets at midnight if no activity recorded
- Streak freeze: user earns 1 freeze token per 7-day streak, usable once to protect streak

#### Achievements / Badges

| Badge | Trigger |
|---|---|
| First Flip | Complete first flashcard session |
| Chapter 1 Clear | Complete Chapter 1 lessons + quiz |
| All Clear | Complete all 12 chapters |
| Ace | Score 100% on any assessment |
| Speed Demon | Complete Timer Blitz with 20+ cards |
| Bot Slayer — Rusty | Beat Rusty bot |
| Bot Slayer — Dash | Beat Dash bot |
| Bot Slayer — Apex | Beat Apex bot |
| On Fire | 7-day streak |
| Unstoppable | 30-day streak |
| Scholar | 1000 XP total |
| Road Ready | Readiness score above 85% |
| Night Owl | Complete Night Before Mode |
| Bookworm | 50 bookmarks saved |
| Deck Builder | Create a custom saved deck |
| Peer Crusher | Win 5 peer battles |
| Trivia Master | Complete 10 Trivia sessions |

---

### 7. Night Before Mode

Special session activated by user, ideally 24–48 hours before their test date.

**Logic:**
1. User sets test date (optional, in Settings or prompted)
2. Night Before Mode becomes available the day before test date
3. On activation: AI analyzes user's entire history
4. Generates a 20-question rapid-fire review targeting weakest areas
5. Timer fixed at 30s per question (cannot be changed)
6. No hints, no skips (simulates real test pressure)
7. Results show chapter-by-chapter breakdown with final readiness prediction
8. Ends with message: "You've studied X questions total. You're [readiness]% ready. Get some sleep."

---

### 8. Offline Mode Logic

**What is cached locally (IndexedDB):**
- Complete question bank for user's state (downloaded on first launch)
- All lesson content (text, no images on minimal mode)
- User progress snapshot (synced every 5 minutes when online)
- Saved flashcard decks
- Recent sessions (last 10)

**What requires connection:**
- AI hints (Claude API)
- Peer Battle (real-time WebSocket)
- Bot Battle (can be offline — bot logic runs client-side)
- Leaderboards
- Parent dashboard

**Sync logic:**
- On reconnect: push all offline activity to server
- Conflict resolution: server timestamp wins for scores, merge for bookmarks
- User notified of sync: "3 sessions synced to your account"

---

### 9. Push Notifications Logic

| Notification | Trigger | Timing |
|---|---|---|
| Daily reminder | User hasn't opened app by reminder time | User-set time (default 7pm) |
| Streak at risk | No activity and it's 2 hours before midnight | Dynamic |
| Streak lost | Streak resets | Next morning 9am |
| Challenge invite | Peer sends a battle invite | Immediate |
| Achievement unlocked | Badge earned | Immediate |
| Weekly summary | Every Sunday | 10am |
| Test day reminder | If test date is set | 3 days before, 1 day before, morning of |
| Parent: weekly report | Parent account set up | Every Monday 8am |

Notification preferences are all individually toggleable in Settings.

---

### 10. Parent Dashboard Logic

**Linking:**
- Learner generates a 6-digit share code in Profile → Family
- Parent enters code in their Parent Dashboard setup
- Link is confirmed by learner (approval required)
- One parent can link to multiple learners
- One learner can link to multiple parents (divorced families)

**Data visible to parent:**
- Weekly study activity (days active, sessions completed)
- Chapter progress (% complete per chapter)
- Assessment scores (last 10 sessions)
- Current readiness score
- Streak status
- Time spent studying (this week / all time)
- Growth areas (weak chapters)
- Test date (if learner set one)

**Data NOT visible to parent:**
- Specific question answers
- Chat or social features
- Private bookmarks or notes

**Parent cannot:**
- Change learner settings
- Access learner account
- See peer battle opponents

---

### 11. Settings Logic

**Theme:** Dark (default) / Light / System
- Stored in localStorage for instant apply before auth
- Synced to user profile when logged in

**Font Size:** Standard / Large
- Standard: 14px base
- Large: 18px base — scales entire type system proportionally

**Study Defaults:**
- Default timer setting (saved per user)
- Default question count (saved per user)
- Preferred assessment mode (pre-selected on Assessment screen)

**Notification preferences:** all individually stored server-side

**Accessibility:**
- High contrast: increases text contrast ratios, removes transparency
- Reduced motion: system preference detected automatically, manual override available

---

### 12. Status Page Logic

**System components monitored:**
- API (GraphQL endpoint health check)
- Database (Supabase connection)
- AI Service (Claude API reachability)
- Real-time (WebSocket / Supabase Realtime)
- Storage (image CDN availability)

**Status levels:**
- Operational (green)
- Degraded Performance (gold) — service works but slow
- Partial Outage (orange) — some features unavailable
- Major Outage (red) — service down

**Status data source:**
- Health check endpoint pinged every 60 seconds
- Status stored in Redis (fast read)
- Incident history kept for 90 days

**Incident communication:**
- Auto-banner in app when any service is non-operational
- Status page shows timeline of events
- Resolved incidents archived with root cause summary

---

### 13. Multi-State Scaling Logic

**State detection:**
- Domain determines state: `driveready-ok.com` → `state_code = "ok"`
- Stored in app config loaded at startup
- All API calls include `state_code` header

**State configuration (per state):**
```
state_code          "ok"
name                "Oklahoma"
passing_score       0.80
real_test_count     50
chapters            12
primary_color       "#22C55E"
secondary_color     "#F59E0B"
```

**Data isolation:**
- All questions, progress, and user data filtered by `state_code`
- Users in Oklahoma only ever see Oklahoma questions
- Same user account can switch state (military families, college students)

**Adding a new state:**
1. Add state config to `STATE_CONFIGS`
2. Seed question bank with state-specific questions
3. Set up `driveready-[state].com` domain
4. Point to same API with new `state_code`
5. Deploy — no code changes required
