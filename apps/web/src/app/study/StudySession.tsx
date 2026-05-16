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

import { useQuery, gql } from '@apollo/client'
import { useState } from 'react'
import { type StudyConfig } from './StudyPage'
import { FreeStudy } from './FreeStudy'
import { DrillMode } from './DrillMode'
import { TimerBlitz } from './TimerBlitz'
import { FiCheckCircle as CheckCircle, FiRotateCcw as RotateCcw, FiHome as Home, FiAlertTriangle as AlertTriangle } from 'react-icons/fi'
import { useUserStore } from '@/stores'

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
        ? 'Great job! Keep it up.'
        : pct >= 50
        ? 'Keep going — you\'re making progress!'
        : 'Keep drilling — you\'ll get there!'
      : mode === 'blitz'
      ? `in ${blitzSeconds} seconds`
      : 'Session complete'

  const ringColor =
    pct >= 80 ? '#22C55E' : pct >= 50 ? '#F8DE22' : '#F45B26'
  const ringTone =
    pct >= 80 ? 'text-correct' : pct >= 50 ? 'text-yellow' : 'text-orange'

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Tricolor stripe at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background:
            'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
        }}
      />

      <div className="w-14 h-14 rounded-full bg-green-soft border border-correct/30 flex items-center justify-center mb-6 animate-fade-up">
        <CheckCircle size={26} className="text-correct" />
      </div>

      <div className="inline-flex items-center gap-2 mb-4 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
        <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
        Session complete · {deckName}
      </div>

      <h2 className="display font-extrabold text-[clamp(28px,4.5vw,44px)] leading-[1.05] tracking-[-1px] text-white mb-2">
        {headline}
      </h2>
      <p className="text-text-secondary text-sm mb-9 max-w-[360px]">{subline}</p>

      {/* Score ring for drill mode */}
      {mode === 'drill' && total > 0 && (
        <div className="mb-9">
          <div className="relative w-28 h-28 mx-auto">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={ringColor} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center mono font-bold text-[22px] tabular-nums ${ringTone}`}>
              {pct}%
            </span>
          </div>
        </div>
      )}

      <div className="w-full max-w-xs space-y-3">
        <button onClick={onRetry} className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold">
          <RotateCcw size={16} />
          Study Again
        </button>
        <button onClick={onExit} className="btn-secondary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold">
          <Home size={16} />
          Back to Study
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function StudySession({ config, onExit }: StudySessionProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')
  const [showResults, setShowResults] = useState(false)
  const [resultScore, setResultScore] = useState(0)
  const [resultTotal, setResultTotal] = useState(0)
  const [sessionKey, setSessionKey] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const exitConfirmModal = showExitConfirm ? (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
        <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
            }}
          />
          <div className="flex items-center gap-3 mb-3 mt-1">
            <div className="w-9 h-9 rounded-md bg-yellow-soft border border-yellow-rim flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={16} className="text-yellow" />
            </div>
            <h3 className="display font-bold text-base text-white">Leave session?</h3>
          </div>
          <p className="text-sm text-text-secondary mb-5">
            Your progress on this session will be lost. Are you sure you want to quit?
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowExitConfirm(false)} className="btn-secondary flex-1 h-10 text-sm font-semibold">
              Keep going
            </button>
            <button
              onClick={onExit}
              className="flex-1 h-10 rounded-md bg-wrong/15 border border-wrong/40 text-wrong text-sm font-semibold hover:bg-wrong hover:text-white active:scale-95 transition-all"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    </>
  ) : null

  const { data, loading, error } = useQuery(GET_QUESTIONS_BY_IDS, {
    variables: { stateCode },
  })

  if (loading) {
    return (
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
          <p className="mono text-[11px] tracking-[0.12em] uppercase font-semibold">Loading cards…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex items-center justify-center px-6">
        <div className="card border-wrong/30 text-center max-w-sm">
          <div className="mono text-[10px] font-semibold tracking-[0.12em] uppercase text-wrong mb-2">Error</div>
          <p className="text-text-primary text-sm mb-4">Failed to load flashcards.</p>
          <button onClick={onExit} className="btn-secondary h-10 px-4 text-sm font-semibold">Go Back</button>
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
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col items-center justify-center px-6 text-center">
        <div className="mono text-[10px] font-semibold tracking-[0.12em] uppercase text-orange mb-3">Empty deck</div>
        <p className="display font-bold text-xl text-white mb-2">No cards found for this deck.</p>
        <p className="text-text-secondary text-sm mb-6">Try a different chapter or deck source.</p>
        <button onClick={onExit} className="btn-secondary h-10 px-5 text-sm font-semibold">Go Back</button>
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
    onExit: () => setShowExitConfirm(true),
  }

  if (config.mode === 'free') {
    return (
      <>
        <FreeStudy
          {...sharedProps}
          onComplete={() => handleComplete(questions.length, questions.length)}
        />
        {exitConfirmModal}
      </>
    )
  }

  if (config.mode === 'drill') {
    return (
      <>
        <DrillMode
          {...sharedProps}
          onComplete={(gotIt, total) => handleComplete(gotIt, total)}
        />
        {exitConfirmModal}
      </>
    )
  }

  if (config.mode === 'blitz') {
    return (
      <>
        <TimerBlitz
          {...sharedProps}
          seconds={config.blitzSeconds}
          onComplete={(flipped, total) => handleComplete(flipped, total)}
        />
        {exitConfirmModal}
      </>
    )
  }

  return null
}
