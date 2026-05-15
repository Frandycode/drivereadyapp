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
  FiArrowLeft,
  FiUser,
  FiMail,
  FiSmartphone,
  FiHelpCircle,
  FiSun,
  FiSliders,
  FiType,
  FiLogOut,
  FiTrash2,
  FiChevronRight,
} from 'react-icons/fi'
import { useUserStore } from '@/stores'
import { PageWrapper } from '@/components/layout/PageWrapper'

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

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => onNavigate('/profile')}
        className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors"
        aria-label="Back"
      >
        <FiArrowLeft size={20} />
      </button>
      <h1 className="display font-bold text-base text-white">Settings</h1>
    </div>
  )

  return (
    <PageWrapper header={header} onNavigate={onNavigate}>
      <div className="space-y-6 py-2">
        {/* ── Profile ──────────────────────────────────────────────── */}
        <Section label="Profile">
          <RowReadOnly Icon={FiUser}       label="Display name" value={user?.displayName ?? '—'} />
          <RowReadOnly Icon={FiMail}       label="Email"        value={user?.email ?? '—'} />
          <RowReadOnly Icon={FiSmartphone} label="Phone"        value={user?.phoneNumber ?? 'Not set'} />
        </Section>

        {/* ── Account ──────────────────────────────────────────────── */}
        <Section label="Account">
          <RowButton
            Icon={FiHelpCircle}
            label="View onboarding tutorial"
            sub="Walk through how DriveReady works"
            onClick={onOpenTutorial}
          />
        </Section>

        {/* ── Display ──────────────────────────────────────────────── */}
        <Section label="Display">
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

        {/* ── Session ──────────────────────────────────────────────── */}
        <Section label="Session">
          <RowButton
            Icon={FiLogOut}
            label={signingOut ? 'Signing out…' : 'Sign out'}
            sub="End your session on this device"
            onClick={handleSignOut}
            disabled={signingOut}
          />
        </Section>

        {/* ── Danger zone ──────────────────────────────────────────── */}
        <Section label="Danger zone" tone="danger">
          <RowButton
            Icon={FiTrash2}
            label="Delete account"
            sub="Permanently remove your data"
            onClick={onDeleteAccount}
            tone="danger"
          />
        </Section>
      </div>
    </PageWrapper>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface SectionProps {
  label: string
  tone?: 'default' | 'danger'
  children: React.ReactNode
}

function Section({ label, tone = 'default', children }: SectionProps) {
  return (
    <section>
      <h2
        className={`text-[11px] font-semibold uppercase tracking-[0.13em] mb-2 px-1 ${
          tone === 'danger' ? 'text-wrong' : 'text-text-muted'
        }`}
      >
        {label}
      </h2>
      <div className="bg-surface-2 border border-border rounded-lg overflow-hidden">
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
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      <Icon size={16} className="text-text-secondary flex-shrink-0" />
      <span className="text-sm text-text-secondary flex-1">{label}</span>
      <span className="text-sm text-white max-w-[55%] truncate text-right">{value ?? '—'}</span>
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
      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border last:border-b-0 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-3'
      } ${tone === 'danger' ? 'text-wrong' : 'text-white'}`}
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
    <div className="flex flex-col gap-3 px-4 py-4 border-b border-border last:border-b-0 sm:flex-row sm:items-center">
      <Icon size={16} className="text-text-secondary flex-shrink-0 hidden sm:block" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-white">{label}</div>
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
