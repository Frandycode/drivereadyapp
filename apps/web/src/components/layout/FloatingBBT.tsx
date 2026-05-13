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

import { GiRobotGolem } from 'react-icons/gi'

interface FloatingBBTProps {
  onClick: () => void
  /** Extra bottom offset (px) — defaults assume mobile tabbar (~80) or footer top */
  bottomOffset?: number
}

export function FloatingBBT({ onClick, bottomOffset }: FloatingBBTProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Bot Battle"
      title="Bot Battle"
      className="
        fixed right-4 z-40
        flex items-center justify-center
        w-14 h-14 rounded-full
        bg-orange text-white
        shadow-[0_8px_24px_-4px_rgba(244,91,38,0.55)]
        border border-orange-deep/60
        hover:bg-orange-deep hover:scale-105
        active:scale-95
        transition-all duration-150
        ring-4 ring-orange/20
        animate-pulse-soft
      "
      style={{
        bottom: `calc(${bottomOffset ?? 88}px + env(safe-area-inset-bottom))`,
      }}
    >
      <GiRobotGolem size={26} aria-hidden="true" />
      <span className="sr-only">Bot Battle</span>
    </button>
  )
}
