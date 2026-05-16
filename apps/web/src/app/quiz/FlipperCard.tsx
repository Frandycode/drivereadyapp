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

export interface FlipperAnswer {
  id: string
  text: string
  isCorrect: boolean
}

interface FlipperCardProps {
  question: string
  explanation: string
  answers: FlipperAnswer[]
  correctCount: number
  revealed: boolean
  onSubmit: (selectedIds: string[]) => void
}

export function FlipperCard({
  question,
  explanation,
  answers,
  correctCount,
  revealed,
  onSubmit,
}: FlipperCardProps) {
  const [shuffled] = useState(() => [...answers].sort(() => Math.random() - 0.5))
  const [placedIds, setPlacedIds]     = useState<string[]>([])
  const [draggingId, setDraggingId]   = useState<string | null>(null)
  const [dragOverCard, setDragOverCard] = useState(false)
  const [flipped, setFlipped]         = useState(false)

  useEffect(() => {
    if (revealed) setFlipped(true)
  }, [revealed])

  const atLimit = placedIds.length >= correctCount
  const answerMap = Object.fromEntries(answers.map((a) => [a.id, a]))
  const correctIds = answers.filter((a) => a.isCorrect).map((a) => a.id)
  const isCorrect =
    placedIds.length === correctIds.length &&
    correctIds.every((id) => placedIds.includes(id))

  function onDragStart(id: string) { setDraggingId(id) }
  function onDragEnd() { setDraggingId(null); setDragOverCard(false) }

  function onDropOnCard(e: React.DragEvent) {
    e.preventDefault()
    if (!draggingId || revealed) return
    if (placedIds.includes(draggingId)) return
    if (atLimit) return   // cap at correctCount
    setPlacedIds((prev) => [...prev, draggingId])
    setDragOverCard(false)
  }

  function onDropOffCard(e: React.DragEvent) {
    e.preventDefault()
    if (!draggingId || revealed) return
    setPlacedIds((prev) => prev.filter((i) => i !== draggingId))
  }

  function tapChip(id: string) {
    if (revealed) return
    if (placedIds.includes(id)) {
      setPlacedIds((prev) => prev.filter((i) => i !== id))
    } else {
      if (atLimit) return   // don't add if at limit
      setPlacedIds((prev) => [...prev, id])
    }
  }

  return (
    <div className="px-4 max-w-content mx-auto w-full space-y-4">
      <p className="text-xs text-text-secondary uppercase tracking-wider font-medium text-center">
        {correctCount > 1 ? `Place ${correctCount} answers on the card` : 'Place your answer on the card'}
      </p>

      {/* The flip card */}
      <div className="perspective-1200 w-full">
        <div
          className={clsx(
            'relative w-full transform-style-3d transition-transform duration-500',
            flipped && '[transform:rotateY(180deg)]'
          )}
          style={{ minHeight: '180px' }}
        >
          {/* Front — drop zone */}
          <div
            className="absolute inset-0 backface-hidden"
            onDragOver={(e) => { e.preventDefault(); if (!atLimit) setDragOverCard(true) }}
            onDragLeave={() => setDragOverCard(false)}
            onDrop={onDropOnCard}
          >
            <div className={clsx(
              'h-full rounded-xl border-2 border-dashed p-4 flex flex-col min-h-[180px] transition-all duration-150',
              dragOverCard
                ? 'border-green-500 bg-green-500/5'
                : placedIds.length > 0
                ? 'border-green-700/50 bg-surface-2'
                : 'border-border bg-surface-2'
            )}>
              {placedIds.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
                  Drag or tap your answer{correctCount > 1 ? 's' : ''} onto the card
                </div>
              ) : (
                <div className="flex-1 flex flex-wrap gap-2 content-start">
                  {placedIds.map((id) => (
                    <div
                      key={id}
                      draggable
                      onDragStart={() => onDragStart(id)}
                      onDragEnd={onDragEnd}
                      onClick={() => tapChip(id)}
                      className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-700 text-green-400 text-sm font-medium cursor-grab select-none"
                    >
                      {answerMap[id]?.text}
                    </div>
                  ))}
                </div>
              )}
              {!revealed && placedIds.length > 0 && (
                <p className="text-xs text-text-secondary text-center mt-1">
                  {placedIds.length} / {correctCount} placed
                  {atLimit && correctCount > 1 ? ' — limit reached' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Back — reveal */}
          <div
            className="absolute inset-0 backface-hidden"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className={clsx(
              'h-full rounded-xl border-2 p-4 flex flex-col min-h-[180px]',
              isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-600 bg-red-500/5'
            )}>
              <div className="flex items-center gap-2 mb-3">
                {isCorrect
                  ? <CheckCircle size={18} className="text-green-500" />
                  : <XCircle size={18} className="text-red-400" />}
                <span className={clsx('text-sm font-bold', isCorrect ? 'text-green-500' : 'text-red-400')}>
                  {isCorrect ? 'Correct!' : 'Not quite'}
                </span>
              </div>
              <div className="flex-1 space-y-2">
                {answers.map((a) => (
                  <div key={a.id} className={clsx(
                    'flex items-center gap-2 text-sm',
                    a.isCorrect ? 'text-green-400 font-medium' : 'text-text-secondary line-through opacity-50'
                  )}>
                    {a.isCorrect
                      ? <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                      : <XCircle size={13} className="text-red-400/50 flex-shrink-0" />}
                    {a.text}
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mt-3 pt-3 border-t border-border">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Question text below card */}
      <div className="card-elevated">
        <p className="text-text-primary text-base font-medium leading-relaxed">{question}</p>
      </div>

      {/* Answer pool */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropOffCard}
        className="rounded-xl bg-surface p-3"
      >
        <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
          Answer choices
        </p>
        <div className="flex flex-wrap gap-2">
          {shuffled
            .filter((a) => !placedIds.includes(a.id))
            .map((answer) => {
              const blocked = atLimit
              return (
                <div
                  key={answer.id}
                  draggable={!revealed && !blocked}
                  onDragStart={() => !blocked && onDragStart(answer.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => tapChip(answer.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full border text-sm font-medium select-none transition-all',
                    revealed
                      ? 'opacity-30 cursor-default'
                      : blocked
                      ? 'bg-surface-2 border-border text-text-secondary opacity-30 cursor-not-allowed'
                      : 'bg-surface-2 border-border text-text-primary hover:border-green-700 cursor-grab active:cursor-grabbing',
                    draggingId === answer.id && 'opacity-40 scale-95',
                  )}
                >
                  {answer.text}
                </div>
              )
            })}
          {shuffled.filter((a) => !placedIds.includes(a.id)).length === 0 && !revealed && (
            <p className="text-xs text-text-secondary italic">All chips placed on card</p>
          )}
        </div>
      </div>

      {!revealed && (
        <button
          onClick={() => onSubmit(placedIds)}
          disabled={placedIds.length === 0}
          className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40"
        >
          Flip Card
        </button>
      )}
    </div>
  )
}
