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
import {
  FiUser,
  FiMail,
  FiSmartphone,
  FiHelpCircle,
  FiMonitor,
  FiMoon,
  FiSun,
  FiSliders,
  FiType,
  FiLogOut,
  FiTrash2,
  FiChevronRight,
} from 'react-icons/fi'
import { useUserStore } from '@/stores'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageHeader } from '@/components/layout/PageHeader'

interface SettingsPageProps {
  onNavigate: (path: string) => void
  onOpenTutorial: () => void
  onSignOut: () => void
  onDeleteAccount: () => void
}

export function SettingsPage({
  onNavigate,
  onOpenTutorial,
  onSignOut,
  onDeleteAccount,
}: SettingsPageProps) {
  const user = useUserStore((s) => s.user)
  const theme = useUserStore((s) => s.theme)
  const setTheme = useUserStore((s) => s.setTheme)
  const displayFontScale = useUserStore((s) => s.displayFontScale)
  const displayBrightness = useUserStore((s) => s.displayBrightness)
  const setDisplayFontScale = useUserStore((s) => s.setDisplayFontScale)
  const setDisplayBrightness = useUserStore((s) => s.setDisplayBrightness)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await onSignOut()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
      <PageHeader
        eyebrow="Preferences"
        title={<>Make it <em className="not-italic text-orange">yours.</em></>}
        sub="Account, appearance, accessibility, and session controls. Display comfort settings save automatically."
        stats={[
          { label: 'Theme', value: theme === 'system' ? 'Auto' : theme, tone: 'gold' },
          { label: 'Font', value: `${Math.round(displayFontScale * 100)}%` },
          { label: 'Bright', value: `${Math.round(displayBrightness * 100)}%`, tone: 'orange' },
        ]}
        slab="navy"
      />

      <div className="bg-navy blueprint-grid">
        <div className="max-w-dashboard mx-auto px-[var(--pad-x)] py-10 pb-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr] lg:gap-10">
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="flex gap-1.5 overflow-x-auto border-b border-border pb-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:pb-0">
                {[
                  { label: 'Account', Icon: FiUser },
                  { label: 'Appearance', Icon: FiSun },
                  { label: 'Display', Icon: FiType },
                  { label: 'Session', Icon: FiLogOut },
                  { label: 'Privacy', Icon: FiTrash2 },
                ].map(({ label, Icon }, index) => (
                  <a
                    key={label}
                    href={`#settings-${label.toLowerCase()}`}
                    className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2.5 text-sm transition-colors whitespace-nowrap ${
                      index === 0 ? 'border border-orange/30 bg-orange-soft text-cream' : 'text-text-secondary hover:bg-surface-2 hover:text-cream'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </a>
                ))}
              </div>
            </aside>

            <div className="space-y-6">
              <Section id="settings-account" label="Account" sub="Basic profile information used across DriveReady.">
                <RowReadOnly Icon={FiUser}       label="Display name" value={user?.displayName ?? '—'} />
                <RowReadOnly Icon={FiMail}       label="Email"        value={user?.email ?? '—'} />
                <RowReadOnly Icon={FiSmartphone} label="Phone"        value={user?.phoneNumber ?? 'Not set'} />
                <RowButton
                  Icon={FiHelpCircle}
                  label="View onboarding tutorial"
                  sub="Walk through how DriveReady works"
                  onClick={onOpenTutorial}
                />
                <RowButton
                  Icon={FiUser}
                  label="Parent dashboard"
                  sub="View linked child progress and weekly activity"
                  onClick={() => onNavigate('/parent')}
                />
              </Section>

              <Section id="settings-appearance" label="Appearance" sub="Pick the theme that feels right for your screen.">
                <div className="px-4 py-4 border-b border-border last:border-b-0 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-cream">Theme</div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        Follow your device or choose a fixed look.
                      </div>
                    </div>
                    <div className="segmented">
                      {[
                        { id: 'system' as const, label: 'System', Icon: FiMonitor },
                        { id: 'light' as const, label: 'Light', Icon: FiSun },
                        { id: 'dark' as const, label: 'Dark', Icon: FiMoon },
                      ].map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          onClick={() => setTheme(id)}
                          className={theme === id ? 'seg-btn seg-btn-active' : 'seg-btn'}
                          aria-pressed={theme === id}
                        >
                          <Icon size={14} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <Section id="settings-display" label="Display" sub="Tune text and brightness without changing the page-title design scale.">
                <RangeRow
                  Icon={FiType}
                  label="Font size"
                  sub="Adjust body and UI text. Page titles keep the DriveReady design scale."
                  min={0.95}
                  max={1.15}
                  step={0.01}
                  value={displayFontScale}
                  valueText={`${Math.round(displayFontScale * 100)}%`}
                  onChange={setDisplayFontScale}
                />
                <RangeRow
                  Icon={FiSun}
                  label="Brightness"
                  sub="Soften or brighten the full app for your screen and environment."
                  min={0.92}
                  max={1.08}
                  step={0.01}
                  value={displayBrightness}
                  valueText={`${Math.round(displayBrightness * 100)}%`}
                  onChange={setDisplayBrightness}
                />
                <RowButton
                  Icon={FiSliders}
                  label="Reset display"
                  sub="Return font size and brightness to the DriveReady default"
                  onClick={() => {
                    setDisplayFontScale(1)
                    setDisplayBrightness(1)
                  }}
                />
              </Section>

              <Section id="settings-session" label="Session" sub="Manage this device session.">
                <RowButton
                  Icon={FiLogOut}
                  label={signingOut ? 'Signing out…' : 'Sign out'}
                  sub="End your session on this device"
                  onClick={handleSignOut}
                  disabled={signingOut}
                />
              </Section>

              <Section id="settings-privacy" label="Privacy" sub="Permanent account actions." tone="danger">
                <RowButton
                  Icon={FiTrash2}
                  label="Delete account"
                  sub="Permanently remove your data"
                  onClick={onDeleteAccount}
                  tone="danger"
                />
              </Section>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface SectionProps {
  id?: string
  label: string
  sub?: string
  tone?: 'default' | 'danger'
  children: React.ReactNode
}

function Section({ id, label, sub, tone = 'default', children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-32 rounded-lg border border-border bg-surface-2 p-5 sm:p-6">
      <div className="mb-5">
        <h2 className={`font-display text-lg font-extrabold ${tone === 'danger' ? 'text-wrong' : 'text-cream'}`}>
          {label}
        </h2>
        {sub && <p className="mt-1 text-xs leading-relaxed text-text-muted">{sub}</p>}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {children}
      </div>
    </section>
  )
}

interface RowProps {
  Icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  sub?: string
  value?: string
}

function RowReadOnly({ Icon, label, value }: RowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0 sm:px-5">
      <Icon size={16} className="text-text-secondary flex-shrink-0" />
      <span className="text-sm text-text-secondary flex-1">{label}</span>
      <span className="text-sm text-cream max-w-[55%] truncate text-right">{value ?? '—'}</span>
    </div>
  )
}

interface RowButtonProps extends RowProps {
  sub?: string
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'danger'
}

function RowButton({ Icon, label, sub, onClick, disabled, tone = 'default' }: RowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-border last:border-b-0 transition-colors sm:px-5 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-3'
      } ${tone === 'danger' ? 'text-wrong' : 'text-cream'}`}
    >
      <Icon
        size={16}
        className={`flex-shrink-0 ${tone === 'danger' ? 'text-wrong' : 'text-text-secondary'}`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="text-xs text-text-secondary mt-0.5">{sub}</div>}
      </div>
      <FiChevronRight size={16} className="text-text-muted flex-shrink-0" />
    </button>
  )
}

interface RangeRowProps {
  Icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  sub?: string
  min: number
  max: number
  step: number
  value: number
  valueText: string
  onChange: (value: number) => void
}

function RangeRow({
  Icon,
  label,
  sub,
  min,
  max,
  step,
  value,
  valueText,
  onChange,
}: RangeRowProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4 border-b border-border last:border-b-0 sm:flex-row sm:items-center sm:px-5">
      <Icon size={16} className="text-text-secondary flex-shrink-0 hidden sm:block" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-cream">{label}</div>
          <div className="mono text-[11px] text-yellow tabular-nums">{valueText}</div>
        </div>
        {sub && <div className="text-xs text-text-secondary mt-0.5">{sub}</div>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="display-range w-full sm:w-[190px]"
        aria-label={label}
      />
    </div>
  )
}
