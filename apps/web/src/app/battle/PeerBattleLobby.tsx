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
import { useMutation, useSubscription, useQuery, gql } from '@apollo/client'
import { FiX as X, FiCopy as Copy, FiCheck as Check, FiLoader as Loader2, FiShare2 as Share2, FiBookOpen as BookOpen } from 'react-icons/fi'
import { GiCrossedSwords as Swords } from 'react-icons/gi'
import { useUserStore } from '@/stores'
import { AppLogo } from '@/components/layout/AppLogo'

// ── GQL ───────────────────────────────────────────────────────────────────────

const GET_CHAPTERS = gql`
  query LobbyGetChapters($stateCode: String!) {
    chapters(stateCode: $stateCode) {
      id
      number
      title
    }
  }
`

const CREATE_BATTLE = gql`
  mutation PeerCreateBattle(
    $questionCount: Int!
    $stateCode: String!
    $timerSeconds: Int
    $chapterIds: [Int!]
  ) {
    createBattle(
      questionCount: $questionCount
      stateCode: $stateCode
      timerSeconds: $timerSeconds
      chapterIds: $chapterIds
    ) {
      id roomCode timerSeconds state playerId chapterIds
    }
  }
`

const JOIN_BATTLE = gql`
  mutation PeerJoinBattle($roomCode: String!) {
    joinBattle(roomCode: $roomCode) {
      id timerSeconds state playerId chapterIds
    }
  }
`

const WAIT_FOR_OPPONENT = gql`
  subscription WaitForOpponent($battleId: ID!) {
    battleUpdated(battleId: $battleId) {
      event
      battleState
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PeerBattleSetup {
  battleId: string
  timerSeconds: number | null
  playerCount: number
  iAmPlayer: boolean   // true = I created (host), false = I joined
  chapterIds: number[] // empty = all chapters
}

interface PeerBattleLobbyProps {
  onStart: (setup: PeerBattleSetup) => void
  onBack: () => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const QUESTION_COUNTS = [5, 10, 15, 20]
const PLAYER_COUNTS   = [2, 3, 4, 5]
const TIMERS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
]

// ── Typing dots (UPDATE-06) ───────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="flex gap-0.5 items-end h-4 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-orange animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '600ms' }}
        />
      ))}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PeerBattleLobby({ onStart, onBack }: PeerBattleLobbyProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [tab, setTab]                         = useState<'host' | 'join'>('host')
  const [questionCount, setQCount]            = useState(10)
  const [playerCount, setPlayerCount]         = useState(2)
  const [timerSec, setTimerSec]               = useState<number>(15)
  const [selectedChapters, setSelectedChapters] = useState<number[]>([])

  // Host state
  const [hostedBattle, setHostedBattle] = useState<{
    id: string
    roomCode: string
    timerSeconds: number | null
    chapterIds: number[]
  } | null>(null)
  const [copied, setCopied]                   = useState(false)
  const [sharedLink, setSharedLink]           = useState(false)
  const [opponentJoining, setOpponentJoining] = useState(false)

  // Join state
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  const { data: chaptersData } = useQuery(GET_CHAPTERS, { variables: { stateCode } })
  const chapters: { id: string; number: number; title: string }[] =
    chaptersData?.chapters ?? []

  const [createBattle, { loading: creating }] = useMutation(CREATE_BATTLE)
  const [joinBattle,   { loading: joining  }] = useMutation(JOIN_BATTLE)

  // ── Wait for opponent (host only) ──────────────────────────────────────────

  const { data: subData } = useSubscription(WAIT_FOR_OPPONENT, {
    variables: { battleId: hostedBattle?.id ?? '' },
    skip: !hostedBattle,
  })

  useEffect(() => {
    if (subData?.battleUpdated?.event === 'joined' && hostedBattle && !opponentJoining) {
      setOpponentJoining(true)
      setTimeout(() => {
        onStart({
          battleId: hostedBattle.id,
          timerSeconds: hostedBattle.timerSeconds,
          playerCount,
          iAmPlayer: true,
          chapterIds: hostedBattle.chapterIds,
        })
      }, 1800)
    }
  }, [subData])

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleCreate() {
    try {
      const { data } = await createBattle({
        variables: {
          questionCount,
          stateCode,
          timerSeconds: timerSec,
          chapterIds: selectedChapters.length > 0 ? selectedChapters : undefined,
        },
      })
      const b = data?.createBattle
      if (b) {
        setHostedBattle({
          id: b.id,
          roomCode: b.roomCode,
          timerSeconds: b.timerSeconds,
          chapterIds: b.chapterIds ?? [],
        })
      }
    } catch {
      // errors surface in Apollo's error state
    }
  }

  async function handleJoin() {
    setJoinError('')
    const code = joinCode.replace(/\D/g, '').slice(0, 6)
    if (code.length !== 6) { setJoinError('Enter the full 6-digit code.'); return }
    try {
      const { data } = await joinBattle({ variables: { roomCode: code } })
      const b = data?.joinBattle
      if (b) {
        onStart({
          battleId: b.id,
          timerSeconds: b.timerSeconds,
          playerCount: 2,
          iAmPlayer: false,
          chapterIds: b.chapterIds ?? [],
        })
      }
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Room not found or already started.'
      setJoinError(msg.replace('["', '').replace('"]', ''))
    }
  }

  function copyCode() {
    if (!hostedBattle) return
    navigator.clipboard.writeText(hostedBattle.roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareInviteLink() {
    if (!hostedBattle) return
    const url = `${window.location.origin}/?join=${hostedBattle.roomCode}`
    if (navigator.share) {
      navigator.share({ title: 'DriveReady Battle', text: `Join my battle! Code: ${hostedBattle.roomCode}`, url })
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setSharedLink(true)
        setTimeout(() => setSharedLink(false), 2000)
      })
    }
  }

  function toggleChapter(num: number) {
    setSelectedChapters((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border">
        <div className="px-4 pt-4 pb-3 max-w-[760px] mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
            aria-label="Exit"
          >
            <X size={20} />
          </button>
          <AppLogo height={24} className="flex-shrink-0" />
          <div className="inline-flex items-center gap-1.5 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange ml-1">
            <Swords size={11} />
            Peer Battle
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 max-w-[760px] mx-auto w-full space-y-6 pb-10">

        {/* Tabs */}
        <div className="flex rounded-md border border-border overflow-hidden">
          {(['host', 'join'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setHostedBattle(null)
                setJoinError('')
                setOpponentJoining(false)
              }}
              className={`flex-1 py-2.5 mono text-[11px] tracking-[0.1em] uppercase font-semibold transition-all ${
                tab === t
                  ? 'bg-orange text-white'
                  : 'bg-white/[0.04] text-text-secondary hover:text-white'
              }`}
            >
              {t === 'host' ? 'Host a Room' : 'Join a Room'}
            </button>
          ))}
        </div>

        {/* ── HOST TAB ────────────────────────────────────────────────────── */}
        {tab === 'host' && !hostedBattle && (
          <div className="space-y-5">

            {/* Chapter selection */}
            {chapters.length > 0 && (
              <section>
                <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                  <BookOpen size={11} />
                  Chapters
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedChapters([])}
                    className={`mono text-[11px] tracking-[0.08em] uppercase font-semibold px-3 py-1.5 rounded-md transition-all border ${
                      selectedChapters.length === 0
                        ? 'bg-orange border-orange text-white'
                        : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
                    }`}
                  >
                    All
                  </button>
                  {chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => toggleChapter(ch.number)}
                      className={`mono text-[11px] tracking-[0.08em] uppercase font-semibold px-3 py-1.5 rounded-md transition-all border ${
                        selectedChapters.includes(ch.number)
                          ? 'bg-orange-soft border-orange text-orange'
                          : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
                      }`}
                    >
                      Ch. {String(ch.number).padStart(2, '0')}
                    </button>
                  ))}
                </div>
                {selectedChapters.length > 0 && (
                  <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted mt-2">
                    {selectedChapters.length === 1
                      ? `Ch. ${String(selectedChapters[0]).padStart(2, '0')} selected`
                      : `${selectedChapters.length} chapters selected`
                    }
                  </p>
                )}
              </section>
            )}

            {/* Player count */}
            <section>
              <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
                Players
              </div>
              <div className="flex gap-2">
                {PLAYER_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`flex-1 py-2 rounded-md mono text-sm font-bold tabular-nums transition-all border ${
                      playerCount === n
                        ? 'bg-orange text-white border-orange'
                        : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {playerCount > 2 && (
                <p className="text-[12px] text-text-secondary mt-2">
                  Dropped players are replaced by a bot automatically.
                </p>
              )}
            </section>

            {/* Question count */}
            <section>
              <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
                Questions
              </div>
              <div className="flex gap-2">
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setQCount(n)}
                    className={`flex-1 py-2 rounded-md mono text-sm font-bold tabular-nums transition-all border ${
                      questionCount === n
                        ? 'bg-orange text-white border-orange'
                        : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>

            {/* Timer */}
            <section>
              <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
                Timer per question
              </div>
              <div className="flex gap-2">
                {TIMERS.map(({ value, label }) => (
                  <button
                    key={label}
                    onClick={() => setTimerSec(value)}
                    className={`flex-1 py-2 rounded-md mono text-[13px] font-bold tabular-nums transition-all border ${
                      timerSec === value
                        ? 'bg-orange text-white border-orange'
                        : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Rules reminder */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange" />
              <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                <span className="w-[14px] h-[1.5px] rounded-full bg-orange" />
                Peer Battle rules
              </div>
              <ul className="text-[13px] text-text-secondary space-y-1.5 leading-relaxed">
                <li>• Both players answer the same questions independently</li>
                <li>• Up to 2 draw requests per player</li>
                <li>• Leaving the screen gives 45s / 30s grace on strikes 1 / 2</li>
                <li>• 3rd screen leave = auto-defeat</li>
              </ul>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary w-full h-12 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 size={18} className="animate-spin" /> : null}
              Create Room
            </button>
          </div>
        )}

        {/* ── WAITING FOR OPPONENT ─────────────────────────────────────────── */}
        {tab === 'host' && hostedBattle && (
          <div className="space-y-6 text-center pt-4">
            <div>
              <div className="mono text-[10px] tracking-[0.14em] uppercase text-text-muted mb-3">
                Share this code with your opponent
              </div>
              <div className="inline-flex items-center gap-3 bg-surface border border-orange/30 rounded-lg px-6 py-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange" />
                <span className="mono text-[40px] font-bold tracking-[0.25em] text-orange tabular-nums leading-none">
                  {hostedBattle.roomCode}
                </span>
                <button
                  onClick={copyCode}
                  className="text-text-secondary hover:text-white transition-colors"
                  title="Copy code"
                  aria-label="Copy code"
                >
                  {copied ? <Check size={20} className="text-correct" /> : <Copy size={20} />}
                </button>
                <button
                  onClick={shareInviteLink}
                  className="text-text-secondary hover:text-orange transition-colors"
                  title="Share invite link"
                  aria-label="Share invite link"
                >
                  {sharedLink ? <Check size={20} className="text-correct" /> : <Share2 size={20} />}
                </button>
              </div>
            </div>

            {opponentJoining ? (
              <div className="inline-flex items-center justify-center gap-1 mono text-[11px] tracking-[0.1em] uppercase font-semibold text-orange">
                <span>Opponent joining</span>
                <TypingDots />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center gap-2 mono text-[11px] tracking-[0.1em] uppercase font-semibold text-text-secondary">
                <Loader2 size={14} className="animate-spin text-orange" />
                <span>Waiting for opponent…</span>
              </div>
            )}

            <div className="mono text-[10px] tracking-[0.08em] uppercase text-text-muted space-y-0.5">
              <p>{questionCount} questions · {hostedBattle.timerSeconds}s per question</p>
              {selectedChapters.length > 0 && (
                <p>
                  {selectedChapters.length === 1
                    ? `Chapter ${selectedChapters[0]}`
                    : `Ch. ${selectedChapters.slice(0, -1).join(', ')} & ${selectedChapters[selectedChapters.length - 1]}`
                  }
                </p>
              )}
            </div>

            {!opponentJoining && (
              <button
                onClick={() => setHostedBattle(null)}
                className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-text-secondary hover:text-white underline transition-colors"
              >
                Cancel room
              </button>
            )}
          </div>
        )}

        {/* ── JOIN TAB ────────────────────────────────────────────────────── */}
        {tab === 'join' && (
          <div className="space-y-5">
            <section>
              <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
                Room code
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={joinCode}
                onChange={(e) => {
                  setJoinError('')
                  setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && joinCode.length === 6 && !joining) handleJoin()
                }}
                className="input text-center mono text-[28px] font-bold tracking-[0.25em] tabular-nums h-16 placeholder:text-text-faint"
              />
              {joinError && (
                <p className="text-[12px] text-wrong mt-2">{joinError}</p>
              )}
            </section>

            <button
              onClick={handleJoin}
              disabled={joining || joinCode.length !== 6}
              className="btn-primary w-full h-12 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {joining ? <Loader2 size={18} className="animate-spin" /> : null}
              Join Battle
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
