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

import { LogOut, User, Mail, Zap, Flame, Shield } from 'lucide-react'
import { useUserStore } from '@/stores'
import { clearAuthToken } from '@driveready/api-client'

export function ProfilePage() {
  const { user, clearUser } = useUserStore()

  function handleLogout() {
    clearAuthToken()
    clearUser()
  }

  if (!user) return null

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Profile</h1>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
            <User size={26} className="text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">{user.displayName}</p>
            <div className="flex items-center gap-1 text-text-secondary text-sm mt-0.5">
              <Mail size={13} />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
              <Zap size={15} />
              <span className="text-xs font-medium uppercase tracking-wide">XP</span>
            </div>
            <p className="font-display text-xl font-bold text-text-primary">{user.xpTotal.toLocaleString()}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
              <Flame size={15} />
              <span className="text-xs font-medium uppercase tracking-wide">Streak</span>
            </div>
            <p className="font-display text-xl font-bold text-text-primary">{user.streakDays}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <Shield size={15} />
              <span className="text-xs font-medium uppercase tracking-wide">Level</span>
            </div>
            <p className="font-display text-xl font-bold text-text-primary">{user.level}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  )
}
