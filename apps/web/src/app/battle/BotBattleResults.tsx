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

import { FaTrophy as Trophy, FaHandshake as Handshake } from 'react-icons/fa'
import { FiRotateCcw as RotateCcw, FiHome as Home } from 'react-icons/fi'
import { GiSkullCrossedBones as Skull } from 'react-icons/gi'
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

  const iconTone =
    outcome === 'win'  ? 'text-yellow' :
    outcome === 'loss' ? 'text-wrong'  : 'text-text-secondary'

  const ringClass =
    outcome === 'win'  ? 'border-yellow-rim bg-yellow-soft' :
    outcome === 'loss' ? 'border-wrong/40 bg-wrong/10'       :
    'border-border bg-surface-2'

  const headlineTone =
    outcome === 'win'  ? 'text-yellow' :
    outcome === 'loss' ? 'text-wrong'  : 'text-white'

  return (
    <div className="min-h-dvh bg-navy-deep blueprint-grid flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background:
            'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
        }}
      />

      {/* Outcome icon */}
      <div className={`w-16 h-16 rounded-full border-2 ${ringClass} flex items-center justify-center mb-5 animate-fade-up`}>
        <Icon size={28} className={iconTone} />
      </div>

      <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
        <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
        Bot Battle · {bot.name}
      </div>

      <h2 className={`display font-extrabold text-[clamp(32px,5vw,48px)] leading-[1.02] tracking-[-1px] mb-2 ${headlineTone}`}>
        {headline}
      </h2>
      <p className="text-text-secondary text-sm mb-8 max-w-[360px]">{sub}</p>

      {/* Score card */}
      <div className="w-full max-w-sm card mb-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background:
              outcome === 'win'
                ? '#22C55E'
                : outcome === 'loss'
                  ? '#EF4444'
                  : '#F8DE22',
          }}
        />
        <div className="flex items-center justify-around pt-1">
          {/* Player */}
          <div className="text-center">
            <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted mb-1">You</p>
            <p className={`mono font-bold text-[44px] tabular-nums leading-none ${
              outcome === 'win' ? 'text-correct' : outcome === 'tie' ? 'text-yellow' : 'text-white'
            }`}>
              {playerScore}
            </p>
          </div>

          <div className="mono font-bold text-[15px] tracking-[0.2em] uppercase text-text-muted">vs</div>

          {/* Bot */}
          <div className="text-center">
            <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted mb-1">{bot.name}</p>
            <p className={`mono font-bold text-[44px] tabular-nums leading-none ${
              outcome === 'loss' ? 'text-wrong' : 'text-text-secondary'
            }`}>
              {botScore}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-2 mono text-[10px] tracking-[0.08em] uppercase">
          <span className="text-text-muted">{total} questions</span>
          <span className="text-text-faint">·</span>
          <span className="text-yellow font-semibold">+{xpEarned} XP</span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onRematch}
          className="btn-primary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <RotateCcw size={16} />
          Rematch {bot.name}
        </button>
        <button
          onClick={onExit}
          className="btn-secondary w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Home size={16} />
          Back to Challenge
        </button>
      </div>
    </div>
  )
}