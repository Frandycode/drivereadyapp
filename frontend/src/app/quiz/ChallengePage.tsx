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
import { Zap, HelpCircle, Puzzle, Layers, RotateCcw, ChevronRight, Bot } from 'lucide-react'
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

export type ChallengeMode = 'quiz' | 'puzzle' | 'flipper' | 'trivia' | 'bot'

export type ChallengeConfig =
  | ({ type: 'quiz' }    & QuizConfig)
  | ({ type: 'puzzle' }  & PuzzleConfig)
  | ({ type: 'flipper' } & FlipperConfig)
  | ({ type: 'trivia' }  & TriviaConfig)
  | ({ type: 'bot' }     & BotBattleConfig)

interface ChallengePageProps {
  onStart: (config: ChallengeConfig) => void
  onBotBattle: () => void
}

const MODES: { id: ChallengeMode; label: string; description: string; Icon: React.ElementType }[] = [
  { id: 'quiz',    label: 'Quiz',       description: 'Multiple choice — pick the correct answer.',          Icon: HelpCircle },
  { id: 'puzzle',  label: 'Puzzle',     description: 'Drag and drop answer chips into the drop zone.',      Icon: Puzzle },
  { id: 'flipper', label: 'Flipper',    description: 'Place your answer on the card, then flip to reveal.', Icon: Layers },
  { id: 'trivia',  label: 'Trivia',     description: 'See the answer — pick the matching question.',        Icon: RotateCcw },
  { id: 'bot',     label: 'Bot Battle', description: 'Challenge Rusty, Dash, or Apex in a live battle.',    Icon: Bot },
]

// Color-coded difficulty levels
const DIFFICULTIES: {
  id: 'pawn' | 'rogue' | 'king'
  label: string
  desc: string
  activeClass: string
  badgeClass: string
}[] = [
  {
    id: 'pawn',
    label: '♟ Pawn',
    desc: 'Unlimited hints & skips · 1× XP',
    activeClass: 'border-green-500 bg-green-500/5',
    badgeClass: 'text-green-400 bg-green-500/10 border-green-700/40',
  },
  {
    id: 'rogue',
    label: '♞ Knight',
    desc: 'Limited hints & skips · 2× XP',
    activeClass: 'border-gold-600 bg-gold-500/5',
    badgeClass: 'text-gold-500 bg-gold-500/10 border-gold-600/40',
  },
  {
    id: 'king',
    label: '♔ King',
    desc: 'No hints or skips · 3× XP',
    activeClass: 'border-red-600 bg-red-500/5',
    badgeClass: 'text-red-400 bg-red-500/10 border-red-700/40',
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

export function ChallengePage({ onStart, onBotBattle }: ChallengePageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [mode, setMode]                         = useState<ChallengeMode>('quiz')
  const [difficulty, setDifficulty]             = useState<'pawn' | 'rogue' | 'king'>('pawn')
  const [questionCount, setQuestionCount]       = useState(10)
  const [timer, setTimer]                       = useState<number | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')

  const { data, loading } = useQuery(GET_CHAPTERS, { variables: { stateCode } })
  const chapters = data?.chapters ?? []
  const selectedChapter = chapters.find((c: { id: string }) => c.id === selectedChapterId)

  function handleStart() {
    if (mode === 'bot') { onBotBattle(); return }
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

  const activeDifficulty = DIFFICULTIES.find((d) => d.id === difficulty)

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <Zap size={20} className="text-green-500" />
      <h1 className="font-display text-lg font-bold text-text-primary">Challenge</h1>
    </div>
  )

  return (
    <PageWrapper header={header}>
      <div className="space-y-6 mt-1">

        {/* Mode */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Mode</h2>
          <div className="space-y-2">
            {MODES.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`w-full text-left card transition-all duration-150 ${
                  mode === id ? 'border-green-500 bg-green-500/5' : 'hover:border-green-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={mode === id ? 'text-green-500' : 'text-text-secondary'} />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary">{description}</p>
                  </div>
                  {mode === id && <ChevronRight size={16} className="text-green-500" />}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Chapter filter */}
        {mode !== 'bot' && (
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
        )}

        {/* Difficulty — color coded */}
        {mode !== 'bot' && (
          <section>
            <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
              Difficulty
            </h2>
            <div className="space-y-2">
              {DIFFICULTIES.map(({ id, label, desc, activeClass, badgeClass }) => (
                <button
                  key={id}
                  onClick={() => setDifficulty(id)}
                  className={`w-full text-left card transition-all duration-150 ${
                    difficulty === id ? activeClass : 'hover:border-green-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-text-primary">{label}</p>
                        {difficulty === id && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">{desc}</p>
                    </div>
                    {difficulty === id && (
                      <ChevronRight size={16} className={
                        id === 'pawn' ? 'text-green-500' :
                        id === 'rogue' ? 'text-gold-500' : 'text-red-400'
                      } />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Settings */}
        {mode !== 'bot' && (
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
                        questionCount === n ? 'bg-green-500 text-bg' : 'bg-surface-3 text-text-secondary hover:text-text-primary'
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
                        timer === value ? 'bg-green-500 text-bg' : 'bg-surface-3 text-text-secondary hover:text-text-primary'
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

        {/* Bot Battle info */}
        {mode === 'bot' && (
          <div className="card border-border bg-surface-2 text-xs text-text-secondary space-y-1">
            <p className="font-medium text-text-primary mb-1">Bot Battle rules</p>
            <p>• No hints or skips — King-level rules apply</p>
            <p>• Questions randomly mixed from all modes</p>
            <p>• Bot and player answer simultaneously</p>
            <p>• Optional timer set on the next screen</p>
            <p>• XP awarded regardless of outcome</p>
          </div>
        )}

        {/* Start */}
        <button
          onClick={handleStart}
          className={`w-full h-12 text-base font-semibold rounded-md transition-all ${
            mode !== 'bot' && difficulty === 'rogue'
              ? 'bg-gold-500 text-bg hover:bg-gold-400 active:scale-95'
              : mode !== 'bot' && difficulty === 'king'
              ? 'bg-red-600 text-white hover:bg-red-500 active:scale-95'
              : 'btn-primary'
          }`}
        >
          {mode === 'bot'
            ? 'Choose Your Opponent →'
            : `Start ${MODES.find((m) => m.id === mode)?.label}`}
        </button>

        <div className="h-2" />
      </div>
    </PageWrapper>
  )
}