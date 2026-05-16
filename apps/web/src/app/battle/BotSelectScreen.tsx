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
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { ArrowLeft, Zap, Clock, AlertTriangle } from 'lucide-react'
import { GiVintageRobot, GiMonoWheelRobot, GiRobotGolem } from 'react-icons/gi'
import { useUserStore } from '@/stores'

export type BotId = 'rusty' | 'dash' | 'apex'

export interface BotConfig {
  id: BotId
  name: string
  tagline: string
  accuracy: number
  thinkMinMs: number
  thinkMaxMs: number
  avatar: React.ComponentType<{ size?: number; className?: string }>
  avatarClass: string
  difficulty: string
  xpReward: number
  color: string
}

export const BOTS: Record<BotId, BotConfig> = {
  rusty: {
    id: 'rusty',
    name: 'Rusty',
    tagline: 'Old & slow. Perfect for beginners.',
    accuracy: 30,
    thinkMinMs: 3000,
    thinkMaxMs: 8000,
    avatar: GiVintageRobot,
    avatarClass: 'text-correct',
    difficulty: 'Beginner',
    xpReward: 20,
    color: 'border-bronze-500 bg-bronze-500/5',
  },
  dash: {
    id: 'dash',
    name: 'Dash',
    tagline: 'Quick reflexes. Sometimes too fast.',
    accuracy: 60,
    thinkMinMs: 1000,
    thinkMaxMs: 3000,
    avatar: GiMonoWheelRobot,
    avatarClass: 'text-yellow',
    difficulty: 'Pro',
    xpReward: 40,
    color: 'border-silver-500 bg-silver-500/5',
  },
  apex: {
    id: 'apex',
    name: 'Apex',
    tagline: 'Precise. Relentless. Almost unbeatable.',
    accuracy: 95,
    thinkMinMs: 2000,
    thinkMaxMs: 4000,
    avatar: GiRobotGolem,
    avatarClass: 'text-orange',
    difficulty: 'Expert',
    xpReward: 80,
    color: 'border-yellow-rim bg-yellow-soft',
  },
}

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30]

const TIMERS = [
  { value: 15,   label: '15s' },
  { value: 30,   label: '30s' },
  { value: 45,   label: '45s' },
  { value: 60,   label: '60s' },
]

export interface BotBattleConfig {
  bot: BotConfig
  questionCount: number
  timerSeconds: number | null
  stateCode: string
}

interface BotSelectScreenProps {
  onStart: (config: BotBattleConfig) => void
  onBack: () => void
}

export function BotSelectScreen({ onStart, onBack }: BotSelectScreenProps) {
  const stateCode     = useUserStore((s) => s.user?.stateCode ?? 'ok')
  const [selectedBot, setSelectedBot]   = useState<BotId>('rusty')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer]               = useState<number | null>(30)

  const bot = BOTS[selectedBot]

  const header = (
    <div className="px-4 pt-4 pb-3 max-w-[760px] mx-auto flex items-center gap-3">
      <button
        onClick={onBack}
        className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors flex-shrink-0"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-bronze-500">
        <span className="w-[18px] h-[1.5px] rounded-full bg-bronze-500" />
        Bot Battle setup
      </div>
    </div>
  )

  return (
    <PageWrapper header={header} className="!max-w-dashboard !px-0">
      <PageHeader
        eyebrow="Bot Battle"
        title={<>Choose your <em className="not-italic text-orange">opponent.</em></>}
        sub="Three bot personalities, three pressure levels. Bot battles always use Expert rules with no hints or skips."
        stats={[
          { label: 'Bots', value: 3, tone: 'gold' },
          { label: 'Top XP', value: '+80', tone: 'orange' },
          { label: 'Rules', value: 'Expert' },
        ]}
        slab="orange"
      />
      <div className="bg-navy blueprint-grid">
       <div className="max-w-dashboard mx-auto px-[var(--pad-x)] py-10 pb-12 space-y-8">

        {/* Bot selector */}
        <section>
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Choose your opponent
            </div>
            <h2 className="font-display text-[clamp(26px,3vw,34px)] font-extrabold text-cream">Pick the pace.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {(Object.values(BOTS) as BotConfig[]).map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBot(b.id)}
                className={`card card-hover min-h-[250px] w-full text-left border-2 p-5 transition-all duration-150 ${
                  selectedBot === b.id ? b.color : 'border-border bg-surface hover:border-orange/40'
                }`}
              >
                <div className="flex h-full flex-col">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.06] bg-surface-2">
                    <b.avatar size={36} className={b.avatarClass} />
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <p className="display text-xl font-extrabold text-cream">{b.name}</p>
                    <span className={`inline-flex items-center mono text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-md border font-semibold ${
                      b.id === 'rusty' ? 'text-bronze-500 bg-bronze-500/10 border-bronze-600/40' :
                      b.id === 'dash'  ? 'text-silver-400 bg-silver-500/10 border-silver-600/40' :
                                         'text-yellow bg-yellow-soft border-yellow-rim'
                    }`}>
                      {b.difficulty}
                    </span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-text-secondary">{b.tagline}</p>
                  <div className="mt-auto">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            b.accuracy < 50 ? 'bg-correct' :
                            b.accuracy < 80 ? 'bg-yellow' : 'bg-orange'
                          }`}
                          style={{ width: `${b.accuracy}%` }}
                        />
                      </div>
                      <span className="mono text-[11px] font-bold tabular-nums text-text-secondary">{b.accuracy}%</span>
                    </div>
                    <div className="inline-flex items-center gap-1 mono text-[11px] font-bold text-yellow">
                      <Zap size={11} />
                      +{b.xpReward} XP reward
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="card p-6">
            <div className="inline-flex items-center gap-2 mb-4 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Battle setup
            </div>
            <div className="space-y-5">
              <div>
                <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Questions</p>
                <div className="segmented flex w-full overflow-x-auto">
                  {QUESTION_COUNTS.map((n) => (
                    <button key={n} onClick={() => setQuestionCount(n)} className={`seg-btn flex-1 justify-center ${questionCount === n ? 'seg-btn-active' : ''}`}>{n}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Clock size={13} className="text-yellow" />
                  <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em]">Timer per question</p>
                </div>
                <div className="segmented flex w-full">
                  {TIMERS.map(({ value, label }) => (
                    <button key={label} onClick={() => setTimer(value)} className={`seg-btn flex-1 justify-center ${timer === value ? 'seg-btn-active' : ''}`}>{label}</button>
                  ))}
                </div>
                <p className="text-[12px] text-text-secondary mt-2 flex items-center gap-1.5">
                  <AlertTriangle size={11} className="text-yellow flex-shrink-0" />
                  If time runs out before you answer, the question is marked wrong.
                </p>
              </div>
            </div>
          </div>

          <div className="card relative overflow-hidden p-6">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange" />
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[14px] h-[1.5px] rounded-full bg-orange" />
              Battle rules
            </div>
            <ul className="text-sm text-text-secondary space-y-1.5 leading-relaxed">
              <li>No hints or skips.</li>
              <li>Questions are mixed from the permit bank.</li>
              <li>Bot and player answer simultaneously.</li>
              <li>XP is awarded regardless of outcome.</li>
            </ul>
            <button
              onClick={() => onStart({ bot, questionCount, timerSeconds: timer, stateCode })}
              className="btn-primary btn-primary-pop mt-6 w-full h-12 text-base font-semibold"
            >
              Battle {bot.name}
            </button>
          </div>
        </section>

       </div>
      </div>
    </PageWrapper>
  )
}
