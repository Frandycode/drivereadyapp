import { useEffect, useRef, useState } from 'react'
import { X, Lightbulb, SkipForward } from 'lucide-react'
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
  onHint,
  onSkip,
  onExit,
  onTimerExpired,
  resetKey,
}: SessionHeaderProps) {
  const [timeLeft, setTimeLeft] = useState(timerSeconds ?? 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset timer whenever question changes
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

  const pct = total > 0 ? ((current) / total) * 100 : 0

  // Timer color
  const timerPct = timerSeconds ? timeLeft / timerSeconds : 1
  const timerColor =
    timerPct > 0.5 ? 'text-green-500' :
      timerPct > 0.2 ? 'text-gold-500' : 'text-red-400'
  const timerPulse = timerPct <= 0.1

  const canHint = difficulty !== 'king' && (hintsLeft === null || hintsLeft > 0)
  const canSkip = difficulty !== 'king' && (skipsLeft === null || skipsLeft > 0)

  return (
    <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border">
      {/* Top row */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 max-w-content mx-auto">
        {/* Exit */}
        <button
          onClick={onExit}
          className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
          aria-label="Exit"
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
          <div className="flex items-center gap-1">
            {Array.from({ length: total }).map((_, i) => {
              const state = answerStates[i] ?? 'unanswered'
              return (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${state === 'correct' ? 'bg-green-500' :
                      state === 'wrong' ? 'bg-red-500' :
                        state === 'skipped' ? 'bg-blue-500' :
                          i === current - 1 ? 'bg-green-700' :  // active question
                            'bg-surface-3'                             // unanswered
                    }`}
                />
              )
            })}
          </div>
        </div>

        {/* Hint button */}
        <button
          onClick={onHint}
          disabled={!canHint}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
            canHint
              ? 'bg-gold-500/10 border border-gold-600/40 text-gold-500 hover:bg-gold-500/20'
              : 'opacity-30 cursor-not-allowed bg-surface-2 border border-border text-text-secondary'
          )}
          aria-label="Use hint"
        >
          <Lightbulb size={13} />
          {hintsLeft !== null ? hintsLeft : '∞'}
        </button>

        {/* Skip button */}
        <button
          onClick={onSkip}
          disabled={!canSkip}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
            canSkip
              ? 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:border-green-700'
              : 'opacity-30 cursor-not-allowed bg-surface-2 border border-border text-text-secondary'
          )}
          aria-label="Skip question"
        >
          <SkipForward size={13} />
          {skipsLeft !== null ? skipsLeft : '∞'}
        </button>
      </div>

      {/* Difficulty badge */}
      <div className="px-4 pb-2 max-w-content mx-auto">
        <span className={clsx(
          'text-xs font-medium px-2 py-0.5 rounded-full border',
          difficulty === 'pawn' && 'text-green-400 bg-green-500/10 border-green-700/40',
          difficulty === 'rogue' && 'text-gold-500 bg-gold-500/10 border-gold-600/40',
          difficulty === 'king' && 'text-red-400 bg-red-500/10 border-red-700/40',
        )}>
          {difficulty === 'pawn' ? '♟ Pawn' : difficulty === 'rogue' ? '♞ Knight' : '♔ King'}
        </span>
      </div>
    </div>
  )
}
