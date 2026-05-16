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

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'
import { clsx } from 'clsx'
import { FiX as X, FiCheckCircle as CheckCircle, FiXCircle as XCircle, FiAlertTriangle as AlertTriangle } from 'react-icons/fi'
import { AppLogo } from '@/components/layout/AppLogo'
import { FloatingTimer } from '@/components/ui/FloatingTimer'
import { BotAvatar } from './BotAvatar'
import { BotBattleResults } from './BotBattleResults'
import { XPBreakdownScreen, buildBattleXPItems } from './XPBreakdownScreen'
import type { BotBattleConfig } from './BotSelectScreen'

const GET_QUESTIONS = gql`
  query GetBotBattleQuestions($stateCode: String!, $count: Int!) {
    questions(stateCode: $stateCode, count: $count) {
      id questionText explanation correctCount chapter
      answers { id text isCorrect sortOrder }
    }
  }
`
const START_SESSION    = gql`mutation StartBotBattleSession($input: StartSessionInput!) { startSession(input: $input) { id } }`
const SUBMIT_ANSWER    = gql`mutation SubmitBotAnswer($input: SubmitAnswerInput!) { submitAnswer(input: $input) { isCorrect xpEarned } }`
const COMPLETE_SESSION = gql`mutation CompleteBotSession($sessionId: ID!) { completeSession(sessionId: $sessionId) { xpEarned accuracy } }`
const BOT_ANSWER       = gql`mutation BotAnswerQuestion($questionId: ID!, $botId: String!) { botAnswerQuestion(questionId: $questionId, botId: $botId) { selectedAnswerIds reasoning } }`

interface Answer { id: string; text: string; isCorrect: boolean; sortOrder: number }
interface Question { id: string; questionText: string; explanation: string; correctCount: number; chapter: number; answers: Answer[] }

interface BotBattleSessionProps {
  config: BotBattleConfig
  onExit: () => void
}

function simulateBotAnswer(question: Question, accuracy: number): string[] {
  const roll       = Math.random() * 100
  const correctIds = question.answers.filter((a) => a.isCorrect).map((a) => a.id)
  const wrongIds   = question.answers.filter((a) => !a.isCorrect).map((a) => a.id)
  if (roll < accuracy) return correctIds
  return [...wrongIds].sort(() => Math.random() - 0.5).slice(0, question.correctCount)
}

function randomThinkTime(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function BotBattleSession({ config, onExit }: BotBattleSessionProps) {
  const { bot } = config

  const [sessionId, setSessionId]           = useState<string | null>(null)
  const [retryKey, setRetryKey]             = useState(0)
  const [queue, setQueue]                   = useState<Question[]>([])
  const [queueIndex, setQueueIndex]         = useState(0)
  const [shuffledAnswers, setShuffledAnswers] = useState<Answer[]>([])
  const [selectedIds, setSelectedIds]       = useState<string[]>([])
  const [playerRevealed, setPlayerRevealed] = useState(false)
  const [botRevealed, setBotRevealed]       = useState(false)
  const [bothRevealed, setBothRevealed]     = useState(false)
  const [botAnswerIds, setBotAnswerIds]     = useState<string[]>([])
  const [botThinking, setBotThinking]       = useState(true)
  const [botReasoning, setBotReasoning]     = useState<string | null>(null)
  const [playerScore, setPlayerScore]       = useState(0)
  const [botScore, setBotScore]             = useState(0)
  const [totalXP, setTotalXP]               = useState(0)
  const [showResults, setShowResults]       = useState(false)
  const [showXPScreen, setShowXPScreen]     = useState(false)
  const [timeLeft, setTimeLeft]             = useState<number | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const botTimerRef                         = useRef<ReturnType<typeof setTimeout> | null>(null)
  const questionTimerRef                    = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data } = useQuery(GET_QUESTIONS, {
    variables: { stateCode: config.stateCode, count: config.questionCount },
  })
  const [startSession]    = useMutation(START_SESSION)
  const [submitAnswer]    = useMutation(SUBMIT_ANSWER)
  const [completeSession] = useMutation(COMPLETE_SESSION)
  const [botAnswerMutation] = useMutation(BOT_ANSWER)

  // Init session
  useEffect(() => {
    const questions: Question[] = data?.questions ?? []
    if (questions.length === 0) return
    setQueue([...questions])
    setQueueIndex(0)
    startSession({
      variables: { input: { stateCode: config.stateCode, mode: 'bot_battle', difficulty: 'expert', questionCount: questions.length, chapters: [] } },
    }).then((r) => setSessionId(r.data?.startSession?.id ?? null))
  }, [data, retryKey])

  const current = queue[queueIndex]

  // Shuffle answers ONCE per question
  useEffect(() => {
    if (!current) return
    setShuffledAnswers([...current.answers].sort(() => Math.random() - 0.5))
  }, [current?.id, retryKey])

  // Bot think + LLM call per question. Mutation runs in parallel with the
  // think-time UX delay; whichever finishes last triggers reveal.
  useEffect(() => {
    if (!current || bothRevealed) return
    setBotThinking(true)
    setBotRevealed(false)
    setBotAnswerIds([])
    setBotReasoning(null)

    let cancelled = false
    let pendingIds: string[] | null = null
    let timerDone = false

    const maybeReveal = () => {
      if (cancelled) return
      if (pendingIds !== null && timerDone) {
        setBotAnswerIds(pendingIds)
        setBotRevealed(true)
        setBotThinking(false)
      }
    }

    botAnswerMutation({ variables: { questionId: current.id, botId: bot.id } })
      .then((r) => {
        const move = r.data?.botAnswerQuestion
        if (move?.selectedAnswerIds?.length) {
          pendingIds = move.selectedAnswerIds
          setBotReasoning(move.reasoning ?? null)
        } else {
          pendingIds = simulateBotAnswer(current, bot.accuracy)
        }
        maybeReveal()
      })
      .catch(() => {
        pendingIds = simulateBotAnswer(current, bot.accuracy)
        maybeReveal()
      })

    const thinkTime = randomThinkTime(bot.thinkMinMs, bot.thinkMaxMs)
    botTimerRef.current = setTimeout(() => {
      timerDone = true
      maybeReveal()
    }, thinkTime)

    return () => {
      cancelled = true
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [queueIndex, current?.id, retryKey])

  // Per-question countdown timer
  useEffect(() => {
    if (!current || !config.timerSeconds || bothRevealed || playerRevealed) return
    setTimeLeft(config.timerSeconds)

    questionTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(questionTimerRef.current!)
          // Time expired — auto-submit as wrong
          setPlayerRevealed(true)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current) }
  }, [queueIndex, current?.id, retryKey, config.timerSeconds])

  // Simultaneous reveal when both answered
  useEffect(() => {
    if (playerRevealed && botRevealed && !bothRevealed) {
      setBothRevealed(true)
      if (questionTimerRef.current) clearInterval(questionTimerRef.current)
    }
  }, [playerRevealed, botRevealed])

  // Score bot answer after reveal
  useEffect(() => {
    if (!bothRevealed || !current) return
    const correctIds = new Set(current.answers.filter((a) => a.isCorrect).map((a) => a.id))
    const botCorrect = botAnswerIds.length === correctIds.size && botAnswerIds.every((id) => correctIds.has(id))
    if (botCorrect) setBotScore((s) => s + 1)
  }, [bothRevealed])

  async function handlePlayerSubmit() {
    if (!current || !sessionId || selectedIds.length === 0 || playerRevealed) return
    if (questionTimerRef.current) clearInterval(questionTimerRef.current)

    const result = await submitAnswer({
      variables: { input: { sessionId, questionId: current.id, selectedAnswerIds: selectedIds, hintUsed: false, timeTakenMs: 0 } },
    })
    const isCorrect = result.data?.submitAnswer?.isCorrect ?? false
    const xp        = result.data?.submitAnswer?.xpEarned ?? 0
    if (isCorrect) setPlayerScore((s) => s + 1)
    setTotalXP((x) => x + xp)
    setPlayerRevealed(true)
  }

  async function handleNext() {
    if (botTimerRef.current) clearTimeout(botTimerRef.current)
    if (questionTimerRef.current) clearInterval(questionTimerRef.current)

    setSelectedIds([])
    setPlayerRevealed(false)
    setBotRevealed(false)
    setBothRevealed(false)
    setBotAnswerIds([])
    setBotThinking(true)
    setTimeLeft(config.timerSeconds)

    const nextIndex = queueIndex + 1
    if (nextIndex >= queue.length) {
      if (sessionId) await completeSession({ variables: { sessionId } })
      setShowXPScreen(true)
      setShowResults(true)
    } else {
      setQueueIndex(nextIndex)
    }
  }

  function handleSelect(id: string) {
    if (playerRevealed || bothRevealed) return
    if (current.correctCount === 1) {
      setSelectedIds([id])
    } else {
      setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
    }
  }

  function handleRetry() {
    if (botTimerRef.current) clearTimeout(botTimerRef.current)
    if (questionTimerRef.current) clearInterval(questionTimerRef.current)
    setSessionId(null); setQueue([]); setQueueIndex(0)
    setSelectedIds([]); setPlayerRevealed(false); setBotRevealed(false)
    setBothRevealed(false); setBotAnswerIds([]); setBotThinking(true)
    setPlayerScore(0); setBotScore(0); setTotalXP(0)
    setShowResults(false); setShowXPScreen(false); setTimeLeft(config.timerSeconds)
    setRetryKey((k) => k + 1)
  }

  if (!current && !showResults) {
    return (
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
          <p className="mono text-[11px] tracking-[0.12em] uppercase font-semibold">Loading battle…</p>
        </div>
      </div>
    )
  }

  if (showResults && showXPScreen) {
    const outcome = playerScore > botScore ? 'win' : playerScore < botScore ? 'lose' : 'tie'
    const { items, totalXP: xpTotal } = buildBattleXPItems({
      outcome,
      playerScore,
      totalQuestions: queue.length,
      isClean: playerScore === queue.length,
    })
    return (
      <XPBreakdownScreen
        outcome={outcome}
        playerScore={playerScore}
        opponentScore={botScore}
        totalQuestions={queue.length}
        items={items}
        totalXP={xpTotal}
        onDone={() => setShowXPScreen(false)}
      />
    )
  }

  if (showResults) {
    return (
      <BotBattleResults
        bot={bot} playerScore={playerScore} botScore={botScore}
        total={queue.length} xpEarned={totalXP}
        onRematch={handleRetry} onExit={onExit}
      />
    )
  }

  const correctIds    = new Set(current.answers.filter((a) => a.isCorrect).map((a) => a.id))
  const playerCorrect = bothRevealed && selectedIds.length === correctIds.size && selectedIds.every((id) => correctIds.has(id))
  const botCorrect    = bothRevealed && botAnswerIds.length === correctIds.size && botAnswerIds.every((id) => correctIds.has(id))

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center gap-3 max-w-[760px] mx-auto px-4 pt-4 pb-3">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
            aria-label="Exit"
          >
            <X size={20} />
          </button>
          <AppLogo height={22} className="flex-shrink-0" />

          <div className="flex-1 flex items-center gap-3">
            <span className="mono font-bold text-correct text-lg tabular-nums w-6 text-right">{playerScore}</span>
            <div className="flex-1 flex items-center gap-1">
              {Array.from({ length: queue.length }).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < queueIndex ? 'bg-correct/70' : i === queueIndex ? 'bg-orange' : 'bg-white/[0.06]'
                }`} />
              ))}
            </div>
            <span className="mono font-bold text-wrong text-lg tabular-nums w-6">{botScore}</span>
          </div>

          <BotAvatar
            bot={bot}
            thinking={botThinking && !bothRevealed}
            answered={botRevealed}
            isCorrect={bothRevealed ? botCorrect : undefined}
            score={botScore}
            playerScore={playerScore}
            size="sm"
          />
        </div>

      </div>

      {config.timerSeconds && !bothRevealed && timeLeft !== null && (
        <FloatingTimer timeLeft={timeLeft} total={config.timerSeconds} />
      )}

      {/* Question */}
      <div className="px-4 pt-6 max-w-[760px] mx-auto w-full">
        <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
          Question {queueIndex + 1} of {queue.length}
        </div>
        <div className="card-elevated mb-4 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background:
                'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
            }}
          />
          <p className="display text-white text-[clamp(15px,1.8vw,18px)] font-semibold leading-snug tracking-[-0.2px] pt-1">
            {current.questionText}
          </p>
        </div>

        {/* Answer options — stable order via shuffledAnswers */}
        <div className="space-y-2">
          {shuffledAnswers.map((answer, idx) => {
            const isSelected   = selectedIds.includes(answer.id)
            const isCorrectAns = correctIds.has(answer.id)
            const isBotPick    = botAnswerIds.includes(answer.id)
            const letter       = String.fromCharCode(65 + idx)

            return (
              <button
                key={answer.id}
                onClick={() => handleSelect(answer.id)}
                disabled={playerRevealed}
                className={clsx(
                  'w-full text-left rounded-md border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                  !bothRevealed && !isSelected  && 'bg-surface border-border hover:border-orange/40 hover:bg-surface-2',
                  !bothRevealed && isSelected   && 'bg-orange-soft border-orange',
                  bothRevealed && isCorrectAns && isSelected   && 'bg-green-soft border-correct',
                  bothRevealed && !isCorrectAns && isSelected  && 'bg-wrong/10 border-wrong',
                  bothRevealed && isCorrectAns && !isSelected  && 'bg-yellow-soft border-yellow-rim',
                  bothRevealed && !isCorrectAns && !isSelected && 'opacity-40 bg-surface border-border',
                )}
              >
                <span className={clsx(
                  'w-6 h-6 rounded-md mono text-[11px] font-bold flex-shrink-0 flex items-center justify-center border',
                  !bothRevealed && isSelected   && 'bg-orange text-white border-orange',
                  !bothRevealed && !isSelected  && 'border-border text-text-muted',
                  bothRevealed && isCorrectAns && isSelected   && 'bg-correct text-bg border-correct',
                  bothRevealed && !isCorrectAns && isSelected  && 'bg-wrong text-white border-wrong',
                  bothRevealed && isCorrectAns && !isSelected  && 'bg-yellow text-bg border-yellow',
                  bothRevealed && !isCorrectAns && !isSelected && 'border-border text-text-muted',
                )}>
                  {bothRevealed && isCorrectAns && isSelected   ? <CheckCircle size={13} /> :
                   bothRevealed && !isCorrectAns && isSelected  ? <XCircle size={13} /> :
                   bothRevealed && isCorrectAns && !isSelected  ? <CheckCircle size={13} /> :
                   letter}
                </span>

                <span className="text-[14px] leading-snug flex-1 text-white">{answer.text}</span>

                {bothRevealed && isBotPick && (
                  <span className={clsx(
                    'mono text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-md font-semibold flex-shrink-0 border',
                    botCorrect
                      ? 'bg-correct/15 text-correct border-correct/40'
                      : 'bg-wrong/10 text-wrong border-wrong/40'
                  )}>
                    {bot.name}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {bothRevealed && (
          <div className="mt-4 px-4 py-3 rounded-md bg-surface-2 border border-border">
            <p className="mono text-[10px] text-text-muted font-semibold uppercase tracking-[0.12em] mb-1.5">
              Explanation
            </p>
            <p className="text-sm text-text-primary leading-relaxed">{current.explanation}</p>
          </div>
        )}

        {/* Bot reasoning */}
        {bothRevealed && botReasoning && (
          <p className="mt-2 text-[13px] italic text-text-secondary leading-relaxed">
            <span className="font-semibold not-italic text-white">{bot.name}:</span> &ldquo;{botReasoning}&rdquo;
          </p>
        )}
      </div>

      {/* Bottom action */}
      <div className="mt-auto px-4 pb-8 pt-4 max-w-[760px] mx-auto w-full">
        {playerRevealed && !bothRevealed && (
          <div className="text-center py-3">
            <p className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-yellow animate-pulse">
              Waiting for {bot.name}…
            </p>
          </div>
        )}
        {!playerRevealed && (
          <button
            onClick={handlePlayerSubmit}
            disabled={selectedIds.length === 0}
            className="btn-primary w-full h-12 text-sm font-semibold disabled:opacity-40"
          >
            Lock In Answer
          </button>
        )}
        {bothRevealed && (
          <button onClick={handleNext} className="btn-primary w-full h-12 text-sm font-semibold">
            {queueIndex + 1 >= queue.length ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>

      {/* Exit confirmation */}
      {showExitConfirm && (
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
                <h3 className="display font-bold text-base text-white">Leave battle?</h3>
              </div>
              <p className="text-sm text-text-secondary mb-5">
                Your battle progress will be lost. Are you sure you want to quit?
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
      )}
    </div>
  )
}
