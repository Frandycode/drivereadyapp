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
import { GiChessPawn, GiChessKnight, GiChessKing } from 'react-icons/gi'
import { clsx } from 'clsx'

type SegmentState = 'unanswered' | 'correct' | 'wrong' | 'skipped'

interface SessionHeaderProps {
  current: number
  total: number
  timerSeconds: number | null
  hintsLeft: number | null
  skipsLeft: number | null
  difficulty: 'pawn' | 'rogue' | 'king'
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
  const timerColor =
    timerPct > 0.5 ? 'text-green-500' :
    timerPct > 0.2 ? 'text-gold-500' : 'text-red-400'
  const timerPulse = timerPct <= 0.1

  // Hint/skip disabled when: king mode, allowance exhausted, OR question already answered/revealed
  const canHint = !isRevealed && difficulty !== 'king' && (hintsLeft === null || hintsLeft > 0)
  const canSkip = !isRevealed && difficulty !== 'king' && (skipsLeft === null || skipsLeft > 0)

  return (
    <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 max-w-content mx-auto">
        {/* Exit */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
        >
          <X size={20} />
        </button>

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-secondary font-mono">
              {current} / {total}
            </span>
            {timerSeconds && (
              <span className={clsx(
                'text-sm font-mono font-bold tabular-nums',
                timerColor,
                timerPulse && 'animate-pulse'
              )}>
                {timeLeft}s
              </span>
            )}
          </div>
          {/* Segmented progress bar */}
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => {
              const state = answerStates[i] ?? 'unanswered'
              return (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                    state === 'correct'  ? 'bg-green-500' :
                    state === 'wrong'   ? 'bg-red-500' :
                    state === 'skipped' ? 'bg-blue-500' :
                    i === current - 1   ? 'bg-green-700' :
                    'bg-surface-3'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Hint */}
        <button
          onClick={onHint}
          disabled={!canHint}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
            canHint
              ? 'bg-gold-500/10 border border-gold-600/40 text-gold-500 hover:bg-gold-500/20'
              : 'opacity-30 cursor-not-allowed bg-surface-2 border border-border text-text-secondary'
          )}
        >
          <Lightbulb size={13} />
          {hintsLeft !== null ? hintsLeft : '∞'}
        </button>

        {/* Skip */}
        <button
          onClick={onSkip}
          disabled={!canSkip}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
            canSkip
              ? 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-green-700'
              : 'opacity-30 cursor-not-allowed bg-surface-2 border border-border text-text-secondary'
          )}
        >
          <SkipForward size={13} />
          {skipsLeft !== null ? skipsLeft : '∞'}
        </button>
      </div>

      {/* Difficulty badge */}
      <div className="px-4 pb-2 max-w-content mx-auto">
        <span className={clsx(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
          difficulty === 'pawn'  && 'text-bronze-500 bg-bronze-500/10 border-bronze-600/40',
          difficulty === 'rogue' && 'text-silver-400 bg-silver-500/10 border-silver-600/40',
          difficulty === 'king'  && 'text-yellow bg-yellow-soft border-yellow-rim',
        )}>
          {difficulty === 'pawn'  && <><GiChessPawn   size={12} /> Pawn</>}
          {difficulty === 'rogue' && <><GiChessKnight size={12} /> Knight</>}
          {difficulty === 'king'  && <><GiChessKing   size={12} /> King</>}
        </span>
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
