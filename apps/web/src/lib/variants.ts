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

export type Variant =
  | 'ember' | 'solar' | 'cobalt' | 'red' | 'chalk' | 'onyx'
  | 'green' | 'sunrise' | 'emberfall' | 'black' | 'flPink' | 'brown'

export const VARIANT_PRIORITY: readonly Variant[] = [
  'ember', 'solar', 'cobalt', 'red', 'chalk', 'onyx',
  'green', 'sunrise', 'emberfall', 'black', 'flPink', 'brown',
] as const

export interface VariantConfig {
  label: string
  /** Slab background: vintage tone, solid color or CSS gradient. */
  slabBackground: string
  /** In light theme some slabs invert: chalk to navy, cobalt to warmed-navy. */
  slabBackgroundLight: string | null
  /** Subtle onyx gloss overlay. */
  hasGloss: boolean
  /** Stripe outer-third colors echo the slab. Middle third always #021A54. */
  stripe: { left: string; right: string }
  /** Eyebrow chip should use neutral muted style. */
  neutralEyebrow: boolean
}

const NAVY_STRIPE_MID = '#021A54'

export const VARIANT_REGISTRY: Record<Variant, VariantConfig> = {
  ember:     { label: 'Ember (Terracotta)',   slabBackground: '#C75A3A',                                           slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#C75A3A', right: '#C75A3A' }, neutralEyebrow: false },
  solar:     { label: 'Solar (Mustard)',      slabBackground: '#D9B342',                                           slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#D9B342', right: '#D9B342' }, neutralEyebrow: false },
  cobalt:    { label: 'Cobalt (Slate denim)', slabBackground: '#3A5582',                                           slabBackgroundLight: '#1E2D5C', hasGloss: false, stripe: { left: '#3A5582', right: '#3A5582' }, neutralEyebrow: false },
  red:       { label: 'Red (Brick)',          slabBackground: '#963024',                                           slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#963024', right: '#963024' }, neutralEyebrow: true  },
  chalk:     { label: 'Chalk (Cream)',        slabBackground: '#F5F0E6',                                           slabBackgroundLight: '#1E2D5C', hasGloss: false, stripe: { left: '#F5F0E6', right: '#F5F0E6' }, neutralEyebrow: false },
  onyx:      { label: 'Onyx (Sepia)',         slabBackground: '#2A2520',                                           slabBackgroundLight: null,      hasGloss: true,  stripe: { left: '#2A2520', right: '#2A2520' }, neutralEyebrow: false },
  green:     { label: 'Green (Sage olive)',   slabBackground: '#5E7245',                                           slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#5E7245', right: '#5E7245' }, neutralEyebrow: false },
  sunrise:   { label: 'Sunrise',              slabBackground: 'linear-gradient(135deg, #C75A3A 0%, #D9B342 100%)', slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#C75A3A', right: '#D9B342' }, neutralEyebrow: false },
  emberfall: { label: 'Emberfall',            slabBackground: 'linear-gradient(135deg, #C75A3A 0%, #2A2520 100%)', slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#C75A3A', right: '#2A2520' }, neutralEyebrow: false },
  black:     { label: 'Black (Vintage ink)',  slabBackground: '#1A1612',                                           slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#1A1612', right: '#1A1612' }, neutralEyebrow: false },
  flPink:    { label: 'Fl. Pink (Rose)',      slabBackground: '#DC5A8E',                                           slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#DC5A8E', right: '#DC5A8E' }, neutralEyebrow: false },
  brown:     { label: 'Brown (Leather)',      slabBackground: '#7A5E3F',                                           slabBackgroundLight: null,      hasGloss: false, stripe: { left: '#7A5E3F', right: '#7A5E3F' }, neutralEyebrow: false },
}

export function getVariantConfig(v: Variant): VariantConfig {
  return VARIANT_REGISTRY[v]
}

export function variantSlabFor(v: Variant, theme: 'dark' | 'light'): string {
  const cfg = VARIANT_REGISTRY[v]
  if (theme === 'light' && cfg.slabBackgroundLight) return cfg.slabBackgroundLight
  return cfg.slabBackground
}

export function stripeCss(v: Variant): string {
  const { stripe } = VARIANT_REGISTRY[v]
  return (
    `linear-gradient(90deg, ` +
    `${stripe.left} 0 33.33%, ` +
    `${NAVY_STRIPE_MID} 33.33% 66.66%, ` +
    `${stripe.right} 66.66% 100%)`
  )
}
