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

import { useState, useEffect } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useUserStore } from '@/stores'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { Flame, Snowflake, X, BookOpen, Layers, Zap, Moon, ArrowUpRight } from 'lucide-react'
import { RiSparklingFill } from 'react-icons/ri'
import { FiTarget, FiArrowRight } from 'react-icons/fi'
import { GiRobotGolem } from 'react-icons/gi'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const USE_FREEZE_TOKEN = gql`
  mutation UseFreezeToken {
    useFreezeToken { id streakDays freezeTokens }
  }
`

const GENERATE_WEEKLY_REPORT = gql`
  mutation GenerateWeeklyReport($stateCode: String!) {
    generateWeeklyReport(stateCode: $stateCode) {
      summary
      focusAreas
      checklist
      generatedAt
    }
  }
`

interface HomePageProps {
  onNavigate: (path: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const [freezeModal, setFreezeModal] = useState(false)
  const [report, setReport] = useState<{ summary: string; focusAreas: string[]; checklist: string[] } | null>(null)
  const [typedMission, setTypedMission] = useState('')
  const [generateReport] = useMutation(GENERATE_WEEKLY_REPORT)

  useEffect(() => {
    if (!user) return
    generateReport({ variables: { stateCode: user.stateCode } })
      .then((r) => {
        const data = r.data?.generateWeeklyReport
        if (data) {
          setReport({
            summary: data.summary,
            focusAreas: data.focusAreas ?? [],
            checklist: data.checklist ?? [],
          })
        }
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    const word = 'mission.'
    let index = 0
    setTypedMission('')
    const interval = window.setInterval(() => {
      index += 1
      setTypedMission(word.slice(0, index))
      if (index >= word.length) window.clearInterval(interval)
    }, 72)
    return () => window.clearInterval(interval)
  }, [user?.id])

  const [useFreezeToken, { loading: freezing }] = useMutation(USE_FREEZE_TOKEN, {
    onCompleted: (data) => {
      if (data?.useFreezeToken && user) {
        setUser({ ...user, streakDays: data.useFreezeToken.streakDays, freezeTokens: data.useFreezeToken.freezeTokens })
      }
      setFreezeModal(false)
    },
  })

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (user?.displayName ?? 'learner').split(' ')[0]
  const streak   = user?.streakDays ?? 0
  const xp       = user?.xpTotal ?? 0
  const freezeTokens = user?.freezeTokens ?? 0

  // Placeholder readiness derived from XP (until backend exposes a real score)
  const readiness = Math.min(95, Math.round((xp % 5000) / 50))
  const readinessTone = readiness >= 88 ? 'green' : readiness >= 72 ? 'blue' : readiness >= 50 ? 'gold' : 'orange'
  const growthAreas = report?.focusAreas?.length
    ? report.focusAreas
    : ['Road signs and pavement markings', 'Right-of-way choices', 'Safe following distance']

  return (
    <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
      <PageHeader
        eyebrow={`${greeting}, ${firstName} - glad you're here`}
        title={
          <>
            Today's <em className="not-italic text-orange">{typedMission || 'mission'}<span className="typing-caret" /></em>
          </>
        }
        sub="Your next win is queued up. Knock out a quick challenge, sharpen the weak spots, and keep your permit momentum alive."
        stats={[
          { label: 'Total XP',   value: xp.toLocaleString(), tone: 'gold' },
          { label: 'Day streak', value: streak, tone: 'gold' },
          { label: 'Readiness', value: `${readiness}%`, tone: readinessTone },
        ]}
        variant="ember"
      />

      <div className="bg-navy blueprint-grid">
        <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10 sm:py-14">

          {/* Streak chip row (separate so it doesn't compete with stats above) */}
          {streak > 0 && (
            <div className="mb-6 flex items-center gap-3 flex-wrap animate-fade-up">
              <div className="streak-chip">
                <Flame size={14} className="text-yellow" />
                {streak} day streak
              </div>
              {freezeTokens > 0 && (
                <button
                  onClick={() => setFreezeModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-info/10 border border-info/30 text-info text-xs font-medium hover:bg-info/20 transition-colors"
                  title="Freeze tokens protect your streak for one missed day"
                >
                  <Snowflake size={12} />
                  <span className="mono font-bold">{freezeTokens}</span>
                  freeze
                </button>
              )}
            </div>
          )}

          {/* Dashboard grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Continue Learning — span 2 on lg */}
            <button
              onClick={() => onNavigate('/learn')}
              className="card card-hover lg:col-span-2 text-left animate-fade-up"
            >
              <CardEyebrow color="orange">Continue Learning</CardEyebrow>
              <div className="mono text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Pick a chapter
              </div>
              <div className="display font-bold text-lg mb-3.5 tracking-[-0.2px]">
                Resume where you left off
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-orange-yellow w-1/2" />
              </div>
              <div className="mt-1.5 flex justify-between mono text-[10px] text-text-muted">
                <span>Browse chapters</span>
                <span>—</span>
              </div>
              <span className="inline-flex items-center gap-1.5 mt-4 text-sm text-orange font-medium">
                Open Learn
                <FiArrowRight size={14} />
              </span>
            </button>

            {/* Readiness ring */}
            <div className="card flex flex-col items-center text-center justify-center gap-1.5 py-7 animate-fade-up" style={{ animationDelay: '0.08s' }}>
              <CardEyebrow color="orange" centered>Readiness</CardEyebrow>
              <ReadinessRing pct={readiness} />
              <div className="display font-bold text-sm mt-2">
                {readiness >= 80 ? 'Almost test-ready' : readiness >= 50 ? 'Making progress' : 'Just getting started'}
              </div>
              <div className="text-[11px] text-text-muted">
                <strong className="text-correct font-semibold">↑ {Math.max(0, readiness - 60)} pts</strong>{' '}this week
              </div>
            </div>

            {/* Daily Challenge */}
            <button
              onClick={() => onNavigate('/challenge')}
              className="card card-hover text-left animate-fade-up"
              style={{ animationDelay: '0.16s', borderColor: 'rgba(248,222,34,0.25)' }}
            >
              <CardEyebrow color="yellow">Daily Challenge · 2× XP</CardEyebrow>
              <p className="text-sm leading-relaxed text-white mb-3">
                Answer today's featured question to keep your streak alive.
              </p>
              <span className="mono text-[11px] text-yellow font-semibold inline-flex items-center gap-1.5">
                <Zap size={12} />
                +40 XP for today's challenge
              </span>
            </button>

            {/* Ask DriveReady */}
            <button
              onClick={() => onNavigate('/tutor')}
              className="card card-hover text-left animate-fade-up"
              style={{ animationDelay: '0.20s' }}
            >
              <CardEyebrow color="orange">AI Tutor</CardEyebrow>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-soft border border-orange/30 flex items-center justify-center flex-shrink-0">
                  <RiSparklingFill className="text-orange" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="display font-bold text-white">Ask DriveReady</p>
                  <p className="text-text-secondary text-xs">Instant answers, any time</p>
                </div>
                <ArrowUpRight size={16} className="text-text-muted" />
              </div>
            </button>

            {/* Adaptive Practice */}
            <button
              onClick={() => onNavigate('/adaptive')}
              className="card card-hover text-left animate-fade-up"
              style={{ animationDelay: '0.24s' }}
            >
              <CardEyebrow color="yellow">Adaptive</CardEyebrow>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-soft border border-yellow-rim flex items-center justify-center flex-shrink-0">
                  <FiTarget className="text-yellow" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="display font-bold text-white">Adaptive Practice</p>
                  <p className="text-text-secondary text-xs">Hit your weakest chapters</p>
                </div>
                <ArrowUpRight size={16} className="text-text-muted" />
              </div>
            </button>

            {/* Bot Battle */}
            <button
              onClick={() => onNavigate('/challenge')}
              className="card card-hover text-left animate-fade-up"
              style={{ animationDelay: '0.28s' }}
            >
              <CardEyebrow color="orange">Bot Battle</CardEyebrow>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-soft border border-orange/30 flex items-center justify-center flex-shrink-0">
                  <GiRobotGolem className="text-orange" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="display font-bold text-white">Pick an opponent</p>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {[
                      ['Rusty', 'Beginner'],
                      ['Dash', 'Pro'],
                      ['Apex', 'Expert'],
                    ].map(([name, level]) => (
                      <span
                        key={name}
                        className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-center"
                      >
                        <span className="block text-[11px] font-semibold text-white">{name}</span>
                        <span className="block mono text-[8px] uppercase tracking-[0.08em] text-text-secondary">{level}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-text-muted" />
              </div>
            </button>

          </div>

          {/* Growth areas */}
          <div className="card mt-8 animate-fade-up" style={{ animationDelay: '0.30s' }}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <CardEyebrow color="orange">Growth Areas</CardEyebrow>
                <h2 className="display font-bold text-lg text-white tracking-[-0.3px]">
                  Focus on what moves your score.
                </h2>
              </div>
              <button
                onClick={() => onNavigate('/adaptive')}
                className="inline-flex items-center gap-1.5 rounded-md border border-orange/30 bg-orange-soft px-3.5 py-2 text-sm font-semibold text-orange hover:bg-orange/15 transition-colors"
              >
                Drill these
                <FiArrowRight size={14} />
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {growthAreas.slice(0, 3).map((area, i) => (
                <div key={area} className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-4">
                  <div className="mono text-[10px] text-yellow uppercase tracking-[0.1em] mb-2">
                    Focus {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{area}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly study plan */}
          {report && (
            <div className="card mt-8 animate-fade-up" style={{ animationDelay: '0.32s' }}>
              <CardEyebrow color="orange">This week's plan</CardEyebrow>
              <p className="text-sm text-white leading-relaxed mb-3">{report.summary}</p>
              {report.checklist.slice(0, 3).length > 0 && (
                <ul className="space-y-1.5">
                  {report.checklist.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-orange mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Quick Access */}
          <div className="mt-12">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-orange uppercase mb-4 inline-flex items-center gap-2">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Quick Access
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickTile Icon={BookOpen} label="Learn"  desc="Chapter lessons" onClick={() => onNavigate('/learn')} />
              <QuickTile Icon={Layers}   label="Study"  desc="Flashcards · Drill" onClick={() => onNavigate('/study')} />
              <QuickTile Icon={Zap}      label="Challenge" desc="Quiz · Battle"   onClick={() => onNavigate('/challenge')} />
              <QuickTile Icon={Moon}     label="Profile" desc="Stats · Settings" onClick={() => onNavigate('/profile')} />
            </div>
          </div>

        </div>
      </div>

      {/* Freeze token modal */}
      {freezeModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setFreezeModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="bg-surface-2 border border-border rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-info/10 border border-info/30 flex items-center justify-center">
                    <Snowflake size={20} className="text-info" />
                  </div>
                  <div>
                    <h3 className="display font-bold text-white">Freeze Token</h3>
                    <p className="text-xs text-text-secondary">{freezeTokens} remaining</p>
                  </div>
                </div>
                <button onClick={() => setFreezeModal(false)} className="text-text-secondary hover:text-white">
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
                  className="flex-1 h-10 rounded-md bg-info text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function CardEyebrow({ color, centered, children }: { color: 'orange' | 'yellow' | 'red'; centered?: boolean; children: React.ReactNode }) {
  const dotClass = color === 'orange' ? 'bg-orange' : color === 'yellow' ? 'bg-yellow' : 'bg-wrong'
  return (
    <div className={`text-[9px] font-semibold tracking-[0.13em] uppercase text-text-muted flex items-center gap-1.5 mb-3.5 ${centered ? 'justify-center' : ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotClass}`} />
      {children}
    </div>
  )
}

function QuickTile({ Icon, label, desc, onClick }: { Icon: React.ComponentType<any>; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative bg-surface-2 border border-border rounded-md p-5 text-left hover:bg-surface-3 hover:border-orange/40 hover:-translate-y-0.5 transition-all group"
    >
      <div className="w-9 h-9 rounded-md bg-orange-soft border border-orange/20 flex items-center justify-center mb-3.5">
        <Icon size={18} className="text-orange" />
      </div>
      <div className="display font-bold text-sm text-white mb-1 tracking-[-0.2px]">{label}</div>
      <div className="text-[11px] text-text-muted leading-snug">{desc}</div>
      <ArrowUpRight size={14} className="absolute top-4 right-4 text-text-muted group-hover:text-orange group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </button>
  )
}

function ReadinessRing({ pct }: { pct: number }) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference * (1 - pct / 100)
  return (
    <div className="relative w-[120px] h-[120px]">
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="url(#readinessRingGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)' }}
        />
        <defs>
          <linearGradient id="readinessRingGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F45B26" />
            <stop offset="100%" stopColor="#F8DE22" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="mono text-3xl font-bold text-white leading-none">
          {pct}<span className="text-sm">%</span>
        </div>
        <div className="text-[9px] text-text-muted tracking-[0.1em] uppercase mt-1">ready</div>
      </div>
    </div>
  )
}
