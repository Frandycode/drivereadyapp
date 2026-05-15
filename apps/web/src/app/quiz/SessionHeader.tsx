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

import { useEffect, useRef, useState } from 'react'
import { X, Lightbulb, SkipForward, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { DifficultyBadge, type DifficultyCode } from '@/lib/difficulty'

type SegmentState = 'unanswered' | 'correct' | 'wrong' | 'skipped'

interface SessionHeaderProps {
  current: number
  total: number
  timerSeconds: number | null
  hintsLeft: number | null
  skipsLeft: number | null
  difficulty: DifficultyCode
  answerStates: SegmentState[]
  isRevealed: boolean           // disables hint + skip after submit
  onHint: () => void
  onSkip: () => void
  onExit: () => void
  onTimerExpired: () => void
  resetKey: number
}

export function SessionHeader({
  current,
  total,
  timerSeconds,
  hintsLeft,
  skipsLeft,
  difficulty,
  answerStates,
  isRevealed,
  onHint,
  onSkip,
  onExit,
  onTimerExpired,
  resetKey,
}: SessionHeaderProps) {
  const [timeLeft, setTimeLeft] = useState(timerSeconds ?? 0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!timerSeconds) return
    setTimeLeft(timerSeconds)

    clearInterval(intervalRef.current!)
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          onTimerExpired()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current!)
  }, [resetKey, timerSeconds])

  const timerPct = timerSeconds ? timeLeft / timerSeconds : 1
  const timerWarn = timerPct <= 0.25
  const timerPulse = timerPct <= 0.1

  // Hint/skip disabled when: king mode, allowance exhausted, OR question already answered/revealed
  const canHint = !isRevealed && difficulty !== 'king' && (hintsLeft === null || hintsLeft > 0)
  const canSkip = !isRevealed && difficulty !== 'king' && (skipsLeft === null || skipsLeft > 0)

  return (
    <div className="sticky top-0 z-40 glass border-b border-border">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 sm:gap-4 max-w-[760px] mx-auto">
        {/* Exit */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
          aria-label="Exit"
        >
          <X size={20} />
        </button>

        {/* Counter */}
        <div className="mono text-[13px] font-medium text-text-secondary flex-shrink-0">
          <strong className="text-white font-bold">{current}</strong>
          <span className="mx-1">/</span>
          {total}
        </div>

        {/* Segmented bar */}
        <div className="flex-1 min-w-0 flex items-center gap-1">
          {Array.from({ length: total }).map((_, i) => {
            const state = answerStates[i] ?? 'unanswered'
            return (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  state === 'correct'  ? 'bg-correct' :
                  state === 'wrong'   ? 'bg-wrong' :
                  state === 'skipped' ? 'bg-info' :
                  i === current - 1   ? 'bg-orange' :
                  'bg-white/[0.06]'
                }`}
              />
            )
          })}
        </div>

        {/* Timer */}
        {timerSeconds && (
          <div className={clsx(
            'inline-flex items-center gap-2 mono font-bold text-[15px] tabular-nums px-3 py-1.5 rounded-md border flex-shrink-0',
            timerWarn
              ? 'text-orange bg-orange-soft border-orange/30'
              : 'text-yellow bg-yellow-soft border-yellow-rim',
            timerPulse && 'animate-pulse',
          )}>
            <span className={clsx(
              'w-1.5 h-1.5 rounded-full',
              timerWarn ? 'bg-orange' : 'bg-yellow',
            )} />
            {timeLeft}s
          </div>
        )}

        {/* Hint */}
        <button
          onClick={onHint}
          disabled={!canHint}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-shrink-0',
            canHint
              ? 'bg-yellow-soft border border-yellow-rim text-yellow hover:bg-yellow/20'
              : 'opacity-30 cursor-not-allowed bg-white/[0.04] border border-border text-text-secondary',
          )}
          aria-label="Hint"
        >
          <Lightbulb size={13} />
          {hintsLeft !== null ? hintsLeft : '∞'}
        </button>

        {/* Skip */}
        <button
          onClick={onSkip}
          disabled={!canSkip}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-shrink-0',
            canSkip
              ? 'bg-white/[0.04] border border-strong text-text-secondary hover:text-white hover:border-orange/40'
              : 'opacity-30 cursor-not-allowed bg-white/[0.04] border border-border text-text-secondary',
          )}
          aria-label="Skip"
        >
          <SkipForward size={13} />
          {skipsLeft !== null ? skipsLeft : '∞'}
        </button>
      </div>

      {/* Difficulty badge */}
      <div className="px-4 pb-3 max-w-[760px] mx-auto">
        <DifficultyBadge difficulty={difficulty} />
      </div>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={20} className="text-gold-500 flex-shrink-0" />
                <h3 className="font-display font-bold text-text-primary">Leave session?</h3>
              </div>
              <p className="text-sm text-text-secondary mb-5">
                Your progress on this session will be lost. Are you sure you want to quit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Keep going
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 h-10 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-500 active:scale-95 transition-all"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
