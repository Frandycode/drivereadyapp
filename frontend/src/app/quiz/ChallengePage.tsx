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

import { useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Zap, HelpCircle, Puzzle, Layers, RotateCcw, Bot, Swords } from 'lucide-react'
import { useUserStore } from '@/stores'
import type { QuizConfig } from '../quiz/QuizSession'
import type { PuzzleConfig } from '../quiz/PuzzleSession'
import type { FlipperConfig } from '../quiz/FlipperSession'
import type { TriviaConfig } from '../quiz/TriviaSession'
import type { BotBattleConfig } from '../battle/BotSelectScreen'

const GET_CHAPTERS = gql`
  query GetChallengeChapters($stateCode: String!) {
    chapters(stateCode: $stateCode) { id number title }
  }
`

export type ChallengeMode = 'quiz' | 'puzzle' | 'flipper' | 'trivia' | 'bot' | 'peer'

export type ChallengeConfig =
  | ({ type: 'quiz' }    & QuizConfig)
  | ({ type: 'puzzle' }  & PuzzleConfig)
  | ({ type: 'flipper' } & FlipperConfig)
  | ({ type: 'trivia' }  & TriviaConfig)
  | ({ type: 'bot' }     & BotBattleConfig)

interface ChallengePageProps {
  onStart: (config: ChallengeConfig) => void
  onBotBattle: () => void
  onPeerBattle: () => void
}

// ── IQ modes: 2×2 grid ───────────────────────────────────────────────────────

const IQ_MODES: { id: ChallengeMode; label: string; desc: string; Icon: React.ElementType }[] = [
  { id: 'quiz',    label: 'Quiz',    desc: 'Multiple choice',         Icon: HelpCircle },
  { id: 'puzzle',  label: 'Puzzle',  desc: 'Drag & drop chips',       Icon: Puzzle     },
  { id: 'flipper', label: 'Flipper', desc: 'Write then flip',         Icon: Layers     },
  { id: 'trivia',  label: 'Trivia',  desc: 'Answer ↔ Question',       Icon: RotateCcw  },
]

// ── Color-coded difficulty levels ─────────────────────────────────────────────

const DIFFICULTIES: {
  id: 'pawn' | 'rogue' | 'king'
  label: string
  desc: string
  activeClass: string
  badgeClass: string
  chevronClass: string
}[] = [
  {
    id: 'pawn',
    label: '♟ Pawn',
    desc: 'Unlimited hints & skips · 1× XP',
    activeClass: 'border-bronze-500 bg-bronze-500/5',
    badgeClass: 'text-bronze-500 bg-bronze-500/10 border-bronze-600/40',
    chevronClass: 'text-bronze-500',
  },
  {
    id: 'rogue',
    label: '♞ Knight',
    desc: 'Limited hints & skips · 2× XP',
    activeClass: 'border-silver-500 bg-silver-500/5',
    badgeClass: 'text-silver-400 bg-silver-500/10 border-silver-600/40',
    chevronClass: 'text-silver-400',
  },
  {
    id: 'king',
    label: '♔ King',
    desc: 'No hints or skips · 3× XP',
    activeClass: 'border-gold-600 bg-gold-500/5',
    badgeClass: 'text-gold-500 bg-gold-500/10 border-gold-600/40',
    chevronClass: 'text-gold-500',
  },
]

const QUESTION_COUNTS = [5, 10, 15, 20]
const TIMERS = [
  { value: null, label: 'Off' },
  { value: 15,   label: '15s' },
  { value: 30,   label: '30s' },
  { value: 45,   label: '45s' },
  { value: 60,   label: '60s' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function ChallengePage({ onStart, onBotBattle, onPeerBattle }: ChallengePageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [mode, setMode]                           = useState<ChallengeMode>('quiz')
  const [difficulty, setDifficulty]               = useState<'pawn' | 'rogue' | 'king'>('pawn')
  const [questionCount, setQuestionCount]         = useState(10)
  const [timer, setTimer]                         = useState<number | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')

  const { data, loading } = useQuery(GET_CHAPTERS, { variables: { stateCode } })
  const chapters = data?.chapters ?? []
  const selectedChapter = chapters.find((c: { id: string }) => c.id === selectedChapterId)

  const isBattleMode = mode === 'bot' || mode === 'peer'

  function handleStart() {
    if (mode === 'bot')  { onBotBattle();  return }
    if (mode === 'peer') { onPeerBattle(); return }
    const base = {
      stateCode,
      chapterNumber: selectedChapter?.number,
      chapterTitle:  selectedChapter?.title,
      questionCount,
      difficulty,
      timerSeconds:  timer,
    }
    onStart({ type: mode, ...base } as ChallengeConfig)
  }

  const activeDiff = DIFFICULTIES.find((d) => d.id === difficulty)

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <Zap size={20} className="text-green-500" />
      <h1 className="font-display text-lg font-bold text-text-primary">Challenge</h1>
    </div>
  )

  return (
    <PageWrapper header={header}>
      <div className="space-y-5 mt-1">

        {/* ── 1. Chapter filter ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Chapter (optional)
          </h2>
          {loading ? (
            <div className="card h-11 animate-pulse bg-surface-2" />
          ) : (
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="input"
            >
              <option value="">All chapters</option>
              {chapters.map((c: { id: string; number: number; title: string }) => (
                <option key={c.id} value={c.id}>Ch. {c.number} — {c.title}</option>
              ))}
            </select>
          )}
        </section>

        {/* ── 2. IQ mode grid (2×2) ─────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            IQ Mode
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {IQ_MODES.map(({ id, label, desc, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all duration-150 ${
                  mode === id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border bg-surface hover:border-green-700'
                }`}
              >
                <Icon size={22} className={mode === id ? 'text-green-500' : 'text-text-secondary'} />
                <span className={`text-sm font-semibold ${mode === id ? 'text-green-400' : 'text-text-primary'}`}>
                  {label}
                </span>
                <span className="text-xs text-text-secondary leading-tight text-center">{desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. Battle mode row (1×2) ──────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Battle Mode
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('bot')}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all duration-150 ${
                mode === 'bot'
                  ? 'border-bronze-500 bg-bronze-500/10'
                  : 'border-border bg-surface hover:border-bronze-600/40'
              }`}
            >
              <Bot size={22} className={mode === 'bot' ? 'text-bronze-500' : 'text-text-secondary'} />
              <span className={`text-sm font-semibold ${mode === 'bot' ? 'text-bronze-500' : 'text-text-primary'}`}>
                Bot Battle
              </span>
              <span className="text-xs text-text-secondary text-center">vs Rusty, Dash, or Apex</span>
            </button>
            <button
              onClick={() => setMode('peer')}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl border-2 transition-all duration-150 ${
                mode === 'peer'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border bg-surface hover:border-green-700'
              }`}
            >
              <Swords size={22} className={mode === 'peer' ? 'text-green-500' : 'text-text-secondary'} />
              <span className={`text-sm font-semibold ${mode === 'peer' ? 'text-green-400' : 'text-text-primary'}`}>
                Peer Battle
              </span>
              <span className="text-xs text-text-secondary text-center">Host or join a live room</span>
            </button>
          </div>
        </section>

        {/* ── 4. Difficulty (IQ modes only) ─────────────────────────────── */}
        {!isBattleMode && (
          <section>
            <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Difficulty
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(({ id, label, badgeClass, activeClass }) => (
                <button
                  key={id}
                  onClick={() => setDifficulty(id)}
                  className={`py-3 px-2 rounded-xl border-2 transition-all duration-150 text-center ${
                    difficulty === id ? activeClass : 'border-border bg-surface hover:border-green-700'
                  }`}
                >
                  <span className={`text-sm font-medium ${difficulty === id ? '' : 'text-text-secondary'}`}>
                    {label.split(' ')[0]}
                  </span>
                  <br />
                  <span className={`text-xs ${difficulty === id ? `${badgeClass.split(' ')[0]}` : 'text-text-secondary'}`}>
                    {label.split(' ')[1]}
                  </span>
                </button>
              ))}
            </div>
            {activeDiff && (
              <p className="text-xs text-text-secondary mt-1.5 px-0.5">{activeDiff.desc}</p>
            )}
          </section>
        )}

        {/* ── 5. Settings (IQ modes only) ───────────────────────────────── */}
        {!isBattleMode && (
          <section>
            <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Settings</h2>
            <div className="card space-y-4">
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Questions</p>
                <div className="flex gap-2">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`flex-1 py-1.5 rounded-md text-sm font-mono font-medium transition-all ${
                        questionCount === n
                          ? 'bg-green-500 text-bg'
                          : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Timer per question</p>
                <div className="flex gap-2">
                  {TIMERS.map(({ value, label }) => (
                    <button
                      key={label}
                      onClick={() => setTimer(value)}
                      className={`flex-1 py-1.5 rounded-md text-sm font-mono font-medium transition-all ${
                        timer === value
                          ? 'bg-green-500 text-bg'
                          : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 6. Battle info cards ──────────────────────────────────────── */}
        {mode === 'bot' && (
          <div className="card border-bronze-600/30 bg-bronze-500/5 text-xs text-text-secondary space-y-1">
            <p className="font-medium text-text-primary mb-1">Bot Battle rules</p>
            <p>• King-level rules — no hints or skips</p>
            <p>• Bot and player answer simultaneously</p>
            <p>• XP awarded regardless of outcome</p>
            <p>• Timer & opponent chosen on next screen</p>
          </div>
        )}
        {mode === 'peer' && (
          <div className="card border-green-700/30 bg-green-500/5 text-xs text-text-secondary space-y-1">
            <p className="font-medium text-text-primary mb-1">Peer Battle rules</p>
            <p>• Host a room or join with a 6-digit code</p>
            <p>• Both players answer independently</p>
            <p>• Up to 2 draw requests per player</p>
            <p>• 3rd screen leave = auto-defeat</p>
          </div>
        )}

        {/* ── 7. CTA ────────────────────────────────────────────────────── */}
        <button
          onClick={handleStart}
          className={`w-full h-12 text-base font-semibold rounded-md transition-all active:scale-95 ${
            mode === 'peer'
              ? 'bg-green-500 text-bg hover:bg-green-400'
              : mode === 'bot'
              ? 'bg-bronze-500 text-bg hover:bg-bronze-400'
              : difficulty === 'rogue'
              ? 'bg-silver-500 text-bg hover:bg-silver-400'
              : difficulty === 'king'
              ? 'bg-gold-500 text-bg hover:bg-gold-400'
              : 'btn-primary'
          }`}
        >
          {mode === 'bot'   ? 'Choose Your Opponent →'
          : mode === 'peer' ? 'Enter Battle Lobby →'
          : `Start ${IQ_MODES.find((m) => m.id === mode)?.label}`}
        </button>

        <div className="h-2" />
      </div>
    </PageWrapper>
  )
}
