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

import { ReactNode } from 'react'
import { FiAward, FiZap } from 'react-icons/fi'
import { FaFire } from 'react-icons/fa'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row overflow-hidden bg-navy-deep">
      {/* ─── LEFT PANEL (brand visual) ─── */}
      <LeftBrandPanel />

      {/* ─── RIGHT PANEL (form) ─── */}
      <div className="relative flex-1 flex items-center justify-center px-5 sm:px-10 py-10 sm:py-12 bg-navy-deep overflow-y-auto">
        {/* Radial glow at top */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse, rgba(244,91,38,0.06) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative z-[1] w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}

// ── Left brand panel ─────────────────────────────────────────────────────────

function LeftBrandPanel() {
  return (
    <div className="relative hidden lg:flex flex-col justify-between basis-[52%] shrink-0 grow-0 overflow-hidden bg-navy p-12">
      {/* Blueprint grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(248,222,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(248,222,34,0.04) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
        aria-hidden="true"
      />

      {/* Drifting orange slab */}
      <div
        className="absolute bottom-[-60px] right-[-80px] w-[320px] h-[420px] bg-orange opacity-[0.08]"
        style={{
          clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0 100%)',
          animation: 'float 18s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Animated road */}
      <svg
        className="absolute left-0 right-0 bottom-20 w-full opacity-20"
        viewBox="0 0 600 160"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <polygon points="300,40 210,160 390,160" fill="rgba(255,255,255,0.04)" />
        <line
          x1="300"
          y1="46"
          x2="300"
          y2="160"
          stroke="#F8DE22"
          strokeWidth="3"
          strokeDasharray="10 18"
          strokeLinecap="round"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-80" dur="2s" repeatCount="indefinite" />
        </line>
        <line x1="300" y1="40" x2="210" y2="160" stroke="rgba(244,91,38,0.5)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="300" y1="40" x2="390" y2="160" stroke="rgba(244,91,38,0.25)" strokeWidth="1" strokeLinecap="round" />
        <circle cx="300" cy="38" r="8" fill="#F8DE22" opacity="0.9" />
        <circle cx="300" cy="38" r="16" fill="#F8DE22" opacity="0.15" />
        <circle cx="300" cy="38" r="28" fill="#F8DE22" opacity="0.05" />
      </svg>

      {/* Top brand */}
      <div className="relative z-[2] flex items-center gap-3 animate-fade-up">
        <BrandShield />
        <div className="leading-tight">
          <div className="font-display font-extrabold text-[20px] tracking-[-0.3px] text-white">
            Drive<em className="not-italic text-orange">Ready</em>
          </div>
          <div className="mono text-[9px] tracking-[0.12em] uppercase text-text-muted mt-0.5">
            driveready-ok.com
          </div>
        </div>
      </div>

      {/* Hero text */}
      <div className="relative z-[2] flex-1 flex flex-col justify-center py-10">
        <div
          className="inline-flex items-center gap-2 bg-yellow-soft border border-yellow-rim rounded-full px-3.5 py-1 w-fit text-[11px] font-medium tracking-[0.12em] text-yellow uppercase mb-7 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-pulse-soft" />
          AI-Powered Permit Prep
        </div>

        <h1
          className="display font-extrabold text-[clamp(36px,4vw,58px)] leading-none tracking-[-2px] text-white mb-5 animate-fade-up"
          style={{ animationDelay: '0.18s' }}
        >
          Your permit.
          <br />
          <span className="text-orange block">First try.</span>
        </h1>

        <p
          className="text-text-secondary font-light text-base leading-relaxed max-w-[380px] mb-9 animate-fade-up"
          style={{ animationDelay: '0.26s' }}
        >
          Five study modes, real-time bot battles, and an AI that tracks your exact weak spots. Built
          for teens. Trusted by parents.
        </p>

        <div
          className="flex flex-wrap gap-3 animate-fade-up"
          style={{ animationDelay: '0.34s' }}
        >
          <StatPill Icon={FiAward}  iconClass="text-yellow"  value="94%"     label="First-attempt pass rate" />
          <StatPill Icon={FaFire}   iconClass="text-orange"  value="14,892"  label="Permits earned" />
          <StatPill Icon={FiZap}    iconClass="text-yellow"  value="6 modes" label="Ways to study" />
        </div>
      </div>

      {/* Bottom row */}
      <div className="relative z-[2] flex items-center gap-1.5 text-[12px] text-text-muted animate-fade-up" style={{ animationDelay: '0.42s' }}>
        <span>All 50 states</span>
        <span className="w-[3px] h-[3px] rounded-full bg-text-muted" />
        <span>AI-powered</span>
        <span className="w-[3px] h-[3px] rounded-full bg-text-muted" />
        <span>Free to start</span>
      </div>

      {/* Tricolor stripe along bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] z-[3]"
        style={{
          background:
            'linear-gradient(90deg, #F8DE22 0 33.33%, #010E33 33.33% 66.66%, #F45B26 66.66% 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  )
}

function BrandShield() {
  return (
    <svg width="36" height="42" viewBox="0 0 60 70" fill="none" aria-hidden="true">
      <path d="M30 2L56 14L56 40Q56 60 30 68Q4 60 4 40L4 14Z" fill="#F45B26" />
      <path d="M30 8L50 18L50 40Q50 57 30 64Q10 57 10 40L10 18Z" fill="#021A54" />
      <polyline
        points="18,38 27,48 44,28"
        stroke="#F45B26"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <polygon
        points="30,12 32.6,20 42,20 35,25 37.5,33 30,28 22.5,33 25,25 18,20 27.4,20"
        fill="#F8DE22"
      />
    </svg>
  )
}

interface StatPillProps {
  Icon: React.ComponentType<{ size?: number; className?: string }>
  iconClass: string
  value: string
  label: string
}

function StatPill({ Icon, iconClass, value, label }: StatPillProps) {
  return (
    <div className="inline-flex items-center gap-2.5 bg-white/[0.05] border border-white/10 rounded-md px-4 py-2.5">
      <Icon size={16} className={iconClass} />
      <div>
        <div className="mono font-medium text-[14px] text-white leading-none">{value}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
      </div>
    </div>
  )
}
