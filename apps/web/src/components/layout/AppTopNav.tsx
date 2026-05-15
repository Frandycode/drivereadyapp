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
import { FiBookOpen, FiHome, FiLayers, FiPlayCircle, FiUser, FiZap } from 'react-icons/fi'
import { AppLogo } from './AppLogo'

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      Icon: FiHome,     path: '/' },
  { id: 'learn',     label: 'Learn',     Icon: FiBookOpen, path: '/learn' },
  { id: 'study',     label: 'Study',     Icon: FiLayers,   path: '/study' },
  { id: 'challenge', label: 'Challenge', Icon: FiZap,      path: '/challenge' },
  { id: 'profile',   label: 'Profile',   Icon: FiUser,     path: '/profile' },
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

  return (
    <header className="sticky top-0 z-50 hidden lg:block glass border-b border-border">
      <div className="max-w-dashboard mx-auto h-16 px-10 flex items-center justify-between gap-6">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 min-w-0"
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

        <nav aria-label="Primary" className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] p-1">
          {NAV_ITEMS.map(({ id, label, Icon, path }) => {
            const isActive = activePath === path || (path !== '/' && activePath.startsWith(path))
            return (
              <button
                key={id}
                onClick={() => onNavigate(path)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all',
                  isActive
                    ? 'bg-orange text-white shadow-[0_8px_22px_rgba(244,91,38,0.28)]'
                    : 'text-text-secondary hover:text-white hover:bg-white/[0.06]',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={15} />
                {label}
              </button>
            )
          })}
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
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 hover:border-orange/30 transition-colors"
            aria-label="Open profile"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-orange text-white text-[12px] font-bold">
              {initials}
            </span>
            <span className="mono text-[11px] text-text-secondary tabular-nums">{xpTotal.toLocaleString()} XP</span>
          </button>
        </div>
      </div>
    </header>
  )
}
