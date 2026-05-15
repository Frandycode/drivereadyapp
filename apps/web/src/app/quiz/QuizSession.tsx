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
import { QuestionCard, type Question } from './QuestionCard'
import { HintPanel } from './HintPanel'
import { QuizResults } from './QuizResults'
import { QuizQuestionSkeleton } from '@/components/ui/Skeleton'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_QUESTIONS = gql`
  query GetQuizQuestions($stateCode: String!, $count: Int!, $chapters: [Int!]) {
    questions(stateCode: $stateCode, count: $count, chapters: $chapters) {
      id
      questionText
      explanation
      hintText
      correctCount
      chapter
      answers {
        id
        text
        isCorrect
        sortOrder
      }
    }
  }
`

const START_SESSION = gql`
  mutation StartQuizSession($input: StartSessionInput!) {
    startSession(input: $input) { id }
  }
`

const SUBMIT_ANSWER = gql`
  mutation SubmitAnswer($input: SubmitAnswerInput!) {
    submitAnswer(input: $input) {
      isCorrect
      correctAnswerIds
      explanation
      xpEarned
    }
  }
`

const COMPLETE_SESSION = gql`
  mutation CompleteSession($sessionId: ID!) {
    completeSession(sessionId: $sessionId) {
      xpEarned
      accuracy
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QuizConfig {
  stateCode: string
  chapterId?: string
  chapterNumber?: number
  chapterNumbers?: number[]   // overrides chapterNumber when set (multi-chapter groups)
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

function getHintSkipAllowance(difficulty: string, questionCount: number): number | null {
  if (difficulty === 'beginner') return null
  if (difficulty === 'expert') return 0
  return Math.max(1, Math.floor(questionCount / 5))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuizSession({ config, onExit, onQuizComplete }: { config: QuizConfig; onExit: () => void; onQuizComplete?: () => void }) {
  const [sessionId, setSessionId]       = useState<string | null>(null)
  const [retryKey, setRetryKey]         = useState(0)
  const [queue, setQueue]               = useState<Question[]>([])
  const [skippedOnce, setSkippedOnce]   = useState<Set<string>>(new Set())
  const [queueIndex, setQueueIndex]     = useState(0)
  const [selectedIds, setSelectedIds]   = useState<string[]>([])
  const [revealed, setRevealed]         = useState(false)
  const [showHint, setShowHint]         = useState(false)
  const [hintsUsed, setHintsUsed]       = useState(0)
  const [skipsUsed, setSkipsUsed]       = useState(0)
  const [answers, setAnswers]           = useState<AnswerRecord[]>([])
  const [answerStates, setAnswerStates] = useState<SegmentState[]>([])
  const [totalXP, setTotalXP]           = useState(0)
  const [showResults, setShowResults]   = useState(false)
  const [hasFiredComplete, setHasFiredComplete] = useState(false)

  useEffect(() => {
    if (showResults && !hasFiredComplete) {
      setHasFiredComplete(true)
      onQuizComplete?.()
    }
  }, [showResults, hasFiredComplete, onQuizComplete])
  const [timerResetKey, setTimerResetKey] = useState(0)

  const allowance = getHintSkipAllowance(config.difficulty, config.questionCount)
  const hintsLeft = allowance === null ? null : Math.max(0, allowance - hintsUsed)
  const skipsLeft = allowance === null ? null : Math.max(0, allowance - skipsUsed)
  const chapters  = config.chapterNumbers ?? (config.chapterNumber ? [config.chapterNumber] : undefined)

  const { data } = useQuery(GET_QUESTIONS, {
    variables: { stateCode: config.stateCode, count: config.questionCount, chapters },
  })

  const [startSession] = useMutation(START_SESSION)
  const [submitAnswer] = useMutation(SUBMIT_ANSWER)
  const [completeSession] = useMutation(COMPLETE_SESSION)

  // Start/restart session whenever data loads or retry is triggered
  useEffect(() => {
    const questions: Question[] = data?.questions ?? []
    if (questions.length === 0) return

    setQueue([...questions])
    setQueueIndex(0)
    setAnswerStates(new Array(questions.length).fill('unanswered'))

    startSession({
      variables: {
        input: {
          stateCode: config.stateCode,
          mode: 'quiz',
          difficulty: config.difficulty,
          questionCount: questions.length,
          chapters: chapters ?? [],
        },
      },
    }).then((r) => setSessionId(r.data?.startSession?.id ?? null))
  }, [data, retryKey])

  const current = queue[queueIndex]

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!current || !sessionId || selectedIds.length === 0) return

    const result = await submitAnswer({
      variables: {
        input: {
          sessionId,
          questionId: current.id,
          selectedAnswerIds: selectedIds,
          hintUsed: showHint,
          timeTakenMs: 0,
        },
      },
    })

    const isCorrect = result.data?.submitAnswer?.isCorrect ?? false
    const xp        = result.data?.submitAnswer?.xpEarned ?? 0
    setTotalXP((x) => x + xp)

    setAnswers((prev) => [...prev, {
      questionId:   current.id,
      questionText: current.questionText,
      isCorrect,
      skipped:  false,
      hintUsed: showHint,
      chapter:  current.chapter,
    }])

    // Mark segment state by original position
    const origIndex = (data?.questions ?? []).findIndex((q: Question) => q.id === current.id)
    setAnswerStates((prev) => {
      const next = [...prev]
      next[origIndex] = isCorrect ? 'correct' : 'wrong'
      return next
    })

    setRevealed(true)
  }

  async function handleNext() {
    setRevealed(false)
    setSelectedIds([])
    setShowHint(false)
    setTimerResetKey((k) => k + 1)

    const nextIndex = queueIndex + 1
    if (nextIndex >= queue.length) {
      if (sessionId) await completeSession({ variables: { sessionId } })
      setShowResults(true)
    } else {
      setQueueIndex(nextIndex)
    }
  }

  async function handleSkip() {
    if (!current) return
    if (config.difficulty === 'expert') return
    if (skipsLeft !== null && skipsLeft <= 0) return

    setSkipsUsed((s) => s + 1)

    const alreadySkipped = skippedOnce.has(current.id)

    if (alreadySkipped) {
      // Second skip — mark as skipped permanently
      setAnswers((prev) => [...prev, {
        questionId:   current.id,
        questionText: current.questionText,
        isCorrect:    false,
        skipped:      true,
        hintUsed:     false,
        chapter:      current.chapter,
      }])
      const origIndex = (data?.questions ?? []).findIndex((q: Question) => q.id === current.id)
      setAnswerStates((prev) => {
        const next = [...prev]
        next[origIndex] = 'skipped'
        return next
      })
      // Remove from queue, advance
      setQueue((prev) => prev.filter((_, i) => i !== queueIndex))
    } else {
      // First skip — move to end of queue
      setSkippedOnce((prev) => new Set([...prev, current.id]))
      setQueue((prev) => {
        const next = [...prev]
        const [removed] = next.splice(queueIndex, 1)
        next.push(removed)
        return next
      })
    }

    setSelectedIds([])
    setShowHint(false)
    setTimerResetKey((k) => k + 1)

    // Check if queue is now exhausted
    setQueue((prev) => {
      if (queueIndex >= prev.length) {
        if (sessionId) completeSession({ variables: { sessionId } })
        setShowResults(true)
      }
      return prev
    })
  }

  function handleHint() {
    if (config.difficulty === 'expert') return
    if (hintsLeft !== null && hintsLeft <= 0) return
    setHintsUsed((h) => h + 1)
    setShowHint(true)
  }

  function handleTimerExpired() {
    if (!current) return
    setAnswers((prev) => [...prev, {
      questionId:   current.id,
      questionText: current.questionText,
      isCorrect:    false,
      skipped:      false,
      hintUsed:     false,
      chapter:      current.chapter,
    }])
    const origIndex = (data?.questions ?? []).findIndex((q: Question) => q.id === current.id)
    setAnswerStates((prev) => {
      const next = [...prev]
      next[origIndex] = 'wrong'
      return next
    })
    setRevealed(true)
  }

  function handleSelect(id: string) {
    if (revealed) return
    if (current.correctCount === 1) {
      setSelectedIds([id])
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      )
    }
  }

  function handleRetry() {
    setSessionId(null)
    setQueue([])
    setSkippedOnce(new Set())
    setQueueIndex(0)
    setSelectedIds([])
    setRevealed(false)
    setShowHint(false)
    setHintsUsed(0)
    setSkipsUsed(0)
    setAnswers([])
    setAnswerStates([])
    setTotalXP(0)
    setShowResults(false)
    setTimerResetKey(0)
    setRetryKey((k) => k + 1)   // triggers useEffect to restart
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!current && !showResults) {
    return <QuizQuestionSkeleton />
  }

  if (showResults) {
    const skipped = answers.filter((a) => a.skipped).length
    const score   = answers.filter((a) => a.isCorrect).length
    return (
      <QuizResults
        score={score}
        total={queue.length || (data?.questions ?? []).length}
        skipped={skipped}
        hintsUsed={hintsUsed}
        xpEarned={totalXP}
        difficulty={config.difficulty}
        deckName={config.chapterTitle ?? 'Pop Quiz'}
        answers={answers}
        onRetry={handleRetry}
        onExit={onExit}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <SessionHeader
        current={queueIndex + 1}
        total={queue.length}
        timerSeconds={config.timerSeconds}
        hintsLeft={hintsLeft}
        skipsLeft={skipsLeft}
        difficulty={config.difficulty}
        answerStates={answerStates}
        isRevealed={revealed}
        onHint={handleHint}
        onSkip={handleSkip}
        onExit={onExit}
        onTimerExpired={handleTimerExpired}
        resetKey={timerResetKey}
      />

      <div className="flex-1 flex flex-col justify-center py-6">
        <QuestionCard
          question={current}
          selectedIds={selectedIds}
          revealed={revealed}
          onSelect={handleSelect}
        />
      </div>

      <div className="px-4 pb-8 max-w-content mx-auto w-full">
        {!revealed ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
            className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-primary w-full h-12 text-base font-semibold"
          >
            {queueIndex + 1 >= queue.length ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>

      {showHint && (
        <HintPanel
          hint={current.hintText ?? null}
          difficulty={config.difficulty}
          onClose={() => setShowHint(false)}
          questionId={current.id}
          attempt={1}
          wrongAnswerIds={[]}
        />
      )}
    </div>
  )
}
