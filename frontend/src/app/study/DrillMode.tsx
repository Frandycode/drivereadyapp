import { useState } from 'react'
import { FlashCard } from './FlashCard'
import { X, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'

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
  const masteredCount = questions.length - remaining + (gotItIds.has(current?.id) ? 0 : 0)

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
            <p className="text-xs text-text-secondary font-medium truncate">{deckName} — Drill</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-green-500 font-mono">
                ✓ {gotItIds.size} mastered
              </span>
              <span className="text-xs text-text-secondary font-mono">
                ↩ {remaining} remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-content mx-auto w-full">
        {!flipped && (
          <p className="text-xs text-text-secondary text-center mb-4 uppercase tracking-wider font-medium">
            Think, then flip to check
          </p>
        )}
        {flipped && (
          <p className="text-xs text-green-500 text-center mb-4 uppercase tracking-wider font-medium">
            How did you do?
          </p>
        )}

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
              className="btn-secondary w-full"
            >
              Reveal Answer
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleStillLearning}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md
                           bg-surface-2 border border-red-800/50 text-red-400
                           hover:bg-red-900/20 active:scale-95 transition-all duration-100 font-medium"
              >
                <ThumbsDown size={16} />
                Still Learning
              </button>
              <button
                onClick={handleGotIt}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-md
                           bg-green-500/10 border border-green-700 text-green-400
                           hover:bg-green-500/20 active:scale-95 transition-all duration-100 font-medium"
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
            className="flex items-center justify-center gap-1.5 mt-4 text-xs text-text-secondary hover:text-text-primary transition-colors mx-auto"
          >
            <RotateCcw size={12} />
            Exit session
          </button>
        )}
      </div>
    </div>
  )
}
