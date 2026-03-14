import { useState, useEffect } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { SessionHeader } from './SessionHeader'
import { QuestionCard, type Question } from './QuestionCard'
import { HintPanel } from './HintPanel'
import { QuizResults } from './QuizResults'

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
    startSession(input: $input) {
      id
    }
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
  chapterTitle?: string
  questionCount: number
  difficulty: 'pawn' | 'rogue' | 'king'
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

interface QuizSessionProps {
  config: QuizConfig
  onExit: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHintSkipAllowance(difficulty: string, questionCount: number): number | null {
  if (difficulty === 'pawn') return null
  if (difficulty === 'king') return 0
  return Math.max(1, Math.floor(questionCount / 5))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuizSession({ config, onExit }: QuizSessionProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [skipsUsed, setSkipsUsed] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [answerStates, setAnswerStates] = useState<SegmentState[]>([])
  const [totalXP, setTotalXP] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [timerResetKey, setTimerResetKey] = useState(0)

  const allowance = getHintSkipAllowance(config.difficulty, config.questionCount)
  const hintsLeft = allowance === null ? null : Math.max(0, allowance - hintsUsed)
  const skipsLeft = allowance === null ? null : Math.max(0, allowance - skipsUsed)

  const chapters = config.chapterNumber ? [config.chapterNumber] : undefined

  const { data, loading, error } = useQuery(GET_QUESTIONS, {
    variables: {
      stateCode: config.stateCode,
      count: config.questionCount,
      chapters,
    },
  })

  const [startSession] = useMutation(START_SESSION)
  const [submitAnswer] = useMutation(SUBMIT_ANSWER)
  const [completeSession] = useMutation(COMPLETE_SESSION)

  // Start session once questions load
  useEffect(() => {
    const questions = data?.questions ?? []
    if (questions.length === 0 || sessionId) return

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
    }).then((result) => {
      setSessionId(result.data?.startSession?.id ?? null)
    })
  }, [data])

  const questions: Question[] = data?.questions ?? []
  const current = questions[questionIndex]

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
    const xp = result.data?.submitAnswer?.xpEarned ?? 0
    setTotalXP((x) => x + xp)

    setAnswers((prev) => [
      ...prev,
      {
        questionId: current.id,
        questionText: current.questionText,
        isCorrect,
        skipped: false,
        hintUsed: showHint,
        chapter: current.chapter,
      },
    ])

    setAnswerStates((prev) => {
      const next = [...prev]
      next[questionIndex] = isCorrect ? 'correct' : 'wrong'
      return next
    })

    setRevealed(true)
  }

  async function handleNext() {
    setRevealed(false)
    setSelectedIds([])
    setShowHint(false)
    setTimerResetKey((k) => k + 1)

    if (questionIndex + 1 >= questions.length) {
      if (sessionId) await completeSession({ variables: { sessionId } })
      setShowResults(true)
    } else {
      setQuestionIndex((i) => i + 1)
    }
  }

  async function handleSkip() {
    if (!current) return
    if (config.difficulty === 'king') return
    if (skipsLeft !== null && skipsLeft <= 0) return

    setSkipsUsed((s) => s + 1)

    setAnswers((prev) => [
      ...prev,
      {
        questionId: current.id,
        questionText: current.questionText,
        isCorrect: false,
        skipped: true,
        hintUsed: false,
        chapter: current.chapter,
      },
    ])

    setAnswerStates((prev) => {
      const next = [...prev]
      next[questionIndex] = 'skipped'
      return next
    })

    setSelectedIds([])
    setShowHint(false)
    setTimerResetKey((k) => k + 1)

    if (questionIndex + 1 >= questions.length) {
      if (sessionId) await completeSession({ variables: { sessionId } })
      setShowResults(true)
    } else {
      setQuestionIndex((i) => i + 1)
    }
  }

  function handleHint() {
    if (config.difficulty === 'king') return
    if (hintsLeft !== null && hintsLeft <= 0) return
    setHintsUsed((h) => h + 1)
    setShowHint(true)
  }

  function handleTimerExpired() {
    if (!current || !sessionId) return

    setAnswers((prev) => [
      ...prev,
      {
        questionId: current.id,
        questionText: current.questionText,
        isCorrect: false,
        skipped: false,
        hintUsed: false,
        chapter: current.chapter,
      },
    ])

    setAnswerStates((prev) => {
      const next = [...prev]
      next[questionIndex] = 'wrong'
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
    setQuestionIndex(0)
    setSelectedIds([])
    setRevealed(false)
    setShowHint(false)
    setHintsUsed(0)
    setSkipsUsed(0)
    setAnswers([])
    setAnswerStates([])
    setTotalXP(0)
    setShowResults(false)
    setSessionId(null)
    setTimerResetKey(0)
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-sm animate-pulse">Loading questions...</p>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-primary font-medium mb-2">No questions found.</p>
        <p className="text-text-secondary text-sm mb-6">
          Try a different chapter or check back later.
        </p>
        <button onClick={onExit} className="btn-secondary">Go Back</button>
      </div>
    )
  }

  if (showResults) {
    const skipped = answers.filter((a) => a.skipped).length
    const score = answers.filter((a) => a.isCorrect).length
    return (
      <QuizResults
        score={score}
        total={questions.length}
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
        current={questionIndex + 1}
        total={questions.length}
        timerSeconds={config.timerSeconds}
        hintsLeft={hintsLeft}
        skipsLeft={skipsLeft}
        difficulty={config.difficulty}
        answerStates={answerStates}
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

      {/* Bottom action */}
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
            {questionIndex + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>

      {/* Hint panel overlay */}
      {showHint && (
        <HintPanel
          hint={current.hintText ?? null}
          difficulty={config.difficulty}
          onClose={() => setShowHint(false)}
        />
      )}
    </div>
  )
}