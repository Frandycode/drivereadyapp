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
  const outcomeColor  = outcome === 'win' ? 'text-green-500' : outcome === 'tie' ? 'text-gold-500' : 'text-red-400'
  const OutcomeIcon   = outcome === 'win'
    ? <GiLaurelsTrophy size={60} className="text-gold-500" />
    : outcome === 'tie'
    ? <FaHandshake size={60} className="text-info" />
    : <IoSad size={60} className="text-red-400" />

  const earnedItems   = items.filter((i) => i.earned)

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6">
      {/* Outcome */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-3">{OutcomeIcon}</div>
        <h2 className={`font-display text-3xl font-bold ${outcomeColor}`}>{outcomeLabel}</h2>
        <p className="text-text-secondary text-sm mt-1">
          {playerScore} – {opponentScore} &nbsp;·&nbsp; {totalQuestions} questions
        </p>
      </div>

      {/* XP breakdown card */}
      <div className="w-full max-w-xs card mb-5 space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-between transition-all duration-300 ${
              i < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <span className={`text-sm ${item.earned ? 'text-text-primary' : 'text-text-secondary line-through'}`}>
              {item.label}
            </span>
            <span className={`font-mono text-sm font-bold ${item.earned ? 'text-green-500' : 'text-text-secondary'}`}>
              {item.earned ? `+${item.xp}` : `+${item.xp}`}
            </span>
          </div>
        ))}

        {showTotal && (
          <div className="pt-2 mt-1 border-t border-border flex items-center justify-between">
            <span className="font-medium text-text-primary">Total XP earned</span>
            <span className="font-mono font-bold text-green-500 text-lg">+{totalXP}</span>
          </div>
        )}
      </div>

      {/* Level progress */}
      {showLevel && (
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">Level {levelCurrent}</span>
            <span className="text-xs text-text-secondary font-mono">
              {Math.min(xpAfter, levelNext)} / {levelNext} XP
            </span>
          </div>
          <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {levelCurrent > levelBefore && (
            <p className="text-center text-green-500 text-sm font-bold mt-3 animate-pulse">
              ⬆ Level Up! You're now Level {levelCurrent}
            </p>
          )}
        </div>
      )}

      <button
        onClick={onDone}
        className="mt-8 text-sm text-text-secondary hover:text-text-primary underline transition-colors"
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
