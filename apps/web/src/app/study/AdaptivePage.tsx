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
    <div className="px-4 pt-4 pb-3 flex items-center gap-3 max-w-[760px] mx-auto">
      <div className="w-8 h-8 rounded-md bg-orange-soft border border-orange/30 flex items-center justify-center flex-shrink-0">
        <Target size={14} className="text-orange" />
      </div>
      <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange flex-1">
        <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
        Adaptive practice
      </div>
      <span className="mono text-[13px] font-medium text-text-secondary tabular-nums">
        <strong className="text-correct font-bold">{score.correct}</strong>
        <span className="mx-1">/</span>
        {score.total}
      </span>
    </div>
  )

  return (
    <PageWrapper header={header}>
      {!current && loading && (
        <div className="text-center py-12">
          <RefreshCw size={20} className="animate-spin mx-auto mb-3 text-orange" />
          <p className="mono text-[11px] tracking-[0.12em] uppercase font-semibold text-text-secondary">
            Choosing your next question…
          </p>
        </div>
      )}

      {current && (
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Chapter {String(current.chapter).padStart(2, '0')}
          </div>
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
              className="btn-primary w-full h-12 text-sm font-semibold disabled:opacity-40"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={loading}
              className="btn-primary w-full h-12 text-sm font-semibold"
            >
              {loading ? 'Loading…' : 'Next Question →'}
            </button>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
