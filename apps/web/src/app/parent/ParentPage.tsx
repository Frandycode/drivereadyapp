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
import { Copy, QrCode, RefreshCw, Target, BookOpen, Award, type LucideIcon } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { useUserStore } from '@/stores'

interface ParentPageProps {
  onNavigate?: (path: string) => void
}

const WEEK = [
  { day: 'Mon', value: 48 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 34 },
  { day: 'Thu', value: 82 },
  { day: 'Fri', value: 58 },
  { day: 'Sat', value: 96, today: true },
  { day: 'Sun', value: 42 },
]

function makeInviteCode() {
  return `DR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function ParentPage({ onNavigate }: ParentPageProps) {
  const user = useUserStore((s) => s.user)
  const [inviteCode, setInviteCode] = useState('DR-9F4K')
  const [copied, setCopied] = useState(false)
  const stateCode = user?.stateCode?.toUpperCase() ?? 'OK'
  const childName = user?.displayName ?? 'Jordan Reyes'
  const initials = childName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const readiness = Math.min(96, Math.max(54, 58 + (user?.level ?? 1) * 4 + Math.min(18, user?.streakDays ?? 0)))

  async function copyInviteCode() {
    await navigator.clipboard?.writeText(inviteCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
      <PageHeader
        eyebrow="Family dashboard"
        title={<>Guide the <em className="not-italic text-orange">practice.</em></>}
        sub={`Parent linking is ${stateCode}-scoped for v1. Track progress, study time, and recent growth areas for one state account.`}
        stats={[
          { label: 'Child XP', value: (user?.xpTotal ?? 3420).toLocaleString(), tone: 'gold' },
          { label: 'Streak', value: user?.streakDays ?? 14, tone: 'orange' },
          { label: 'Ready', value: `${readiness}%`, tone: 'green' },
        ]}
        variant="brown"
      />

      <div className="bg-navy blueprint-grid">
        <div className="mx-auto max-w-dashboard px-[var(--pad-x)] py-10 pb-14 space-y-8">
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="card card-hover p-6">
              <div className="card-eyebrow"><span className="ey-dot bg-yellow" />Parent link</div>
              <h2 className="font-display text-2xl font-extrabold text-cream">Share the invite code.</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Give this code to a parent or guardian to connect the dashboard to this learner account.
              </p>
              <div className="my-6 rounded-md border border-dashed border-yellow-rim bg-yellow-soft px-5 py-5 text-center">
                <div className="mono text-[clamp(28px,6vw,44px)] font-bold tracking-[0.18em] text-yellow">{inviteCode}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="btn-secondary justify-center" onClick={copyInviteCode}><Copy size={15} />{copied ? 'Copied' : 'Copy'}</button>
                <button className="btn-secondary justify-center" onClick={() => setInviteCode(makeInviteCode())}><RefreshCw size={15} />New</button>
                <button className="btn-secondary justify-center"><QrCode size={15} />QR</button>
              </div>
            </div>

            <div className="card p-6 sm:p-7">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[linear-gradient(135deg,#F45B26,#F8DE22)] font-display text-2xl font-extrabold text-navy-deep">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-2xl font-extrabold text-cream">{childName}</div>
                  <div className="mono mt-1 text-[11px] uppercase tracking-[0.1em] text-text-muted">
                    Linked Aug 22 · last active 14 min ago · {stateCode}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Stat label="Total XP" value={(user?.xpTotal ?? 3420).toLocaleString()} tone="text-yellow" />
                    <Stat label="Streak" value={`${user?.streakDays ?? 14} days`} tone="text-orange" />
                    <Stat label="Readiness" value={`${readiness}%`} tone="text-green" />
                    <Stat label="This week" value="6h 24m" tone="text-sky" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6 sm:p-7">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="card-eyebrow"><span className="ey-dot bg-green" />Weekly activity</div>
                <h2 className="font-display text-2xl font-extrabold text-cream">Study rhythm.</h2>
              </div>
              <p className="text-sm text-text-secondary">
                <span className="font-bold text-yellow">+47%</span> vs last week
              </p>
            </div>
            <div className="flex h-52 items-end gap-3 rounded-lg border border-border bg-white/[0.03] px-4 py-5">
              {WEEK.map((item) => (
                <div key={item.day} className="flex h-full flex-1 flex-col justify-end gap-2">
                  <div
                    className={`rounded-t-md bg-[linear-gradient(180deg,#F8DE22,#F45B26)] ${item.today ? 'outline outline-2 outline-offset-2 outline-dashed outline-orange' : ''}`}
                    style={{ height: `${item.value}%` }}
                  />
                  <div className="mono text-center text-[10px] uppercase tracking-[0.08em] text-text-muted">{item.day}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-text-secondary">6h 24m studied this week.</p>
          </section>

          <section>
            <div className="mb-5">
              <div className="card-eyebrow"><span className="ey-dot bg-orange" />Recent topics</div>
              <h2 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold text-cream">Where to focus next.</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Topic Icon={Target} eyebrow="Growth area" title="Right-of-way rules" body="Four-way stops and uncontrolled intersections need one more pass." />
              <Topic Icon={BookOpen} eyebrow="This week" title="Traffic signs" body="Most study time went into warning signs and signal behavior." />
              <Topic Icon={Award} eyebrow="Mastered" title="Permit basics" body="Identity, documents, and eligibility questions are stable." />
            </div>
          </section>
        </div>
      </div>
    </PageWrapper>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-border bg-white/[0.03] p-4">
      <div className={`mono text-lg font-bold ${tone}`}>{value}</div>
      <div className="mono mt-1 text-[10px] uppercase tracking-[0.1em] text-text-muted">{label}</div>
    </div>
  )
}

function Topic({ Icon, eyebrow, title, body }: { Icon: LucideIcon; eyebrow: string; title: string; body: string }) {
  return (
    <div className="card card-hover p-5">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-md border border-orange/30 bg-orange-soft text-orange">
        <Icon size={20} />
      </div>
      <div className="card-eyebrow"><span className="ey-dot bg-orange" />{eyebrow}</div>
      <div className="font-display text-lg font-extrabold text-cream">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
    </div>
  )
}
