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
import { FiHome, FiBookOpen, FiLayers, FiZap, FiUser } from 'react-icons/fi'

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      Icon: FiHome,     path: '/' },
  { id: 'learn',     label: 'Learn',     Icon: FiBookOpen, path: '/learn' },
  { id: 'study',     label: 'Study',     Icon: FiLayers,   path: '/study' },
  { id: 'challenge', label: 'Challenge', Icon: FiZap,      path: '/challenge' },
  { id: 'profile',   label: 'Profile',   Icon: FiUser,     path: '/profile' },
]

interface BottomNavProps {
  activePath: string
  onNavigate: (path: string) => void
}

export function BottomNav({ activePath, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border pb-safe"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ id, label, Icon, path }) => {
          const isActive =
            activePath === path || (path !== '/' && activePath.startsWith(path))
          return (
            <button
              key={id}
              onClick={() => onNavigate(path)}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-1 transition-colors duration-150',
                isActive ? 'text-white' : 'text-text-muted hover:text-white',
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-[30%] right-[30%] h-0.5 bg-orange rounded-b-sm"
                  aria-hidden="true"
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={clsx(
                  'transition-colors duration-150',
                  isActive ? 'text-orange' : 'text-current',
                )}
              />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
