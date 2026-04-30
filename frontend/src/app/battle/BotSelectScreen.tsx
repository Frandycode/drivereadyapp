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
import { ArrowLeft, Zap, Clock, AlertTriangle } from 'lucide-react'
import { GiVintageRobot, GiMonoWheelRobot, GiRobotGolem } from 'react-icons/gi'

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
    avatarClass: 'text-bronze-500',
    difficulty: 'Pawn',
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
    avatarClass: 'text-silver-400',
    difficulty: 'Knight',
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
    avatarClass: 'text-gold-500',
    difficulty: 'King',
    xpReward: 80,
    color: 'border-gold-600 bg-gold-500/5',
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
  const [selectedBot, setSelectedBot]   = useState<BotId>('rusty')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer]               = useState<number | null>(30)

  const bot = BOTS[selectedBot]

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <button onClick={onBack} className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={20} />
      </button>
      <h1 className="font-display text-lg font-bold text-text-primary">Bot Battle</h1>
    </div>
  )

  return (
    <PageWrapper header={header}>
      <div className="space-y-6 mt-1">

        {/* Bot selector */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
            Choose your opponent
          </h2>
          <div className="space-y-3">
            {(Object.values(BOTS) as BotConfig[]).map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBot(b.id)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                  selectedBot === b.id ? b.color : 'border-border bg-surface hover:border-green-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-surface-2 rounded-xl flex-shrink-0">
                    <b.avatar size={36} className={b.avatarClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-display font-bold text-text-primary">{b.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        b.id === 'rusty' ? 'text-bronze-500 bg-bronze-500/10 border-bronze-600/40' :
                        b.id === 'dash'  ? 'text-silver-400 bg-silver-500/10 border-silver-600/40' :
                                           'text-gold-500 bg-gold-500/10 border-gold-600/40'
                      }`}>
                        {b.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{b.tagline}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.accuracy < 50 ? 'bg-green-500' :
                            b.accuracy < 80 ? 'bg-gold-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${b.accuracy}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-text-secondary">{b.accuracy}%</span>
                      <Zap size={12} className="text-gold-500" />
                      <span className="text-xs text-gold-500 font-medium">+{b.xpReward} XP</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Question count */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Questions
          </h2>
          <div className="flex gap-2 flex-wrap">
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`flex-1 min-w-[48px] py-2 rounded-md text-sm font-mono font-medium transition-all ${
                  questionCount === n
                    ? 'bg-green-500 text-bg'
                    : 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        {/* Timer */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock size={12} />
            Timer per question
          </h2>
          <div className="flex gap-2">
            {TIMERS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setTimer(value)}
                className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                  timer === value
                    ? 'bg-green-500 text-bg'
                    : 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-secondary mt-2 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-gold-500 flex-shrink-0" />
            If time runs out before you answer, the question is marked wrong.
          </p>
        </section>

        {/* Rules */}
        <div className="card border-border bg-surface-2 text-xs text-text-secondary space-y-1">
          <p className="font-medium text-text-primary mb-1">Battle rules</p>
          <p>• No hints or skips — King-level rules for all bot battles</p>
          <p>• Questions randomly mixed from all modes</p>
          <p>• Bot and player answer simultaneously</p>
          <p>• XP awarded regardless of outcome</p>
        </div>

        {/* Start */}
        <button
          onClick={() => onStart({ bot, questionCount, timerSeconds: timer, stateCode: 'ok' })}
          className="btn-primary w-full h-12 text-base font-semibold"
        >
          Battle {bot.name}!
        </button>

        <div className="h-2" />
      </div>
    </PageWrapper>
  )
}