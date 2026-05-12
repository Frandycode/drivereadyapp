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

import { useState } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useUserStore } from '@/stores'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Flame, Target, Zap, BookOpen, Snowflake, X } from 'lucide-react'
import { MdWavingHand } from 'react-icons/md'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const USE_FREEZE_TOKEN = gql`
  mutation UseFreezeToken {
    useFreezeToken { id streakDays freezeTokens }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface HomePageProps {
  onNavigate: (path: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HomePage({ onNavigate }: HomePageProps) {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const [freezeModal, setFreezeModal] = useState(false)
  const [useFreezeToken, { loading: freezing }] = useMutation(USE_FREEZE_TOKEN, {
    onCompleted: (data) => {
      if (data?.useFreezeToken && user) {
        setUser({ ...user, streakDays: data.useFreezeToken.streakDays, freezeTokens: data.useFreezeToken.freezeTokens })
      }
      setFreezeModal(false)
    },
  })

  const hour         = new Date().getHours()
  const greeting     = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const streak       = user?.streakDays ?? 0
  const freezeTokens = user?.freezeTokens ?? 0

  // Show "study today" nudge in the evening if streak > 0
  const isEvening    = hour >= 18
  const streakAtRisk = streak > 0 && isEvening

  return (
    <PageWrapper>
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-text-secondary text-sm">{greeting}</p>
        <h2 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          {user?.displayName ?? 'Learner'}
          <MdWavingHand size={26} className="text-gold-500" />
        </h2>
      </div>

      {/* ── Streak banner ──────────────────────────────────────────────────── */}
      <div className={`card mb-5 ${
        streakAtRisk ? 'border-gold-600/60 bg-gold-500/5' : streak > 0 ? 'border-orange-700/40' : 'border-border'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              streak > 0 ? 'bg-gold-500/20 border border-gold-600/40' : 'bg-surface-2 border border-border'
            }`}>
              <Flame size={20} className={streak > 0 ? 'text-gold-500' : 'text-text-secondary'} />
            </div>
            <div>
              <p className="font-display font-bold text-text-primary text-lg leading-tight flex items-center gap-1.5">
                {streak > 0
                  ? <>{streak} day streak <Flame size={16} className="text-gold-500 flex-shrink-0" /></>
                  : 'No streak yet'}
              </p>
              <p className="text-xs text-text-secondary">
                {streak > 0 ? 'Keep it going — study daily!' : 'Start studying to build your streak'}
              </p>
            </div>
          </div>

          {/* Freeze tokens */}
          {freezeTokens > 0 && (
            <button
              onClick={() => setFreezeModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all"
              title="Freeze tokens protect your streak for one missed day"
            >
              <Snowflake size={14} />
              <span className="text-sm font-mono font-bold">{freezeTokens}</span>
            </button>
          )}
        </div>

        {/* Streak-at-risk nudge */}
        {streakAtRisk && (
          <div className="mt-3 pt-3 border-t border-gold-700/30 flex items-center justify-between gap-3">
            <p className="text-xs text-gold-400">
              Your streak ends tonight! Study now to keep it.
            </p>
            <button
              onClick={() => onNavigate('/study')}
              className="text-xs font-semibold text-bg bg-gold-500 hover:bg-gold-400 px-3 py-1.5 rounded-md transition-all flex-shrink-0"
            >
              Study now
            </button>
          </div>
        )}
      </div>

      {/* ── XP + Readiness stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={<Zap size={18} className="text-green-500" />}
          value={user?.xpTotal ?? 0}
          label="Total XP"
          color="green"
        />
        <StatCard
          icon={<Target size={18} className="text-info" />}
          value="—"
          label="Readiness"
          color="info"
        />
      </div>

      {/* ── Continue studying ─────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-green-500" />
          <span className="font-medium text-text-primary">Continue Learning</span>
        </div>
        <p className="text-text-secondary text-sm mb-3">
          Pick up where you left off
        </p>
        <button className="btn-primary w-full" onClick={() => onNavigate('/study')}>
          Start Studying
        </button>
      </div>

      {/* ── Daily challenge ───────────────────────────────────────────────── */}
      <div className="card border-gold-600/50">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-bold text-text-primary">Daily Challenge</span>
          <span className="text-xs text-gold-500 bg-gold-500/10 border border-gold-600/30 px-2 py-0.5 rounded-full">
            2× XP
          </span>
        </div>
        <p className="text-text-secondary text-sm">
          Answer today's featured question to keep your streak alive.
        </p>
        <button className="btn-gold w-full mt-3" onClick={() => onNavigate('/challenge')}>
          Take the Challenge
        </button>
      </div>

      {/* ── Ask DriveReady (AI tutor) ───────────────────────────────────── */}
      <button
        onClick={() => onNavigate('/tutor')}
        className="w-full mt-4 card-elevated text-left hover:border-green-700 active:scale-[0.99] transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-green-500 text-lg">✨</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-text-primary">Ask DriveReady</p>
            <p className="text-text-secondary text-xs">Get instant answers to driving questions</p>
          </div>
        </div>
      </button>

      {/* ── Freeze token modal ────────────────────────────────────────────── */}
      {freezeModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setFreezeModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                    <Snowflake size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-text-primary">Freeze Token</h3>
                    <p className="text-xs text-text-secondary">{freezeTokens} remaining</p>
                  </div>
                </div>
                <button onClick={() => setFreezeModal(false)} className="text-text-secondary hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-5">
                Use a freeze token to protect your {streak}-day streak for one missed day. You won't lose your streak even if you miss today.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setFreezeModal(false)} className="btn-secondary flex-1">
                  Keep it
                </button>
                <button
                  onClick={() => useFreezeToken()}
                  disabled={freezing}
                  className="flex-1 h-10 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  Use Token
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}

function StatCard({
  icon, value, label, color,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  color: 'gold' | 'green' | 'info'
}) {
  const valueClass = {
    gold: 'text-gold-500',
    green: 'text-green-500',
    info: 'text-info',
  }[color]

  return (
    <div className="card text-center p-3">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={`font-mono text-lg font-bold ${valueClass}`}>{value}</div>
      <div className="text-text-secondary text-xs">{label}</div>
    </div>
  )
}
