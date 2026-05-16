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

import { useState, useEffect, useRef } from 'react'
import { FlashCard } from './FlashCard'
import { FiX as X, FiZap as Zap } from 'react-icons/fi'

interface Question {
  id: string
  questionText: string
  explanation: string
  hintText?: string
}

interface TimerBlitzProps {
  questions: Question[]
  deckName: string
  seconds: number
  onExit: () => void
  onComplete: (flipped: number, total: number) => void
}

export function TimerBlitz({ questions, deckName, seconds, onExit, onComplete }: TimerBlitzProps) {
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(seconds)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [flippedCount, setFlippedCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Shuffle questions for blitz
  const [shuffled] = useState(() => [...questions].sort(() => Math.random() - 0.5))

  useEffect(() => {
    if (!started) return

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current!)
  }, [started])

  // When time hits 0, finish
  useEffect(() => {
    if (timeLeft === 0 && started) {
      onComplete(flippedCount, shuffled.length)
    }
  }, [timeLeft, started])

  function handleFlip() {
    if (!started) return
    setFlipped((f) => {
      const next = !f
      if (next) setFlippedCount((c) => c + 1)
      return next
    })
  }

  function handleNext() {
    if (!started) return
    setFlipped(false)
    setTimeout(() => {
      setIndex((i) => (i + 1) % shuffled.length)
    }, 100)
  }

  // Timer color
  const pct = timeLeft / seconds
  const timerColor =
    pct > 0.5 ? 'text-correct' : pct > 0.2 ? 'text-yellow' : 'text-orange'
  const timerBar =
    pct > 0.5 ? 'bg-correct' : pct > 0.2 ? 'bg-yellow' : 'bg-orange'
  const timerPulse = pct <= 0.1 && started

  const current = shuffled[index % shuffled.length]

  if (!started) {
    return (
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background:
              'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
          }}
        />
        <button
          onClick={onExit}
          className="absolute top-4 left-4 p-2 text-text-secondary hover:text-white transition-colors"
          aria-label="Exit"
        >
          <X size={20} />
        </button>

        <div className="w-14 h-14 rounded-full bg-orange-soft border border-orange/30 flex items-center justify-center mb-6 animate-fade-up">
          <Zap size={26} className="text-orange" />
        </div>

        <div className="inline-flex items-center gap-2 mb-4 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
          Timer blitz · {deckName}
        </div>

        <h2 className="display font-extrabold text-[clamp(28px,4.5vw,40px)] leading-[1.05] tracking-[-1px] text-white mb-3">
          Race the clock.
        </h2>
        <p className="text-text-secondary text-sm mb-8 max-w-[340px]">
          Flip as many cards as you can in{' '}
          <span className="mono text-yellow font-bold">{seconds}s</span>. No scoring, just speed.
        </p>

        <button
          onClick={() => setStarted(true)}
          className="btn-primary w-full max-w-xs h-12 text-base font-semibold"
        >
          Start!
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center gap-3 sm:gap-4 px-4 pt-4 pb-3 max-w-[760px] mx-auto">
          <button
            onClick={onExit}
            className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
            aria-label="Exit"
          >
            <X size={20} />
          </button>

          <div className="mono text-[13px] font-medium text-text-secondary flex-shrink-0">
            <strong className="text-orange font-bold">{flippedCount}</strong>
            <span className="ml-1 text-text-muted text-[11px]">flipped</span>
          </div>

          <div className="flex-1 min-w-0 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${timerBar}`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>

          <div className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted truncate max-w-[140px] hidden sm:block">
            {deckName}
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex justify-center pt-8 pb-3">
        <div
          className={`mono font-bold text-[clamp(48px,8vw,72px)] ${timerColor} ${
            timerPulse ? 'animate-pulse' : ''
          } tabular-nums leading-none`}
        >
          {timeLeft}
          <span className="text-text-muted text-[clamp(18px,2.5vw,24px)] ml-1 font-medium">s</span>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-6 max-w-[760px] mx-auto w-full">
        <FlashCard
          question={current.questionText}
          answer={current.explanation}
          hint={current.hintText}
          flipped={flipped}
          onFlip={handleFlip}
        />

        {/* Next button — only shown after flip */}
        <div className="mt-5">
          {flipped ? (
            <button
              onClick={handleNext}
              className="btn-primary w-full h-11 text-sm font-semibold"
            >
              Next Card →
            </button>
          ) : (
            <p className="text-center mono text-[10px] tracking-[0.12em] uppercase text-text-muted">
              Tap card to flip
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
