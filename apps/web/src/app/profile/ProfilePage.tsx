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
import { useMutation, useQuery, gql, ApolloError } from '@apollo/client'
import { LogOut, User, Mail, Phone, CheckCircle, X, Lock, Trash2, Users, Copy, RefreshCw, Settings as SettingsIcon, Award, Flame, Target, ShieldCheck, Zap } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { useUserStore } from '@/stores'
import { clearAuthToken } from '@driveready/api-client'

const GENERATE_LINK_CODE = gql`
  mutation GenerateLinkCode {
    generateLinkCode
  }
`

const REVOKE_PARENT_LINK = gql`
  mutation RevokeParentLink($linkId: ID!) {
    revokeParentLink(linkId: $linkId)
  }
`

const MY_PARENT_LINKS = gql`
  query MyParentLinks {
    myParentLinks {
      id
      status
      linkCode
      linkCodeExpiresAt
    }
  }
`

const REQUEST_EMAIL_CHANGE = gql`
  mutation RequestEmailChange($newEmail: String!) {
    requestEmailChange(newEmail: $newEmail)
  }
`

const CONFIRM_EMAIL_CHANGE = gql`
  mutation ConfirmEmailChange($code: String!) {
    confirmEmailChange(code: $code)
  }
`

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`

const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String!) {
    deleteAccount(password: $password)
  }
`

const SEND_PHONE_OTP = gql`
  mutation SendPhoneOtp($input: SendPhoneOtpInput!) {
    sendPhoneOtp(input: $input)
  }
`

const VERIFY_PHONE_OTP = gql`
  mutation VerifyPhoneOtp($input: VerifyOtpInput!, $phoneNumber: String!) {
    verifyPhoneOtp(input: $input, phoneNumber: $phoneNumber)
  }
`

type PhoneStep = 'idle' | 'enter-number' | 'enter-code' | 'done'

interface ProfilePageProps {
  onNavigate?: (path: string) => void
}

export function ProfilePage({ onNavigate }: ProfilePageProps = {}) {
  const { user, clearUser, setUser } = useUserStore()

  // Email change
  type EmailStep = 'idle' | 'enter-email' | 'enter-code' | 'done'
  const [emailStep, setEmailStep]           = useState<EmailStep>('idle')
  const [newEmail, setNewEmail]             = useState('')
  const [emailDigits, setEmailDigits]       = useState(['', '', '', '', '', ''])
  const [emailError, setEmailError]         = useState('')
  const [requestEmailChange, { loading: requestingEmail }] = useMutation(REQUEST_EMAIL_CHANGE)
  const [confirmEmailChange, { loading: confirmingEmail }] = useMutation(CONFIRM_EMAIL_CHANGE)

  async function handleRequestEmailChange() {
    setEmailError('')
    try {
      await requestEmailChange({ variables: { newEmail } })
      setEmailDigits(['', '', '', '', '', ''])
      setEmailStep('enter-code')
    } catch (err: unknown) {
      if (err instanceof ApolloError) setEmailError(err.graphQLErrors[0]?.message ?? 'Could not send code.')
    }
  }

  async function handleConfirmEmailChange() {
    const code = emailDigits.join('')
    if (code.length < 6) { setEmailError('Please enter all 6 digits.'); return }
    setEmailError('')
    try {
      await confirmEmailChange({ variables: { code } })
      if (user) setUser({ ...user, email: newEmail, emailVerified: true })
      setEmailStep('done')
    } catch (err: unknown) {
      if (err instanceof ApolloError) setEmailError(err.graphQLErrors[0]?.message ?? 'Incorrect code.')
    }
  }

  function handleEmailDigit(index: number, value: string) {
    const digit = value.replace(/\D/, '').slice(-1)
    const next = [...emailDigits]; next[index] = digit; setEmailDigits(next)
    if (digit && index < 5) document.getElementById(`ec-otp-${index + 1}`)?.focus()
  }

  function handleEmailKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !emailDigits[index] && index > 0)
      document.getElementById(`ec-otp-${index - 1}`)?.focus()
  }

  // Change password
  const [showChangePw, setShowChangePw]   = useState(false)
  const [currentPw, setCurrentPw]         = useState('')
  const [newPw, setNewPw]                 = useState('')
  const [confirmPw, setConfirmPw]         = useState('')
  const [pwError, setPwError]             = useState('')
  const [pwSuccess, setPwSuccess]         = useState(false)

  // Delete account
  const [showDelete, setShowDelete]       = useState(false)
  const [deletePw, setDeletePw]           = useState('')
  const [deleteError, setDeleteError]     = useState('')

  // Parent linking (learner side)
  const [linkCode, setLinkCode]             = useState<string | null>(null)
  const [linkCopyDone, setLinkCopyDone]     = useState(false)
  const [generateLinkCode, { loading: generating }] = useMutation(GENERATE_LINK_CODE)
  const [revokeParentLink]                          = useMutation(REVOKE_PARENT_LINK)
  const { data: parentLinksData, refetch: refetchLinks } = useQuery(MY_PARENT_LINKS, { fetchPolicy: 'network-only' })

  async function handleGenerateLinkCode() {
    const { data } = await generateLinkCode()
    setLinkCode(data?.generateLinkCode ?? null)
    refetchLinks()
  }

  async function handleCopyCode() {
    if (!linkCode) return
    await navigator.clipboard.writeText(linkCode)
    setLinkCopyDone(true)
    setTimeout(() => setLinkCopyDone(false), 2000)
  }

  async function handleRevokeLink(linkId: string) {
    await revokeParentLink({ variables: { linkId } })
    if (linkCode) setLinkCode(null)
    refetchLinks()
  }

  const [changePassword, { loading: changingPw }]   = useMutation(CHANGE_PASSWORD)
  const [deleteAccount,  { loading: deleting   }]   = useMutation(DELETE_ACCOUNT)

  async function handleChangePassword() {
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    try {
      await changePassword({ variables: { currentPassword: currentPw, newPassword: newPw } })
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setShowChangePw(false); setPwSuccess(false) }, 1500)
    } catch (err: unknown) {
      if (err instanceof ApolloError) setPwError(err.graphQLErrors[0]?.message ?? 'Could not update password.')
    }
  }

  async function handleDeleteAccount() {
    setDeleteError('')
    try {
      await deleteAccount({ variables: { password: deletePw } })
      clearAuthToken()
      clearUser()
    } catch (err: unknown) {
      if (err instanceof ApolloError) setDeleteError(err.graphQLErrors[0]?.message ?? 'Could not delete account.')
    }
  }

  // Phone verification flow
  const [phoneStep, setPhoneStep]   = useState<PhoneStep>('idle')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneDigits, setPhoneDigits] = useState(['', '', '', '', '', ''])
  const [phoneError, setPhoneError]   = useState('')

  const [sendPhoneOtp,   { loading: sending   }] = useMutation(SEND_PHONE_OTP)
  const [verifyPhoneOtp, { loading: verifying }] = useMutation(VERIFY_PHONE_OTP)

  function handleLogout() {
    clearAuthToken()
    clearUser()
  }

  async function handleSendPhoneOtp() {
    setPhoneError('')
    try {
      await sendPhoneOtp({ variables: { input: { phoneNumber } } })
      setPhoneDigits(['', '', '', '', '', ''])
      setPhoneStep('enter-code')
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        setPhoneError(err.graphQLErrors[0]?.message ?? 'Could not send code.')
      }
    }
  }

  async function handleVerifyPhoneOtp() {
    const code = phoneDigits.join('')
    if (code.length < 6) { setPhoneError('Please enter all 6 digits.'); return }
    setPhoneError('')
    try {
      await verifyPhoneOtp({ variables: { input: { code }, phoneNumber } })
      if (user) setUser({ ...user, phoneVerified: true, phoneNumber })
      setPhoneStep('done')
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        setPhoneError(err.graphQLErrors[0]?.message ?? 'Incorrect code.')
      }
    }
  }

  function handlePhoneDigit(index: number, value: string) {
    const digit = value.replace(/\D/, '').slice(-1)
    const next = [...phoneDigits]
    next[index] = digit
    setPhoneDigits(next)
    if (digit && index < 5) document.getElementById(`phone-otp-${index + 1}`)?.focus()
  }

  function handlePhoneKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !phoneDigits[index] && index > 0) {
      document.getElementById(`phone-otp-${index - 1}`)?.focus()
    }
  }

  if (!user) return null

  const firstName = (user.displayName ?? '').split(' ')[0] || 'there'
  const initials = (user.displayName ?? user.email ?? 'DR')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const level = Number(user.level) || 1
  const xpTotal = Number(user.xpTotal) || 0
  const levelGoal = Math.max(1000, (level + 1) * 1000)
  const levelProgress = Math.min(94, Math.max(8, Math.round((xpTotal / levelGoal) * 100)))
  const xpRemaining = Math.max(0, levelGoal - xpTotal)
  const readiness = Math.min(96, Math.max(48, 58 + level * 4 + Math.min(18, user.streakDays)))
  const achievements = [
    { name: 'First Steps', condition: 'Finished Chapter 1', Icon: CheckCircle, unlocked: true, tone: 'text-green border-green/30 bg-green-soft' },
    { name: 'Streak Spark', condition: '7-day study streak', Icon: Flame, unlocked: user.streakDays >= 7, tone: 'text-orange border-orange/30 bg-orange-soft' },
    { name: 'Pop Quiz Champ', condition: 'Passed an end-of-chapter quiz', Icon: Award, unlocked: true, tone: 'text-yellow border-yellow-rim bg-yellow-soft' },
    { name: 'Precision Driver', condition: 'Quiz score at least 95%', Icon: Target, unlocked: false, tone: 'text-text-muted border-border bg-white/[0.04]' },
    { name: 'Battle Ready', condition: 'Win a battle session', Icon: ShieldCheck, unlocked: false, tone: 'text-text-muted border-border bg-white/[0.04]' },
    { name: 'Blitz Master', condition: '12+ cards in 60 seconds', Icon: Zap, unlocked: false, tone: 'text-text-muted border-border bg-white/[0.04]' },
  ]
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length
  const sessionHistory = [
    { date: 'Latest', mode: 'Quiz', topic: 'Permit practice', score: `${readiness}%`, xp: '+120', tone: 'text-green' },
    { date: 'Recent', mode: 'Drill', topic: 'Weak spots deck', score: 'Focused', xp: '+80', tone: 'text-yellow' },
    { date: 'Recent', mode: 'Study', topic: 'Saved cards', score: 'Reviewed', xp: '+45', tone: 'text-orange' },
  ]

  return (
    <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
      <PageHeader
        eyebrow="Account · profile"
        title={
          <>
            Hey, <em className="not-italic text-orange">{firstName}.</em>
          </>
        }
        sub="Email, phone, family link, password — your account in one place."
        stats={[
          { label: 'XP',     value: user.xpTotal.toLocaleString(), tone: 'gold' },
          { label: 'Streak', value: user.streakDays,               tone: 'orange' },
          { label: 'Level',  value: user.level,                    tone: 'green' },
        ]}
        slab="orange"
      />

      <div className="bg-navy blueprint-grid">
        <div className="max-w-dashboard mx-auto px-[var(--pad-x)] py-10 pb-14 space-y-8">

        <section className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-surface-2 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center relative overflow-hidden">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-orange/10 blur-3xl" aria-hidden="true" />
          <div className="relative grid h-[90px] w-[90px] place-items-center rounded-full bg-[linear-gradient(135deg,#F45B26,#F8DE22)] font-display text-3xl font-extrabold text-navy-deep shadow-[0_18px_50px_rgba(244,91,38,0.20)]">
            {initials}
          </div>
          <div className="relative min-w-0">
            <div className="font-display text-[clamp(28px,3.4vw,40px)] font-extrabold leading-tight text-cream">
              {user.displayName}
            </div>
            <div className="mono mt-1 truncate text-[12px] text-text-muted">
              {user.email} · {user.stateCode?.toUpperCase() ?? 'OK'} permit prep
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip chip-yellow"><span className="chip-dot bg-yellow" />Level {level}</span>
              <span className="chip chip-orange"><span className="chip-dot bg-orange" />{user.streakDays} day streak</span>
              <span className="chip chip-green"><span className="chip-dot bg-green" />{readiness}% ready</span>
            </div>
          </div>
          <div className="relative lg:text-right">
            <div className="mono text-[48px] font-bold leading-none text-yellow">{String(level).padStart(2, '0')}</div>
            <div className="font-display text-sm font-bold text-cream">Road Reader</div>
            <div className="mono mt-1 text-[11px] text-text-muted">{xpTotal.toLocaleString()} / {levelGoal.toLocaleString()} XP</div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface-2 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="font-display text-base font-bold text-cream">Progress to next level</div>
            <div className="mono text-[12px] text-text-muted"><strong className="text-yellow">{xpRemaining.toLocaleString()} XP</strong> to go</div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#F45B26,#F8DE22)]" style={{ width: `${levelProgress}%` }} />
          </div>
        </section>

        <section>
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-yellow">
              <span className="w-[18px] h-[1.5px] rounded-full bg-yellow" />
              Achievements
            </div>
            <h2 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold text-cream">{unlockedCount} of {achievements.length} unlocked.</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {achievements.map(({ name, condition, Icon, unlocked, tone }) => (
              <div key={name} className={`card card-hover p-4 text-center ${unlocked ? '' : 'opacity-55'}`}>
                <div className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border ${tone}`}>
                  <Icon size={20} />
                </div>
                <div className="font-display text-sm font-bold text-cream">{name}</div>
                <div className="mt-1 text-[11px] leading-snug text-text-muted">{condition}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-green">
              <span className="w-[18px] h-[1.5px] rounded-full bg-green" />
              Recent sessions
            </div>
            <h2 className="font-display text-[clamp(24px,3vw,32px)] font-extrabold text-cream">Your latest work.</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
            <table className="history-tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Topic</th>
                  <th>Score</th>
                  <th>XP</th>
                </tr>
              </thead>
              <tbody>
                {sessionHistory.map((row) => (
                  <tr key={`${row.date}-${row.mode}-${row.topic}`}>
                    <td data-label="Date" className="mono">{row.date}</td>
                    <td data-label="Mode">{row.mode}</td>
                    <td data-label="Topic">{row.topic}</td>
                    <td data-label="Score" className={`mono font-bold ${row.tone}`}>{row.score}</td>
                    <td data-label="XP" className="mono">{row.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Account security
          </div>
        </div>

        {/* Avatar + name + Settings */}
        <div className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, #F8DE22 0 33.33%, #021A54 33.33% 66.66%, #F45B26 66.66% 100%)',
            }}
          />
          <div className="w-14 h-14 rounded-md bg-orange-soft border border-orange/30 flex items-center justify-center shrink-0">
            <User size={26} className="text-orange" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="display font-bold text-base text-white truncate">{user.displayName}</p>
            <div className="flex items-center gap-1 text-text-secondary text-[13px] mt-0.5">
              <Mail size={12} />
              <span className="truncate">{user.email}</span>
              {user.emailVerified && <CheckCircle size={12} className="text-correct shrink-0" />}
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('/settings')}
              className="p-2 rounded-md text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors flex-shrink-0"
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>
          )}
        </div>

        {/* Email change */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <Mail size={11} />
              Email address
            </div>
            {emailStep === 'idle' && (
              <button
                onClick={() => { setEmailStep('enter-email'); setEmailError('') }}
                className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-orange hover:text-yellow transition-colors"
              >
                Change
              </button>
            )}
          </div>

          {emailStep === 'idle' && (
            <p className="text-[14px] text-text-secondary truncate">{user.email}</p>
          )}

          {emailStep === 'enter-email' && (
            <div className="mt-3 space-y-3">
              <input
                className="input"
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoFocus
              />
              {emailError && <p className="text-wrong text-xs">{emailError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleRequestEmailChange}
                  disabled={!newEmail || requestingEmail}
                  className="btn-primary flex-1 h-10 text-sm"
                >
                  {requestingEmail ? 'Sending...' : 'Send Code'}
                </button>
                <button
                  onClick={() => { setEmailStep('idle'); setEmailError('') }}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {emailStep === 'enter-code' && (
            <div className="mt-3 space-y-3">
              <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted">Enter the 6-digit code sent to {newEmail}</p>
              <div className="flex gap-2">
                {emailDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`ec-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleEmailDigit(i, e.target.value)}
                    onKeyDown={(e) => handleEmailKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-10 h-12 text-center mono text-lg font-bold tabular-nums rounded-md border-2 bg-bg text-white focus:outline-none focus:border-orange transition-colors border-border"
                  />
                ))}
              </div>
              {emailError && <p className="text-wrong text-xs">{emailError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmEmailChange}
                  disabled={emailDigits.some((d) => !d) || confirmingEmail}
                  className="btn-primary flex-1 h-10 text-sm"
                >
                  {confirmingEmail ? 'Verifying...' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setEmailStep('enter-email'); setEmailError('') }}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {emailStep === 'done' && (
            <p className="mt-2 text-[13px] text-correct">Email updated to {newEmail}.</p>
          )}
        </div>

        {/* Phone verification */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <Phone size={11} />
              Phone number
            </div>
            {user.phoneVerified && (
              <span className="inline-flex items-center gap-1 mono text-[10px] tracking-[0.1em] uppercase font-semibold text-correct">
                <CheckCircle size={11} /> Verified
              </span>
            )}
          </div>

          {user.phoneVerified ? (
            <p className="text-[14px] text-text-secondary">{user.phoneNumber}</p>
          ) : phoneStep === 'idle' ? (
            <button
              onClick={() => setPhoneStep('enter-number')}
              className="mt-1 mono text-[11px] tracking-[0.1em] uppercase font-semibold text-orange hover:text-yellow transition-colors"
            >
              + Add &amp; verify phone number
            </button>
          ) : phoneStep === 'enter-number' ? (
            <div className="mt-3 space-y-3">
              <input
                className="input"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              {phoneError && (
                <p className="text-wrong text-xs">{phoneError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSendPhoneOtp}
                  disabled={!phoneNumber || sending}
                  className="btn-primary flex-1 h-10 text-sm"
                >
                  {sending ? 'Sending...' : 'Send Code'}
                </button>
                <button
                  onClick={() => { setPhoneStep('idle'); setPhoneError('') }}
                  className="p-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ) : phoneStep === 'enter-code' ? (
            <div className="mt-3 space-y-3">
              <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted">Enter the code sent to {phoneNumber}</p>
              <div className="flex gap-2">
                {phoneDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`phone-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePhoneDigit(i, e.target.value)}
                    onKeyDown={(e) => handlePhoneKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-10 h-12 text-center mono text-lg font-bold tabular-nums rounded-md border-2 bg-bg text-white focus:outline-none focus:border-orange transition-colors border-border"
                  />
                ))}
              </div>
              {phoneError && <p className="text-wrong text-xs">{phoneError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleVerifyPhoneOtp}
                  disabled={phoneDigits.some((d) => !d) || verifying}
                  className="btn-primary flex-1 h-10 text-sm"
                >
                  {verifying ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  onClick={() => { setPhoneStep('enter-number'); setPhoneError('') }}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-correct">Phone verified successfully!</p>
          )}
        </div>

        {/* Parent linking — learner generates invite code */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <Users size={11} />
            Family link
          </div>

          {/* Active parent links */}
          {(parentLinksData?.myParentLinks ?? [])
            .filter((l: { status: string }) => l.status === 'active')
            .map((l: { id: string; status: string }) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0 mb-2">
                <span className="text-[13px] text-text-secondary">Parent linked</span>
                <button
                  onClick={() => handleRevokeLink(l.id)}
                  className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-wrong/80 hover:text-wrong transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}

          {/* Invite code */}
          {linkCode ? (
            <div className="space-y-2">
              <p className="mono text-[10px] tracking-[0.1em] uppercase text-text-muted">Share this code with your parent. It expires in 24 hours.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-bg border border-orange/30 rounded-md px-4 py-2 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange" />
                  <span className="mono text-2xl font-bold tracking-[0.3em] text-orange tabular-nums">{linkCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-md border border-border text-text-secondary hover:text-white hover:border-orange/40 transition-colors"
                  title="Copy code"
                >
                  {linkCopyDone ? <CheckCircle size={18} className="text-correct" /> : <Copy size={18} />}
                </button>
                <button
                  onClick={handleGenerateLinkCode}
                  disabled={generating}
                  className="p-2 rounded-md border border-border text-text-secondary hover:text-white hover:border-orange/40 transition-colors"
                  title="Generate new code"
                >
                  <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateLinkCode}
              disabled={generating}
              className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-orange hover:text-yellow transition-colors"
            >
              {generating ? 'Generating…' : '+ Generate parent invite code'}
            </button>
          )}
        </div>

        {/* Change password */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <button
            onClick={() => { setShowChangePw((v) => !v); setPwError(''); setPwSuccess(false) }}
            className="w-full flex items-center justify-between"
          >
            <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <Lock size={11} />
              Change password
            </div>
            <span className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-text-secondary">
              {showChangePw ? 'Cancel' : 'Update'}
            </span>
          </button>

          {showChangePw && (
            <div className="mt-4 space-y-3">
              <input
                className="input"
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
              />
              <input
                className="input"
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <input
                className="input"
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
              />
              {pwError   && <p className="text-wrong text-xs">{pwError}</p>}
              {pwSuccess && <p className="text-correct text-xs">Password updated.</p>}
              <button
                onClick={handleChangePassword}
                disabled={!currentPw || !newPw || !confirmPw || changingPw}
                className="btn-primary w-full h-11 text-sm font-semibold"
              >
                {changingPw ? 'Updating…' : 'Update password'}
              </button>
            </div>
          )}
        </div>

        {/* Delete account */}
        <div className="bg-surface border border-wrong/30 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-wrong" />
          <button
            onClick={() => { setShowDelete((v) => !v); setDeleteError('') }}
            className="w-full flex items-center justify-between mt-1"
          >
            <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-wrong">
              <Trash2 size={11} />
              Delete account
            </div>
            <span className="mono text-[11px] tracking-[0.1em] uppercase font-semibold text-text-secondary">
              {showDelete ? 'Cancel' : 'Manage'}
            </span>
          </button>

          {showDelete && (
            <div className="mt-4 space-y-3">
              <p className="text-[12px] text-text-secondary leading-relaxed">
                This permanently deletes your account and all study data. Enter your password to confirm.
              </p>
              <input
                className="input border-wrong/40"
                type="password"
                placeholder="Your password"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
              />
              {deleteError && <p className="text-wrong text-xs">{deleteError}</p>}
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePw || deleting}
                className="w-full h-11 rounded-md bg-wrong/15 border border-wrong/40 text-wrong hover:bg-wrong hover:text-white active:scale-95 transition-all text-sm font-semibold"
              >
                {deleting ? 'Deleting…' : 'Permanently delete my account'}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-md border border-wrong/40 text-wrong hover:bg-wrong/10 hover:text-white transition-all text-sm font-semibold"
        >
          <LogOut size={16} />
          Log out
        </button>

        </section>

        </div>
      </div>
    </PageWrapper>
  )
}
