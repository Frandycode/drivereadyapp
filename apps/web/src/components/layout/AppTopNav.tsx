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
import { FiPlayCircle } from 'react-icons/fi'
import { AppLogo } from './AppLogo'

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      path: '/' },
  { id: 'learn',     label: 'Learn',     path: '/learn' },
  { id: 'study',     label: 'Study',     path: '/study' },
  { id: 'challenge', label: 'Challenge', path: '/challenge' },
  { id: 'profile',   label: 'Profile',   path: '/profile' },
]

interface AppTopNavProps {
  activePath: string
  displayName?: string | null
  xpTotal?: number
  onNavigate: (path: string) => void
  onTutorial: () => void
}

export function AppTopNav({
  activePath,
  displayName,
  xpTotal = 0,
  onNavigate,
  onTutorial,
}: AppTopNavProps) {
  const initials = (displayName ?? 'Driver Ready')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DR'
  const firstName = (displayName ?? 'Driver').split(' ')[0] || 'Driver'

  return (
    <header className="sticky top-0 z-50 hidden lg:block glass border-b border-cream/[0.08]">
      <div className="h-16 px-[var(--pad-x)] flex items-center justify-between gap-8">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2.5 min-w-0"
          aria-label="Go to home"
        >
          <AppLogo height={34} />
          <div className="leading-tight text-left">
            <div className="mono text-[9px] tracking-[0.14em] uppercase text-text-muted">
              Oklahoma permit prep
            </div>
            <div className="text-[11px] text-text-secondary">drivereadyapp.com</div>
          </div>
        </button>

        <nav aria-label="Primary">
          <ul className="flex items-center gap-7">
            {NAV_ITEMS.map(({ id, label, path }) => {
              const isActive = activePath === path || (path !== '/' && activePath.startsWith(path))
              return (
                <li key={id}>
                  <button
                    onClick={() => onNavigate(path)}
                    className={clsx(
                      'relative py-2 text-[18px] font-medium transition-colors',
                      isActive ? 'text-cream' : 'text-text-secondary hover:text-cream',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {label}
                    {isActive && (
                      <span
                        className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-orange"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={onTutorial}
            className="inline-flex items-center gap-2 rounded-full border border-yellow-rim/30 bg-yellow-soft px-3.5 py-2 text-[12px] font-semibold text-yellow hover:bg-yellow/15 hover:border-yellow-rim transition-colors"
          >
            <FiPlayCircle size={14} />
            See how it works
          </button>
          <button
            onClick={() => onNavigate('/profile')}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-cream/[0.13] transition-colors hover:border-orange"
            aria-label="Open profile"
          >
            <span
              className="grid place-items-center w-7 h-7 rounded-full text-navy-deep font-display font-extrabold text-[15px]"
              style={{ background: 'linear-gradient(135deg, #F45B26, #F8DE22)' }}
            >
              {initials}
            </span>
            <span className="text-[17px] font-medium text-cream">{firstName}</span>
            <span className="mono text-[11px] text-yellow tabular-nums">{xpTotal.toLocaleString()} XP</span>
          </button>
        </div>
      </div>
    </header>
  )
}
