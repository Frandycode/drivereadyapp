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
import { X, ThumbsUp, ThumbsDown, RotateCcw, CornerDownLeft } from 'lucide-react'

interface Question {
  id: string
  questionText: string
  explanation: string
  hintText?: string
}

interface DrillModeProps {
  questions: Question[]
  deckName: string
  onExit: () => void
  onComplete: (gotItCount: number, total: number) => void
}

export function DrillMode({ questions, deckName, onExit, onComplete }: DrillModeProps) {
  const [deck, setDeck] = useState<Question[]>([...questions])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [gotItIds, setGotItIds] = useState<Set<string>>(new Set())
  const [totalSeen, setTotalSeen] = useState(0)

  const current = deck[index]

  function handleGotIt() {
    setGotItIds((prev) => new Set([...prev, current.id]))
    setTotalSeen((n) => n + 1)
    advance(true)
  }

  function handleStillLearning() {
    setTotalSeen((n) => n + 1)
    advance(false)
  }

  function advance(gotIt: boolean) {
    setFlipped(false)

    setTimeout(() => {
      const newDeck = deck.filter((_, i) => i !== index)

      if (!gotIt) {
        // Re-add at end of deck
        newDeck.push(current)
      }

      if (newDeck.length === 0) {
        onComplete(gotItIds.size + (gotIt ? 1 : 0), questions.length)
        return
      }

      setDeck(newDeck)
      setIndex(Math.min(index, newDeck.length - 1))
    }, 150)
  }

  const remaining = deck.length
  const pct = questions.length > 0 ? (gotItIds.size / questions.length) * 100 : 0

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
            <strong className="text-correct font-bold">{gotItIds.size}</strong>
            <span className="mx-1">/</span>
            {questions.length}
            <span className="ml-1 text-text-muted text-[11px]">mastered</span>
          </div>

          <div className="flex-1 min-w-0 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-correct rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="inline-flex items-center gap-1 mono text-[10px] font-semibold tracking-[0.1em] uppercase text-yellow flex-shrink-0">
            <CornerDownLeft size={11} />
            {remaining} left
          </div>
        </div>

        <div className="px-4 pb-3 max-w-[760px] mx-auto">
          <span className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted truncate block">
            {deckName} · Drill
          </span>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-[760px] mx-auto w-full">
        <div className="inline-flex items-center justify-center gap-2 mb-5 mono text-[10px] font-semibold tracking-[0.14em] uppercase">
          {flipped ? (
            <>
              <span className="w-[18px] h-[1.5px] rounded-full bg-correct" />
              <span className="text-correct">How did you do?</span>
              <span className="w-[18px] h-[1.5px] rounded-full bg-correct" />
            </>
          ) : (
            <>
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              <span className="text-orange">Think, then flip to check</span>
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            </>
          )}
        </div>

        <FlashCard
          question={current.questionText}
          answer={current.explanation}
          hint={current.hintText}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
        />

        {/* Action buttons — only show after flip */}
        <div className="mt-6">
          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className="btn-secondary w-full h-11 text-sm font-semibold"
            >
              Reveal Answer
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleStillLearning}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md
                           bg-wrong/10 border border-wrong/40 text-wrong
                           hover:bg-wrong hover:text-white active:scale-95 transition-all duration-100 text-sm font-semibold"
              >
                <ThumbsDown size={16} />
                Still Learning
              </button>
              <button
                onClick={handleGotIt}
                className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md
                           bg-green-soft border border-correct/40 text-correct
                           hover:bg-correct hover:text-white active:scale-95 transition-all duration-100 text-sm font-semibold"
              >
                <ThumbsUp size={16} />
                Got It!
              </button>
            </div>
          )}
        </div>

        {/* Restart hint */}
        {totalSeen > 0 && (
          <button
            onClick={onExit}
            className="inline-flex items-center justify-center gap-1.5 mt-5 mono text-[10px] tracking-[0.1em] uppercase text-text-muted hover:text-white transition-colors mx-auto"
          >
            <RotateCcw size={11} />
            Exit session
          </button>
        )}
      </div>
    </div>
  )
}
