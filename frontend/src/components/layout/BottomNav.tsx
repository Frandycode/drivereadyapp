import { Home, BookOpen, Layers, Zap, User } from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      Icon: Home,     path: '/' },
  { id: 'learn',     label: 'Learn',     Icon: BookOpen, path: '/learn' },
  { id: 'study',     label: 'Study',     Icon: Layers,   path: '/study' },
  { id: 'challenge', label: 'Challenge', Icon: Zap,      path: '/challenge' },
  { id: 'profile',   label: 'Profile',   Icon: User,     path: '/profile' },
]

interface BottomNavProps {
  activePath: string
  onNavigate: (path: string) => void
}

export function BottomNav({ activePath, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ id, label, Icon, path }) => {
          const isActive = activePath === path || (path !== '/' && activePath.startsWith(path))
          return (
            <button
              key={id}
              onClick={() => onNavigate(path)}
              className={clsx(
                'nav-item flex-1',
                isActive && 'active'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.75}
                className="transition-all duration-150"
              />
              <span className={clsx(
                'text-xs transition-all duration-150',
                isActive ? 'font-medium text-green-500' : 'text-text-secondary'
              )}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
