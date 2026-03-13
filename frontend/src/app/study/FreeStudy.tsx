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
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto">
          <button
            onClick={onExit}
            className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs text-text-secondary font-medium truncate">{deckName}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-text-secondary">
                {index + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-content mx-auto w-full">
        <p className="text-xs text-text-secondary text-center mb-4 uppercase tracking-wider font-medium">
          Free Study — no scoring
        </p>

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
            className="btn-secondary flex items-center gap-2 flex-1 justify-center disabled:opacity-30"
          >
            <ArrowLeft size={16} />
            Prev
          </button>
          <button
            onClick={goNext}
            className="btn-primary flex items-center gap-2 flex-1 justify-center"
          >
            {isLast ? 'Finish' : 'Next'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
