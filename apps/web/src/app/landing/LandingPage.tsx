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

import { FiArrowRight, FiZap, FiShield, FiCheck, FiX } from 'react-icons/fi'
import { Footer } from '@/components/layout/Footer'

interface LandingPageProps {
  onSignIn: () => void
  onStartFree: () => void
}

export function LandingPage({ onSignIn, onStartFree }: LandingPageProps) {
  return (
    <div className="min-h-dvh bg-navy-deep">
      <TopBar onSignIn={onSignIn} onStartFree={onStartFree} />
      <Hero onSignIn={onSignIn} onStartFree={onStartFree} />
      <Footer />
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
              <div className="mono font-bold text-[14px] text-white">Rogue</div>
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
