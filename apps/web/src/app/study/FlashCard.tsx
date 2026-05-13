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
        style={{ minHeight: '260px' }}
      >
        {/* Front — Question */}
        <div className="absolute inset-0 backface-hidden">
          <div className="card-elevated h-full flex flex-col justify-between p-6 rounded-lg min-h-[260px] relative overflow-hidden">
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background:
                  'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
              }}
            />
            <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[14px] h-[1.5px] rounded-full bg-orange" />
              Question
            </div>
            <p className="display text-white text-[clamp(17px,2vw,20px)] font-semibold leading-snug text-center flex-1 flex items-center justify-center px-2 tracking-[-0.2px]">
              {question}
            </p>
            <div className="flex items-center justify-between gap-3">
              {hint ? (
                <span className="text-[11px] text-yellow/90 italic line-clamp-1 max-w-[80%] inline-flex items-center gap-1.5">
                  <BiBulb size={13} className="text-yellow shrink-0" />
                  {hint}
                </span>
              ) : (
                <span />
              )}
              <span className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted">Tap to flip →</span>
            </div>
          </div>
        </div>

        {/* Back — Answer */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="card-elevated h-full flex flex-col justify-between p-6 rounded-lg border-correct/30 min-h-[260px] relative overflow-hidden bg-green-soft/40">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-correct" />
            <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-correct">
              <span className="w-[14px] h-[1.5px] rounded-full bg-correct" />
              Answer
            </div>
            <p className="text-white text-[15px] leading-relaxed text-center flex-1 flex items-center justify-center px-2">
              {answer}
            </p>
            <span className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted text-right">Tap to flip back →</span>
          </div>
        </div>
      </div>
    </div>
  )
}
