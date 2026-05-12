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
import { X, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { AppLogo } from '@/components/layout/AppLogo'
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
      variables: { input: { stateCode: config.stateCode, mode: 'bot_battle', difficulty: 'king', questionCount: questions.length, chapters: [] } },
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
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-sm animate-pulse">Loading battle...</p>
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

  // Timer color
  const timerPct   = config.timerSeconds ? (timeLeft ?? 0) / config.timerSeconds : 1
  const timerColor = timerPct > 0.5 ? 'text-green-500' : timerPct > 0.2 ? 'text-gold-500' : 'text-red-400'

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto">
          <button onClick={() => setShowExitConfirm(true)} className="p-1 -ml-1 text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
          <AppLogo height={24} className="flex-shrink-0" />

          <div className="flex-1 flex items-center gap-3">
            <span className="font-mono font-bold text-green-500 text-lg w-6 text-right">{playerScore}</span>
            <div className="flex-1 flex items-center gap-1">
              {Array.from({ length: queue.length }).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < queueIndex ? 'bg-green-700' : i === queueIndex ? 'bg-green-500' : 'bg-surface-3'
                }`} />
              ))}
            </div>
            <span className="font-mono font-bold text-red-400 text-lg w-6">{botScore}</span>
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

        {/* Per-question timer bar */}
        {config.timerSeconds && !bothRevealed && (
          <div className="px-0 mt-2 max-w-content mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-mono font-bold ${timerColor} ${timerPct <= 0.1 ? 'animate-pulse' : ''}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timerPct > 0.5 ? 'bg-green-500' : timerPct > 0.2 ? 'bg-gold-500' : 'bg-red-500'
                }`}
                style={{ width: `${timerPct * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="px-4 pt-6 max-w-content mx-auto w-full">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-3">
          Question {queueIndex + 1} of {queue.length}
        </p>
        <div className="card-elevated mb-4">
          <p className="text-text-primary text-base font-medium leading-relaxed">{current.questionText}</p>
        </div>

        {/* Answer options — stable order via shuffledAnswers */}
        <div className="space-y-2">
          {shuffledAnswers.map((answer) => {
            const isSelected   = selectedIds.includes(answer.id)
            const isCorrectAns = correctIds.has(answer.id)
            const isBotPick    = botAnswerIds.includes(answer.id)

            return (
              <button
                key={answer.id}
                onClick={() => handleSelect(answer.id)}
                disabled={playerRevealed}
                className={clsx(
                  'w-full text-left rounded-lg border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                  !bothRevealed && !isSelected  && 'bg-surface border-border hover:border-green-700 hover:bg-surface-2',
                  !bothRevealed && isSelected   && 'bg-green-500/10 border-green-500',
                  bothRevealed && isCorrectAns && isSelected   && 'bg-green-500/15 border-green-500',
                  bothRevealed && !isCorrectAns && isSelected  && 'bg-red-500/10 border-red-600',
                  bothRevealed && isCorrectAns && !isSelected  && 'bg-gold-500/10 border-gold-600',
                  bothRevealed && !isCorrectAns && !isSelected && 'opacity-40 bg-surface border-border',
                )}
              >
                <div className={clsx(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  !bothRevealed && isSelected   && 'bg-green-500 border-green-500',
                  !bothRevealed && !isSelected  && 'border-border',
                  bothRevealed && isCorrectAns && isSelected   && 'bg-green-500 border-green-500',
                  bothRevealed && !isCorrectAns && isSelected  && 'bg-red-500 border-red-500',
                  bothRevealed && isCorrectAns && !isSelected  && 'bg-gold-500 border-gold-500',
                  bothRevealed && !isCorrectAns && !isSelected && 'border-border',
                )}>
                  {bothRevealed && isCorrectAns && isSelected   && <CheckCircle size={12} className="text-bg" />}
                  {bothRevealed && !isCorrectAns && isSelected  && <XCircle size={12} className="text-bg" />}
                  {bothRevealed && isCorrectAns && !isSelected  && <CheckCircle size={12} className="text-bg" />}
                  {!bothRevealed && isSelected                  && <div className="w-2 h-2 rounded-full bg-bg" />}
                </div>

                <span className="text-sm leading-snug flex-1 text-text-primary">{answer.text}</span>

                {bothRevealed && isBotPick && (
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0',
                    botCorrect
                      ? 'bg-red-500/10 text-red-400 border border-red-700/40'
                      : 'bg-surface-3 text-text-secondary border border-border'
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
          <div className="mt-4 px-4 py-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Explanation</p>
            <p className="text-sm text-text-primary leading-relaxed">{current.explanation}</p>
          </div>
        )}

        {/* Bot reasoning */}
        {bothRevealed && botReasoning && (
          <p className="mt-2 text-xs italic text-text-secondary leading-relaxed">
            <span className="font-semibold not-italic text-text-primary">{bot.name}:</span> "{botReasoning}"
          </p>
        )}
      </div>

      {/* Bottom action */}
      <div className="mt-auto px-4 pb-8 pt-4 max-w-content mx-auto w-full">
        {playerRevealed && !bothRevealed && (
          <div className="text-center py-3">
            <p className="text-sm text-gold-500 animate-pulse">Waiting for {bot.name} to answer...</p>
          </div>
        )}
        {!playerRevealed && (
          <button
            onClick={handlePlayerSubmit}
            disabled={selectedIds.length === 0}
            className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40"
          >
            Lock In Answer
          </button>
        )}
        {bothRevealed && (
          <button onClick={handleNext} className="btn-primary w-full h-12 text-base font-semibold">
            {queueIndex + 1 >= queue.length ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>

      {/* Exit confirmation */}
      {showExitConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={20} className="text-gold-500 flex-shrink-0" />
                <h3 className="font-display font-bold text-text-primary">Leave battle?</h3>
              </div>
              <p className="text-sm text-text-secondary mb-5">
                Your battle progress will be lost. Are you sure you want to quit?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)} className="btn-secondary flex-1">
                  Keep going
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 h-10 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-500 active:scale-95 transition-all"
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