/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : DriveReady — AI-Powered Multi-State Driver Education Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { FiArrowRight, FiZap, FiShield, FiCheck, FiX, FiAward, FiCpu } from 'react-icons/fi'
import { BsDiamondFill } from 'react-icons/bs'
import { GiSwordSpade } from 'react-icons/gi'
import { Footer } from '@/components/layout/Footer'
import type { IconType } from 'react-icons'

interface LandingPageProps {
  onSignIn: () => void
  onStartFree: () => void
}

export function LandingPage({ onSignIn, onStartFree }: LandingPageProps) {
  return (
    <div className="min-h-dvh bg-navy-deep">
      <TopBar onSignIn={onSignIn} onStartFree={onStartFree} />
      <Hero onSignIn={onSignIn} onStartFree={onStartFree} />
      <TrustMarquee />
      <FeaturesStrip />
      <CtaBand onStartFree={onStartFree} />
      <Footer />
    </div>
  )
}

// ── CTA band (orange, blueprint texture) ──────────────────────────────────────

function CtaBand({ onStartFree }: { onStartFree: () => void }) {
  return (
    <section className="relative overflow-hidden bg-orange text-center py-[clamp(60px,8vw,96px)] px-4 sm:px-10">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />
      <div className="relative z-[1] max-w-[780px] mx-auto">
        <h2 className="display font-extrabold text-[clamp(30px,5vw,52px)] leading-[1.05] tracking-[-1.2px] text-navy-deep mb-4">
          Ready to get your permit?
        </h2>
        <p className="text-navy-deep/70 text-base mb-7">
          Free to start. No credit card. Oklahoma's smartest permit prep.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onStartFree}
            className="btn-navy inline-flex items-center gap-1.5 px-7 py-3.5 text-[15px]"
          >
            Start studying free
            <FiArrowRight size={16} />
          </button>
          <button
            onClick={onStartFree}
            className="inline-flex items-center px-7 py-3.5 text-[15px] rounded-md border-[1.5px] border-navy-deep/35 text-navy-deep hover:bg-navy-deep/5 transition-colors"
          >
            How it works
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Features strip ────────────────────────────────────────────────────────────

interface Feature {
  Icon: IconType
  iconTone: 'orange' | 'yellow' | 'green'
  name: string
  desc: string
  meta: [string, string]
}

const FEATURES: Feature[] = [
  {
    Icon: FiCpu,
    iconTone: 'orange',
    name: 'AI that adapts',
    desc:
      'Readiness score updates after every session. Growth Areas auto-detect weak chapters and prioritize them in every drill.',
    meta: ['Adaptive', 'Realtime'],
  },
  {
    Icon: GiSwordSpade,
    iconTone: 'yellow',
    name: 'Six ways to study',
    desc:
      'Quiz, Puzzle, Flipper, Trivia, Bot Battle, Peer Battle — all pull from the same question bank, so variety never means gaps.',
    meta: ['6 modes', '1 bank'],
  },
  {
    Icon: FiAward,
    iconTone: 'green',
    name: 'Gamified progress',
    desc:
      'XP, levels, achievement badges, daily streaks with freeze tokens, and a readiness score that tells you when you are truly ready.',
    meta: ['7 levels', 'Streak Freeze'],
  },
]

const TONE_CLASS: Record<Feature['iconTone'], string> = {
  orange: 'bg-orange-soft border-orange/30 text-orange',
  yellow: 'bg-yellow-soft border-yellow-rim text-yellow',
  green:  'bg-green-soft border-green/30 text-green-400',
}

function FeaturesStrip() {
  return (
    <section className="relative bg-navy-deep blueprint-grid border-b border-yellow-rim/20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-10 py-[clamp(48px,7vw,84px)]">
        {/* Section header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 mb-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Why DriveReady
          </div>
          <h2 className="display font-extrabold text-[clamp(22px,2.6vw,32px)] leading-tight tracking-[-0.6px] text-white mb-2.5">
            Built different.
            <br />
            Built to pass.
          </h2>
          <p className="text-text-secondary font-light leading-relaxed max-w-[560px]">
            Not a quiz app with a paywall. A full learning system designed around how teenagers
            actually retain information.
          </p>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, iconTone, name, desc, meta }) => (
            <div
              key={name}
              className="relative overflow-hidden bg-navy-card border border-border rounded-2xl p-6 transition-colors hover:border-orange/40"
            >
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${TONE_CLASS[iconTone]}`}
              >
                <Icon size={22} />
              </div>
              <h3 className="display font-bold text-base text-white mb-1.5">{name}</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">{desc}</p>
              <div className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted flex items-center gap-2.5">
                <span>{meta[0]}</span>
                <span className="w-1 h-1 rounded-full bg-text-faint" />
                <span>{meta[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Trust marquee ─────────────────────────────────────────────────────────────

const TRUST_ITEMS: { strong: string; rest: string }[] = [
  { strong: 'Aligned with',     rest: 'Oklahoma DPS' },
  { strong: '900+',             rest: 'questions' },
  { strong: '5',                rest: 'study modes' },
  { strong: 'AI-curated',       rest: 'weak-spot review' },
  { strong: 'Offline',          rest: 'ready' },
  { strong: 'No ads,',          rest: 'ever' },
]

function TrustMarquee() {
  // Render the row twice for a seamless loop
  const row = (key: string) =>
    TRUST_ITEMS.map((item, i) => (
      <span key={`${key}-${i}`} className="inline-flex items-center gap-2 px-7 text-[12px] text-text-secondary whitespace-nowrap">
        <BsDiamondFill size={9} className="text-orange shrink-0" />
        <strong className="text-white font-semibold">{item.strong}</strong>
        <span>{item.rest}</span>
      </span>
    ))

  return (
    <div className="relative overflow-hidden border-y border-yellow-rim/20 bg-navy-deep/80 backdrop-blur-sm py-3.5">
      <div className="flex w-max animate-marquee">
        {row('a')}
        {row('b')}
      </div>

      {/* Edge fades */}
      <div
        className="absolute inset-y-0 left-0 w-16 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, #010E33 0%, transparent 100%)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-16 pointer-events-none"
        style={{ background: 'linear-gradient(270deg, #010E33 0%, transparent 100%)' }}
      />
    </div>
  )
}

// ── Top nav (landing only) ────────────────────────────────────────────────────

function TopBar({ onSignIn, onStartFree }: { onSignIn: () => void; onStartFree: () => void }) {
  return (
    <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 sm:px-10 glass border-b border-border">
      <div className="flex items-center gap-2.5 min-w-0">
        <ShieldMark />
        <div className="leading-tight">
          <div className="font-display font-extrabold text-[17px] text-white tracking-tight">
            Drive<em className="not-italic text-orange">Ready</em>
          </div>
          <div className="mono text-[9px] tracking-[0.12em] uppercase text-text-muted hidden sm:block">
            Oklahoma · driveready-ok.com
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSignIn}
          className="hidden sm:inline-flex pill-btn border border-border text-text-secondary hover:text-white hover:border-strong"
        >
          Sign in
        </button>
        <button
          onClick={onStartFree}
          className="pill-btn bg-orange text-white hover:bg-orange-deep inline-flex items-center gap-1.5"
        >
          Start Free
          <FiArrowRight size={14} />
        </button>
      </div>
    </nav>
  )
}

function ShieldMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={(size * 68) / 60} viewBox="0 0 60 68" fill="none" aria-hidden="true">
      <path d="M30 2 L56 14 L56 38 Q56 58 30 66 Q4 58 4 38 L4 14 Z" fill="#F45B26" />
      <path d="M30 8 L50 18 L50 38 Q50 55 30 62 Q10 55 10 38 L10 18 Z" fill="#021A54" />
      <polyline
        points="18,36 27,46 44,28"
        stroke="#F45B26"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polygon
        points="30,11 32.5,19 41,19 34.5,24 37,32 30,27 23,32 25.5,24 19,19 27.5,19"
        fill="#F8DE22"
      />
    </svg>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero({ onSignIn, onStartFree }: { onSignIn: () => void; onStartFree: () => void }) {
  return (
    <section className="relative overflow-hidden bg-navy-deep blueprint-grid border-b border-yellow-rim/40">
      {/* Orange slab on the right (hidden on tiny screens) */}
      <div
        className="absolute top-0 right-0 bottom-0 w-[42%] bg-orange z-0 hidden sm:block"
        style={{ clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0% 100%)' }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(1,14,51,0.3) 0%, transparent 30%)' }}
        />
      </div>

      {/* Tricolor stripe along bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] z-10"
        style={{
          background:
            'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-[2] max-w-[1200px] mx-auto px-4 sm:px-10 py-[clamp(72px,9vw,120px)] pb-[clamp(60px,7vw,96px)] grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        {/* Left */}
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-yellow-soft border border-yellow-rim rounded-full px-3.5 py-1 mb-7 text-[11px] font-medium tracking-[0.12em] text-yellow uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-pulse-soft" />
            Oklahoma · AI-Powered Permit Prep
          </div>

          <h1 className="display font-extrabold text-[clamp(40px,6vw,84px)] leading-[0.96] tracking-[-2px] text-white mb-7">
            Pass your
            <br />
            <span className="text-orange">
              <span
                className="px-1"
                style={{
                  background:
                    'linear-gradient(transparent 78%, #F8DE22 78%, #F8DE22 92%, transparent 92%)',
                }}
              >
                permit test.
              </span>
            </span>
          </h1>

          <p className="text-text-secondary font-light leading-relaxed text-[clamp(15px,1.5vw,17px)] max-w-[480px] mb-9">
            Five study modes, real-time bot battles, and an AI that learns your weak spots —
            everything you need to walk out of the DMV with your permit on the first try.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onStartFree}
              className="btn-yellow inline-flex items-center gap-1.5 px-7 py-3.5 text-[15px]"
            >
              Start Studying Free
              <FiArrowRight size={16} />
            </button>
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-7 py-3.5 text-[15px] rounded-md border border-border text-text-secondary hover:text-white hover:border-strong transition-colors"
            >
              Sign in
            </button>
          </div>

          <div className="mt-7 mono text-[10px] tracking-[0.1em] uppercase text-text-muted flex items-center gap-2.5 flex-wrap">
            <span>
              Live in <strong className="text-yellow font-semibold">Oklahoma</strong>
            </span>
            <span className="w-1 h-1 rounded-full bg-text-faint" />
            <span>Texas &amp; California coming soon</span>
          </div>
        </div>

        {/* Right — preview card */}
        <div className="relative animate-fade-up [animation-delay:0.3s]">
          <PreviewCard />

          {/* Floating pills */}
          <div className="absolute -left-4 top-[30%] hidden sm:flex items-center gap-2.5 bg-navy-card/95 border border-yellow-rim rounded-2xl px-3.5 py-2.5 backdrop-blur-md shadow-[0_14px_30px_-10px_rgba(0,0,0,0.4)] animate-float">
            <span className="w-[34px] h-[34px] rounded-full bg-yellow-soft border border-yellow-rim flex items-center justify-center text-yellow">
              <FiZap size={16} />
            </span>
            <div className="leading-tight">
              <div className="mono font-bold text-[14px] text-white">3,420</div>
              <div className="text-[9px] tracking-[0.08em] uppercase text-text-muted mt-0.5">
                Total XP
              </div>
            </div>
          </div>

          <div className="absolute -right-5 bottom-[18%] hidden sm:flex items-center gap-2.5 bg-navy-card/95 border border-orange/30 rounded-2xl px-3.5 py-2.5 backdrop-blur-md shadow-[0_14px_30px_-10px_rgba(0,0,0,0.4)] animate-float [animation-delay:1.5s]">
            <span className="w-[34px] h-[34px] rounded-full bg-orange-soft border border-orange/30 flex items-center justify-center text-orange">
              <FiShield size={16} />
            </span>
            <div className="leading-tight">
              <div className="mono font-bold text-[14px] text-white">Pro</div>
              <div className="text-[9px] tracking-[0.08em] uppercase text-text-muted mt-0.5">
                Difficulty
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PreviewCard() {
  return (
    <div className="relative rounded-xl overflow-hidden bg-[rgba(7,30,92,0.92)] border border-yellow-rim/40 backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-yellow-rim/30 bg-navy/50">
        <div className="mono text-[10px] font-semibold tracking-[0.12em] uppercase text-yellow flex items-center">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow mr-2 animate-pulse-soft" />
          Daily Challenge
        </div>
        <div className="mono text-[10px] text-text-muted">2× XP · 0:42</div>
      </div>

      {/* Body */}
      <div className="px-5 py-6">
        <p className="display font-bold text-[18px] leading-snug tracking-[-0.3px] text-white mb-5">
          When must you yield to a pedestrian in Oklahoma?
        </p>

        <div className="flex flex-col gap-2">
          <PreviewOpt letter="A" text="Only at marked crosswalks" state="default" />
          <PreviewOpt letter="✓" text="At all crosswalks, marked or unmarked" state="correct" />
          <PreviewOpt letter="✗" text="Only when a light is present" state="wrong" />
          <PreviewOpt letter="D" text="When they wave you through" state="default" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-yellow-rim/20 bg-navy/30">
        <div className="mono text-[12px] text-yellow font-semibold inline-flex items-center gap-1.5">
          <FiZap size={12} />
          14 day streak
        </div>
        <div className="mono text-[11px] text-text-muted">
          Readiness <strong className="text-orange font-semibold">72%</strong>
        </div>
      </div>
    </div>
  )
}

function PreviewOpt({
  letter,
  text,
  state,
}: {
  letter: string
  text: string
  state: 'default' | 'correct' | 'wrong'
}) {
  const wrapClass =
    state === 'correct'
      ? 'bg-green-soft border-green/50 text-green-400 font-medium'
      : state === 'wrong'
        ? 'bg-wrong/10 border-wrong/40 text-wrong/75'
        : 'bg-white/[0.04] border-white/[0.08] text-text-secondary'
  const dotClass =
    state === 'correct'
      ? 'bg-green-500 text-bg'
      : state === 'wrong'
        ? 'bg-wrong/35 text-wrong/70'
        : 'bg-white/[0.07] text-text-muted'
  const Glyph =
    state === 'correct' ? <FiCheck size={11} strokeWidth={3} /> : state === 'wrong' ? <FiX size={11} strokeWidth={3} /> : null
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-[13px] ${wrapClass}`}>
      <span
        className={`w-5 h-5 rounded mono text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${dotClass}`}
      >
        {Glyph ?? letter}
      </span>
      <span>{text}</span>
    </div>
  )
}
