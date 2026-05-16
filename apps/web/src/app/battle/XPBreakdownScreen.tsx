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

import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores'
import { GiLaurelsTrophy } from 'react-icons/gi'
import { IoSad } from 'react-icons/io5'
import { FaHandshake } from 'react-icons/fa'
import { FiAward, FiCheckCircle, FiTarget, FiZap } from 'react-icons/fi'

export interface XPBreakdownItem {
  label: string
  xp: number
  earned: boolean
}

interface XPBreakdownScreenProps {
  outcome: 'win' | 'lose' | 'tie'
  playerScore: number
  opponentScore: number
  totalQuestions: number
  items: XPBreakdownItem[]
  totalXP: number
  onDone: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function XPBreakdownScreen({
  outcome,
  playerScore,
  opponentScore,
  totalQuestions,
  items,
  totalXP,
  onDone,
}: XPBreakdownScreenProps) {
  const user          = useUserStore((s) => s.user)
  const addXP         = useUserStore((s) => s.addXP)

  const [visibleCount, setVisibleCount] = useState(0)
  const [showTotal, setShowTotal]       = useState(false)
  const [showLevel, setShowLevel]       = useState(false)
  const [barWidth, setBarWidth]         = useState(0)

  const xpBefore   = user?.xpTotal ?? 0
  const levelBefore = user?.level ?? 1
  const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3200]

  function xpForLevel(lvl: number) { return LEVEL_THRESHOLDS[lvl - 1] ?? 0 }
  function xpForNextLevel(lvl: number) { return LEVEL_THRESHOLDS[lvl] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] }

  const xpAfter      = xpBefore + totalXP
  const levelCurrent = xpAfter >= xpForNextLevel(levelBefore + 1) ? levelBefore + 1 : levelBefore
  const levelBase    = xpForLevel(levelCurrent)
  const levelNext    = xpForNextLevel(levelCurrent)
  const levelRange   = Math.max(levelNext - levelBase, 1)
  const targetPct    = Math.min(((xpAfter - levelBase) / levelRange) * 100, 100)

  // Cascade items in with 350ms gaps, then show total, then bar
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    items.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 400 + i * 350))
    })
    timers.push(setTimeout(() => setShowTotal(true), 400 + items.length * 350 + 200))
    timers.push(setTimeout(() => {
      setShowLevel(true)
      addXP(totalXP)
    }, 400 + items.length * 350 + 700))
    timers.push(setTimeout(() => setBarWidth(targetPct), 400 + items.length * 350 + 900))
    timers.push(setTimeout(onDone, 400 + items.length * 350 + 4000))
    return () => timers.forEach(clearTimeout)
  }, [])

  const outcomeLabel  = outcome === 'win' ? 'Victory' : outcome === 'tie' ? "It's a Tie" : 'Defeat'
  const outcomeColor  = outcome === 'win' ? 'text-correct' : outcome === 'tie' ? 'text-yellow' : 'text-wrong'
  const OutcomeIcon   = outcome === 'win'
    ? <GiLaurelsTrophy size={56} className="text-yellow" />
    : outcome === 'tie'
    ? <FaHandshake size={56} className="text-info" />
    : <IoSad size={56} className="text-wrong" />

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background:
            'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
        }}
      />

      {/* Outcome */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4 animate-fade-up">{OutcomeIcon}</div>
        <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
          XP breakdown
        </div>
        <h2 className={`display font-extrabold text-[clamp(28px,4.5vw,40px)] leading-[1.02] tracking-[-1px] ${outcomeColor}`}>
          {outcomeLabel}
        </h2>
        <p className="mono text-[11px] tracking-[0.1em] uppercase text-text-muted mt-2">
          <span className="text-white font-bold">{playerScore}</span> – <span className="text-text-secondary">{opponentScore}</span>
          <span className="mx-2 text-text-faint">·</span>
          {totalQuestions} questions
        </p>
      </div>

      {/* XP breakdown card */}
      <div className="w-full max-w-sm card mb-5 space-y-2.5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow" />
        {items.map((item, i) => {
          const Icon = i === 0 ? FiAward : i === 1 ? FiTarget : FiCheckCircle
          return (
          <div
            key={i}
            className={`flex items-center justify-between gap-4 rounded-md border border-border bg-white/[0.03] px-3 py-2.5 transition-all duration-300 ${
              i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <span className={`flex items-center gap-2 text-[13px] ${item.earned ? 'text-text-primary' : 'text-text-muted line-through'}`}>
              <span className={`grid h-7 w-7 place-items-center rounded-md border ${item.earned ? 'border-yellow-rim bg-yellow-soft text-yellow' : 'border-border bg-white/[0.04] text-text-muted'}`}>
                <Icon size={14} />
              </span>
              <span>{item.label}</span>
            </span>
            <span className={`mono text-sm font-bold tabular-nums ${item.earned ? 'text-yellow' : 'text-text-muted'}`}>
              +{item.xp} XP
            </span>
          </div>
          )
        })}

        {showTotal && (
          <div className="pt-3 mt-1 border-t border-white/[0.06] flex items-center justify-between animate-fade-up">
            <span className="mono text-[10px] font-semibold tracking-[0.12em] uppercase text-yellow inline-flex items-center gap-2">
              <FiZap size={13} />
              Total XP earned
            </span>
            <span className="font-display font-extrabold text-yellow text-2xl tabular-nums">+{totalXP}</span>
          </div>
        )}
      </div>

      {/* Level progress */}
      {showLevel && (
        <div className="w-full max-w-sm animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <span className="mono text-[10px] tracking-[0.12em] uppercase font-semibold text-orange">Level {levelCurrent}</span>
            <span className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted tabular-nums">
              {Math.min(xpAfter, levelNext)} / {levelNext} XP
            </span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-yellow rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {levelCurrent > levelBefore && (
            <p className="text-center text-yellow text-sm font-bold mt-3 animate-pulse mono tracking-[0.05em] uppercase">
              ⬆ Level Up! You&apos;re now Level {levelCurrent}
            </p>
          )}
        </div>
      )}

      <button
        onClick={onDone}
        className="mt-8 mono text-[11px] tracking-[0.1em] uppercase font-semibold text-text-secondary hover:text-white underline transition-colors"
      >
        Skip
      </button>
    </div>
  )
}

// ── Helper: build XP items from battle outcome ────────────────────────────────

export function buildBattleXPItems({
  outcome,
  playerScore,
  totalQuestions,
  isClean,
}: {
  outcome: 'win' | 'lose' | 'tie'
  playerScore: number
  totalQuestions: number
  isClean: boolean
}): { items: XPBreakdownItem[]; totalXP: number } {
  const accuracy = totalQuestions > 0 ? playerScore / totalQuestions : 0

  const items: XPBreakdownItem[] = [
    {
      label: outcome === 'win' ? 'Battle won' : outcome === 'tie' ? 'Battle tied' : 'Battle completed',
      xp:    outcome === 'win' ? 25 : outcome === 'tie' ? 10 : 5,
      earned: true,
    },
    {
      label: 'Accuracy bonus (80%+)',
      xp:    10,
      earned: accuracy >= 0.8,
    },
    {
      label: 'Clean game bonus',
      xp:    5,
      earned: isClean,
    },
  ]

  const totalXP = items.filter((i) => i.earned).reduce((sum, i) => sum + i.xp, 0)
  return { items, totalXP }
}
