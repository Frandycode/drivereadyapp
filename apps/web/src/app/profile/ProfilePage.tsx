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
import { LogOut, User, Mail, Zap, Flame, Shield, Phone, CheckCircle, X, Lock, Trash2, Users, Copy, RefreshCw } from 'lucide-react'
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

export function ProfilePage() {
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

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Profile</h1>

        {/* Avatar + name */}
        <div className="flex items-center gap-4 bg-surface border border-border rounded-2xl p-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
            <User size={26} className="text-green-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate">{user.displayName}</p>
            <div className="flex items-center gap-1 text-text-secondary text-sm mt-0.5">
              <Mail size={13} />
              <span className="truncate">{user.email}</span>
              {user.emailVerified && <CheckCircle size={12} className="text-green-500 shrink-0" />}
            </div>
          </div>
        </div>

        {/* Email change */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">Email Address</span>
            </div>
            {emailStep === 'idle' && (
              <button
                onClick={() => { setEmailStep('enter-email'); setEmailError('') }}
                className="text-xs text-green-500 hover:text-green-400 transition-colors"
              >
                Change
              </button>
            )}
          </div>

          {emailStep === 'idle' && (
            <p className="text-sm text-text-secondary truncate">{user.email}</p>
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
              <p className="text-xs text-text-secondary">Enter the 6-digit code sent to {newEmail}</p>
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
                    className="w-10 h-12 text-center text-lg font-bold font-mono rounded-lg border-2 bg-bg text-text-primary focus:outline-none focus:border-green-500 transition-colors border-border"
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
            <p className="mt-2 text-sm text-green-500">Email updated to {newEmail}.</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
              <Zap size={15} />
              <span className="text-xs font-medium uppercase tracking-wide">XP</span>
            </div>
            <p className="font-display text-xl font-bold text-text-primary">{user.xpTotal.toLocaleString()}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
              <Flame size={15} />
              <span className="text-xs font-medium uppercase tracking-wide">Streak</span>
            </div>
            <p className="font-display text-xl font-bold text-text-primary">{user.streakDays}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <Shield size={15} />
              <span className="text-xs font-medium uppercase tracking-wide">Level</span>
            </div>
            <p className="font-display text-xl font-bold text-text-primary">{user.level}</p>
          </div>
        </div>

        {/* Phone verification */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">Phone Number</span>
            </div>
            {user.phoneVerified && (
              <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircle size={12} /> Verified
              </span>
            )}
          </div>

          {user.phoneVerified ? (
            <p className="text-sm text-text-secondary">{user.phoneNumber}</p>
          ) : phoneStep === 'idle' ? (
            <button
              onClick={() => setPhoneStep('enter-number')}
              className="mt-2 text-sm text-green-500 hover:text-green-400 transition-colors"
            >
              Add &amp; verify phone number
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
              <p className="text-xs text-text-secondary">Enter the code sent to {phoneNumber}</p>
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
                    className="w-10 h-12 text-center text-lg font-bold font-mono rounded-lg border-2 bg-bg text-text-primary focus:outline-none focus:border-green-500 transition-colors border-border"
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
            <p className="mt-2 text-sm text-green-500">Phone verified successfully!</p>
          )}
        </div>

        {/* Parent linking — learner generates invite code */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Family Link</span>
          </div>

          {/* Active parent links */}
          {(parentLinksData?.myParentLinks ?? [])
            .filter((l: { status: string }) => l.status === 'active')
            .map((l: { id: string; status: string }) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 mb-2">
                <span className="text-sm text-text-secondary">Parent linked</span>
                <button
                  onClick={() => handleRevokeLink(l.id)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}

          {/* Invite code */}
          {linkCode ? (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">Share this code with your parent. It expires in 24 hours.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-bg border border-border rounded-lg px-4 py-2 text-center">
                  <span className="font-mono text-2xl font-bold tracking-[0.3em] text-green-400">{linkCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary transition-colors"
                  title="Copy code"
                >
                  {linkCopyDone ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
                <button
                  onClick={handleGenerateLinkCode}
                  disabled={generating}
                  className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary transition-colors"
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
              className="text-sm text-green-500 hover:text-green-400 transition-colors"
            >
              {generating ? 'Generating...' : '+ Generate parent invite code'}
            </button>
          )}
        </div>

        {/* Change password */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <button
            onClick={() => { setShowChangePw((v) => !v); setPwError(''); setPwSuccess(false) }}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">Change Password</span>
            </div>
            <span className="text-xs text-text-secondary">{showChangePw ? 'Cancel' : 'Update'}</span>
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
              {pwSuccess && <p className="text-green-500 text-xs">Password updated.</p>}
              <button
                onClick={handleChangePassword}
                disabled={!currentPw || !newPw || !confirmPw || changingPw}
                className="btn-primary w-full h-10 text-sm"
              >
                {changingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          )}
        </div>

        {/* Delete account */}
        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <button
            onClick={() => { setShowDelete((v) => !v); setDeleteError('') }}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Trash2 size={15} className="text-red-400" />
              <span className="text-sm font-medium text-red-400">Delete Account</span>
            </div>
            <span className="text-xs text-text-secondary">{showDelete ? 'Cancel' : 'Manage'}</span>
          </button>

          {showDelete && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                This permanently deletes your account and all study data. Enter your password to confirm.
              </p>
              <input
                className="input border-red-500/40"
                type="password"
                placeholder="Your password"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
              />
              {deleteError && <p className="text-wrong text-xs">{deleteError}</p>}
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePw || deleting}
                className="w-full h-10 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete My Account'}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  )
}
