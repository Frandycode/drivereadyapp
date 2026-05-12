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
import { AIExplanationPanel } from './AIExplanationPanel'

export interface Answer {
  id: string
  text: string
  isCorrect: boolean
  sortOrder: number
}

export interface Question {
  id: string
  questionText: string
  explanation: string
  hintText?: string
  correctCount: number
  chapter: number
  answers: Answer[]
}

type AnswerState = 'idle' | 'correct' | 'wrong' | 'missed'

interface QuestionCardProps {
  question: Question
  selectedIds: string[]
  revealed: boolean
  onSelect: (id: string) => void
}

export function QuestionCard({ question, selectedIds, revealed, onSelect }: QuestionCardProps) {
  const isMultiple = question.correctCount > 1

  const [shuffledAnswers, setShuffledAnswers] = useState(() =>
    [...question.answers].sort(() => Math.random() - 0.5)
  )

  // Only reshuffle when the question itself changes
  useEffect(() => {
    setShuffledAnswers([...question.answers].sort(() => Math.random() - 0.5))
  }, [question.id])

  function getAnswerState(answer: Answer): AnswerState {
    if (!revealed) return 'idle'
    const isSelected = selectedIds.includes(answer.id)
    if (answer.isCorrect && isSelected) return 'correct'
    if (answer.isCorrect && !isSelected) return 'missed'
    if (!answer.isCorrect && isSelected) return 'wrong'
    return 'idle'
  }

  return (
    <div className="px-4 max-w-content mx-auto w-full">
      {/* Multiple answer notice */}
      {isMultiple && (
        <div className="mb-3 px-3 py-2 rounded-md bg-gold-500/10 border border-gold-600/30">
          <p className="text-xs text-gold-500 font-medium">
            Select all {question.correctCount} correct answers
          </p>
        </div>
      )}

      {/* Question text */}
      <div className="card-elevated mb-4">
        <p className="text-text-primary text-base font-medium leading-relaxed">
          {question.questionText}
        </p>
      </div>

      {/* Answer options */}
      <div className="space-y-2">
        {shuffledAnswers.map((answer) => {
          const state = getAnswerState(answer)
          const isSelected = selectedIds.includes(answer.id)

          return (
            <button
              key={answer.id}
              onClick={() => !revealed && onSelect(answer.id)}
              disabled={revealed}
              className={clsx(
                'w-full text-left rounded-lg border px-4 py-3 transition-all duration-150',
                'flex items-center gap-3',
                // Idle states
                !revealed && !isSelected && 'bg-surface border-border hover:border-green-700 hover:bg-surface-2 active:scale-[0.99]',
                !revealed && isSelected  && 'bg-green-500/10 border-green-500',
                // Revealed states
                revealed && state === 'correct' && 'bg-green-500/15 border-green-500',
                revealed && state === 'wrong'   && 'bg-red-500/10 border-red-600',
                revealed && state === 'missed'  && 'bg-gold-500/10 border-gold-600 animate-pulse',
                revealed && state === 'idle'    && 'bg-surface border-border opacity-50',
              )}
            >
              {/* Selection indicator */}
              <div className={clsx(
                'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                !revealed && isSelected  && 'bg-green-500 border-green-500',
                !revealed && !isSelected && 'border-border',
                revealed && state === 'correct' && 'bg-green-500 border-green-500',
                revealed && state === 'wrong'   && 'bg-red-500 border-red-500',
                revealed && state === 'missed'  && 'bg-gold-500 border-gold-500',
                revealed && state === 'idle'    && 'border-border',
              )}>
                {revealed && state === 'correct' && <CheckCircle size={12} className="text-bg" />}
                {revealed && state === 'wrong'   && <XCircle size={12} className="text-bg" />}
                {revealed && state === 'missed'  && <CheckCircle size={12} className="text-bg" />}
                {!revealed && isSelected         && <div className="w-2 h-2 rounded-full bg-bg" />}
              </div>

              <span className={clsx(
                'text-sm leading-snug flex-1',
                revealed && state === 'correct' && 'text-green-400 font-medium',
                revealed && state === 'wrong'   && 'text-red-400',
                revealed && state === 'missed'  && 'text-gold-500 font-medium',
                (!revealed || state === 'idle')  && 'text-text-primary',
              )}>
                {answer.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Explanation — shown after reveal */}
      {revealed && (
        <>
          <div className="mt-4 px-4 py-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">
              Explanation
            </p>
            <p className="text-sm text-text-primary leading-relaxed">
              {question.explanation}
            </p>
          </div>
          <AIExplanationPanel
            questionId={question.id}
            selectedAnswerId={selectedIds[0] ?? null}
          />
        </>
      )}
    </div>
  )
}