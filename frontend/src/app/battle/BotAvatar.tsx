import { clsx } from 'clsx'
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
    <div className="flex flex-col items-center gap-2">
      {/* Avatar circle */}
      <div className={clsx(
        'relative rounded-2xl flex items-center justify-center border-2 transition-all duration-300',
        size === 'md' ? 'w-16 h-16 text-3xl' : 'w-12 h-12 text-2xl',
        thinking  && 'animate-pulse border-gold-500 bg-gold-500/10',
        answered  && isCorrect === undefined && 'border-green-700 bg-surface-2',
        answered  && isCorrect === true  && 'border-green-500 bg-green-500/10',
        answered  && isCorrect === false && 'border-red-600 bg-red-500/10',
        !thinking && !answered && 'border-border bg-surface-2',
      )}>
        {bot.avatar}

        {/* Status dot */}
        {thinking && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gold-500 border-2 border-bg flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-bg animate-ping" />
          </span>
        )}
        {answered && isCorrect === true && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-bg flex items-center justify-center text-bg text-[8px] font-bold">✓</span>
        )}
        {answered && isCorrect === false && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-bg flex items-center justify-center text-bg text-[8px] font-bold">✗</span>
        )}
      </div>

      {/* Name + score */}
      <div className="text-center">
        <p className="text-xs font-medium text-text-primary">{bot.name}</p>
        <p className={clsx(
          'text-lg font-mono font-bold',
          isWinning ? 'text-red-400' : isTied ? 'text-gold-500' : 'text-text-secondary'
        )}>
          {score}
        </p>
      </div>

      {/* Thinking text */}
      {thinking && (
        <p className="text-xs text-gold-500 animate-pulse">thinking...</p>
      )}
    </div>
  )
}