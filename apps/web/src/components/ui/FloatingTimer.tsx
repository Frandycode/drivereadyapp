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

import { FiClock as Clock } from 'react-icons/fi'
import { clsx } from 'clsx'

interface FloatingTimerProps {
  timeLeft: number
  total: number
  label?: string
}

export function FloatingTimer({ timeLeft, total, label = 'Timer' }: FloatingTimerProps) {
  const pct = total > 0 ? Math.max(0, Math.min(1, timeLeft / total)) : 0
  const tone =
    pct > 0.5 ? { text: 'text-correct', border: 'border-correct/45', bg: 'bg-correct/10', stroke: '#22C55E' } :
    pct > 0.2 ? { text: 'text-yellow',  border: 'border-yellow-rim', bg: 'bg-yellow-soft', stroke: '#F8DE22' } :
                { text: 'text-orange',  border: 'border-orange/45', bg: 'bg-orange-soft', stroke: '#F45B26' }
  const circumference = 2 * Math.PI * 33
  const dash = circumference * pct
  const ended = timeLeft <= 0

  return (
    <div
      className={clsx(
        'fixed right-4 top-[76px] z-50 rounded-full border bg-navy-deep/90 p-2 shadow-[0_18px_42px_rgba(0,0,0,0.36)] backdrop-blur-md',
        tone.border,
        tone.bg,
        pct <= 0.1 && !ended && 'animate-pulse',
      )}
      aria-label={`${label}: ${timeLeft} seconds remaining`}
    >
      <div className="relative grid h-[82px] w-[82px] place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 82 82" aria-hidden="true">
          <circle cx="41" cy="41" r="33" fill="none" stroke="rgba(245,240,230,0.12)" strokeWidth="7" />
          <circle
            cx="41"
            cy="41"
            r="33"
            fill="none"
            stroke={tone.stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="relative flex flex-col items-center leading-none">
          <Clock size={14} className={tone.text} />
          <span className={clsx('mono mt-1 text-[24px] font-black tabular-nums', tone.text)}>
            {timeLeft}
          </span>
          <span className="mono mt-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {ended ? 'Time ended' : 'seconds'}
          </span>
        </div>
      </div>
    </div>
  )
}
