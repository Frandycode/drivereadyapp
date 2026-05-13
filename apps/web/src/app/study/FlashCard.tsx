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
import { clsx } from 'clsx'
import { BiBulb } from 'react-icons/bi'

interface FlashCardProps {
  question: string
  answer: string
  hint?: string
  flipped?: boolean
  onFlip?: () => void
  className?: string
}

export function FlashCard({ question, answer, hint, flipped, onFlip, className }: FlashCardProps) {
  const [localFlipped, setLocalFlipped] = useState(false)

  // Support both controlled (flipped prop) and uncontrolled usage
  const isFlipped = flipped !== undefined ? flipped : localFlipped

  function handleFlip() {
    if (onFlip) {
      onFlip()
    } else {
      setLocalFlipped((f) => !f)
    }
  }

  return (
    <div
      className={clsx('perspective-1200 w-full cursor-pointer select-none', className)}
      onClick={handleFlip}
      role="button"
      aria-label={isFlipped ? 'Show question' : 'Reveal answer'}
    >
      <div
        className={clsx(
          'relative w-full transform-style-3d transition-transform duration-500',
          isFlipped && '[transform:rotateY(180deg)]'
        )}
        style={{ minHeight: '220px' }}
      >
        {/* Front — Question */}
        <div className="absolute inset-0 backface-hidden">
          <div className="card-elevated h-full flex flex-col justify-between p-5 rounded-xl min-h-[220px]">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Question
            </span>
            <p className="text-text-primary text-lg font-medium leading-snug text-center flex-1 flex items-center justify-center px-2">
              {question}
            </p>
            <div className="flex items-center justify-between">
              {hint ? (
                <span className="text-xs text-text-secondary italic line-clamp-1 max-w-[80%] inline-flex items-center gap-1.5">
                  <BiBulb size={13} className="text-yellow shrink-0" />
                  {hint}
                </span>
              ) : (
                <span />
              )}
              <span className="text-xs text-text-secondary">Tap to flip →</span>
            </div>
          </div>
        </div>

        {/* Back — Answer */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="card-elevated h-full flex flex-col justify-between p-5 rounded-xl border-green-700/50 min-h-[220px]">
            <span className="text-xs font-medium text-green-500 uppercase tracking-wider">
              Answer
            </span>
            <p className="text-text-primary text-base leading-relaxed text-center flex-1 flex items-center justify-center px-2">
              {answer}
            </p>
            <span className="text-xs text-text-secondary text-right">Tap to flip back →</span>
          </div>
        </div>
      </div>
    </div>
  )
}
