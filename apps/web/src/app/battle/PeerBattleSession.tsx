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
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client'
import { clsx } from 'clsx'
import { X, CheckCircle, XCircle, WifiOff, Clock } from 'lucide-react'
import { GiLaurelsTrophy } from 'react-icons/gi'
import { IoSad } from 'react-icons/io5'
import { FaHandshake } from 'react-icons/fa'
import { useUserStore } from '@/stores'
import { AppLogo } from '@/components/layout/AppLogo'
import { XPBreakdownScreen, buildBattleXPItems } from './XPBreakdownScreen'
import type { PeerBattleSetup } from './PeerBattleLobby'

// ── Thinking dots (UPDATE-07) ─────────────────────────────────────────────────

function ThinkingDots({ colorClass }: { colorClass: string }) {
  return (
    <span className="flex gap-0.5 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1 h-1 rounded-full ${colorClass} animate-bounce opacity-70`}
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '800ms' }}
        />
      ))}
    </span>
  )
}

// ── GQL ───────────────────────────────────────────────────────────────────────

const GET_BATTLE_QUESTIONS = gql`
  query GetBattleQuestions($battleId: ID!) {
    battleQuestions(battleId: $battleId) {
      id questionText explanation correctCount chapter
      answers { id text isCorrect sortOrder }
    }
  }
`

const SUBMIT_BATTLE_ANSWER = gql`
  mutation PeerSubmitAnswer(
    $battleId: ID!
    $questionId: ID!
    $selectedAnswerIds: [ID!]!
    $questionIndex: Int!
  ) {
    submitBattleAnswer(
      battleId: $battleId
      questionId: $questionId
      selectedAnswerIds: $selectedAnswerIds
      questionIndex: $questionIndex
    ) {
      id playerScore opponentScore winner state
    }
  }
`

const FORFEIT_BATTLE = gql`
  mutation PeerForfeit($battleId: ID!) {
    forfeitBattle(battleId: $battleId) { id winner state }
  }
`

const REQUEST_DRAW = gql`
  mutation PeerRequestDraw($battleId: ID!) {
    requestDraw(battleId: $battleId) { id state }
  }
`

const RESPOND_TO_DRAW = gql`
  mutation PeerRespondDraw($battleId: ID!, $accepted: Boolean!) {
    respondToDraw(battleId: $battleId, accepted: $accepted) { id winner state }
  }
`

const RECORD_SCREEN_LEAVE = gql`
  mutation PeerScreenLeave($battleId: ID!) {
    recordScreenLeave(battleId: $battleId) { id state }
  }
`

const RECORD_SCREEN_RETURN = gql`
  mutation PeerScreenReturn($battleId: ID!) {
    recordScreenReturn(battleId: $battleId) { id state }
  }
`

const PLAYER_HEARTBEAT = gql`
  mutation PeerHeartbeat($battleId: ID!) {
    playerHeartbeat(battleId: $battleId)
  }
`

const REJOIN_BATTLE = gql`
  mutation PeerRejoin($battleId: ID!) {
    rejoinBattle(battleId: $battleId) {
      id playerScore opponentScore state
    }
  }
`

const BATTLE_UPDATED = gql`
  subscription PeerBattleUpdated($battleId: ID!) {
    battleUpdated(battleId: $battleId) {
      event
      playerId
      questionIndex
      isCorrect
      playerScore
      opponentScore
      battleState
      winner
      drawRequestsUsed
      drawRequestsLeft
      screenLeaveStrikes
      wasForgiven
      durationAwayMs
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface Answer   { id: string; text: string; isCorrect: boolean; sortOrder: number }
interface Question { id: string; questionText: string; explanation: string; correctCount: number; answers: Answer[] }

type Phase =
  | 'loading'        // fetching questions
  | 'active'         // answering questions
  | 'waiting'        // I finished all questions, waiting for battle_end
  | 'draw_pending'   // I requested a draw, waiting for opponent response
  | 'draw_incoming'  // opponent requested a draw — I must respond
  | 'forfeit_warn'   // opponent declined my draw — 15s to forfeit or continue
  | 'complete'       // game over

interface BattleEvent {
  event: string
  playerId: string
  questionIndex: number
  isCorrect: boolean | null
  playerScore: number
  opponentScore: number
  battleState: string
  winner: string | null
  drawRequestsUsed: number | null
  drawRequestsLeft: number | null
  screenLeaveStrikes: number | null
  wasForgiven: boolean | null
  durationAwayMs: number | null
}

interface PeerBattleSessionProps {
  setup: PeerBattleSetup
  onExit: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PeerBattleSession({ setup, onExit }: PeerBattleSessionProps) {
  const { battleId, timerSeconds, iAmPlayer, chapterIds } = setup
  const myUserId  = useUserStore((s) => s.user?.id ?? '')
  const myInitial = useUserStore((s) => {
    const u = s.user
    return ((u?.displayName ?? u?.email ?? 'M')[0] ?? 'M').toUpperCase()
  })

  // ── Core state ────────────────────────────────────────────────────────────
  const [phase, setPhase]                     = useState<Phase>('loading')
  const [questions, setQuestions]             = useState<Question[]>([])
  const [qIndex, setQIndex]                   = useState(0)
  const [shuffledAnswers, setShuffledAnswers] = useState<Answer[]>([])
  const [selectedIds, setSelectedIds]         = useState<string[]>([])
  const [revealed, setRevealed]               = useState(false)

  // ── Scores ────────────────────────────────────────────────────────────────
  const [myScore, setMyScore]       = useState(0)
  const [theirScore, setTheirScore] = useState(0)
  const [winner, setWinner]         = useState<string | null>(null)

  // ── Supplementary UI state ────────────────────────────────────────────────
  const [drawsLeft, setDrawsLeft]               = useState(2)
  const [drawCountdown, setDrawCountdown]       = useState(30)
  const [opponentOnScreen, setOpponentOnScreen] = useState(true)
  const [opponentLeftAt, setOpponentLeftAt]     = useState<number | null>(null)
  const [opponentAwayLeft, setOpponentAwayLeft] = useState<number | null>(null)
  const [timeLeft, setTimeLeft]                 = useState<number | null>(timerSeconds)
  const [forfeitWarnLeft, setForfeitWarnLeft]   = useState(15)
  const [exitConfirm, setExitConfirm]           = useState(false)
  const [autoSubmit, setAutoSubmit]             = useState(false)
  const [autoAdvance, setAutoAdvance]           = useState(false)
  const [isReconnecting, setIsReconnecting]     = useState(false)
  const [showXPScreen, setShowXPScreen]         = useState(false)
  const [myAnswered, setMyAnswered]             = useState(false)
  const [opponentAnswered, setOpponentAnswered] = useState(false)
  // Guest sees cinematic chapter reveal; host skips it
  const [cinematicDone, setCinematicDone]       = useState(iAmPlayer)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const forfeitTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const drawTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const awayTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoAdvanceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hbRef            = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef         = useRef(phase)
  phaseRef.current = phase

  // ── GQL hooks ─────────────────────────────────────────────────────────────
  const { data: qData } = useQuery(GET_BATTLE_QUESTIONS, { variables: { battleId } })
  const [submitAnswer]   = useMutation(SUBMIT_BATTLE_ANSWER)
  const [forfeit]        = useMutation(FORFEIT_BATTLE)
  const [requestDraw]    = useMutation(REQUEST_DRAW)
  const [respondToDraw]  = useMutation(RESPOND_TO_DRAW)
  const [recordLeave]    = useMutation(RECORD_SCREEN_LEAVE)
  const [recordReturn]   = useMutation(RECORD_SCREEN_RETURN)
  const [heartbeat]      = useMutation(PLAYER_HEARTBEAT)
  const [rejoin]         = useMutation(REJOIN_BATTLE)

  // ── Load questions ────────────────────────────────────────────────────────
  useEffect(() => {
    const qs: Question[] = qData?.battleQuestions ?? []
    if (qs.length > 0) {
      setQuestions(qs)
      setPhase('active')
    }
  }, [qData])

  // ── Shuffle answers per question ──────────────────────────────────────────
  useEffect(() => {
    const q = questions[qIndex]
    if (!q) return
    setShuffledAnswers([...q.answers].sort(() => Math.random() - 0.5))
    setSelectedIds([])
    setRevealed(false)
    setMyAnswered(false)
    setOpponentAnswered(false)
    if (timerSeconds) setTimeLeft(timerSeconds)
  }, [qIndex, questions])

  // ── Per-question countdown timer ──────────────────────────────────────────
  useEffect(() => {
    if (!timerSeconds || !questions[qIndex]) return
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      // Keep ticking even during overlays (architecture: timer always runs)
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!)
          if (phaseRef.current === 'active') setAutoSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [qIndex, questions.length, timerSeconds])

  // ── Auto-submit on timer expiry ───────────────────────────────────────────
  useEffect(() => {
    if (!autoSubmit) return
    setAutoSubmit(false)
    handleSubmit(true)
  }, [autoSubmit])

  // ── UPDATE-04: Auto-advance 2.5s after answer is revealed ────────────────
  useEffect(() => {
    if (!revealed) return
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    autoAdvanceRef.current = setTimeout(() => {
      if (phaseRef.current === 'active') handleNext()
    }, 2500)
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current) }
  }, [revealed])

  // ── BUG-08: 30s draw-pending countdown ───────────────────────────────────
  useEffect(() => {
    if (phase !== 'draw_pending') {
      if (drawTimerRef.current) clearInterval(drawTimerRef.current)
      return
    }
    setDrawCountdown(30)
    drawTimerRef.current = setInterval(() => {
      setDrawCountdown((t) => {
        if (t <= 1) {
          clearInterval(drawTimerRef.current!)
          setPhase('active')
          return 30
        }
        return t - 1
      })
    }, 1000)
    return () => { if (drawTimerRef.current) clearInterval(drawTimerRef.current) }
  }, [phase])

  // ── UPDATE-10: Opponent away countdown (45s first leave, 30s second) ──────
  useEffect(() => {
    if (opponentOnScreen) {
      if (awayTimerRef.current) clearInterval(awayTimerRef.current)
      setOpponentAwayLeft(null)
      return
    }
    const graceSec = 45  // conservative — backend uses 45s for first strike
    setOpponentLeftAt(Date.now())
    setOpponentAwayLeft(graceSec)
    awayTimerRef.current = setInterval(() => {
      setOpponentAwayLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(awayTimerRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (awayTimerRef.current) clearInterval(awayTimerRef.current) }
  }, [opponentOnScreen])

  // ── Forfeit warning countdown (15s after draw declined) ───────────────────
  useEffect(() => {
    if (phase !== 'forfeit_warn') return
    setForfeitWarnLeft(15)
    forfeitTimerRef.current = setInterval(() => {
      setForfeitWarnLeft((t) => {
        if (t <= 1) {
          clearInterval(forfeitTimerRef.current!)
          setPhase('active') // warning expired — game resumes
          return 15
        }
        return t - 1
      })
    }, 1000)
    return () => { if (forfeitTimerRef.current) clearInterval(forfeitTimerRef.current) }
  }, [phase])

  // ── Guest cinematic: show chapter info for ~18s before questions ─────────
  useEffect(() => {
    if (iAmPlayer || cinematicDone) return
    const t = setTimeout(() => setCinematicDone(true), 18000)
    return () => clearTimeout(t)
  }, [])

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'loading' || phase === 'complete') return
    hbRef.current = setInterval(() => {
      heartbeat({ variables: { battleId } })
    }, 7000)
    return () => { if (hbRef.current) clearInterval(hbRef.current) }
  }, [battleId, phase])

  // ── Page Visibility (screen leave / return) ───────────────────────────────
  useEffect(() => {
    if (phase === 'loading' || phase === 'complete') return
    const handler = () => {
      if (document.hidden) {
        recordLeave({ variables: { battleId } })
      } else {
        recordReturn({ variables: { battleId } })
      }
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [battleId, phase])

  // ── Subscription ──────────────────────────────────────────────────────────
  const { data: subData, error: subError } = useSubscription(BATTLE_UPDATED, { variables: { battleId } })

  // ── BUG-06: Reconnect on subscription error ───────────────────────────────
  useEffect(() => {
    if (!subError || phase === 'loading' || phase === 'complete') return
    setIsReconnecting(true)
    const retry = setTimeout(async () => {
      try {
        await rejoin({ variables: { battleId } })
      } catch { /* battle may already be complete */ }
      setIsReconnecting(false)
    }, 3000)
    return () => clearTimeout(retry)
  }, [subError])

  useEffect(() => {
    const ev: BattleEvent | null = subData?.battleUpdated ?? null
    if (!ev) return

    // Sync scores (subscription is the authoritative source)
    setMyScore(iAmPlayer ? ev.playerScore : ev.opponentScore)
    setTheirScore(iAmPlayer ? ev.opponentScore : ev.playerScore)

    switch (ev.event) {
      case 'battle_end':
      case 'forfeit':
      case 'auto_defeat':
      case 'draw_accepted': {
        // Resolve winner label to my perspective
        const raw = ev.winner
        let resolved: string | null = raw
        if (raw === 'player')   resolved = iAmPlayer ? 'win'  : 'lose'
        if (raw === 'opponent') resolved = iAmPlayer ? 'lose' : 'win'
        if (raw === 'tie')      resolved = 'tie'
        setWinner(resolved)
        setShowXPScreen(true)
        setPhase('complete')
        break
      }

      case 'answer_submitted':
        if (ev.playerId !== myUserId) setOpponentAnswered(true)
        break

      case 'draw_requested':
        if (ev.playerId !== myUserId) {
          setPhase('draw_incoming')
        } else if (ev.drawRequestsLeft !== null) {
          setDrawsLeft(ev.drawRequestsLeft)
        }
        break

      case 'draw_declined':
        if (phaseRef.current === 'draw_pending') {
          // I requested and was declined — show forfeit warning
          setPhase('forfeit_warn')
        } else {
          // I declined the opponent's request — return to active
          setPhase('active')
        }
        break

      case 'screen_leave':
        if (ev.playerId !== myUserId) setOpponentOnScreen(false)
        break

      case 'screen_return':
        if (ev.playerId !== myUserId) setOpponentOnScreen(true)
        break
    }
  }, [subData])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function handleSelect(id: string) {
    if (revealed) return
    const q = questions[qIndex]
    if (!q) return
    if (q.correctCount === 1) {
      setSelectedIds([id])
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      )
    }
  }

  async function handleSubmit(timedOut = false) {
    if (timerRef.current) clearInterval(timerRef.current)
    const q = questions[qIndex]
    if (!q) return

    const ids = timedOut ? [] : selectedIds
    setRevealed(true)
    setMyAnswered(true)

    await submitAnswer({
      variables: {
        battleId,
        questionId: q.id,
        selectedAnswerIds: ids,
        questionIndex: qIndex,
      },
    })
  }

  function handleNext() {
    if (qIndex + 1 >= questions.length) {
      setPhase('waiting')
    } else {
      setQIndex((i) => i + 1)
      setPhase('active')
    }
  }

  async function handleForfeit() {
    await forfeit({ variables: { battleId } })
    // phase will transition to 'complete' via subscription
  }

  async function handleRequestDraw() {
    if (drawsLeft <= 0) return
    try {
      await requestDraw({ variables: { battleId } })
      setPhase('draw_pending')
    } catch {
      // draw request limit already enforced by backend
    }
  }

  async function handleRespondDraw(accepted: boolean) {
    await respondToDraw({ variables: { battleId, accepted } })
    // phase transitions via subscription (draw_accepted → complete, draw_declined → active)
  }

  function handleExit() {
    if (phase !== 'complete') {
      setExitConfirm(true)
    } else {
      onExit()
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const current     = questions[qIndex]
  const correctIds  = current ? new Set(current.answers.filter((a) => a.isCorrect).map((a) => a.id)) : new Set<string>()
  const timerPct    = timerSeconds ? (timeLeft ?? 0) / timerSeconds : 1
  const timerColor  = timerPct > 0.5 ? 'text-green-500' : timerPct > 0.2 ? 'text-yellow-400' : 'text-red-400'

  // ── Guest cinematic loading screen (UPDATE-05) ────────────────────────────

  if (!cinematicDone) {
    const chapterLabel =
      chapterIds.length === 0
        ? 'All chapters'
        : chapterIds.length === 1
        ? `Chapter ${chapterIds[0]}`
        : `Ch. ${chapterIds.join(' · Ch. ')}`

    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="w-20 h-20 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
        <div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Get Ready!</h2>
          <p className="text-text-secondary text-sm">{chapterLabel}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-text-secondary">Your opponent has chosen the questions</p>
          <p className="text-xs text-text-secondary">Battle starts shortly...</p>
        </div>
        <button
          onClick={() => setCinematicDone(true)}
          className="text-xs text-text-secondary/50 hover:text-text-secondary underline"
        >
          Skip
        </button>
      </div>
    )
  }

  // ── Results screen ────────────────────────────────────────────────────────

  if (phase === 'complete' && showXPScreen) {
    const xpOutcome = (winner === 'win' || winner === 'lose' || winner === 'tie') ? winner : 'lose'
    const { items, totalXP } = buildBattleXPItems({
      outcome: xpOutcome,
      playerScore: myScore,
      totalQuestions: questions.length,
      isClean: myScore === questions.length,
    })
    return (
      <XPBreakdownScreen
        outcome={xpOutcome}
        playerScore={myScore}
        opponentScore={theirScore}
        totalQuestions={questions.length}
        items={items}
        totalXP={totalXP}
        onDone={() => setShowXPScreen(false)}
      />
    )
  }

  if (phase === 'complete') {
    const iconMap: Record<string, React.ReactNode> = {
      win:  <GiLaurelsTrophy size={72} className="text-gold-500" />,
      lose: <IoSad size={72} className="text-red-400" />,
      tie:  <FaHandshake size={72} className="text-info" />,
    }
    const labelMap: Record<string, string> = {
      win:  'You Won!',
      lose: 'You Lost',
      tie:  "It's a Tie",
    }
    const icon  = iconMap[winner ?? '']  ?? <GiLaurelsTrophy size={72} className="text-text-secondary" />
    const label = labelMap[winner ?? ''] ?? 'Battle Over'

    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-6 px-6">
        <div>{icon}</div>
        <h2 className="font-display text-3xl font-bold text-text-primary">{label}</h2>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">You</p>
            <p className="font-mono text-4xl font-bold text-green-500">{myScore}</p>
          </div>
          <span className="text-2xl text-text-secondary font-bold">vs</span>
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">Opponent</p>
            <p className="font-mono text-4xl font-bold text-red-400">{theirScore}</p>
          </div>
        </div>

        <p className="text-sm text-text-secondary">
          {questions.length} question{questions.length !== 1 ? 's' : ''}
        </p>

        <button onClick={onExit} className="btn-primary w-full max-w-xs h-12 text-base font-semibold">
          Back to Challenge
        </button>
      </div>
    )
  }

  // ── Waiting screen ────────────────────────────────────────────────────────

  if (phase === 'waiting') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col">
        <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center justify-between max-w-content mx-auto">
            <span className="font-mono text-2xl font-bold text-green-500">{myScore}</span>
            <span className="text-text-secondary text-sm">Questions done</span>
            <span className="font-mono text-2xl font-bold text-red-400">{theirScore}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-6">
          <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          <p className="text-text-primary font-medium">Waiting for opponent to finish...</p>
          <p className="text-text-secondary text-sm">Results will appear automatically</p>
          <button
            onClick={() => setExitConfirm(true)}
            className="mt-4 text-sm text-text-secondary hover:text-text-primary underline"
          >
            Forfeit
          </button>
        </div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (phase === 'loading' || !current) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-text-secondary text-sm animate-pulse">Loading battle...</p>
      </div>
    )
  }

  // ── Main battle UI ────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-bg flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto">
          <button onClick={handleExit} className="p-1 -ml-1 text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
          <AppLogo height={24} className="flex-shrink-0" />

          {/* Score rail */}
          <div className="flex-1 flex items-center gap-2">
            {/* My side: avatar · score · answered indicator */}
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-700 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-green-400">{myInitial}</span>
              </div>
              <span className="font-mono font-bold text-green-500 text-base">{myScore}</span>
              <span className="w-4 flex items-center justify-center">
                {myAnswered
                  ? <CheckCircle size={13} className="text-green-500" />
                  : <ThinkingDots colorClass="bg-green-500" />
                }
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex-1 flex items-center gap-0.5">
              {questions.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < qIndex ? 'bg-green-700' : i === qIndex ? 'bg-green-500' : 'bg-surface-3'
                }`} />
              ))}
            </div>

            {/* Opponent side: answered indicator · score · avatar */}
            <div className="flex items-center gap-1">
              <span className="w-4 flex items-center justify-center">
                {opponentAnswered
                  ? <CheckCircle size={13} className="text-red-400" />
                  : <ThinkingDots colorClass="bg-red-400" />
                }
              </span>
              <span className="font-mono font-bold text-red-400 text-base">{theirScore}</span>
              <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-red-400">?</span>
              </div>
            </div>
          </div>

          {/* Opponent status */}
          {!opponentOnScreen && opponentAwayLeft !== null && (
            <span className="flex items-center gap-1 text-xs text-yellow-400 font-mono">
              <WifiOff size={13} />
              {opponentAwayLeft}s
            </span>
          )}
        </div>

        {/* Per-question timer bar */}
        {timerSeconds && (
          <div className="px-0 mt-2 max-w-content mx-auto">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-mono font-bold ${timerColor} ${timerPct <= 0.1 ? 'animate-pulse' : ''}`}>
                <Clock size={10} className="inline mr-0.5" />{timeLeft}s
              </span>
            </div>
            <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timerPct > 0.5 ? 'bg-green-500' : timerPct > 0.2 ? 'bg-yellow-400' : 'bg-red-500'
                }`}
                style={{ width: `${timerPct * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Question ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 max-w-content mx-auto w-full">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-3">
          Question {qIndex + 1} of {questions.length}
        </p>
        <div className="card-elevated mb-4">
          <p className="text-text-primary text-base font-medium leading-relaxed">{current.questionText}</p>
        </div>

        {/* ── Answers ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {shuffledAnswers.map((answer) => {
            const isSelected   = selectedIds.includes(answer.id)
            const isCorrectAns = correctIds.has(answer.id)

            return (
              <button
                key={answer.id}
                onClick={() => handleSelect(answer.id)}
                disabled={revealed}
                className={clsx(
                  'w-full text-left rounded-lg border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                  !revealed && !isSelected  && 'bg-surface border-border hover:border-green-700 hover:bg-surface-2',
                  !revealed && isSelected   && 'bg-green-500/10 border-green-500',
                  revealed && isCorrectAns && isSelected  && 'bg-green-500/15 border-green-500',
                  revealed && !isCorrectAns && isSelected && 'bg-red-500/10 border-red-600',
                  revealed && isCorrectAns && !isSelected && 'bg-yellow-400/10 border-yellow-600',
                  revealed && !isCorrectAns && !isSelected && 'opacity-40 bg-surface border-border',
                )}
              >
                <div className={clsx(
                  'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                  !revealed && isSelected   && 'bg-green-500 border-green-500',
                  !revealed && !isSelected  && 'border-border',
                  revealed && isCorrectAns && isSelected  && 'bg-green-500 border-green-500',
                  revealed && !isCorrectAns && isSelected && 'bg-red-500 border-red-500',
                  revealed && isCorrectAns && !isSelected && 'bg-yellow-400 border-yellow-400',
                  revealed && !isCorrectAns && !isSelected && 'border-border',
                )}>
                  {revealed && isCorrectAns && isSelected  && <CheckCircle size={12} className="text-bg" />}
                  {revealed && !isCorrectAns && isSelected && <XCircle size={12} className="text-bg" />}
                  {revealed && isCorrectAns && !isSelected && <CheckCircle size={12} className="text-bg" />}
                  {!revealed && isSelected                 && <div className="w-2 h-2 rounded-full bg-bg" />}
                </div>
                <span className="text-sm leading-snug flex-1 text-text-primary">{answer.text}</span>
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-surface-2 border border-border">
            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">Explanation</p>
            <p className="text-sm text-text-primary leading-relaxed">{current.explanation}</p>
          </div>
        )}
      </div>

      {/* ── Bottom actions ───────────────────────────────────────────────── */}
      <div className="mt-auto px-4 pb-8 pt-4 max-w-content mx-auto w-full space-y-3">
        {!revealed && (
          <>
            <button
              onClick={() => handleSubmit()}
              disabled={selectedIds.length === 0}
              className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40"
            >
              Lock In Answer
            </button>
            <div className="flex gap-3 justify-center">
              {drawsLeft > 0 && (
                <button
                  onClick={handleRequestDraw}
                  className="text-xs text-text-secondary hover:text-text-primary underline"
                >
                  Request Draw ({drawsLeft} left)
                </button>
              )}
              <button
                onClick={() => setExitConfirm(true)}
                className="text-xs text-red-400/70 hover:text-red-400 underline"
              >
                Forfeit
              </button>
            </div>
          </>
        )}
        {revealed && (
          <div className="h-12 flex items-center justify-center">
            <p className="text-sm text-text-secondary animate-pulse">
              {qIndex + 1 >= questions.length ? 'Finishing...' : 'Next question in a moment...'}
            </p>
          </div>
        )}
      </div>

      {/* ── Draw pending overlay ─────────────────────────────────────────── */}
      {phase === 'draw_pending' && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
              <p className="font-display text-lg font-bold text-text-primary">Draw Requested</p>
              <p className="text-sm text-text-secondary">Waiting for opponent to respond...</p>
              <p className={clsx(
                'font-mono text-4xl font-bold',
                drawCountdown > 10 ? 'text-green-500' : drawCountdown > 5 ? 'text-yellow-400' : 'text-red-400'
              )}>
                {drawCountdown}s
              </p>
              <button
                onClick={() => { setPhase('active'); if (drawTimerRef.current) clearInterval(drawTimerRef.current) }}
                className="text-xs text-text-secondary hover:text-text-primary underline"
              >
                Cancel and keep playing
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Draw incoming overlay ────────────────────────────────────────── */}
      {phase === 'draw_incoming' && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
              <p className="font-display text-lg font-bold text-text-primary">Opponent Requests a Draw</p>
              <p className="text-sm text-text-secondary">
                Accept to end as a tie, or decline and keep playing.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleRespondDraw(false)}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-text-secondary hover:border-red-600 hover:text-red-400 transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleRespondDraw(true)}
                  className="flex-1 h-11 rounded-lg bg-green-500 text-bg text-sm font-semibold hover:bg-green-400 transition-all"
                >
                  Accept Tie
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Forfeit warning overlay (draw declined) ──────────────────────── */}
      {phase === 'forfeit_warn' && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-red-800 rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
              <p className="font-display text-lg font-bold text-red-400">Draw Declined</p>
              <p className="text-sm text-text-secondary">
                Forfeit now or return to the battle.
              </p>
              <p className="font-mono text-3xl font-bold text-red-400">{forfeitWarnLeft}s</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setPhase('active'); if (forfeitTimerRef.current) clearInterval(forfeitTimerRef.current) }}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
                >
                  Return to Battle
                </button>
                <button
                  onClick={handleForfeit}
                  className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all"
                >
                  Forfeit
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Reconnecting overlay ─────────────────────────────────────────── */}
      {isReconnecting && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin mx-auto" />
              <p className="font-display font-bold text-text-primary">Reconnecting...</p>
              <p className="text-sm text-text-secondary">Hang tight — restoring your connection</p>
            </div>
          </div>
        </>
      )}

      {/* ── Exit confirm overlay ─────────────────────────────────────────── */}
      {exitConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setExitConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
              <p className="font-display text-lg font-bold text-text-primary">Forfeit Battle?</p>
              <p className="text-sm text-text-secondary">
                Leaving now counts as a forfeit. Your opponent wins.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setExitConfirm(false)}
                  className="flex-1 h-11 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={handleForfeit}
                  className="flex-1 h-11 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all"
                >
                  Forfeit
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
