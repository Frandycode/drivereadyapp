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

import { RotateCcw, Home, Trophy, Skull, Handshake } from 'lucide-react'
import type { BotConfig } from './BotSelectScreen'

interface BotBattleResultsProps {
  bot: BotConfig
  playerScore: number
  botScore: number
  total: number
  xpEarned: number
  onRematch: () => void
  onExit: () => void
}

export function BotBattleResults({
  bot,
  playerScore,
  botScore,
  total,
  xpEarned,
  onRematch,
  onExit,
}: BotBattleResultsProps) {
  const outcome =
    playerScore > botScore ? 'win' :
    playerScore < botScore ? 'loss' : 'tie'

  const headline =
    outcome === 'win'  ? 'You won!' :
    outcome === 'loss' ? `${bot.name} wins` : "It's a tie!"

  const sub =
    outcome === 'win'  ? `You outscored ${bot.name}. Well done!` :
    outcome === 'loss' ? `${bot.name} got the better of you this time.` :
    'A perfectly matched battle.'

  const Icon =
    outcome === 'win'  ? Trophy :
    outcome === 'loss' ? Skull : Handshake

  const iconColor =
    outcome === 'win'  ? 'text-gold-500' :
    outcome === 'loss' ? 'text-red-400' : 'text-text-secondary'

  const ringColor =
    outcome === 'win'  ? 'border-gold-600 bg-gold-500/10' :
    outcome === 'loss' ? 'border-red-700 bg-red-500/5' :
    'border-border bg-surface-2'

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 text-center">
      {/* Outcome icon */}
      <div className={`w-20 h-20 rounded-full border-2 ${ringColor} flex items-center justify-center mb-6`}>
        <Icon size={32} className={iconColor} />
      </div>

      <h2 className="font-display text-3xl font-bold text-text-primary mb-1">{headline}</h2>
      <p className="text-text-secondary text-sm mb-8">{sub}</p>

      {/* Score card */}
      <div className="w-full max-w-xs card mb-6">
        <div className="flex items-center justify-around">
          {/* Player */}
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">You</p>
            <p className={`font-mono font-bold text-4xl ${
              outcome === 'win' ? 'text-green-500' : outcome === 'tie' ? 'text-gold-500' : 'text-text-primary'
            }`}>
              {playerScore}
            </p>
          </div>

          <div className="text-text-secondary font-display font-bold text-xl">vs</div>

          {/* Bot */}
          <div className="text-center">
            <p className="text-xs text-text-secondary mb-1">{bot.name}</p>
            <p className={`font-mono font-bold text-4xl ${
              outcome === 'loss' ? 'text-red-400' : 'text-text-secondary'
            }`}>
              {botScore}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-center gap-2">
          <span className="text-xs text-text-secondary">{total} questions</span>
          <span className="text-text-secondary">·</span>
          <span className="text-xs text-gold-500 font-medium">+{xpEarned} XP earned</span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onRematch}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Rematch {bot.name}
        </button>
        <button
          onClick={onExit}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Home size={16} />
          Back to Challenge
        </button>
      </div>
    </div>
  )
}