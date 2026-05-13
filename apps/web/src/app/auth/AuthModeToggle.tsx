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

interface AuthModeToggleProps {
  mode: 'signin' | 'signup'
  onChange: (mode: 'signin' | 'signup') => void
}

export function AuthModeToggle({ mode, onChange }: AuthModeToggleProps) {
  return (
    <div
      className="flex bg-white/[0.05] border border-white/10 rounded-lg p-1 mb-9 animate-fade-up"
      role="tablist"
    >
      <Tab active={mode === 'signin'} onClick={() => onChange('signin')}>
        Sign In
      </Tab>
      <Tab active={mode === 'signup'} onClick={() => onChange('signup')}>
        Create Account
      </Tab>
    </div>
  )
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={clsx(
        'flex-1 py-2.5 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-orange text-white shadow-[0_2px_12px_rgba(244,91,38,0.35)]'
          : 'text-text-secondary hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
