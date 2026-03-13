# DriveReady — Design & Appearance Specification

## Brand Identity

### Name & Domain
- Primary: `DriveReady OK` / `driveready-ok.com`
- Pattern: `driveready-[state].com` (e.g., `driveready-tx.com`, `driveready-ca.com`)
- Each state deployment is a branded sub-product sharing the same codebase

### Tagline / Motto
> **"Learn it. Know it. Drive it."**

### Logo Concept
- Stylized road stretching toward a horizon
- Subtle checkmark or "ready" indicator embedded in the vanishing point
- Wordmark: `DriveReady` bold + `OK` in state accent color
- Scalable SVG — works at favicon size and billboard size
- Dark and light variants required

---

## Color System

### Design Philosophy
Oklahoma's official green and white are used as the **accent and meaning layer**, not the dominant palette. The dark background has a subtle green DNA baked in — neutral surfaces feel on-brand without screaming green. Gold represents Oklahoma's prairies and powers all gamification elements.

### Base Palette — Dark Mode (Default)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0A0F0D` | App background — dark green-black |
| `--surface` | `#111A14` | Cards, sidebars |
| `--surface-2` | `#1A2B1F` | Elevated cards, modals, panels |
| `--surface-3` | `#243D29` | Hover states on surfaces |
| `--border` | `#243D29` | Dividers, input borders |
| `--border-subtle` | `#1A2B1F` | Very subtle separators |

### Primary — Oklahoma Green

| Token | Hex | Usage |
|---|---|---|
| `--green-400` | `#4ADE80` | Hover states, highlights |
| `--green-500` | `#22C55E` | Primary actions, correct answers, progress |
| `--green-600` | `#16A34A` | Pressed states |
| `--green-700` | `#15803D` | Badges, deep accents |

### Secondary — Prairie Gold

| Token | Hex | Usage |
|---|---|---|
| `--gold-400` | `#FBBF24` | XP points, achievements, streaks |
| `--gold-500` | `#F59E0B` | Timer warnings, highlights |
| `--gold-600` | `#D97706` | Pressed/active gold states |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--correct` | `#22C55E` | Correct answer feedback |
| `--wrong` | `#EF4444` | Wrong answer feedback |
| `--warning` | `#F59E0B` | Timer low, caution states |
| `--info` | `#38BDF8` | Sky blue — Oklahoma flag — neutral guidance |
| `--hint` | `#818CF8` | AI hints, smart suggestions — soft indigo |
| `--growth` | `#F97316` | Growth areas, weak spots — orange |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--text-primary` | `#F0FDF4` | Main content — near-white with green tint |
| `--text-secondary` | `#86EFAC` | Labels, captions, metadata |
| `--text-muted` | `#4ADE8066` | Disabled, placeholder (40% opacity green) |
| `--text-inverse` | `#14532D` | Text on light backgrounds |

### Light Mode Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#F0FDF4` | Very light green-white |
| `--surface` | `#FFFFFF` | Cards |
| `--surface-2` | `#DCFCE7` | Elevated panels |
| `--border` | `#BBF7D0` | Dividers |
| `--text-primary` | `#14532D` | Deep green text |
| `--text-secondary` | `#166534` | Secondary text |

Light mode mirrors the same green logic — same app, inverted.

### Multi-State Color Swapping

Each state overrides only the accent layer. Base backgrounds remain constant.

```css
/* Oklahoma */
--state-primary: #22C55E;
--state-secondary: #F59E0B;

/* Texas */
--state-primary: #DC2626;
--state-secondary: #94A3B8;

/* California */
--state-primary: #1D4ED8;
--state-secondary: #CA8A04;

/* Florida */
--state-primary: #EA580C;
--state-secondary: #0284C7;
```

---

## Typography

### Font Stack

| Role | Font | Weight | Usage |
|---|---|---|---|
| Display / Headers | `Syne` | 700, 800 | Section titles, scores, bot names, chapter headers |
| Body / UI | `DM Sans` | 300, 400, 500 | All readable content, buttons, labels |
| Timers / Scores | `JetBrains Mono` | 400, 700 | Countdown timers, XP numbers, quiz scores |

### Type Scale

| Name | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `display-xl` | 48px | 800 | Syne | Score reveals, splash screens |
| `display-lg` | 36px | 700 | Syne | Section headers, readiness score |
| `display-md` | 28px | 700 | Syne | Card titles, chapter names |
| `heading` | 22px | 700 | Syne | In-card headers, question text |
| `subheading` | 18px | 500 | DM Sans | Subtitles, mode names |
| `body-lg` | 16px | 400 | DM Sans | Primary body content |
| `body` | 14px | 400 | DM Sans | Secondary content, descriptions |
| `caption` | 12px | 400 | DM Sans | Labels, metadata, timestamps |
| `timer` | 32px | 700 | JetBrains Mono | Countdown displays |
| `score` | 24px | 700 | JetBrains Mono | Live scores, XP display |

---

## Spacing & Layout

### Spacing Scale (base 4px)
```
2px   xs      — icon gaps, tight padding
4px   sm      — compact elements
8px   md      — standard inner padding
12px  lg      — card padding
16px  xl      — section gaps
24px  2xl     — major section spacing
32px  3xl     — page section breaks
48px  4xl     — hero spacing
64px  5xl     — full-section gaps
```

### Border Radius
```
4px   sm      — chips, tags, small badges
8px   md      — buttons, inputs
12px  lg      — cards (default)
16px  xl      — modals, large cards
24px  2xl     — feature panels
9999px full   — pills, avatars, circular elements
```

### Grid System
- Mobile: 1 column, 16px gutters
- Tablet: 2 columns, 24px gutters
- Desktop: 12-column grid, 24px gutters, 1280px max-width
- Content max-width: 768px (reading/quiz content)
- Dashboard max-width: 1280px

### Elevation (no drop shadows — border-based)
```
Level 0: background (#0A0F0D) — page canvas
Level 1: surface (#111A14) — default cards
Level 2: surface-2 (#1A2B1F) — elevated cards, modals
Level 3: surface-3 (#243D29) — tooltips, dropdowns
```

---

## Navigation Structure

### Primary Navigation (Bottom bar — Mobile / Left sidebar — Desktop)

```
🏠  Home          — Dashboard, daily challenge, streak
📖  Learn         — Chapter-based lessons
🃏  Study         — Flashcard modes
⚡  Challenge     — Assessment types + Robot/Peer Battle
👤  Profile       — Progress, achievements, settings
```

### Secondary Pages (accessible from Profile or nav)
```
Settings          — App preferences, notifications, account
Status            — System uptime, version, known issues, roadmap
Parent Dashboard  — Separate authenticated view
```

---

## Component Design Language

### Cards
- Border: 1px `--border` solid
- Background: `--surface`
- Radius: 12px
- Padding: 16px
- Hover: background transitions to `--surface-2`, border to `--green-700`
- Active: scale(0.98) transform

### Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `--green-500` | `#0A0F0D` | none |
| Secondary | `--surface-2` | `--text-primary` | `--border` |
| Ghost | transparent | `--green-400` | `--green-700` |
| Danger | `#EF444420` | `#EF4444` | `#EF444440` |
| Gold (XP/Game) | `--gold-500` | `#0A0F0D` | none |
| Disabled | `--surface` | `--text-muted` | `--border` |

Button sizes: sm (32px h), md (40px h), lg (48px h)
All buttons: 8px radius, DM Sans 500 weight

### Inputs
- Height: 44px
- Border: 1px `--border`
- Focus border: `--green-500` with 2px glow `#22C55E30`
- Background: `--surface-2`
- Radius: 8px

### Answer Options (Quiz)

**Unselected:**
- Background: `--surface`
- Border: 1px `--border`

**Selected (pending):**
- Background: `#22C55E15`
- Border: 1px `--green-500`

**Correct:**
- Background: `#22C55E20`
- Border: 1px `--green-500`
- Icon: ✓ in `--green-500`
- Animation: pulse expand → settle

**Wrong:**
- Background: `#EF444420`
- Border: 1px `#EF4444`
- Icon: ✗ in `#EF4444`
- Animation: horizontal shake → fade to muted

**Hint highlighted:**
- Left border: 3px `--hint` (indigo)
- Background: `#818CF810`

---

## Animation System

### Principles
- **Purposeful** — every animation communicates state change
- **Fast** — UI responses under 200ms, reveals under 400ms
- **Reduced motion** — all animations respect `prefers-reduced-motion`

### Timing Reference

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `instant` | 100ms | ease-out | Button press, selection |
| `fast` | 200ms | ease-out | Hover states, toggles |
| `standard` | 300ms | ease-in-out | Card transitions, reveals |
| `deliberate` | 500ms | cubic-bezier(0.4, 0, 0.2, 1) | Card flip, modal open |
| `dramatic` | 800ms | spring | Score reveal, level up |

### Signature Animations

**Card Flip (Flashcard / Flipper mode)**
- Y-axis 3D rotation: 0° → 180°
- Duration: 500ms, deliberate easing
- Mid-flip (90°): swap content
- Perspective: 1200px on parent

**Correct Answer**
- Green pulse: scale(1) → scale(1.04) → scale(1) 
- Duration: 300ms
- Followed by confetti burst (3 particles, subtle)

**Wrong Answer**
- Horizontal shake: translateX(0 → -8px → 8px → -4px → 0)
- Duration: 400ms
- Red border flash

**Timer Pulse (< 10 seconds)**
- Color: `--gold-500` → `#EF4444` linear transition
- Scale: subtle 1.0 → 1.05 pulse every second
- At 5s: font weight increases to 700

**Bot Thinking**
- 3 dots pulsing in sequence
- Each dot: scale 0.6 → 1.0 → 0.6
- Stagger: 150ms between dots
- Color: matches bot personality color

**Streak Milestone**
- Gold flame flicker: opacity 0.8 → 1.0 rapid oscillation
- Number: counter animation from previous to new value
- Duration: 800ms dramatic spring

**XP Gain**
- Number flies from answer location to XP counter
- Arc motion path
- Duration: 600ms
- Gold color, fades out at destination

**Page Transitions**
- Slide from right on forward navigation
- Slide from left on back navigation
- Duration: 300ms standard easing
- Opacity 0→1 fade layered on slide

**Robot Battle — Bot Response**
- Correct: bot avatar bounces, green flash
- Wrong: bot avatar shakes, red flash, sad expression
- King bot (Apex): cold mechanical correct animation — no expression change

---

## Screen-by-Screen Design

### Home / Dashboard
**Layout:** Greeting + daily stats bar + primary CTA + section cards grid

Elements:
- Greeting: "Good morning, [Name] 👋" in display-md
- Streak chip: flame icon + count in gold
- Readiness meter: circular progress ring, green fill, percentage in center (JetBrains Mono)
- "Continue learning" card — last chapter, progress bar
- "Daily Challenge" card — highlighted in gold border
- "Growth Areas" section — red-orange tagged weak chapters
- Quick stats row: total XP / questions answered / days streak

### Learn Section
**Layout:** Chapter list → Chapter detail → Lesson cards → Pop Quiz

Chapter list card:
- Chapter number (Syne 700, muted)
- Title (Syne 700)
- Progress bar (green fill)
- Lock icon if prerequisites not met
- Bookmark count badge (gold)

Lesson card:
- One concept per card — maximum 3 sentences
- Illustration or sign image if applicable
- Swipe right to continue, swipe left to bookmark
- Bookmark button (gold star) top right

Pop Quiz (end of chapter):
- 5 questions, same Quiz component as Assessment
- Optional timer toggle before starting
- Shows score breakdown at end with chapter retry option

### Study Section
**Layout:** Mode selector → Deck selector → Study session → Results

Mode selector: 3 large cards
- Free Study: "Flip at your own pace"
- Drill Mode: "Sort into Got it / Still learning"
- Timer Blitz: "Flip as many as you can" + time selector (30/60/90/120s)

Deck source options:
- Smart (Bookmarks + Growth Areas) — default, badged "Recommended"
- Custom (chapter picker + mix-and-match)
- Saved decks (user-named collections)

Flashcard:
- Large centered card, 3D flip animation
- Front: question text + chapter tag
- Back: answer + explanation + source reference
- Drill mode: Got It (green swipe right) / Still Learning (red swipe left)
- Saved deck button in session header

### Assessment Section
**Layout:** Mode picker → Settings panel → Session → Results

Mode cards (large, icon + description):
- Quiz — multiple choice
- Puzzle — drag and drop
- Flipper — card + drag answer
- Trivia — answer-first (Jeopardy style)

Settings panel (shared across modes):
- Questions: 5 / 10 / 15 / 20 / 25 / 30
- Timer: Off / 15s / 30s / 45s / 60s
- Difficulty: Pawn / Rogue / King
- Chapter filter: All / Select chapters
- Hint and skip availability shown based on difficulty

During session header (persistent):
- Question counter: "3 of 20" (JetBrains Mono)
- Timer countdown (JetBrains Mono, pulses when low)
- Hint button (indigo, shows remaining count)
- Skip button (muted, shows remaining count)
- Progress bar across full width

### Challenge Section
**Layout:** Mode picker → Bot/Peer setup → Battle → Results

Challenge modes:
- Robot Battle (solo vs AI bot)
- Peer Battle (real-time vs friend)

Robot Battle setup:
- Bot selector: Rusty (gray) / Dash (blue) / Apex (gold)
- Bot personality card with accuracy shown
- Question count selector
- Question type mix (from all assessment types)

Battle screen:
- Split view: player left, bot right
- Live score counters (JetBrains Mono)
- Bot "thinking" animation between questions
- Question in center, shared for both

Peer Battle:
- Invite via link or username
- Waiting lobby with animated "waiting for opponent"
- Same split-view battle screen with real usernames

### Profile
**Layout:** Avatar + stats hero → Tab navigation → Content

Tabs:
- Progress (chapter mastery grid + readiness score)
- Achievements (badge grid, locked badges shown as silhouettes)
- History (recent sessions with scores)
- Saved Decks (user-created flashcard decks)

Achievements use gold/green badge design with icon + name + unlock condition.

### Parent Dashboard
**Separate authenticated view (parent role)**

- Linked learner selector (dropdown if multiple)
- Weekly activity chart (days × sessions)
- Chapter progress grid
- Recent quiz scores timeline
- Growth areas callout
- Time spent studying (this week / total)
- Streak status

### Settings
Clean list layout with section headers:

```
Account         Profile info, avatar, display name, email
Appearance      Dark / Light / System | Font size: Standard / Large
Notifications   Push on/off | Daily reminder time | Streak alerts | Challenge invites
Study           Default timer | Default question count | Preferred mode
Accessibility   High contrast | Reduced motion | Larger tap targets
Privacy         Download my data | Delete account | Cookie preferences
About           Version | Changelog | Legal | Contact | Rate the app
```

### Status Page
```
System Status      API ● / Database ● / AI Service ● / Real-time ●
                   Each: green (operational) / gold (degraded) / red (outage)

Current Version    v1.0.0 — "What's new in this version" expandable

Known Issues       Transparent numbered list with status tags

Coming Soon        Roadmap teaser — locked feature previews
```

---

## Bot Visual Identities

### Rusty (Pawn — 30% accuracy)
- Color: warm gray `#9CA3AF` + orange `#F97316`
- Personality: clunky, friendly, makes obvious mistakes
- Avatar: round robot face, slightly dented, warm smile
- Animation: slow, occasionally glitches/stutters
- Voice/tone: "Hmm, I think maybe...?"

### Dash (Rogue — 60% accuracy)
- Color: sky blue `#38BDF8` + white
- Personality: confident, unpredictable, sometimes cocky
- Avatar: sleek angular robot, visor eyes
- Animation: quick, snappy, occasionally overconfident
- Voice/tone: "Easy. Next."

### Apex (King — 95% accuracy)
- Color: gold `#F59E0B` + deep green `#15803D`
- Personality: cold, precise, minimal expression
- Avatar: minimal geometric face, single glowing eye
- Animation: mechanical perfection, no wasted motion
- Voice/tone: "Correct." (no celebration)

---

## Iconography

Library: **Lucide React** (consistent, clean, open source, tree-shakeable)

Key icon assignments:
```
Home:           home
Learn:          book-open
Study:          layers
Challenge:      zap
Profile:        user
Bookmark:       bookmark
Settings:       settings
Streak:         flame
XP / Points:    star
Timer:          timer
Hint:           lightbulb
Skip:           skip-forward
Correct:        check-circle
Wrong:          x-circle
Lock:           lock
Achievement:    award
Parent:         users
Bot:            bot
Peer Battle:    swords
Notification:   bell
Growth Area:    trending-up
Readiness:      target
Night Mode:     moon
```

---

## Accessibility Standards

- WCAG 2.1 AA minimum compliance
- All interactive elements: minimum 44×44px tap target
- Focus indicators: 2px `--green-500` outline, 2px offset
- Color is never the only differentiator (always paired with icon or text)
- Screen reader labels on all icon-only buttons
- Keyboard navigation fully supported
- High contrast mode: increases border weights, removes transparency effects
- Reduced motion mode: replaces all animations with instant transitions or simple fades
- Font size: Standard (14px base) / Large (18px base) user-selectable

---

## Responsive Breakpoints

```
xs:   < 480px    — small phones
sm:   480–767px  — large phones (primary target)
md:   768–1023px — tablets
lg:   1024–1279px — small desktop / landscape tablet
xl:   1280px+    — desktop
```

Mobile-first: all components designed at sm, enhanced at md and lg.
