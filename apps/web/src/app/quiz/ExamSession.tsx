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
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center gap-3 max-w-[760px] mx-auto px-4 pt-4 pb-3">
          <button
            onClick={onExit}
            className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
            aria-label="Exit"
          >
            <X size={20} />
          </button>
          <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-yellow">
            <span className="w-[18px] h-[1.5px] rounded-full bg-yellow" />
            Practice exam · results
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-8 pb-10 max-w-[760px] mx-auto w-full space-y-5">

        {/* Verdict */}
        <div className={clsx(
          'card text-center relative overflow-hidden border-2',
          passed ? 'border-correct/40 bg-green-soft' : 'border-wrong/40 bg-wrong/5'
        )}>
          <div className={clsx(
            'absolute top-0 left-0 right-0 h-[3px]',
            passed ? 'bg-correct' : 'bg-wrong'
          )} />

          <div className={clsx(
            'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 mt-1 border',
            passed ? 'bg-green-soft border-correct/40' : 'bg-wrong/10 border-wrong/40'
          )}>
            {passed
              ? <CheckCircle size={26} className="text-correct" strokeWidth={2.5} />
              : <XCircle    size={26} className="text-wrong"   strokeWidth={2.5} />
            }
          </div>

          <div className={clsx(
            'inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.16em] uppercase',
            passed ? 'text-correct' : 'text-wrong'
          )}>
            <span className={clsx('w-[14px] h-[1.5px] rounded-full', passed ? 'bg-correct' : 'bg-wrong')} />
            {passed ? 'Verdict · pass' : 'Verdict · fail'}
          </div>

          <h2 className={clsx(
            'display font-extrabold text-[clamp(40px,6vw,56px)] leading-[0.95] tracking-[-2px] mb-3',
            passed ? 'text-correct' : 'text-wrong'
          )}>
            {passed ? 'PASS' : 'FAIL'}
          </h2>

          <p className="mono font-bold text-[44px] tabular-nums leading-none text-white mb-2">
            {correct}<span className="text-text-muted text-[26px]">/{EXAM_TOTAL}</span>
          </p>

          <p className={clsx(
            'mono text-[11px] tracking-[0.1em] uppercase font-semibold',
            passed ? 'text-correct' : 'text-text-secondary'
          )}>
            {pct}% · {passed
              ? "You're ready"
              : `${EXAM_PASS} required to pass`
            }
          </p>

          {!passed && (
            <div className="mt-3 inline-flex items-center justify-center gap-1.5 mono text-[10px] tracking-[0.08em] uppercase text-yellow font-semibold">
              <AlertTriangle size={11} />
              Need {EXAM_PASS - correct} more correct
            </div>
          )}
        </div>

        {/* AI coaching */}
        {(coaching || coachingLoading) && (
          <div className="card-elevated border border-orange/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange" />
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[14px] h-[1.5px] rounded-full bg-orange" />
              AI Coach
            </div>
            {coachingLoading && !coaching ? (
              <p className="text-[13px] text-text-secondary italic">Reviewing your exam…</p>
            ) : (
              <p className="text-sm text-text-primary leading-relaxed">{coaching}</p>
            )}
          </div>
        )}

        {/* Per-chapter breakdown */}
        <section>
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Chapter breakdown
          </div>
          <div className="space-y-2">
            {chapterStats.map(({ chapter, correct: chCorrect, total }) => {
              const chPct  = total > 0 ? Math.round((chCorrect / total) * 100) : 0
              const weak   = chPct < 70
              return (
                <div key={chapter} className="card py-3">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {weak && <AlertTriangle size={11} className="text-yellow flex-shrink-0" />}
                      <span className={clsx(
                        'text-[13px] font-medium truncate',
                        weak ? 'text-yellow' : 'text-white'
                      )}>
                        <span className="mono text-[11px] text-text-muted mr-1">Ch. {String(chapter).padStart(2, '0')}</span>
                        {chapterTitles[chapter] ?? ''}
                      </span>
                    </div>
                    <span className="mono text-[11px] font-bold tabular-nums text-text-secondary flex-shrink-0">
                      {chCorrect}/{total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-500',
                        chPct >= 80 ? 'bg-correct' : chPct >= 60 ? 'bg-yellow' : 'bg-orange'
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
        <div className="space-y-3 pt-2">
          <button
            onClick={onRetake}
            className="btn-primary w-full h-12 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Retake Exam
          </button>
          <button
            onClick={onExit}
            className="btn-secondary w-full h-12 text-sm font-semibold flex items-center justify-center gap-2"
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
  const timerCls  = timerPct > 0.25 ? 'text-white' : timerPct > 0.1 ? 'text-yellow animate-pulse' : 'text-orange animate-pulse'
  const answered  = records.length

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center gap-3 max-w-[760px] mx-auto px-4 pt-4 pb-3">
          <button
            onClick={() => setExitConfirm(true)}
            className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
            aria-label="Exit"
          >
            <X size={20} />
          </button>

          {/* Progress */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="mono text-[11px] text-text-secondary font-medium tabular-nums">
                <strong className="text-white font-bold">{qIndex + 1}</strong>
                <span className="mx-1">/</span>
                {questions.length}
              </span>
              <span className={clsx('inline-flex items-center gap-1 mono text-[11px] font-bold tabular-nums', timerCls)}>
                <Clock size={11} />
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-orange rounded-full transition-all duration-300"
                style={{ width: `${(answered / EXAM_TOTAL) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Question ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 max-w-[760px] mx-auto w-full flex-1 flex flex-col">
        <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase">
          <span className="w-[18px] h-[1.5px] rounded-full bg-yellow" />
          <span className="text-yellow">Practice exam</span>
          <span className="text-text-faint">·</span>
          <span className="text-text-muted">Ch. {String(current?.chapter ?? 0).padStart(2, '0')}</span>
        </div>

        <div className="card-elevated mb-5 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background:
                'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
            }}
          />
          <p className="display text-white text-[clamp(15px,1.8vw,18px)] font-semibold leading-snug tracking-[-0.2px] pt-1">
            {current?.questionText}
          </p>
        </div>

        {/* ── Answers ──────────────────────────────────────────────────────── */}
        <div className="space-y-2 flex-1">
          {shuffledAnswers.map((answer, idx) => {
            const isSelected = selectedId === answer.id
            const letter     = String.fromCharCode(65 + idx)
            return (
              <button
                key={answer.id}
                onClick={() => { if (!advancing) setSelectedId(answer.id) }}
                disabled={advancing}
                className={clsx(
                  'w-full text-left rounded-md border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                  isSelected
                    ? 'bg-orange-soft border-orange'
                    : 'bg-surface border-border hover:border-orange/40 hover:bg-surface-2',
                )}
              >
                <span className={clsx(
                  'w-6 h-6 rounded-md mono text-[11px] font-bold flex-shrink-0 flex items-center justify-center border',
                  isSelected ? 'bg-orange text-white border-orange' : 'border-border text-text-muted'
                )}>
                  {letter}
                </span>
                <span className="text-[14px] leading-snug flex-1 text-white">{answer.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bottom action ───────────────────────────────────────────────────── */}
      <div className="px-4 pb-8 pt-4 max-w-[760px] mx-auto w-full">
        <button
          onClick={handleConfirm}
          disabled={!selectedId || advancing}
          className="btn-primary w-full h-12 text-sm font-semibold disabled:opacity-40"
        >
          {advancing ? 'Next question…' : qIndex + 1 >= questions.length ? 'Finish Exam' : 'Confirm Answer'}
        </button>
        <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted text-center mt-3">
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
            <div className="bg-surface border border-wrong/40 rounded-lg p-6 w-full max-w-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-wrong" />
              <div className="flex items-center gap-3 mt-1">
                <div className="w-9 h-9 rounded-md bg-yellow-soft border border-yellow-rim flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-yellow" />
                </div>
                <h3 className="display font-bold text-base text-white">Abandon exam?</h3>
              </div>
              <p className="text-sm text-text-secondary">
                Your progress will be lost. You&apos;ll need to start a fresh 50-question exam.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setExitConfirm(false)}
                  className="btn-secondary flex-1 h-10 text-sm font-semibold"
                >
                  Keep going
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 h-10 rounded-md bg-wrong/15 border border-wrong/40 text-wrong text-sm font-semibold hover:bg-wrong hover:text-white active:scale-95 transition-all"
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
