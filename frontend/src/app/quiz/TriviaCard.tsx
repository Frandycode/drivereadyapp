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

import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { CheckCircle, XCircle } from 'lucide-react'

export interface TriviaOption {
  id: string
  questionText: string
  isCorrect: boolean
}

interface TriviaCardProps {
  answerText: string        // the "answer" shown at top (correct answer text)
  options: TriviaOption[]   // 4 question options to choose from
  revealed: boolean
  onSelect: (id: string) => void
  selectedId: string | null
}

export function TriviaCard({
  answerText,
  options,
  revealed,
  onSelect,
  selectedId,
}: TriviaCardProps) {
  const [shuffled, setShuffled] = useState<TriviaOption[]>([])

  useEffect(() => {
    setShuffled([...options].sort(() => Math.random() - 0.5))
  }, [answerText])

  function getOptionStyle(opt: TriviaOption): string {
    if (!revealed) {
      return selectedId === opt.id
        ? 'bg-green-500/10 border-green-500'
        : 'bg-surface border-border hover:border-green-700 hover:bg-surface-2 active:scale-[0.99]'
    }
    if (opt.isCorrect) return 'bg-green-500/15 border-green-500'
    if (selectedId === opt.id && !opt.isCorrect) return 'bg-red-500/10 border-red-600'
    return 'bg-surface border-border opacity-40'
  }

  return (
    <div className="px-4 max-w-content mx-auto w-full space-y-4">
      {/* Jeopardy label */}
      <p className="text-xs text-gold-500 uppercase tracking-wider font-medium text-center">
        Trivia — pick the correct question
      </p>

      {/* The "answer" card shown at top */}
      <div className="card-elevated border-gold-600/40 bg-gold-500/5">
        <p className="text-xs text-gold-500 font-medium uppercase tracking-wider mb-1">
          The Answer Is:
        </p>
        <p className="text-text-primary text-lg font-bold leading-snug">
          {answerText}
        </p>
      </div>

      {/* Question options */}
      <p className="text-xs text-text-secondary font-medium">
        Which question matches this answer?
      </p>

      <div className="space-y-2">
        {shuffled.map((opt) => {
          const isSelected = selectedId === opt.id

          return (
            <button
              key={opt.id}
              onClick={() => !revealed && onSelect(opt.id)}
              disabled={revealed}
              className={clsx(
                'w-full text-left rounded-lg border px-4 py-3 transition-all duration-150',
                'flex items-center gap-3',
                getOptionStyle(opt),
              )}
            >
              {/* Indicator */}
              <div className={clsx(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                !revealed && isSelected  && 'bg-green-500 border-green-500',
                !revealed && !isSelected && 'border-border',
                revealed && opt.isCorrect                    && 'bg-green-500 border-green-500',
                revealed && !opt.isCorrect && isSelected     && 'bg-red-500 border-red-500',
                revealed && !opt.isCorrect && !isSelected    && 'border-border',
              )}>
                {revealed && opt.isCorrect                 && <CheckCircle size={12} className="text-bg" />}
                {revealed && !opt.isCorrect && isSelected  && <XCircle size={12} className="text-bg" />}
                {!revealed && isSelected                   && <div className="w-2 h-2 rounded-full bg-bg" />}
              </div>

              <span className={clsx(
                'text-sm leading-snug flex-1',
                revealed && opt.isCorrect                   && 'text-green-400 font-medium',
                revealed && !opt.isCorrect && isSelected    && 'text-red-400',
                (!revealed || (!opt.isCorrect && !isSelected)) && 'text-text-primary',
              )}>
                {opt.questionText}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}