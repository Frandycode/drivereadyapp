import { useUserStore } from '@/stores'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Flame, Target, Zap, BookOpen } from 'lucide-react'

export function HomePage() {
  const user = useUserStore((s) => s.user)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <PageWrapper>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-text-secondary text-sm">{greeting}</p>
        <h2 className="font-display text-2xl font-bold text-text-primary">
          {user?.displayName ?? 'Learner'} 👋
        </h2>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={<Flame size={18} className="text-gold-500" />}
          value={user?.streakDays ?? 0}
          label="Day Streak"
          color="gold"
        />
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

      {/* Continue studying */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-green-500" />
          <span className="font-medium text-text-primary">Continue Learning</span>
        </div>
        <p className="text-text-secondary text-sm mb-3">
          Pick up where you left off
        </p>
        <button className="btn-primary w-full">Start Studying</button>
      </div>

      {/* Daily challenge */}
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
        <button className="btn-gold w-full mt-3">Take the Challenge</button>
      </div>
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
