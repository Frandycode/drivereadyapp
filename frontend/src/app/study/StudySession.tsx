import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { type StudyConfig } from './StudyPage'
import { FreeStudy } from './FreeStudy'
import { DrillMode } from './DrillMode'
import { TimerBlitz } from './TimerBlitz'
import { CheckCircle, RotateCcw, Home } from 'lucide-react'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_QUESTIONS_BY_IDS = gql`
  query GetQuestionsByIds($stateCode: String!) {
    questions(stateCode: $stateCode, count: 999) {
      id
      questionText
      explanation
      hintText
      chapter
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  id: string
  questionText: string
  explanation: string
  hintText?: string
  chapter: number
}

interface StudySessionProps {
  config: StudyConfig
  onExit: () => void
}

// ── Results Screen ─────────────────────────────────────────────────────────────

function ResultsScreen({
  mode,
  deckName,
  score,
  total,
  blitzSeconds,
  onRetry,
  onExit,
}: {
  mode: string
  deckName: string
  score: number
  total: number
  blitzSeconds?: number
  onRetry: () => void
  onExit: () => void
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  const headline =
    mode === 'blitz'
      ? `${score} cards flipped`
      : mode === 'drill'
      ? `${score} of ${total} mastered`
      : `${total} cards reviewed`

  const subline =
    mode === 'drill'
      ? pct >= 80
        ? 'Great job! 🎉'
        : pct >= 50
        ? 'Keep going — you\'re making progress!'
        : 'Keep drilling — you\'ll get there!'
      : mode === 'blitz'
      ? `in ${blitzSeconds} seconds`
      : 'Session complete'

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-700 flex items-center justify-center mb-6">
        <CheckCircle size={28} className="text-green-500" />
      </div>

      <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
        {deckName}
      </p>
      <h2 className="font-display text-3xl font-bold text-text-primary mb-1">{headline}</h2>
      <p className="text-text-secondary text-sm mb-10">{subline}</p>

      {/* Score ring for drill mode */}
      {mode === 'drill' && total > 0 && (
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#243D29" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#22C55E" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xl text-text-primary">
              {pct}%
            </span>
          </div>
        </div>
      )}

      <div className="w-full max-w-xs space-y-3">
        <button onClick={onRetry} className="btn-primary w-full flex items-center justify-center gap-2">
          <RotateCcw size={16} />
          Study Again
        </button>
        <button onClick={onExit} className="btn-secondary w-full flex items-center justify-center gap-2">
          <Home size={16} />
          Back to Study
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function StudySession({ config, onExit }: StudySessionProps) {
  const [showResults, setShowResults] = useState(false)
  const [resultScore, setResultScore] = useState(0)
  const [resultTotal, setResultTotal] = useState(0)
  const [sessionKey, setSessionKey] = useState(0)

  const { data, loading, error } = useQuery(GET_QUESTIONS_BY_IDS, {
    variables: { stateCode: 'ok' },
  })

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-sm animate-pulse">Loading cards...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center px-6">
        <div className="card border-red-800/30 text-center">
          <p className="text-red-400 text-sm mb-3">Failed to load flashcards.</p>
          <button onClick={onExit} className="btn-secondary">Go Back</button>
        </div>
      </div>
    )
  }

  // Filter to only the question IDs in this config
  const allQuestions: Question[] = data?.questions ?? []
  const idSet = new Set(config.questionIds)
  const questions = allQuestions.filter((q) => idSet.has(q.id))

  if (questions.length === 0) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-primary font-medium mb-2">No cards found for this deck.</p>
        <p className="text-text-secondary text-sm mb-6">Try a different chapter or deck source.</p>
        <button onClick={onExit} className="btn-secondary">Go Back</button>
      </div>
    )
  }

  function handleComplete(score: number, total: number) {
    setResultScore(score)
    setResultTotal(total)
    setShowResults(true)
  }

  function handleRetry() {
    setShowResults(false)
    setSessionKey((k) => k + 1)
  }

  if (showResults) {
    return (
      <ResultsScreen
        mode={config.mode}
        deckName={config.deckName}
        score={resultScore}
        total={resultTotal}
        blitzSeconds={config.blitzSeconds}
        onRetry={handleRetry}
        onExit={onExit}
      />
    )
  }

  // Route to the right mode
  const sharedProps = {
    key: sessionKey,
    questions,
    deckName: config.deckName,
    onExit,
  }

  if (config.mode === 'free') {
    return (
      <FreeStudy
        {...sharedProps}
        onComplete={() => handleComplete(questions.length, questions.length)}
      />
    )
  }

  if (config.mode === 'drill') {
    return (
      <DrillMode
        {...sharedProps}
        onComplete={(gotIt, total) => handleComplete(gotIt, total)}
      />
    )
  }

  if (config.mode === 'blitz') {
    return (
      <TimerBlitz
        {...sharedProps}
        seconds={config.blitzSeconds}
        onComplete={(flipped, total) => handleComplete(flipped, total)}
      />
    )
  }

  return null
}
