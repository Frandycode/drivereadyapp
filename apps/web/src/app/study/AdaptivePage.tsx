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
import { useLazyQuery, gql } from '@apollo/client'
import { Target, RefreshCw } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { QuestionCard, type Question } from '@/app/quiz/QuestionCard'

const NEXT_ADAPTIVE = gql`
  query NextAdaptiveQuestion($stateCode: String!) {
    nextAdaptiveQuestion(stateCode: $stateCode) {
      id questionText explanation correctCount chapter hintText
      answers { id text isCorrect sortOrder }
    }
  }
`

interface Props {
  stateCode: string
}

export function AdaptivePage({ stateCode }: Props) {
  const [current, setCurrent]         = useState<Question | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [revealed, setRevealed]       = useState(false)
  const [score, setScore]             = useState({ correct: 0, total: 0 })

  const [fetchNext, { loading }] = useLazyQuery(NEXT_ADAPTIVE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.nextAdaptiveQuestion) {
        setCurrent(data.nextAdaptiveQuestion)
        setSelectedIds([])
        setRevealed(false)
      }
    },
  })

  useEffect(() => {
    fetchNext({ variables: { stateCode } })
  }, [])

  function handleSelect(id: string) {
    if (revealed || !current) return
    if (current.correctCount > 1) {
      setSelectedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
    } else {
      setSelectedIds([id])
    }
  }

  function handleSubmit() {
    if (!current || selectedIds.length === 0) return
    setRevealed(true)
    const correctIds = current.answers.filter((a) => a.isCorrect).map((a) => a.id)
    const ok = selectedIds.length === correctIds.length && selectedIds.every((id) => correctIds.includes(id))
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
  }

  function handleNext() {
    fetchNext({ variables: { stateCode } })
  }

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <Target size={18} className="text-green-500" />
      <h1 className="font-display text-base font-bold text-text-primary flex-1">Adaptive Practice</h1>
      <span className="text-xs font-mono text-text-secondary">
        {score.correct} / {score.total}
      </span>
    </div>
  )

  return (
    <PageWrapper header={header}>
      {!current && loading && (
        <div className="text-center text-text-secondary text-sm py-12">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
          Choosing your next question…
        </div>
      )}

      {current && (
        <div className="space-y-4">
          <p className="text-xs text-text-secondary uppercase tracking-wider">Chapter {current.chapter}</p>
          <QuestionCard
            question={current}
            selectedIds={selectedIds}
            revealed={revealed}
            onSelect={handleSelect}
          />
          {!revealed ? (
            <button
              onClick={handleSubmit}
              disabled={selectedIds.length === 0}
              className="btn-primary w-full h-12 disabled:opacity-40"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={loading}
              className="btn-primary w-full h-12"
            >
              {loading ? 'Loading…' : 'Next Question →'}
            </button>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
