import { X, Lightbulb } from 'lucide-react'

interface HintPanelProps {
  hint: string | null
  difficulty: 'pawn' | 'rogue' | 'king'
  onClose: () => void
}

export function HintPanel({ hint, difficulty, onClose }: HintPanelProps) {
  const label =
    difficulty === 'pawn'
      ? 'Hint — Pawn Mode (unlimited hints)'
      : 'Hint — Rogue Mode'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-surface border-t border-border rounded-t-2xl p-5 max-w-lg mx-auto">
          {/* Handle */}
          <div className="w-10 h-1 bg-surface-3 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-gold-500" />
              <span className="text-sm font-medium text-gold-500">{label}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Hint content */}
          <div className="bg-gold-500/5 border border-gold-600/30 rounded-lg p-4">
            <p className="text-text-primary text-sm leading-relaxed">
              {hint ?? 'Think carefully about the specific rules and regulations covered in this chapter.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary w-full mt-4"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  )
}
