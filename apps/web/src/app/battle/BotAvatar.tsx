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
import { FiCheck, FiX } from 'react-icons/fi'
import type { BotConfig } from './BotSelectScreen'

interface BotAvatarProps {
  bot: BotConfig
  thinking: boolean     // pulsing "thinking" state
  answered: boolean     // bot has locked in an answer
  isCorrect?: boolean   // only set after reveal
  score: number
  playerScore: number
  size?: 'sm' | 'md'
}

export function BotAvatar({
  bot,
  thinking,
  answered,
  isCorrect,
  score,
  playerScore,
  size = 'md',
}: BotAvatarProps) {
  const isWinning = score > playerScore
  const isTied    = score === playerScore

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Avatar circle */}
      <div className={clsx(
        'relative rounded-md flex items-center justify-center border-2 transition-all duration-300',
        size === 'md' ? 'w-16 h-16' : 'w-12 h-12',
        thinking  && 'animate-pulse border-yellow bg-yellow-soft',
        answered  && isCorrect === undefined && 'border-correct/40 bg-surface-2',
        answered  && isCorrect === true  && 'border-correct bg-green-soft',
        answered  && isCorrect === false && 'border-wrong bg-wrong/10',
        !thinking && !answered && 'border-border bg-surface-2',
      )}>
        <bot.avatar size={size === 'md' ? 30 : 22} className={bot.avatarClass} />

        {/* Status dot */}
        {thinking && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-yellow border-2 border-bg flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-bg animate-ping" />
          </span>
        )}
        {answered && isCorrect === true && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-correct border-2 border-bg flex items-center justify-center text-bg">
            <FiCheck size={9} strokeWidth={3} />
          </span>
        )}
        {answered && isCorrect === false && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-wrong border-2 border-bg flex items-center justify-center text-white">
            <FiX size={9} strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Name + score */}
      <div className="text-center">
        <p className="mono text-[10px] tracking-[0.08em] uppercase font-semibold text-text-secondary">{bot.name}</p>
        <p className={clsx(
          'mono text-lg font-bold tabular-nums leading-tight',
          isWinning ? 'text-wrong' : isTied ? 'text-yellow' : 'text-text-secondary'
        )}>
          {score}
        </p>
      </div>

      {/* Thinking text */}
      {thinking && (
        <p className="mono text-[10px] tracking-[0.1em] uppercase text-yellow animate-pulse font-semibold">thinking…</p>
      )}
    </div>
  )
}