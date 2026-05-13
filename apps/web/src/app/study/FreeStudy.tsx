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

import { useState } from 'react'
import { FlashCard } from './FlashCard'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'

interface Question {
  id: string
  questionText: string
  explanation: string
  hintText?: string
}

interface FreeStudyProps {
  questions: Question[]
  deckName: string
  onExit: () => void
  onComplete: () => void
}

export function FreeStudy({ questions, deckName, onExit, onComplete }: FreeStudyProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const current = questions[index]
  const isLast = index === questions.length - 1

  function goNext() {
    setFlipped(false)
    setTimeout(() => {
      if (isLast) {
        onComplete()
      } else {
        setIndex((i) => i + 1)
      }
    }, 150)
  }

  function goPrev() {
    if (index === 0) return
    setFlipped(false)
    setTimeout(() => setIndex((i) => i - 1), 150)
  }

  const pct = Math.round(((index + 1) / questions.length) * 100)

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
            <strong className="text-white font-bold">{index + 1}</strong>
            <span className="mx-1">/</span>
            {questions.length}
          </div>

          <div className="flex-1 min-w-0 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-orange rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted truncate max-w-[140px] hidden sm:block">
            {deckName}
          </div>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-[760px] mx-auto w-full">
        <div className="inline-flex items-center justify-center gap-2 mb-5 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
          Free study · no scoring
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
        </div>

        <FlashCard
          question={current.questionText}
          answer={current.explanation}
          hint={current.hintText}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="btn-secondary h-11 flex items-center gap-2 flex-1 justify-center disabled:opacity-30 text-sm font-semibold"
          >
            <ArrowLeft size={16} />
            Prev
          </button>
          <button
            onClick={goNext}
            className="btn-primary h-11 flex items-center gap-2 flex-1 justify-center text-sm font-semibold"
          >
            {isLast ? 'Finish' : 'Next'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
