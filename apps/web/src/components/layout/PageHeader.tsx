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
import { clsx } from 'clsx'

export type SlabVariant = 'orange' | 'yellow' | 'navy' | 'none'

export interface PageStat {
  label: string
  value: ReactNode
  tone?: 'default' | 'gold' | 'orange' | 'green'
}

interface PageHeaderProps {
  /** Small label above title, e.g. "Good morning, Jordan" */
  eyebrow?: ReactNode
  /** Title — supports JSX (use <em> for orange, <span class="yel"> for yellow) */
  title: ReactNode
  /** Subhead beneath title */
  sub?: ReactNode
  /** Right-aligned stats block */
  stats?: PageStat[]
  /** Background slab color (right-side angled wedge) */
  slab?: SlabVariant
  /** Hide the tricolor stripe at the bottom */
  noStripe?: boolean
}

const TONE_CLASS: Record<NonNullable<PageStat['tone']>, string> = {
  default: 'text-white',
  gold:    'text-yellow',
  orange:  'text-orange',
  green:   'text-correct',
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  stats,
  slab = 'orange',
  noStripe,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-navy-deep blueprint-grid border-b border-yellow-rim/40">
      <div className="relative px-[var(--pad-x)] py-[clamp(48px,7vw,84px)] pb-[clamp(40px,5vw,56px)]">
        {slab !== 'none' && (
          <div
            className={clsx(
              'absolute top-0 right-0 bottom-0 w-[36%] z-0 pointer-events-none opacity-95',
              'before:content-[""] before:absolute before:inset-0',
              'before:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] before:bg-[length:30px_30px]',
              'after:content-[""] after:absolute after:inset-0',
              'after:bg-[linear-gradient(90deg,rgba(1,14,51,0.35)_0%,transparent_30%)]',
            )}
            style={{
              clipPath: 'polygon(22% 0, 100% 0, 100% 100%, 0% 100%)',
              background:
                slab === 'orange'
                  ? '#F45B26'
                  : slab === 'yellow'
                    ? '#F8DE22'
                    : 'linear-gradient(135deg, #021A54 0%, #071E5C 100%)',
            }}
          />
        )}

        {!noStripe && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] z-10"
            style={{
              background:
                'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
            }}
          />
        )}

        <div className="relative z-[2] max-w-[1200px] mx-auto flex flex-wrap items-end justify-between gap-8 animate-fade-up">
          <div className="flex-1 min-w-0 max-w-[640px]">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 bg-yellow-soft border border-yellow-rim rounded-full px-3.5 py-1 mb-5 text-[11px] font-medium tracking-[0.12em] text-yellow uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow animate-pulse-soft" />
                {eyebrow}
              </div>
            )}
            <h1 className="display font-extrabold leading-[0.98] tracking-[-1.4px] text-white text-[clamp(32px,5vw,56px)] mb-3.5">
              {title}
            </h1>
            {sub && (
              <p className="text-text-secondary font-light leading-relaxed text-[clamp(14px,1.4vw,16px)] max-w-[480px]">
                {sub}
              </p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-[clamp(18px,2.5vw,32px)] relative z-[2]">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-start">
                  <div
                    className={clsx(
                      'mono font-bold leading-none text-[clamp(20px,2.4vw,26px)]',
                      TONE_CLASS[s.tone ?? 'default'],
                    )}
                  >
                    {s.value}
                  </div>
                  <div className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted mt-1.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
