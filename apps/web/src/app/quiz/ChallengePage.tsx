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
import { PageHeader } from '@/components/layout/PageHeader'
import { Zap, HelpCircle, Puzzle, Layers, RotateCcw, Bot, Swords, ClipboardList, FolderOpen } from 'lucide-react'
import { useUserStore } from '@/stores'
import { DifficultyBars, getDifficultyCopy, type DifficultyCode } from '@/lib/difficulty'
import type { QuizConfig } from '../quiz/QuizSession'
import type { PuzzleConfig } from '../quiz/PuzzleSession'
import type { FlipperConfig } from '../quiz/FlipperSession'
import type { TriviaConfig } from '../quiz/TriviaSession'
import type { BotBattleConfig } from '../battle/BotSelectScreen'

const GET_CHAPTERS = gql`
  query GetChallengeChapters($stateCode: String!) {
    chapters(stateCode: $stateCode) { id number title }
    chapterGroups(stateCode: $stateCode) { id name chapterNumbers isPreset }
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
  onExam: () => void
}

// ── IQ modes: 2×2 grid ───────────────────────────────────────────────────────

const IQ_MODES: { id: ChallengeMode; label: string; tag: string; desc: string; Icon: React.ElementType }[] = [
  { id: 'quiz',    label: 'Quiz',    tag: 'Standard',      desc: 'Classic multiple choice, matching the permit-test rhythm.', Icon: HelpCircle },
  { id: 'puzzle',  label: 'Puzzle',  tag: 'Spatial',       desc: 'Drag answers into place to lock in sign and rule memory.',    Icon: Puzzle     },
  { id: 'flipper', label: 'Flipper', tag: 'Active recall', desc: 'Commit to an answer, then flip the card for the reveal.',     Icon: Layers     },
  { id: 'trivia',  label: 'Trivia',  tag: 'Reverse',       desc: 'Start from the answer and identify the matching question.',   Icon: RotateCcw  },
]

// ── Color-coded difficulty levels ─────────────────────────────────────────────

const DIFFICULTIES: {
  id: DifficultyCode
}[] = [
  { id: 'beginner' },
  { id: 'pro' },
  { id: 'expert' },
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

export function ChallengePage({ onStart, onBotBattle, onPeerBattle, onExam }: ChallengePageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [mode, setMode]                           = useState<ChallengeMode>('quiz')
  const [difficulty, setDifficulty]               = useState<DifficultyCode>('beginner')
  const [questionCount, setQuestionCount]         = useState(10)
  const [timer, setTimer]                         = useState<number | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [selectedGroupId, setSelectedGroupId]     = useState<string>('')
  const [filterType, setFilterType]               = useState<'chapter' | 'group'>('chapter')

  const { data, loading } = useQuery(GET_CHAPTERS, { variables: { stateCode } })
  const chapters = data?.chapters ?? []
  const groups: { id: string; name: string; chapterNumbers: number[]; isPreset: boolean }[] = data?.chapterGroups ?? []
  const selectedChapter = chapters.find((c: { id: string }) => c.id === selectedChapterId)
  const selectedGroup   = groups.find((g) => g.id === selectedGroupId)

  const isBattleMode = mode === 'bot' || mode === 'peer'

  function handleStart() {
    if (mode === 'bot')  { onBotBattle();  return }
    if (mode === 'peer') { onPeerBattle(); return }
    const base = {
      stateCode,
      chapterNumber:  filterType === 'chapter' ? selectedChapter?.number : undefined,
      chapterNumbers: filterType === 'group'   ? selectedGroup?.chapterNumbers : undefined,
      chapterTitle:
        filterType === 'chapter' ? selectedChapter?.title :
        filterType === 'group'   ? selectedGroup?.name :
        undefined,
      questionCount,
      difficulty,
      timerSeconds:  timer,
    }
    onStart({ type: mode, ...base } as ChallengeConfig)
  }

  const activeDiff = getDifficultyCopy(difficulty)

  const pageHeader = (
    <PageHeader
      eyebrow="Quiz · battle · exam"
      title={
        <>
          Put it to the <em className="not-italic text-orange">test.</em>
        </>
      }
      sub="Four ways to assess, two ways to battle, and a full exam when you need the real pressure."
      stats={[
        { label: 'IQ modes',     value: IQ_MODES.length },
        { label: 'Battle modes', value: 2,            tone: 'orange' },
        { label: 'Difficulties', value: DIFFICULTIES.length, tone: 'gold' },
      ]}
      slab="orange"
    />
  )

  return (
    <PageWrapper className="!max-w-dashboard !px-0">
      {pageHeader}
      <div className="page-tabs">
        <div className="page-tabs-inner">
          <a className="pt-btn pt-btn-active" href="#challenge-modes"><Zap size={17} /> Modes</a>
          <a className="pt-btn" href="#challenge-battle"><Swords size={17} /> Battle</a>
          <a className="pt-btn" href="#challenge-setup"><ClipboardList size={17} /> Settings</a>
        </div>
      </div>
      <div className="bg-navy blueprint-grid">
       <div className="max-w-dashboard mx-auto px-[var(--pad-x)] py-10 pb-12 space-y-12">
        <section id="challenge-modes" className="scroll-mt-32">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Assessment modes
            </div>
            <h2 className="font-display text-[clamp(26px,3vw,34px)] font-extrabold leading-tight text-cream">
              Same questions. Four different lenses.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
              Every mode pulls from the same question bank. The format changes how the answer sticks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {IQ_MODES.map(({ id, label, tag, desc, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`card card-hover min-h-[220px] p-5 text-left border-2 ${mode === id ? 'border-orange bg-orange-soft' : ''}`}
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-md border border-orange/25 bg-orange-soft text-orange">
                    <Icon size={22} />
                  </div>
                  <span className="mono rounded-md border border-border bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-text-muted">
                    {tag}
                  </span>
                </div>
                <div className="font-display text-xl font-extrabold text-cream mb-2">{label}</div>
                <p className="text-sm leading-relaxed text-text-secondary">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="challenge-battle" className="scroll-mt-32">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-yellow">
              <span className="w-[18px] h-[1.5px] rounded-full bg-yellow" />
              Battle modes
            </div>
            <h2 className="font-display text-[clamp(26px,3vw,34px)] font-extrabold leading-tight text-cream">
              Compete. Win XP. No hints.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <button
              onClick={() => setMode('bot')}
              className={`card card-hover p-6 text-left border-2 ${mode === 'bot' ? 'border-yellow-rim bg-yellow-soft' : ''}`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-yellow-rim bg-yellow-soft text-yellow">
                  <Bot size={23} />
                </div>
                <div>
                  <div className="font-display text-xl font-extrabold text-cream">Bot Battle</div>
                  <p className="text-sm text-text-secondary">Pick a personality and beat their score.</p>
                </div>
              </div>
              <div className="mt-5 space-y-2.5">
                {[
                  ['Rusty', '30%', 'Slow, friendly, makes obvious mistakes', '#9CA3AF'],
                  ['Dash', '60%', 'Fast, confident, sometimes wrong', '#38BDF8'],
                  ['Apex', '95%', 'Precise, high-pressure challenge', '#F59E0B'],
                ].map(([name, acc, desc, color]) => (
                  <div key={name} className="flex items-center gap-3 rounded-md border border-border bg-white/[0.03] p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full font-bold" style={{ background: `${color}24`, color, border: `1px solid ${color}55` }}>
                      {name.charAt(0)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold" style={{ color }}>{name}</span>
                      <span className="block text-xs text-text-muted">{desc}</span>
                    </span>
                    <span className="mono text-right text-sm font-bold" style={{ color }}>{acc}</span>
                  </div>
                ))}
              </div>
            </button>

            <button
              onClick={() => setMode('peer')}
              className={`card card-hover p-6 text-left border-2 ${mode === 'peer' ? 'border-orange bg-orange-soft' : ''}`}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full border border-orange/30 bg-orange-soft text-orange">
                  <Swords size={23} />
                </div>
                <div>
                  <div className="font-display text-xl font-extrabold text-cream">Peer Battle</div>
                  <p className="text-sm text-text-secondary">Host a live room or join a friend.</p>
                </div>
              </div>
              <div className="rounded-md border border-yellow-rim bg-yellow-soft p-5 text-center">
                <div className="mono mb-2 text-[10px] uppercase tracking-[0.14em] text-text-muted">Sample code</div>
                <div className="mono text-[clamp(26px,5vw,34px)] font-bold tracking-[0.18em] text-yellow">DR-9F4K</div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                Both players get the same questions. Fastest correct answers win the round.
              </p>
            </button>
          </div>
        </section>

        <section id="challenge-setup" className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
          <div className="card p-6 sm:p-7">
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
                <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
                Session setup
              </div>
              <h2 className="font-display text-2xl font-extrabold text-cream">Tune the rules.</h2>
            </div>

            {loading ? (
              <div className="card h-11 animate-pulse bg-surface-2" />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex gap-2">
                    <button
                      onClick={() => { setFilterType('chapter'); setSelectedGroupId('') }}
                      className={`flex-1 rounded-md border px-4 py-2 mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-all ${
                        filterType === 'chapter' ? 'border-orange bg-orange text-white' : 'border-border bg-white/[0.04] text-text-secondary hover:border-orange/40 hover:text-cream'
                      }`}
                    >
                      By Chapter
                    </button>
                    <button
                      onClick={() => { setFilterType('group'); setSelectedChapterId('') }}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-4 py-2 mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-all ${
                        filterType === 'group' ? 'border-orange bg-orange text-white' : 'border-border bg-white/[0.04] text-text-secondary hover:border-orange/40 hover:text-cream'
                      }`}
                    >
                      <FolderOpen size={12} />
                      By Group
                    </button>
                  </div>

                  {filterType === 'chapter' && (
                    <select value={selectedChapterId} onChange={(e) => setSelectedChapterId(e.target.value)} className="input">
                      <option value="">All chapters</option>
                      {chapters.map((c: { id: string; number: number; title: string }) => (
                        <option key={c.id} value={c.id}>Ch. {c.number} — {c.title}</option>
                      ))}
                    </select>
                  )}

                  {filterType === 'group' && (
                    groups.length === 0 ? (
                      <p className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text-secondary">No groups yet. Create one in Study.</p>
                    ) : (
                      <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="input">
                        <option value="">All chapters</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    )
                  )}
                </div>

                {!isBattleMode && (
                  <>
                    <div>
                      <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Difficulty</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {DIFFICULTIES.map(({ id }) => {
                          const cfg = getDifficultyCopy(id)
                          return (
                            <button
                              key={id}
                              onClick={() => setDifficulty(id)}
                              className={`rounded-md border-2 px-3 py-3 text-center transition-all ${difficulty === id ? cfg.activeClass : 'border-border bg-surface hover:border-orange/40'}`}
                            >
                              <DifficultyBars difficulty={id} />
                              <span className={`mt-1 block mono text-[11px] font-semibold uppercase tracking-[0.08em] ${difficulty === id ? cfg.classes.split(' ')[0] : 'text-text-secondary'}`}>
                                {cfg.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{activeDiff.desc}</p>
                    </div>

                    <div>
                      <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Questions</p>
                      <div className="segmented flex w-full">
                        {QUESTION_COUNTS.map((n) => (
                          <button key={n} onClick={() => setQuestionCount(n)} className={`seg-btn flex-1 justify-center ${questionCount === n ? 'seg-btn-active' : ''}`}>{n}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Timer per question</p>
                      <div className="segmented flex w-full overflow-x-auto">
                        {TIMERS.map(({ value, label }) => (
                          <button key={label} onClick={() => setTimer(value)} className={`seg-btn flex-1 justify-center ${timer === value ? 'seg-btn-active' : ''}`}>{label}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-28">
            <button onClick={onExam} className="card card-hover w-full border-yellow-rim bg-yellow-soft p-5 text-left">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-md border border-yellow-rim bg-yellow-soft text-yellow">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <div className="font-display text-lg font-extrabold text-cream">Full Practice Exam</div>
                  <p className="mono text-[10px] uppercase tracking-[0.1em] text-text-muted">50 questions · 60 min</p>
                </div>
              </div>
              <span className="chip chip-yellow">No hints or skips</span>
            </button>

            {mode === 'bot' && (
              <div className="card border-yellow-rim bg-yellow-soft p-5">
                <div className="card-eyebrow"><span className="ey-dot bg-yellow" />Bot Battle rules</div>
                <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
                  <li>Expert rules: no hints or skips.</li>
                  <li>Bot and player answer simultaneously.</li>
                  <li>Opponent and timer are chosen next.</li>
                </ul>
              </div>
            )}
            {mode === 'peer' && (
              <div className="card border-orange/30 bg-orange-soft p-5">
                <div className="card-eyebrow"><span className="ey-dot bg-orange" />Peer Battle rules</div>
                <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
                  <li>Host a room or join with a code.</li>
                  <li>Both players answer independently.</li>
                  <li>Leaving repeatedly can end the match.</li>
                </ul>
              </div>
            )}

            <button onClick={handleStart} className="btn-primary btn-primary-pop w-full h-12 text-base font-semibold">
              {mode === 'bot'   ? 'Choose Your Opponent'
              : mode === 'peer' ? 'Enter Battle Lobby'
              : `Start ${IQ_MODES.find((m) => m.id === mode)?.label}`}
            </button>
          </div>
        </section>
       </div>
      </div>
    </PageWrapper>
  )
}
