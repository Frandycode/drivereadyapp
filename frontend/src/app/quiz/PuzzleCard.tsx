import { useState } from 'react'
import { clsx } from 'clsx'
import { CheckCircle, XCircle, Plus } from 'lucide-react'

export interface PuzzleAnswer {
  id: string
  text: string
  isCorrect: boolean
}

interface PuzzleCardProps {
  question: string
  answers: PuzzleAnswer[]
  correctCount: number
  revealed: boolean
  onSubmit: (selectedIds: string[]) => void
}

export function PuzzleCard({ question, answers, correctCount, revealed, onSubmit }: PuzzleCardProps) {
  const [availableIds, setAvailableIds] = useState<string[]>(
    () => [...answers].sort(() => Math.random() - 0.5).map((a) => a.id)
  )
  const [droppedIds, setDroppedIds] = useState<string[]>([])
  const [dragOverZone, setDragOverZone] = useState<'drop' | 'pool' | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const answerMap = Object.fromEntries(answers.map((a) => [a.id, a]))
  const atLimit = droppedIds.length >= correctCount

  function onDragStart(id: string) { setDraggingId(id) }
  function onDragEnd() { setDraggingId(null); setDragOverZone(null) }

  function onDropInZone(e: React.DragEvent) {
    e.preventDefault()
    if (!draggingId || revealed) return
    if (droppedIds.includes(draggingId)) return
    if (atLimit && !droppedIds.includes(draggingId)) return  // cap at correctCount
    setAvailableIds((prev) => prev.filter((i) => i !== draggingId))
    setDroppedIds((prev) => [...prev, draggingId])
    setDragOverZone(null)
  }

  function onDropInPool(e: React.DragEvent) {
    e.preventDefault()
    if (!draggingId || revealed) return
    if (availableIds.includes(draggingId)) return
    setDroppedIds((prev) => prev.filter((i) => i !== draggingId))
    setAvailableIds((prev) => [...prev, draggingId])
    setDragOverZone(null)
  }

  function tapChip(id: string) {
    if (revealed) return
    if (availableIds.includes(id)) {
      if (atLimit) return   // already at limit, don't add more
      setAvailableIds((prev) => prev.filter((i) => i !== id))
      setDroppedIds((prev) => [...prev, id])
    } else {
      setDroppedIds((prev) => prev.filter((i) => i !== id))
      setAvailableIds((prev) => [...prev, id])
    }
  }

  function getChipStyle(id: string): string {
    if (!revealed) return ''
    const answer = answerMap[id]
    const isDropped = droppedIds.includes(id)
    if (answer.isCorrect && isDropped)   return 'bg-green-500/20 border-green-500 text-green-400'
    if (!answer.isCorrect && isDropped)  return 'bg-red-500/10 border-red-600 text-red-400'
    if (answer.isCorrect && !isDropped)  return 'bg-gold-500/10 border-gold-600 text-gold-500 animate-pulse'
    return 'opacity-40'
  }

  return (
    <div className="px-4 max-w-content mx-auto w-full space-y-4">
      {correctCount > 1 && (
        <div className="px-3 py-2 rounded-md bg-gold-500/10 border border-gold-600/30">
          <p className="text-xs text-gold-500 font-medium">
            Place all {correctCount} correct answers in the drop zone
          </p>
        </div>
      )}

      <div className="card-elevated">
        <p className="text-text-primary text-base font-medium leading-relaxed">{question}</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!atLimit || droppedIds.includes(draggingId ?? '')) setDragOverZone('drop')
        }}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={onDropInZone}
        className={clsx(
          'min-h-[80px] rounded-xl border-2 border-dashed p-3 transition-all duration-150',
          dragOverZone === 'drop'
            ? 'border-green-500 bg-green-500/5'
            : 'border-border bg-surface-2',
        )}
      >
        {droppedIds.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[56px] gap-2 text-text-secondary">
            <Plus size={16} />
            <span className="text-sm">
              Drop {correctCount === 1 ? 'your answer' : `up to ${correctCount} answers`} here
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {droppedIds.map((id) => {
              const answer = answerMap[id]
              return (
                <div
                  key={id}
                  draggable={!revealed}
                  onDragStart={() => onDragStart(id)}
                  onDragEnd={onDragEnd}
                  onClick={() => tapChip(id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full border text-sm font-medium cursor-grab active:cursor-grabbing transition-all select-none',
                    revealed
                      ? getChipStyle(id)
                      : 'bg-green-500/10 border-green-500 text-green-400 hover:bg-green-500/20',
                    draggingId === id && 'opacity-40 scale-95',
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {revealed && answer.isCorrect && droppedIds.includes(id) && <CheckCircle size={12} />}
                    {revealed && !answer.isCorrect && droppedIds.includes(id) && <XCircle size={12} />}
                    {answer.text}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        {/* Chip count indicator */}
        {!revealed && droppedIds.length > 0 && (
          <p className="text-xs text-text-secondary mt-2">
            {droppedIds.length} / {correctCount} placed
            {atLimit && correctCount > 1 ? ' — limit reached' : ''}
          </p>
        )}
      </div>

      {/* Answer pool */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragOverZone(null)}
        onDrop={onDropInPool}
        className={clsx(
          'rounded-xl p-3 transition-all duration-150',
          dragOverZone === 'pool' ? 'bg-surface-3' : 'bg-surface',
        )}
      >
        <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
          Answer choices
        </p>
        <div className="flex flex-wrap gap-2">
          {availableIds.map((id) => {
            const answer = answerMap[id]
            const blocked = atLimit && !droppedIds.includes(id)
            return (
              <div
                key={id}
                draggable={!revealed && !blocked}
                onDragStart={() => !blocked && onDragStart(answer.id)}
                onDragEnd={onDragEnd}
                onClick={() => tapChip(answer.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-full border text-sm font-medium select-none transition-all',
                  revealed
                    ? getChipStyle(id)
                    : blocked
                    ? 'bg-surface-2 border-border text-text-secondary opacity-30 cursor-not-allowed'
                    : 'bg-surface-2 border-border text-text-primary hover:border-green-700 cursor-grab active:cursor-grabbing',
                  draggingId === id && 'opacity-40 scale-95',
                )}
              >
                {answer.text}
              </div>
            )
          })}
          {availableIds.length === 0 && !revealed && (
            <p className="text-xs text-text-secondary italic">All chips placed</p>
          )}
        </div>
      </div>

      {!revealed && (
        <button
          onClick={() => onSubmit(droppedIds)}
          disabled={droppedIds.length === 0}
          className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40"
        >
          Submit
        </button>
      )}
    </div>
  )
}
