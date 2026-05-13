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
  const timerColor  = timerPct > 0.5 ? 'text-correct' : timerPct > 0.2 ? 'text-yellow' : 'text-orange'
  const timerBar    = timerPct > 0.5 ? 'bg-correct'   : timerPct > 0.2 ? 'bg-yellow'   : 'bg-orange'

  // ── Guest cinematic loading screen (UPDATE-05) ────────────────────────────

  if (!cinematicDone) {
    const chapterLabel =
      chapterIds.length === 0
        ? 'All chapters'
        : chapterIds.length === 1
        ? `Chapter ${chapterIds[0]}`
        : `Ch. ${chapterIds.join(' · Ch. ')}`

    return (
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col items-center justify-center gap-7 px-6 text-center relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background:
              'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
          }}
        />
        <div className="w-20 h-20 rounded-full border-4 border-orange border-t-transparent animate-spin" />
        <div>
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Peer Battle
          </div>
          <h2 className="display font-extrabold text-[clamp(28px,4vw,40px)] leading-[1.05] tracking-[-1px] text-white mb-2">
            Get ready.
          </h2>
          <p className="mono text-[11px] tracking-[0.1em] uppercase text-yellow font-semibold">{chapterLabel}</p>
        </div>
        <div className="space-y-1.5">
          <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted">Your opponent has chosen the questions</p>
          <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted">Battle starts shortly…</p>
        </div>
        <button
          onClick={() => setCinematicDone(true)}
          className="mono text-[11px] tracking-[0.1em] uppercase text-text-muted hover:text-white underline font-semibold transition-colors"
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
      win:  <GiLaurelsTrophy size={64} className="text-yellow" />,
      lose: <IoSad size={64} className="text-wrong" />,
      tie:  <FaHandshake size={64} className="text-info" />,
    }
    const labelMap: Record<string, string> = {
      win:  'You won!',
      lose: 'You lost',
      tie:  "It's a tie",
    }
    const toneMap: Record<string, string> = {
      win:  'text-yellow',
      lose: 'text-wrong',
      tie:  'text-white',
    }
    const stripeMap: Record<string, string> = {
      win:  '#22C55E',
      lose: '#EF4444',
      tie:  '#F8DE22',
    }
    const icon  = iconMap[winner ?? '']  ?? <GiLaurelsTrophy size={64} className="text-text-secondary" />
    const label = labelMap[winner ?? ''] ?? 'Battle Over'
    const tone  = toneMap[winner ?? '']  ?? 'text-white'
    const stripe = stripeMap[winner ?? ''] ?? '#F8DE22'

    return (
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col items-center justify-center gap-6 px-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background:
              'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
          }}
        />
        <div className="animate-fade-up">{icon}</div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Peer Battle result
          </div>
          <h2 className={`display font-extrabold text-[clamp(32px,5vw,48px)] leading-[1.02] tracking-[-1px] ${tone}`}>
            {label}
          </h2>
        </div>

        <div className="w-full max-w-sm card relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: stripe }} />
          <div className="flex items-center justify-around pt-1">
            <div className="text-center">
              <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted mb-1">You</p>
              <p className={`mono font-bold text-[44px] tabular-nums leading-none ${
                winner === 'win' ? 'text-correct' : winner === 'tie' ? 'text-yellow' : 'text-white'
              }`}>{myScore}</p>
            </div>
            <div className="mono font-bold text-[15px] tracking-[0.2em] uppercase text-text-muted">vs</div>
            <div className="text-center">
              <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted mb-1">Opponent</p>
              <p className={`mono font-bold text-[44px] tabular-nums leading-none ${
                winner === 'lose' ? 'text-wrong' : 'text-text-secondary'
              }`}>{theirScore}</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-center mono text-[10px] tracking-[0.08em] uppercase text-text-muted">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </div>
        </div>

        <button onClick={onExit} className="btn-primary w-full max-w-xs h-12 text-sm font-semibold">
          Back to Challenge
        </button>
      </div>
    )
  }

  // ── Waiting screen ────────────────────────────────────────────────────────

  if (phase === 'waiting') {
    return (
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col">
        <div className="sticky top-0 z-40 glass border-b border-border">
          <div className="flex items-center justify-between max-w-[760px] mx-auto px-4 pt-4 pb-3">
            <span className="mono text-2xl font-bold text-correct tabular-nums">{myScore}</span>
            <span className="mono text-[10px] tracking-[0.12em] uppercase font-semibold text-text-muted">Questions done</span>
            <span className="mono text-2xl font-bold text-wrong tabular-nums">{theirScore}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-6">
          <div className="w-12 h-12 rounded-full border-4 border-orange border-t-transparent animate-spin" />
          <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Waiting for opponent
          </div>
          <p className="display font-bold text-xl text-white">Almost done.</p>
          <p className="text-text-secondary text-sm">Results will appear automatically.</p>
          <button
            onClick={() => setExitConfirm(true)}
            className="mt-4 mono text-[11px] tracking-[0.1em] uppercase font-semibold text-wrong/70 hover:text-wrong underline transition-colors"
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
      <div className="min-h-dvh bg-navy-deep blueprint-grid flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
          <p className="mono text-[11px] tracking-[0.12em] uppercase font-semibold">Loading battle…</p>
        </div>
      </div>
    )
  }

  // ── Main battle UI ────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="flex items-center gap-3 max-w-[760px] mx-auto px-4 pt-4 pb-3">
          <button
            onClick={handleExit}
            className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
            aria-label="Exit"
          >
            <X size={20} />
          </button>
          <AppLogo height={22} className="flex-shrink-0" />

          {/* Score rail */}
          <div className="flex-1 flex items-center gap-2">
            {/* My side: avatar · score · answered indicator */}
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-md bg-green-soft border border-correct/40 flex items-center justify-center flex-shrink-0">
                <span className="mono text-[9px] font-bold text-correct">{myInitial}</span>
              </div>
              <span className="mono font-bold text-correct text-base tabular-nums">{myScore}</span>
              <span className="w-4 flex items-center justify-center">
                {myAnswered
                  ? <CheckCircle size={13} className="text-correct" />
                  : <ThinkingDots colorClass="bg-correct" />
                }
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex-1 flex items-center gap-0.5">
              {questions.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < qIndex ? 'bg-correct/70' : i === qIndex ? 'bg-orange' : 'bg-white/[0.06]'
                }`} />
              ))}
            </div>

            {/* Opponent side: answered indicator · score · avatar */}
            <div className="flex items-center gap-1">
              <span className="w-4 flex items-center justify-center">
                {opponentAnswered
                  ? <CheckCircle size={13} className="text-wrong" />
                  : <ThinkingDots colorClass="bg-wrong" />
                }
              </span>
              <span className="mono font-bold text-wrong text-base tabular-nums">{theirScore}</span>
              <div className="w-5 h-5 rounded-md bg-wrong/10 border border-wrong/40 flex items-center justify-center flex-shrink-0">
                <span className="mono text-[9px] font-bold text-wrong">?</span>
              </div>
            </div>
          </div>

          {/* Opponent status */}
          {!opponentOnScreen && opponentAwayLeft !== null && (
            <span className="flex items-center gap-1 mono text-[11px] font-bold text-yellow tabular-nums">
              <WifiOff size={12} />
              {opponentAwayLeft}s
            </span>
          )}
        </div>

        {/* Per-question timer bar */}
        {timerSeconds && (
          <div className="px-4 pb-3 max-w-[760px] mx-auto">
            <div className="flex items-center justify-end mb-1">
              <span className={`mono text-[11px] font-bold tabular-nums ${timerColor} ${timerPct <= 0.1 ? 'animate-pulse' : ''}`}>
                <Clock size={10} className="inline mr-0.5" />{timeLeft}s
              </span>
            </div>
            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timerBar}`}
                style={{ width: `${timerPct * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Question ────────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 max-w-[760px] mx-auto w-full">
        <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
          Question {qIndex + 1} of {questions.length}
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

        {/* ── Answers ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {shuffledAnswers.map((answer, idx) => {
            const isSelected   = selectedIds.includes(answer.id)
            const isCorrectAns = correctIds.has(answer.id)
            const letter       = String.fromCharCode(65 + idx)

            return (
              <button
                key={answer.id}
                onClick={() => handleSelect(answer.id)}
                disabled={revealed}
                className={clsx(
                  'w-full text-left rounded-md border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                  !revealed && !isSelected  && 'bg-surface border-border hover:border-orange/40 hover:bg-surface-2',
                  !revealed && isSelected   && 'bg-orange-soft border-orange',
                  revealed && isCorrectAns && isSelected  && 'bg-green-soft border-correct',
                  revealed && !isCorrectAns && isSelected && 'bg-wrong/10 border-wrong',
                  revealed && isCorrectAns && !isSelected && 'bg-yellow-soft border-yellow-rim',
                  revealed && !isCorrectAns && !isSelected && 'opacity-40 bg-surface border-border',
                )}
              >
                <span className={clsx(
                  'w-6 h-6 rounded-md mono text-[11px] font-bold flex-shrink-0 flex items-center justify-center border',
                  !revealed && isSelected   && 'bg-orange text-white border-orange',
                  !revealed && !isSelected  && 'border-border text-text-muted',
                  revealed && isCorrectAns && isSelected  && 'bg-correct text-bg border-correct',
                  revealed && !isCorrectAns && isSelected && 'bg-wrong text-white border-wrong',
                  revealed && isCorrectAns && !isSelected && 'bg-yellow text-bg border-yellow',
                  revealed && !isCorrectAns && !isSelected && 'border-border text-text-muted',
                )}>
                  {revealed && isCorrectAns && isSelected   ? <CheckCircle size={13} strokeWidth={3} /> :
                   revealed && !isCorrectAns && isSelected  ? <XCircle size={13} strokeWidth={3} /> :
                   revealed && isCorrectAns && !isSelected  ? <CheckCircle size={13} strokeWidth={3} /> :
                   letter}
                </span>
                <span className="text-[14px] leading-snug flex-1 text-white">{answer.text}</span>
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div className="mt-4 px-4 py-3 rounded-md bg-surface-2 border border-border">
            <p className="mono text-[10px] text-text-muted font-semibold uppercase tracking-[0.12em] mb-1.5">
              Explanation
            </p>
            <p className="text-sm text-text-primary leading-relaxed">{current.explanation}</p>
          </div>
        )}
      </div>

      {/* ── Bottom actions ───────────────────────────────────────────────── */}
      <div className="mt-auto px-4 pb-8 pt-4 max-w-[760px] mx-auto w-full space-y-3">
        {!revealed && (
          <>
            <button
              onClick={() => handleSubmit()}
              disabled={selectedIds.length === 0}
              className="btn-primary w-full h-12 text-sm font-semibold disabled:opacity-40"
            >
              Lock In Answer
            </button>
            <div className="flex gap-4 justify-center">
              {drawsLeft > 0 && (
                <button
                  onClick={handleRequestDraw}
                  className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-text-secondary hover:text-yellow underline transition-colors"
                >
                  Request Draw ({drawsLeft} left)
                </button>
              )}
              <button
                onClick={() => setExitConfirm(true)}
                className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-wrong/70 hover:text-wrong underline transition-colors"
              >
                Forfeit
              </button>
            </div>
          </>
        )}
        {revealed && (
          <div className="h-12 flex items-center justify-center">
            <p className="mono text-[11px] tracking-[0.12em] uppercase font-semibold text-text-secondary animate-pulse">
              {qIndex + 1 >= questions.length ? 'Finishing…' : 'Next question…'}
            </p>
          </div>
        )}
      </div>

      {/* ── Draw pending overlay ─────────────────────────────────────────── */}
      {phase === 'draw_pending' && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm text-center space-y-4 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background:
                    'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
                }}
              />
              <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-yellow">
                <span className="w-[14px] h-[1.5px] rounded-full bg-yellow" />
                Draw requested
              </div>
              <p className="mono text-[11px] tracking-[0.1em] uppercase text-text-muted">Waiting for opponent to respond…</p>
              <p className={clsx(
                'mono text-[44px] font-bold tabular-nums leading-none',
                drawCountdown > 10 ? 'text-correct' : drawCountdown > 5 ? 'text-yellow' : 'text-orange'
              )}>
                {drawCountdown}s
              </p>
              <button
                onClick={() => { setPhase('active'); if (drawTimerRef.current) clearInterval(drawTimerRef.current) }}
                className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-text-secondary hover:text-white underline transition-colors"
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
            <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm text-center space-y-4 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background:
                    'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
                }}
              />
              <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-yellow">
                <span className="w-[14px] h-[1.5px] rounded-full bg-yellow" />
                Draw incoming
              </div>
              <p className="display font-bold text-base text-white">Opponent requests a draw.</p>
              <p className="text-[13px] text-text-secondary">
                Accept to end as a tie, or decline and keep playing.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRespondDraw(false)}
                  className="flex-1 h-10 rounded-md bg-white/[0.04] border border-border text-sm font-semibold text-text-secondary hover:border-wrong/40 hover:text-wrong transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleRespondDraw(true)}
                  className="flex-1 h-10 rounded-md bg-correct/15 border border-correct/40 text-correct text-sm font-semibold hover:bg-correct hover:text-bg transition-all"
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
            <div className="bg-surface border border-wrong/40 rounded-lg p-6 w-full max-w-sm text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-wrong" />
              <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-wrong">
                <span className="w-[14px] h-[1.5px] rounded-full bg-wrong" />
                Draw declined
              </div>
              <p className="text-[13px] text-text-secondary">Forfeit now or return to the battle.</p>
              <p className="mono text-[36px] font-bold tabular-nums leading-none text-wrong">{forfeitWarnLeft}s</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPhase('active'); if (forfeitTimerRef.current) clearInterval(forfeitTimerRef.current) }}
                  className="flex-1 h-10 rounded-md bg-white/[0.04] border border-border text-sm font-semibold text-text-secondary hover:text-white transition-all"
                >
                  Return
                </button>
                <button
                  onClick={handleForfeit}
                  className="flex-1 h-10 rounded-md bg-wrong/15 border border-wrong/40 text-wrong text-sm font-semibold hover:bg-wrong hover:text-white active:scale-95 transition-all"
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
            <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-sm text-center space-y-3 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background:
                    'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
                }}
              />
              <div className="w-10 h-10 rounded-full border-4 border-orange border-t-transparent animate-spin mx-auto" />
              <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                <span className="w-[14px] h-[1.5px] rounded-full bg-orange" />
                Reconnecting
              </div>
              <p className="text-[13px] text-text-secondary">Hang tight — restoring your connection.</p>
            </div>
          </div>
        </>
      )}

      {/* ── Exit confirm overlay ─────────────────────────────────────────── */}
      {exitConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setExitConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-wrong/40 rounded-lg p-6 w-full max-w-sm text-center space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-wrong" />
              <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-wrong">
                <span className="w-[14px] h-[1.5px] rounded-full bg-wrong" />
                Forfeit?
              </div>
              <p className="text-[13px] text-text-secondary">
                Leaving now counts as a forfeit. Your opponent wins.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setExitConfirm(false)}
                  className="flex-1 h-10 rounded-md bg-white/[0.04] border border-border text-sm font-semibold text-text-secondary hover:text-white transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={handleForfeit}
                  className="flex-1 h-10 rounded-md bg-wrong/15 border border-wrong/40 text-wrong text-sm font-semibold hover:bg-wrong hover:text-white active:scale-95 transition-all"
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
