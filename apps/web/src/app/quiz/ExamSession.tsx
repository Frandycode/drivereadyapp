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

import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { clsx } from 'clsx'
import { X, Clock, CheckCircle, XCircle, AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { useUserStore } from '@/stores'
import { QuizQuestionSkeleton } from '@/components/ui/Skeleton'

// ── GQL ───────────────────────────────────────────────────────────────────────

const GET_EXAM = gql`
  query GetExamQuestions($stateCode: String!) {
    questions(stateCode: $stateCode, count: 50) {
      id questionText correctCount chapter
      answers { id text isCorrect sortOrder }
    }
    chapters(stateCode: $stateCode) {
      number title
    }
  }
`

const GET_EXAM_COACHING = gql`
  mutation GetExamCoaching($overallCorrect: Int!, $overallTotal: Int!, $chapters: [ExamChapterStatInput!]!) {
    getExamCoaching(overallCorrect: $overallCorrect, overallTotal: $overallTotal, chapters: $chapters)
  }
`

// ── Constants ─────────────────────────────────────────────────────────────────

const EXAM_TOTAL    = 50
const EXAM_PASS     = 38
const EXAM_DURATION = 3600 // 60 minutes

// ── Types ─────────────────────────────────────────────────────────────────────

interface Answer   { id: string; text: string; isCorrect: boolean }
interface Question { id: string; questionText: string; correctCount: number; chapter: number; answers: Answer[] }

interface ExamRecord {
  questionId: string
  chapter: number
  isCorrect: boolean
}

interface ExamSessionProps {
  onExit: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Results screen ────────────────────────────────────────────────────────────

function ExamResults({
  records,
  questions,
  chapterTitles,
  onRetake,
  onExit,
}: {
  records: ExamRecord[]
  questions: Question[]
  chapterTitles: Record<number, string>
  onRetake: () => void
  onExit: () => void
}) {
  const addXP = useUserStore((s) => s.addXP)

  const correct = records.filter((r) => r.isCorrect).length
  const passed  = correct >= EXAM_PASS
  const pct     = Math.round((correct / EXAM_TOTAL) * 100)

  const [coaching, setCoaching] = useState<string | null>(null)
  const [getCoaching, { loading: coachingLoading }] = useMutation(GET_EXAM_COACHING)

  // Award XP once on mount
  useEffect(() => {
    addXP(passed ? 200 : 25)
  }, [])

  // Request LLM coaching once we have stats
  useEffect(() => {
    const chapterPayload = Object.entries(
      records.reduce<Record<number, { correct: number; total: number }>>((acc, r) => {
        if (!acc[r.chapter]) acc[r.chapter] = { correct: 0, total: 0 }
        acc[r.chapter].total++
        if (r.isCorrect) acc[r.chapter].correct++
        return acc
      }, {})
    ).map(([num, s]) => ({
      chapter: Number(num),
      title: chapterTitles[Number(num)] ?? '',
      correct: s.correct,
      total: s.total,
    }))
    getCoaching({ variables: { overallCorrect: correct, overallTotal: EXAM_TOTAL, chapters: chapterPayload } })
      .then((r) => { if (r.data?.getExamCoaching) setCoaching(r.data.getExamCoaching) })
      .catch(() => {})
  }, [])

  // Per-chapter breakdown
  const chapterStats = useMemo(() => {
    const map: Record<number, { correct: number; total: number }> = {}
    records.forEach((r) => {
      if (!map[r.chapter]) map[r.chapter] = { correct: 0, total: 0 }
      map[r.chapter].total++
      if (r.isCorrect) map[r.chapter].correct++
    })
    // Fill in chapters with no answers (unanswered = 0 correct)
    questions.forEach((q) => {
      if (!map[q.chapter]) map[q.chapter] = { correct: 0, total: 0 }
      if (!records.find((r) => r.questionId === q.id)) {
        map[q.chapter].total++
      }
    })
    return Object.entries(map)
      .map(([num, stats]) => ({ chapter: Number(num), ...stats }))
      .sort((a, b) => a.chapter - b.chapter)
  }, [records, questions])

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto">
          <button onClick={onExit} className="p-1 -ml-1 text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
          <h1 className="font-display text-lg font-bold text-text-primary">Exam Results</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-8 max-w-content mx-auto w-full space-y-6">

        {/* Verdict */}
        <div className={clsx(
          'card text-center border-2',
          passed ? 'border-green-500 bg-green-500/5' : 'border-red-600 bg-red-500/5'
        )}>
          <div className={clsx(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
            passed ? 'bg-green-500/20 border border-green-700' : 'bg-red-500/15 border border-red-800'
          )}>
            {passed
              ? <CheckCircle size={32} className="text-green-500" />
              : <XCircle    size={32} className="text-red-400" />
            }
          </div>

          <h2 className={clsx(
            'font-display text-4xl font-bold mb-1',
            passed ? 'text-green-500' : 'text-red-400'
          )}>
            {passed ? 'PASS' : 'FAIL'}
          </h2>

          <p className="font-mono text-5xl font-bold text-text-primary my-3">
            {correct}<span className="text-text-secondary text-3xl">/{EXAM_TOTAL}</span>
          </p>

          <p className={clsx(
            'text-sm font-medium',
            passed ? 'text-green-400' : 'text-text-secondary'
          )}>
            {pct}% · {passed
              ? 'Great work — you\'re ready!'
              : `${EXAM_PASS} required to pass`
            }
          </p>

          {!passed && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-secondary">
              <AlertTriangle size={12} className="text-gold-500" />
              <span>Need {EXAM_PASS - correct} more correct answer{EXAM_PASS - correct !== 1 ? 's' : ''} to pass</span>
            </div>
          )}
        </div>

        {/* AI coaching */}
        {(coaching || coachingLoading) && (
          <div className="card-elevated border border-green-500/30">
            <p className="text-xs text-green-500 font-medium uppercase tracking-wider mb-2">AI Coach</p>
            {coachingLoading && !coaching ? (
              <p className="text-sm text-text-secondary italic">Reviewing your exam…</p>
            ) : (
              <p className="text-sm text-text-primary leading-relaxed">{coaching}</p>
            )}
          </div>
        )}

        {/* Per-chapter breakdown */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
            Chapter Breakdown
          </h2>
          <div className="space-y-2">
            {chapterStats.map(({ chapter, correct: chCorrect, total }) => {
              const chPct  = total > 0 ? Math.round((chCorrect / total) * 100) : 0
              const weak   = chPct < 70
              return (
                <div key={chapter} className="card py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {weak && <AlertTriangle size={12} className="text-gold-500 flex-shrink-0" />}
                      <span className={clsx(
                        'text-sm font-medium truncate',
                        weak ? 'text-gold-500' : 'text-text-primary'
                      )}>
                        Ch. {chapter}
                        {chapterTitles[chapter] ? ` — ${chapterTitles[chapter]}` : ''}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-text-secondary flex-shrink-0 ml-2">
                      {chCorrect}/{total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-500',
                        chPct >= 80 ? 'bg-green-500' : chPct >= 60 ? 'bg-gold-500' : 'bg-red-500'
                      )}
                      style={{ width: `${chPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onRetake}
            className="btn-primary w-full h-12 text-base font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Retake Exam
          </button>
          <button
            onClick={onExit}
            className="btn-secondary w-full h-12 flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Back to Challenge
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExamSession({ onExit }: ExamSessionProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  // Core state
  const [questions, setQuestions]         = useState<Question[]>([])
  const [shuffledAnswers, setShuffledAnswers] = useState<Answer[]>([])
  const [qIndex, setQIndex]               = useState(0)
  const [selectedId, setSelectedId]       = useState<string>('')
  const [records, setRecords]             = useState<ExamRecord[]>([])
  const [phase, setPhase]                 = useState<'loading' | 'active' | 'complete'>('loading')
  const [advancing, setAdvancing]         = useState(false)
  const [timeLeft, setTimeLeft]           = useState(EXAM_DURATION)
  const [exitConfirm, setExitConfirm]     = useState(false)
  const [sessionKey, setSessionKey]       = useState(0)

  const chapterTitles = useRef<Record<number, string>>({})
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef      = useRef(phase)
  phaseRef.current    = phase

  const { data, refetch } = useQuery(GET_EXAM, {
    variables: { stateCode },
    fetchPolicy: 'network-only',
  })

  // ── Load questions ──────────────────────────────────────────────────────────

  useEffect(() => {
    const qs: Question[] = data?.questions ?? []
    if (qs.length === 0) return

    const titles: Record<number, string> = {}
    ;(data?.chapters ?? []).forEach((c: { number: number; title: string }) => {
      titles[c.number] = c.title
    })
    chapterTitles.current = titles

    setQuestions(qs)
    setQIndex(0)
    setRecords([])
    setSelectedId('')
    setTimeLeft(EXAM_DURATION)
    setPhase('active')
  }, [data, sessionKey])

  // ── Shuffle answers when question changes ───────────────────────────────────

  useEffect(() => {
    const q = questions[qIndex]
    if (!q) return
    setShuffledAnswers([...q.answers].sort(() => Math.random() - 0.5))
    setSelectedId('')
    setAdvancing(false)
  }, [qIndex, questions])

  // ── Global 60-min countdown ─────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'active') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (phaseRef.current === 'active') setPhase('complete')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleConfirm() {
    if (!selectedId || advancing) return
    const q = questions[qIndex]
    if (!q) return

    const correctIds = new Set(q.answers.filter((a) => a.isCorrect).map((a) => a.id))
    const isCorrect  = correctIds.has(selectedId)

    setRecords((prev) => [...prev, { questionId: q.id, chapter: q.chapter, isCorrect }])
    setAdvancing(true)

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        setPhase('complete')
      } else {
        setQIndex((i) => i + 1)
      }
    }, 350)
  }

  function handleRetake() {
    setPhase('loading')
    setRecords([])
    setQIndex(0)
    setSelectedId('')
    setTimeLeft(EXAM_DURATION)
    setSessionKey((k) => k + 1)
    refetch()
  }

  // ── Render: loading ─────────────────────────────────────────────────────────

  if (phase === 'loading') return <QuizQuestionSkeleton />

  // ── Render: results ─────────────────────────────────────────────────────────

  if (phase === 'complete') {
    return (
      <ExamResults
        records={records}
        questions={questions}
        chapterTitles={chapterTitles.current}
        onRetake={handleRetake}
        onExit={onExit}
      />
    )
  }

  // ── Render: active exam ─────────────────────────────────────────────────────

  const current   = questions[qIndex]
  const timerPct  = timeLeft / EXAM_DURATION
  const timerCls  = timerPct > 0.25 ? 'text-text-primary' : timerPct > 0.1 ? 'text-gold-500 animate-pulse' : 'text-red-400 animate-pulse'
  const answered  = records.length

  return (
    <div className="min-h-dvh bg-bg flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto">
          <button
            onClick={() => setExitConfirm(true)}
            className="p-1 -ml-1 text-text-secondary hover:text-text-primary flex-shrink-0"
          >
            <X size={20} />
          </button>

          {/* Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary font-medium">
                Q {qIndex + 1} of {questions.length}
              </span>
              <span className={clsx('flex items-center gap-1 text-xs font-mono font-bold', timerCls)}>
                <Clock size={11} />
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${(answered / EXAM_TOTAL) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Question ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 max-w-content mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
            Practice Exam
          </span>
          <span className="text-xs text-text-secondary">·</span>
          <span className="text-xs text-text-secondary">
            Ch. {current?.chapter}
          </span>
        </div>

        <div className="card-elevated mb-5">
          <p className="text-text-primary text-base font-medium leading-relaxed">
            {current?.questionText}
          </p>
        </div>

        {/* ── Answers ──────────────────────────────────────────────────────── */}
        <div className="space-y-2 flex-1">
          {shuffledAnswers.map((answer) => {
            const isSelected = selectedId === answer.id
            return (
              <button
                key={answer.id}
                onClick={() => { if (!advancing) setSelectedId(answer.id) }}
                disabled={advancing}
                className={clsx(
                  'w-full text-left rounded-lg border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                  isSelected
                    ? 'bg-green-500/10 border-green-500'
                    : 'bg-surface border-border hover:border-green-700 hover:bg-surface-2',
                )}
              >
                <div className={clsx(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  isSelected ? 'bg-green-500 border-green-500' : 'border-border'
                )}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-bg" />}
                </div>
                <span className="text-sm leading-snug flex-1 text-text-primary">{answer.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom action ───────────────────────────────────────────────────── */}
      <div className="px-4 pb-8 pt-4 max-w-content mx-auto w-full">
        <button
          onClick={handleConfirm}
          disabled={!selectedId || advancing}
          className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40"
        >
          {advancing ? 'Next question...' : qIndex + 1 >= questions.length ? 'Finish Exam' : 'Confirm Answer'}
        </button>
        <p className="text-xs text-text-secondary text-center mt-2">
          No hints or skips · answers revealed at the end
        </p>
      </div>

      {/* ── Exit confirm overlay ────────────────────────────────────────────── */}
      {exitConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setExitConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
              <AlertTriangle size={28} className="text-gold-500 mx-auto" />
              <p className="font-display text-lg font-bold text-text-primary">Abandon Exam?</p>
              <p className="text-sm text-text-secondary">
                Your progress will be lost. You'll need to start a fresh 50-question exam.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setExitConfirm(false)}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
                >
                  Keep Going
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all"
                >
                  Abandon
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
