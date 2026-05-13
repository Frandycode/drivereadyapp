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

import { useEffect, useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { X, Lightbulb, Sparkles } from 'lucide-react'

const GET_ADAPTIVE_HINT = gql`
  mutation GetAdaptiveHint($questionId: ID!, $attempt: Int!, $wrongAnswerIds: [ID!]!) {
    getAdaptiveHint(questionId: $questionId, attempt: $attempt, wrongAnswerIds: $wrongAnswerIds)
  }
`

interface HintPanelProps {
  hint: string | null
  difficulty: 'pawn' | 'rogue' | 'king'
  onClose: () => void
  questionId?: string
  attempt?: number
  wrongAnswerIds?: string[]
}

export function HintPanel({ hint, difficulty, onClose, questionId, attempt = 1, wrongAnswerIds = [] }: HintPanelProps) {
  const label =
    difficulty === 'pawn'
      ? 'Hint — Pawn Mode (unlimited hints)'
      : 'Hint — Rogue Mode'

  const [adaptiveHint, setAdaptiveHint] = useState<string | null>(null)
  const [getHint, { loading }] = useMutation(GET_ADAPTIVE_HINT)

  useEffect(() => {
    if (!questionId) return
    getHint({ variables: { questionId, attempt, wrongAnswerIds } })
      .then((r) => {
        const text = r.data?.getAdaptiveHint
        if (text) setAdaptiveHint(text)
      })
      .catch(() => {})
  }, [questionId])

  const displayedHint = adaptiveHint ?? hint

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
            {loading && !displayedHint ? (
              <p className="text-text-secondary text-sm italic">Thinking of a hint…</p>
            ) : (
              <>
                <p className="text-text-primary text-sm leading-relaxed">
                  {displayedHint ?? 'Think carefully about the specific rules and regulations covered in this chapter.'}
                </p>
                {adaptiveHint && (
                  <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                    <Sparkles size={10} /> Personalized
                  </p>
                )}
              </>
            )}
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
