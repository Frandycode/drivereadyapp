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
import { GiChessPawn, GiChessKnight, GiChessKing } from 'react-icons/gi'
import type { IconType } from 'react-icons'
import { useUserStore } from '@/stores'
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

const IQ_MODES: { id: ChallengeMode; label: string; desc: string; Icon: React.ElementType }[] = [
  { id: 'quiz',    label: 'Quiz',    desc: 'Multiple choice',         Icon: HelpCircle },
  { id: 'puzzle',  label: 'Puzzle',  desc: 'Drag & drop chips',       Icon: Puzzle     },
  { id: 'flipper', label: 'Flipper', desc: 'Write then flip',         Icon: Layers     },
  { id: 'trivia',  label: 'Trivia',  desc: 'Answer ↔ Question',       Icon: RotateCcw  },
]

// ── Color-coded difficulty levels ─────────────────────────────────────────────

const DIFFICULTIES: {
  id: 'pawn' | 'rogue' | 'king'
  Icon: IconType
  label: string
  desc: string
  activeClass: string
  badgeClass: string
  chevronClass: string
}[] = [
  {
    id: 'pawn',
    Icon: GiChessPawn,
    label: 'Pawn',
    desc: 'Unlimited hints & skips · 1× XP',
    activeClass: 'border-bronze-500 bg-bronze-500/5',
    badgeClass: 'text-bronze-500 bg-bronze-500/10 border-bronze-600/40',
    chevronClass: 'text-bronze-500',
  },
  {
    id: 'rogue',
    Icon: GiChessKnight,
    label: 'Knight',
    desc: 'Limited hints & skips · 2× XP',
    activeClass: 'border-silver-500 bg-silver-500/5',
    badgeClass: 'text-silver-400 bg-silver-500/10 border-silver-600/40',
    chevronClass: 'text-silver-400',
  },
  {
    id: 'king',
    Icon: GiChessKing,
    label: 'King',
    desc: 'No hints or skips · 3× XP',
    activeClass: 'border-yellow/40 bg-yellow-soft',
    badgeClass: 'text-yellow bg-yellow-soft border-yellow-rim',
    chevronClass: 'text-yellow',
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

export function ChallengePage({ onStart, onBotBattle, onPeerBattle, onExam }: ChallengePageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [mode, setMode]                           = useState<ChallengeMode>('quiz')
  const [difficulty, setDifficulty]               = useState<'pawn' | 'rogue' | 'king'>('pawn')
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

  const activeDiff = DIFFICULTIES.find((d) => d.id === difficulty)

  const pageHeader = (
    <PageHeader
      eyebrow="Quiz · battle · exam"
      title={
        <>
          Pick a fight, <em className="not-italic text-orange">pick a level.</em>
        </>
      }
      sub="Four IQ modes, two battle modes, and the full practice exam. Difficulty tier scales hints, skips, and XP."
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
      <div className="bg-navy blueprint-grid">
       <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10 pb-12 space-y-6">

        {/* ── 1. Chapter / Group filter ──────────────────────────────────── */}
        <section>
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Filter (optional)
          </div>
          {loading ? (
            <div className="card h-11 animate-pulse bg-surface-2" />
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => { setFilterType('chapter'); setSelectedGroupId('') }}
                  className={`flex-1 py-2 rounded-md mono text-[11px] tracking-[0.08em] uppercase font-semibold transition-all border ${
                    filterType === 'chapter'
                      ? 'bg-orange text-white border-orange'
                      : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
                  }`}
                >
                  By Chapter
                </button>
                <button
                  onClick={() => { setFilterType('group'); setSelectedChapterId('') }}
                  className={`flex-1 py-2 rounded-md mono text-[11px] tracking-[0.08em] uppercase font-semibold transition-all border inline-flex items-center justify-center gap-1.5 ${
                    filterType === 'group'
                      ? 'bg-orange text-white border-orange'
                      : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
                  }`}
                >
                  <FolderOpen size={12} />
                  By Group
                </button>
              </div>

              {filterType === 'chapter' && (
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

              {filterType === 'group' && (
                groups.length === 0 ? (
                  <p className="text-xs text-text-secondary px-1">No groups yet — create one in Study.</p>
                ) : (
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="input"
                  >
                    <option value="">All chapters</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                )
              )}
            </div>
          )}
        </section>

        {/* ── 2. IQ mode grid (2×2) ─────────────────────────────────────── */}
        <section>
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            IQ mode
          </div>
          <div className="grid grid-cols-2 gap-2">
            {IQ_MODES.map(({ id, label, desc, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-md border-2 transition-all duration-150 ${
                  mode === id
                    ? 'border-orange bg-orange-soft'
                    : 'border-border bg-surface hover:border-orange/40'
                }`}
              >
                <Icon size={22} className={mode === id ? 'text-orange' : 'text-text-secondary'} />
                <span className={`text-sm font-semibold ${mode === id ? 'text-orange' : 'text-white'}`}>
                  {label}
                </span>
                <span className="text-xs text-text-muted leading-tight text-center">{desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. Battle mode row (1×2) ──────────────────────────────────── */}
        <section>
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Battle mode
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('bot')}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-md border-2 transition-all duration-150 ${
                mode === 'bot'
                  ? 'border-bronze-500 bg-bronze-500/10'
                  : 'border-border bg-surface hover:border-bronze-600/40'
              }`}
            >
              <Bot size={22} className={mode === 'bot' ? 'text-bronze-500' : 'text-text-secondary'} />
              <span className={`text-sm font-semibold ${mode === 'bot' ? 'text-bronze-500' : 'text-white'}`}>
                Bot Battle
              </span>
              <span className="text-xs text-text-muted text-center">vs Rusty, Dash, or Apex</span>
            </button>
            <button
              onClick={() => setMode('peer')}
              className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-md border-2 transition-all duration-150 ${
                mode === 'peer'
                  ? 'border-orange bg-orange-soft'
                  : 'border-border bg-surface hover:border-orange/40'
              }`}
            >
              <Swords size={22} className={mode === 'peer' ? 'text-orange' : 'text-text-secondary'} />
              <span className={`text-sm font-semibold ${mode === 'peer' ? 'text-orange' : 'text-white'}`}>
                Peer Battle
              </span>
              <span className="text-xs text-text-muted text-center">Host or join a live room</span>
            </button>
          </div>
        </section>

        {/* ── 3b. Practice Exam ─────────────────────────────────────────── */}
        <section>
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-yellow">
            <span className="w-[18px] h-[1.5px] rounded-full bg-yellow" />
            Practice exam
          </div>
          <button
            onClick={onExam}
            className="w-full text-left rounded-lg border border-yellow-rim bg-yellow-soft hover:border-yellow hover:bg-yellow/20 active:scale-[0.99] transition-all duration-150 px-4 py-4 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-yellow-soft border border-yellow-rim flex items-center justify-center flex-shrink-0">
                <ClipboardList size={22} className="text-yellow" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="display font-bold text-white text-base tracking-[-0.2px]">Full Practice Exam</p>
                <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted mt-1">
                  50 questions · 60 min · pass 38+
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center mono text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-md bg-white/[0.04] border border-yellow-rim text-yellow font-semibold">
                    No hints / skips
                  </span>
                  <span className="mono text-[11px] text-yellow font-bold">+200 XP</span>
                </div>
              </div>
              <Zap size={16} className="text-yellow flex-shrink-0" />
            </div>
          </button>
        </section>

        {/* ── 4. Difficulty (IQ modes only) ─────────────────────────────── */}
        {!isBattleMode && (
          <section>
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Difficulty
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(({ id, Icon, label, badgeClass, activeClass }) => (
                <button
                  key={id}
                  onClick={() => setDifficulty(id)}
                  className={`py-3 px-2 rounded-md border-2 transition-all duration-150 text-center flex flex-col items-center gap-1.5 ${
                    difficulty === id ? activeClass : 'border-border bg-surface hover:border-orange/40'
                  }`}
                >
                  <Icon size={20} className={difficulty === id ? badgeClass.split(' ')[0] : 'text-text-secondary'} />
                  <span className={`mono text-[11px] tracking-[0.08em] uppercase font-semibold ${difficulty === id ? badgeClass.split(' ')[0] : 'text-text-secondary'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
            {activeDiff && (
              <p className="text-[12px] text-text-secondary mt-2 px-0.5 leading-relaxed">{activeDiff.desc}</p>
            )}
          </section>
        )}

        {/* ── 5. Settings (IQ modes only) ───────────────────────────────── */}
        {!isBattleMode && (
          <section>
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Settings
            </div>
            <div className="card space-y-4">
              <div>
                <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Questions</p>
                <div className="flex gap-2">
                  {QUESTION_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
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
              </div>
              <div>
                <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Timer per question</p>
                <div className="flex gap-2">
                  {TIMERS.map(({ value, label }) => (
                    <button
                      key={label}
                      onClick={() => setTimer(value)}
                      className={`flex-1 py-2 rounded-md mono text-[13px] font-bold tabular-nums transition-all border ${
                        timer === value
                          ? 'bg-orange text-white border-orange'
                          : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
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
          <div className="card border-bronze-600/40 bg-bronze-500/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-bronze-500" />
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-bronze-500">
              <span className="w-[14px] h-[1.5px] rounded-full bg-bronze-500" />
              Bot Battle rules
            </div>
            <ul className="text-[13px] text-text-secondary space-y-1.5 leading-relaxed">
              <li>• King-level rules — no hints or skips</li>
              <li>• Bot and player answer simultaneously</li>
              <li>• XP awarded regardless of outcome</li>
              <li>• Timer & opponent chosen on next screen</li>
            </ul>
          </div>
        )}
        {mode === 'peer' && (
          <div className="card border-orange/30 bg-orange-soft relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange" />
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[14px] h-[1.5px] rounded-full bg-orange" />
              Peer Battle rules
            </div>
            <ul className="text-[13px] text-text-secondary space-y-1.5 leading-relaxed">
              <li>• Host a room or join with a 6-digit code</li>
              <li>• Both players answer independently</li>
              <li>• Up to 2 draw requests per player</li>
              <li>• 3rd screen leave = auto-defeat</li>
            </ul>
          </div>
        )}

        {/* ── 7. CTA ────────────────────────────────────────────────────── */}
        <button
          onClick={handleStart}
          className={`w-full h-12 text-sm font-semibold rounded-md transition-all active:scale-95 border ${
            mode === 'peer'
              ? 'bg-orange text-white border-orange hover:bg-orange-deep'
              : mode === 'bot'
              ? 'bg-bronze-500 text-bg border-bronze-500 hover:bg-bronze-400'
              : difficulty === 'rogue'
              ? 'bg-silver-500 text-bg border-silver-500 hover:bg-silver-400'
              : difficulty === 'king'
              ? 'bg-yellow text-bg border-yellow hover:bg-yellow/90'
              : 'btn-primary border-orange'
          }`}
        >
          {mode === 'bot'   ? 'Choose Your Opponent →'
          : mode === 'peer' ? 'Enter Battle Lobby →'
          : `Start ${IQ_MODES.find((m) => m.id === mode)?.label}`}
        </button>

       </div>
      </div>
    </PageWrapper>
  )
}
