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
import { X, Copy, Check, Loader2, Swords, Share2, BookOpen } from 'lucide-react'
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
          className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce"
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
    <div className="min-h-dvh bg-bg flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto">
          <button onClick={onBack} className="p-1 -ml-1 text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
          <AppLogo height={26} className="flex-shrink-0" />
          <div className="flex items-center gap-2 ml-1">
            <Swords size={18} className="text-green-500" />
            <h1 className="font-display text-lg font-bold text-text-primary">Peer Battle</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 max-w-content mx-auto w-full space-y-6">

        {/* Tabs */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['host', 'join'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setHostedBattle(null)
                setJoinError('')
                setOpponentJoining(false)
              }}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-green-500 text-bg'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
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
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={12} className="text-text-secondary" />
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Chapters</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedChapters([])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      selectedChapters.length === 0
                        ? 'bg-green-500 border-green-500 text-bg'
                        : 'bg-surface-2 border-border text-text-secondary hover:border-green-700'
                    }`}
                  >
                    All
                  </button>
                  {chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => toggleChapter(ch.number)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        selectedChapters.includes(ch.number)
                          ? 'bg-green-500/15 border-green-500 text-green-400'
                          : 'bg-surface-2 border-border text-text-secondary hover:border-green-700'
                      }`}
                    >
                      Ch. {ch.number}
                    </button>
                  ))}
                </div>
                {selectedChapters.length > 0 && (
                  <p className="text-xs text-text-secondary mt-1.5">
                    {selectedChapters.length === 1
                      ? `Ch. ${selectedChapters[0]} selected`
                      : `${selectedChapters.length} chapters selected`
                    }
                  </p>
                )}
              </section>
            )}

            {/* Player count */}
            <section>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Players</p>
              <div className="flex gap-2">
                {PLAYER_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayerCount(n)}
                    className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                      playerCount === n
                        ? 'bg-green-500 text-bg'
                        : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {playerCount > 2 && (
                <p className="text-xs text-text-secondary mt-1.5">
                  Dropped players are replaced by a bot automatically.
                </p>
              )}
            </section>

            {/* Question count */}
            <section>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Questions</p>
              <div className="flex gap-2">
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setQCount(n)}
                    className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                      questionCount === n
                        ? 'bg-green-500 text-bg'
                        : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>

            {/* Timer */}
            <section>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                Timer per question
              </p>
              <div className="flex gap-2">
                {TIMERS.map(({ value, label }) => (
                  <button
                    key={label}
                    onClick={() => setTimerSec(value)}
                    className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                      timerSec === value
                        ? 'bg-green-500 text-bg'
                        : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Rules reminder */}
            <div className="card border-border bg-surface-2 text-xs text-text-secondary space-y-1">
              <p className="font-medium text-text-primary mb-1">Peer Battle rules</p>
              <p>• Both players answer the same questions independently</p>
              <p>• Up to 2 draw requests per player</p>
              <p>• Leaving the screen gives 45s / 30s grace on strikes 1 / 2</p>
              <p>• 3rd screen leave = auto-defeat</p>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 size={18} className="animate-spin" /> : null}
              Create Room
            </button>
          </div>
        )}

        {/* ── WAITING FOR OPPONENT ─────────────────────────────────────────── */}
        {tab === 'host' && hostedBattle && (
          <div className="space-y-6 text-center">
            <div>
              <p className="text-sm text-text-secondary mb-3">Share this code with your opponent</p>
              <div className="inline-flex items-center gap-3 bg-surface border border-border rounded-xl px-6 py-4">
                <span className="font-mono text-4xl font-bold tracking-[0.25em] text-green-500">
                  {hostedBattle.roomCode}
                </span>
                <button
                  onClick={copyCode}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                  title="Copy code"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
                <button
                  onClick={shareInviteLink}
                  className="text-text-secondary hover:text-green-500 transition-colors"
                  title="Share invite link"
                >
                  {sharedLink ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                </button>
              </div>
            </div>

            {opponentJoining ? (
              <div className="flex items-center justify-center gap-1 text-green-500">
                <span className="text-sm font-medium">Opponent joining</span>
                <TypingDots />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-text-secondary">
                <Loader2 size={16} className="animate-spin text-green-500" />
                <span className="text-sm">Waiting for opponent to join...</span>
              </div>
            )}

            <div className="text-xs text-text-secondary space-y-0.5">
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
                className="text-sm text-text-secondary hover:text-text-primary underline"
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
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Room Code</p>
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
                className="input text-center font-mono text-2xl tracking-widest h-14"
              />
              {joinError && (
                <p className="text-xs text-red-400 mt-1.5">{joinError}</p>
              )}
            </section>

            <button
              onClick={handleJoin}
              disabled={joining || joinCode.length !== 6}
              className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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
