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
import { useQuery, useMutation, gql } from '@apollo/client'
import { SessionHeader } from './SessionHeader'
import { PuzzleCard } from './PuzzleCard'
import { QuizResults } from './QuizResults'

const GET_QUESTIONS = gql`
  query GetPuzzleQuestions($stateCode: String!, $count: Int!, $chapters: [Int!]) {
    questions(stateCode: $stateCode, count: $count, chapters: $chapters) {
      id
      questionText
      explanation
      hintText
      correctCount
      chapter
      answers { id text isCorrect sortOrder }
    }
  }
`
const START_SESSION = gql`
  mutation StartPuzzleSession($input: StartSessionInput!) {
    startSession(input: $input) { id }
  }
`
const SUBMIT_ANSWER = gql`
  mutation SubmitPuzzleAnswer($input: SubmitAnswerInput!) {
    submitAnswer(input: $input) { isCorrect xpEarned }
  }
`
const COMPLETE_SESSION = gql`
  mutation CompletePuzzleSession($sessionId: ID!) {
    completeSession(sessionId: $sessionId) { xpEarned accuracy }
  }
`

export interface PuzzleConfig {
  stateCode: string
  chapterNumber?: number
  chapterNumbers?: number[]
  chapterTitle?: string
  questionCount: number
  difficulty: 'beginner' | 'pro' | 'expert'
  timerSeconds: number | null
}

type SegmentState = 'unanswered' | 'correct' | 'wrong' | 'skipped'

interface AnswerRecord {
  questionId: string
  questionText: string
  isCorrect: boolean
  skipped: boolean
  hintUsed: boolean
  chapter: number
}

function getHintSkipAllowance(difficulty: string, count: number): number | null {
  if (difficulty === 'beginner') return null
  if (difficulty === 'expert') return 0
  return Math.max(1, Math.floor(count / 5))
}

export function PuzzleSession({ config, onExit }: { config: PuzzleConfig; onExit: () => void }) {
  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [retryKey, setRetryKey]         = useState(0)
  const [queue, setQueue]               = useState<any[]>([])
  const [skippedOnce, setSkippedOnce]   = useState<Set<string>>(new Set())
  const [queueIndex, setQueueIndex]     = useState(0)
  const [revealed, setRevealed]         = useState(false)
  const [hintsUsed, setHintsUsed]       = useState(0)
  const [skipsUsed, setSkipsUsed]       = useState(0)
  const [answers, setAnswers]           = useState<AnswerRecord[]>([])
  const [answerStates, setAnswerStates] = useState<SegmentState[]>([])
  const [totalXP, setTotalXP]           = useState(0)
  const [showResults, setShowResults]   = useState(false)
  const [timerResetKey, setTimerResetKey] = useState(0)
  const [cardKey, setCardKey]           = useState(0)

  const allowance = getHintSkipAllowance(config.difficulty, config.questionCount)
  const hintsLeft = allowance === null ? null : Math.max(0, allowance - hintsUsed)
  const skipsLeft = allowance === null ? null : Math.max(0, allowance - skipsUsed)
  const chapters  = config.chapterNumbers ?? (config.chapterNumber ? [config.chapterNumber] : undefined)

  const { data } = useQuery(GET_QUESTIONS, {
    variables: { stateCode: config.stateCode, count: config.questionCount, chapters },
  })

  const [startSession]    = useMutation(START_SESSION)
  const [submitAnswer]    = useMutation(SUBMIT_ANSWER)
  const [completeSession] = useMutation(COMPLETE_SESSION)

  useEffect(() => {
    const questions = data?.questions ?? []
    if (questions.length === 0) return
    setQueue([...questions])
    setQueueIndex(0)
    setAnswerStates(new Array(questions.length).fill('unanswered'))
    startSession({
      variables: {
        input: {
          stateCode: config.stateCode,
          mode: 'puzzle',
          difficulty: config.difficulty,
          questionCount: questions.length,
          chapters: chapters ?? [],
        },
      },
    }).then((r) => setSessionId(r.data?.startSession?.id ?? null))
  }, [data, retryKey])

  const current = queue[queueIndex]

  async function handleSubmit(selectedIds: string[]) {
    if (!current || !sessionId) return
    const result = await submitAnswer({
      variables: {
        input: {
          sessionId,
          questionId: current.id,
          selectedAnswerIds: selectedIds,
          hintUsed: false,
          timeTakenMs: 0,
        },
      },
    })
    const isCorrect = result.data?.submitAnswer?.isCorrect ?? false
    const xp        = result.data?.submitAnswer?.xpEarned ?? 0
    setTotalXP((x) => x + xp)
    setAnswers((prev) => [...prev, {
      questionId: current.id, questionText: current.questionText,
      isCorrect, skipped: false, hintUsed: false, chapter: current.chapter,
    }])
    const origIndex = (data?.questions ?? []).findIndex((q: any) => q.id === current.id)
    setAnswerStates((prev) => {
      const next = [...prev]; next[origIndex] = isCorrect ? 'correct' : 'wrong'; return next
    })
    setRevealed(true)
  }

  async function handleNext() {
    setRevealed(false)
    setTimerResetKey((k) => k + 1)
    setCardKey((k) => k + 1)
    const nextIndex = queueIndex + 1
    if (nextIndex >= queue.length) {
      if (sessionId) await completeSession({ variables: { sessionId } })
      setShowResults(true)
    } else {
      setQueueIndex(nextIndex)
    }
  }

  async function handleSkip() {
    if (!current || config.difficulty === 'expert') return
    if (skipsLeft !== null && skipsLeft <= 0) return
    setSkipsUsed((s) => s + 1)
    const alreadySkipped = skippedOnce.has(current.id)
    if (alreadySkipped) {
      setAnswers((prev) => [...prev, {
        questionId: current.id, questionText: current.questionText,
        isCorrect: false, skipped: true, hintUsed: false, chapter: current.chapter,
      }])
      const origIndex = (data?.questions ?? []).findIndex((q: any) => q.id === current.id)
      setAnswerStates((prev) => {
        const next = [...prev]; next[origIndex] = 'skipped'; return next
      })
      setQueue((prev) => prev.filter((_, i) => i !== queueIndex))
    } else {
      setSkippedOnce((prev) => new Set([...prev, current.id]))
      setQueue((prev) => {
        const next = [...prev]
        const [removed] = next.splice(queueIndex, 1)
        next.push(removed)
        return next
      })
    }
    setTimerResetKey((k) => k + 1)
    setCardKey((k) => k + 1)
    if (queueIndex >= queue.length - 1) {
      if (sessionId) await completeSession({ variables: { sessionId } })
      setShowResults(true)
    }
  }

  function handleTimerExpired() {
    if (!current) return
    setAnswers((prev) => [...prev, {
      questionId: current.id, questionText: current.questionText,
      isCorrect: false, skipped: false, hintUsed: false, chapter: current.chapter,
    }])
    const origIndex = (data?.questions ?? []).findIndex((q: any) => q.id === current.id)
    setAnswerStates((prev) => {
      const next = [...prev]; next[origIndex] = 'wrong'; return next
    })
    setRevealed(true)
  }

  function handleRetry() {
    setSessionId(null); setQueue([]); setSkippedOnce(new Set()); setQueueIndex(0)
    setRevealed(false); setHintsUsed(0); setSkipsUsed(0); setAnswers([])
    setAnswerStates([]); setTotalXP(0); setShowResults(false)
    setTimerResetKey(0); setCardKey(0); setRetryKey((k) => k + 1)
  }

  if (!current && !showResults) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-sm animate-pulse">Loading puzzle...</p>
      </div>
    )
  }

  if (showResults) {
    return (
      <QuizResults
        score={answers.filter((a) => a.isCorrect).length}
        total={queue.length || (data?.questions ?? []).length}
        skipped={answers.filter((a) => a.skipped).length}
        hintsUsed={hintsUsed} xpEarned={totalXP}
        difficulty={config.difficulty}
        deckName={config.chapterTitle ?? 'Puzzle'}
        answers={answers} onRetry={handleRetry} onExit={onExit}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <SessionHeader
        current={queueIndex + 1} total={queue.length}
        timerSeconds={config.timerSeconds} hintsLeft={hintsLeft} skipsLeft={skipsLeft}
        difficulty={config.difficulty} answerStates={answerStates} isRevealed={revealed}
        onHint={() => { if (config.difficulty !== 'expert' && (hintsLeft === null || hintsLeft > 0)) setHintsUsed((h) => h + 1) }}
        onSkip={handleSkip} onExit={onExit}
        onTimerExpired={handleTimerExpired} resetKey={timerResetKey}
      />
      <div className="flex-1 flex flex-col justify-center py-6">
        <PuzzleCard
          key={cardKey}
          question={current.questionText} answers={current.answers}
          correctCount={current.correctCount} revealed={revealed}
          onSubmit={handleSubmit}
        />
      </div>
      {revealed && (
        <div className="px-4 pb-8 max-w-content mx-auto w-full">
          <button onClick={handleNext} className="btn-primary w-full h-12 text-base font-semibold">
            {queueIndex + 1 >= queue.length ? 'See Results →' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  )
}
