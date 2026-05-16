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
import { FiCheckCircle as CheckCircle, FiXCircle as XCircle } from 'react-icons/fi'
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
    <div className="px-4 max-w-[760px] mx-auto w-full">
      {/* Multiple-answer notice */}
      {isMultiple && (
        <div className="mb-3 inline-flex items-center gap-2 bg-yellow-soft border border-yellow-rim rounded-full px-3.5 py-1 text-[11px] font-medium tracking-[0.06em] text-yellow uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-pulse-soft" />
          Select all {question.correctCount} correct answers
        </div>
      )}

      {/* Quiz card */}
      <div className="relative overflow-hidden bg-surface-2 border border-border rounded-xl px-6 sm:px-9 py-7 sm:py-9">
        {/* Tricolor stripe at top */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: 'linear-gradient(90deg, #F8DE22 0%, #F45B26 100%)',
          }}
          aria-hidden="true"
        />

        <div className="mono text-[10px] font-semibold tracking-[0.12em] uppercase text-orange mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange" />
          Question
        </div>

        <h2 className="display font-bold text-[clamp(22px,2.8vw,28px)] leading-[1.3] tracking-[-0.5px] text-white mb-7">
          {question.questionText}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {shuffledAnswers.map((answer, idx) => {
            const state      = getAnswerState(answer)
            const isSelected = selectedIds.includes(answer.id)
            const letter     = String.fromCharCode(65 + idx)

            const wrapClass = clsx(
              'group flex items-center gap-3.5 px-4 sm:px-5 py-3.5 sm:py-4 rounded-md border transition-all duration-150 text-left text-[14px]',
              !revealed && !isSelected && 'bg-white/[0.03] border-strong text-text-primary hover:bg-orange/[0.06] hover:border-orange/30',
              !revealed && isSelected  && 'bg-orange/[0.12] border-orange text-white',
              revealed && state === 'correct' && 'bg-green-soft border-correct text-correct',
              revealed && state === 'wrong'   && 'bg-wrong/10 border-wrong/60 text-wrong',
              revealed && state === 'missed'  && 'bg-yellow-soft border-yellow text-yellow animate-pulse-soft',
              revealed && state === 'idle'    && 'bg-white/[0.03] border-strong opacity-50',
            )

            const chipClass = clsx(
              'w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center mono text-[12px] font-bold transition-all',
              !revealed && !isSelected && 'bg-white/[0.06] text-text-muted group-hover:bg-orange/20 group-hover:text-orange',
              !revealed && isSelected  && 'bg-orange text-white',
              revealed && state === 'correct' && 'bg-correct text-bg',
              revealed && state === 'wrong'   && 'bg-wrong text-bg',
              revealed && state === 'missed'  && 'bg-yellow text-bg',
              revealed && state === 'idle'    && 'bg-white/[0.06] text-text-muted',
            )

            return (
              <button
                key={answer.id}
                onClick={() => !revealed && onSelect(answer.id)}
                disabled={revealed}
                className={wrapClass}
              >
                <span className={chipClass}>
                  {revealed && state === 'correct' ? <CheckCircle size={13} /> :
                   revealed && state === 'wrong'   ? <XCircle size={13} /> :
                   revealed && state === 'missed'  ? <CheckCircle size={13} /> :
                   letter}
                </span>
                <span className="flex-1 leading-snug">{answer.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Explanation — shown after reveal */}
      {revealed && (
        <>
          <div className="mt-4 px-4 py-3 rounded-md bg-surface-2 border border-border">
            <p className="mono text-[10px] text-text-muted font-semibold uppercase tracking-[0.12em] mb-1.5">
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