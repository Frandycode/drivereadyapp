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
 *
 * TEMPORARY - deleted at end of Phase 11. Visit /__variantPreview to inspect
 * every vintage variant in isolation.
 */

import { PageHeader } from '@/components/layout/PageHeader'
import { VARIANT_PRIORITY, getVariantConfig } from '@/lib/variants'

export function VariantPreviewPage() {
  return (
    <div className="min-h-dvh bg-bg">
      {VARIANT_PRIORITY.map((v) => {
        const cfg = getVariantConfig(v)
        return (
          <div key={v}>
            <PageHeader
              variant={v}
              eyebrow={`Variant preview · ${cfg.label}`}
              title={<>{cfg.label} <em>variant.</em></>}
              sub="Used to verify slab fill, stripe colors, and brand-accent contrast."
              stats={[
                { label: 'XP',        value: '3,420', tone: 'gold' },
                { label: 'Streak',    value: '14' },
                { label: 'Readiness', value: '72%',   tone: 'orange' },
              ]}
            />
            <div className="h-8 bg-bg" />
          </div>
        )
      })}
    </div>
  )
}
