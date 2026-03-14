import { useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Zap, HelpCircle, Puzzle, Layers, RotateCcw, ChevronRight } from 'lucide-react'
import { useUserStore } from '@/stores'
import type { QuizConfig } from './QuizSession'
import type { PuzzleConfig } from './PuzzleSession'
import type { FlipperConfig } from './FlipperSession'
import type { TriviaConfig } from './TriviaSession'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_CHAPTERS = gql`
  query GetChallengeChapters($stateCode: String!) {
    chapters(stateCode: $stateCode) { id number title }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChallengeMode = 'quiz' | 'puzzle' | 'flipper' | 'trivia'
export type ChallengeDifficulty = 'pawn' | 'rogue' | 'king'

export type ChallengeConfig =
  | ({ type: 'quiz' }    & QuizConfig)
  | ({ type: 'puzzle' }  & PuzzleConfig)
  | ({ type: 'flipper' } & FlipperConfig)
  | ({ type: 'trivia' }  & TriviaConfig)

interface ChallengePageProps {
  onStart: (config: ChallengeConfig) => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MODES: {
  id: ChallengeMode
  label: string
  description: string
  Icon: React.ElementType
}[] = [
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Multiple choice — pick the correct answer.',
    Icon: HelpCircle,
  },
  {
    id: 'puzzle',
    label: 'Puzzle',
    description: 'Drag and drop answer chips into the drop zone.',
    Icon: Puzzle,
  },
  {
    id: 'flipper',
    label: 'Flipper',
    description: 'Place your answer on the card, then flip to reveal.',
    Icon: Layers,
  },
  {
    id: 'trivia',
    label: 'Trivia',
    description: 'See the answer — pick the matching question.',
    Icon: RotateCcw,
  },
]

const DIFFICULTIES: {
  id: ChallengeDifficulty
  label: string
  desc: string
}[] = [
  { id: 'pawn',  label: '♟ Pawn',   desc: 'Unlimited hints & skips · 1× XP' },
  { id: 'rogue', label: '♞ Knight', desc: 'Limited hints & skips · 2× XP' },
  { id: 'king',  label: '♔ King',   desc: 'No hints or skips · 3× XP' },
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

export function ChallengePage({ onStart }: ChallengePageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [mode, setMode] = useState<ChallengeMode>('quiz')
  const [difficulty, setDifficulty] = useState<ChallengeDifficulty>('pawn')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer] = useState<number | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')

  const { data, loading } = useQuery(GET_CHAPTERS, {
    variables: { stateCode },
  })

  const chapters = data?.chapters ?? []
  const selectedChapter = chapters.find((c: { id: string }) => c.id === selectedChapterId)

  function handleStart() {
    const base = {
      stateCode,
      chapterNumber: selectedChapter?.number,
      chapterTitle: selectedChapter?.title,
      questionCount,
      difficulty,
      timerSeconds: timer,
    }

    onStart({ type: mode, ...base } as ChallengeConfig)
  }

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <Zap size={20} className="text-green-500" />
      <h1 className="font-display text-lg font-bold text-text-primary">Challenge</h1>
    </div>
  )

  return (
    <PageWrapper header={header}>
      <div className="space-y-6 mt-1">

        {/* ── Mode ────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Mode
          </h2>
          <div className="space-y-2">
            {MODES.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`w-full text-left card transition-all duration-150 ${
                  mode === id
                    ? 'border-green-500 bg-green-500/5'
                    : 'hover:border-green-700'
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

        {/* ── Chapter filter ───────────────────────────────────────────────── */}
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
                <option key={c.id} value={c.id}>
                  Ch. {c.number} — {c.title}
                </option>
              ))}
            </select>
          )}
        </section>

        {/* ── Difficulty ───────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Difficulty
          </h2>
          <div className="space-y-2">
            {DIFFICULTIES.map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setDifficulty(id)}
                className={`w-full text-left card transition-all duration-150 ${
                  difficulty === id
                    ? 'border-green-500 bg-green-500/5'
                    : 'hover:border-green-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary">{desc}</p>
                  </div>
                  {difficulty === id && <ChevronRight size={16} className="text-green-500" />}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Settings ─────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Settings
          </h2>
          <div className="card space-y-4">
            {/* Question count */}
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

            {/* Timer */}
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

        {/* ── Start ────────────────────────────────────────────────────────── */}
        <button
          onClick={handleStart}
          className="btn-primary w-full h-12 text-base font-semibold"
        >
          Start {MODES.find((m) => m.id === mode)?.label}
        </button>

        <div className="h-2" />
      </div>
    </PageWrapper>
  )
}