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
import { useMutation, gql } from '@apollo/client'
import { Sparkles } from 'lucide-react'

const EXPLAIN_ANSWER = gql`
  mutation ExplainAnswer($questionId: ID!, $selectedAnswerId: ID!) {
    explainAnswer(questionId: $questionId, selectedAnswerId: $selectedAnswerId) {
      explanation
      generated
      generatedAt
    }
  }
`

interface Props {
  questionId: string
  selectedAnswerId: string | null
}

export function AIExplanationPanel({ questionId, selectedAnswerId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [explainAnswer, { data, loading, error }] = useMutation(EXPLAIN_ANSWER)

  if (!selectedAnswerId) return null

  async function handleExpand() {
    setExpanded(true)
    if (!data && selectedAnswerId) {
      try {
        await explainAnswer({ variables: { questionId, selectedAnswerId } })
      } catch {
        /* swallow — handled via Apollo error state */
      }
    }
  }

  const explanation = data?.explainAnswer?.explanation as string | undefined
  const generated   = data?.explainAnswer?.generated  as boolean | undefined

  if (!expanded) {
    return (
      <div className="mt-2">
        <button
          onClick={handleExpand}
          className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles size={12} />
          Why this answer?
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 px-4 py-3 rounded-lg bg-surface-2 border border-green-500/30">
      <p className="text-xs text-green-500 font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        <Sparkles size={11} />
        {generated ? 'Personalized explanation' : 'Explanation'}
      </p>
      {loading && <p className="text-sm text-text-secondary">Thinking…</p>}
      {error && <p className="text-sm text-red-400">Couldn't generate one — try again in a moment.</p>}
      {explanation && (
        <p className="text-sm text-text-primary leading-relaxed">{explanation}</p>
      )}
    </div>
  )
}
