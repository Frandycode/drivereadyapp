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

import { clsx } from 'clsx'

export type DifficultyCode = 'beginner' | 'pro' | 'expert'

export const DIFFICULTY_COPY: Record<
  DifficultyCode,
  {
    label: string
    desc: string
    xp: string
    classes: string
    activeClass: string
    bars: Array<'green' | 'yellow' | 'red'>
  }
> = {
  beginner: {
    label: 'Beginner',
    desc: 'Unlimited hints and skips. Best for building confidence.',
    xp: '1x XP',
    classes: 'text-correct bg-correct/10 border-correct/35',
    activeClass: 'border-correct/55 bg-correct/10',
    bars: ['green'],
  },
  pro: {
    label: 'Pro',
    desc: 'Limited hints and skips. A balanced permit-test pace.',
    xp: '2x XP',
    classes: 'text-yellow bg-yellow-soft border-yellow-rim',
    activeClass: 'border-yellow-rim bg-yellow-soft',
    bars: ['green', 'yellow'],
  },
  expert: {
    label: 'Expert',
    desc: 'No hints or skips. Closest to real test pressure.',
    xp: '3x XP',
    classes: 'text-orange bg-orange-soft border-orange/35',
    activeClass: 'border-orange/45 bg-orange-soft',
    bars: ['green', 'yellow', 'red'],
  },
}

const BAR_CLASS = {
  green: 'bg-correct',
  yellow: 'bg-yellow',
  red: 'bg-wrong',
}

export function getDifficultyCopy(difficulty: DifficultyCode) {
  return DIFFICULTY_COPY[difficulty]
}

export function DifficultyBars({ difficulty, compact = false }: { difficulty: DifficultyCode; compact?: boolean }) {
  const cfg = getDifficultyCopy(difficulty)
  return (
    <span className={clsx('inline-flex items-center gap-1', compact ? 'h-2' : 'h-3')} aria-hidden="true">
      {(['green', 'yellow', 'red'] as const).map((bar) => (
        <span
          key={bar}
          className={clsx(
            'rounded-full transition-all',
            compact ? 'h-1.5 w-4' : 'h-2 w-6',
            cfg.bars.includes(bar) ? BAR_CLASS[bar] : 'bg-white/[0.08]',
          )}
        />
      ))}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: DifficultyCode }) {
  const cfg = getDifficultyCopy(difficulty)
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-md border px-2 py-1 mono text-[10px] font-semibold uppercase tracking-[0.08em]', cfg.classes)}>
      <DifficultyBars difficulty={difficulty} compact />
      {cfg.label}
    </span>
  )
}
