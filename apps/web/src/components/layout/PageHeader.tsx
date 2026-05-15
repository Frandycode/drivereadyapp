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
import { getVariantConfig, stripeCss, variantSlabFor, type Variant } from '@/lib/variants'
import { useTheme } from '@/lib/theme'

export type { Variant } from '@/lib/variants'

export interface PageStat {
  label: string
  value: ReactNode
  tone?: 'default' | 'gold' | 'orange' | 'green'
}

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  sub?: ReactNode
  stats?: PageStat[]
  variant?: Variant
  /** @deprecated Use `variant`. Temporary shim for legacy callsites. */
  slab?: 'orange' | 'yellow' | 'navy' | 'none'
  noStripe?: boolean
}

const TONE_CLASS: Record<NonNullable<PageStat['tone']>, string> = {
  default: 'text-cream',
  gold:    'text-yellow',
  orange:  'text-orange',
  green:   'text-correct',
}

export function PageHeader({
  eyebrow, title, sub, stats, variant, slab, noStripe,
}: PageHeaderProps) {
  const { resolved: theme } = useTheme()
  const resolved: Variant =
    variant ??
    (slab === 'yellow' ? 'solar' :
      slab === 'navy'  ? 'cobalt' :
      slab === 'none'  ? 'ember' :
                          'ember')
  const cfg = getVariantConfig(resolved)
  const slabBg = variantSlabFor(resolved, theme)

  return (
    <section className="relative overflow-hidden bg-bg blueprint-grid border-b border-cream/[0.08]">
      <div className="relative px-[var(--pad-x)] py-[clamp(48px,7vw,84px)] pb-[clamp(40px,5vw,56px)]">
        <div
          className={clsx(
            'absolute top-0 right-0 bottom-0 w-[36%] z-0 pointer-events-none opacity-95',
            'transition-[background] duration-200 ease-out',
            'before:content-[""] before:absolute before:inset-0',
            'before:bg-[linear-gradient(rgba(245,240,230,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(245,240,230,0.05)_1px,transparent_1px)]',
            'before:bg-[length:30px_30px]',
            'after:content-[""] after:absolute after:inset-0',
            'after:bg-[linear-gradient(90deg,rgba(14,17,48,0.35)_0%,transparent_30%)]',
          )}
          style={{
            clipPath: 'polygon(22% 0, 100% 0, 100% 100%, 0% 100%)',
            background: slabBg,
          }}
          aria-hidden="true"
        />

        {cfg.hasGloss && (
          <div
            className="absolute top-0 right-0 bottom-0 w-[36%] z-0 pointer-events-none bg-onyx-gloss animate-onyx-gloss"
            style={{ clipPath: 'polygon(22% 0, 100% 0, 100% 100%, 0% 100%)' }}
            aria-hidden="true"
          />
        )}

        {!noStripe && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] z-10 transition-[background] duration-200 ease-out"
            style={{ background: stripeCss(resolved) }}
            aria-hidden="true"
          />
        )}

        <div className="relative z-[2] max-w-[1200px] mx-auto flex flex-wrap items-end justify-between gap-8 animate-fade-up">
          <div className="flex-1 min-w-0 max-w-[640px]">
            {eyebrow && (
              <div
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full px-3.5 py-1 mb-5',
                  'text-[15px] font-medium tracking-[0.12em] uppercase',
                  cfg.neutralEyebrow
                    ? 'bg-cream/[0.05] border border-cream/[0.14] text-text-secondary'
                    : 'bg-orange-soft border border-orange/30 text-orange',
                )}
              >
                <span
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full animate-pulse-soft',
                    cfg.neutralEyebrow ? 'bg-text-secondary' : 'bg-orange',
                  )}
                />
                {eyebrow}
              </div>
            )}
            <h1 className="font-display font-extrabold leading-[0.98] tracking-[-1.4px] text-cream text-[clamp(45px,7vw,78px)] mb-3.5">
              {title}
            </h1>
            {sub && (
              <p className="text-text-secondary font-light leading-relaxed text-[clamp(20px,2vw,22px)] max-w-[480px]">
                {sub}
              </p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="flex flex-wrap items-center gap-[clamp(18px,2.5vw,32px)] relative z-[2]">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-start">
                  <div className={clsx('stat-balloon mono font-bold leading-none tabular-nums text-[clamp(31px,3.9vw,42px)]', TONE_CLASS[s.tone ?? 'default'])}>
                    {s.value}
                  </div>
                  <div className="mono text-[14px] tracking-[0.1em] uppercase text-text-muted mt-1.5">
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
