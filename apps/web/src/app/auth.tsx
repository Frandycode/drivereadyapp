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

import { useState, useRef } from 'react'
import { useMutation, gql, ApolloError } from '@apollo/client'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { setAuthToken } from '@driveready/api-client'
import { useUserStore } from '@/stores'
import { AppLogo } from '@/components/layout/AppLogo'
import { Check, X, AlertTriangle, Clock, Eye, EyeOff } from 'lucide-react'
import { FiMail, FiLock, FiUser, FiPhone, FiCalendar, FiArrowRight } from 'react-icons/fi'
import { AuthLayout } from '@/app/auth/AuthLayout'
import { AuthModeToggle } from '@/app/auth/AuthModeToggle'
import { AuthField } from '@/app/auth/AuthField'

const HCAPTCHA_SITE_KEY =
  import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? '10000000-ffff-ffff-ffff-000000000001'

// ── Password rules ────────────────────────────────────────────────────────────

const SPECIAL = /[#$&!*\-]/
const RULES = [
  { label: 'At least 8 characters',               test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter',                     test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',                     test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number',                               test: (p: string) => /\d/.test(p) },
  { label: 'Special character  # $ & ! * -',      test: (p: string) => SPECIAL.test(p) },
  { label: 'No 3+ identical characters in a row', test: (p: string) => !/(.)\1\1/.test(p) },
]

function passwordValid(p: string) {
  return RULES.every((r) => r.test(p))
}

// ── Age helpers ───────────────────────────────────────────────────────────────

function calcAge(year: number, month: number): number {
  const today = new Date()
  let age = today.getFullYear() - year
  // Use first of birth month as conservative estimate
  if (today.getMonth() + 1 < month) age -= 1
  return age
}

type AgeGroup = 'under13' | 'minor' | 'adult' | null

function getAgeGroup(year: number, month: number): AgeGroup {
  if (!year || !month) return null
  const age = calcAge(year, month)
  if (age < 13) return 'under13'
  if (age < 18) return 'minor'
  return 'adult'
}

// ── GraphQL ───────────────────────────────────────────────────────────────────

const USER_FIELDS = `id email displayName role stateCode xpTotal level streakDays freezeTokens emailVerified phoneNumber phoneVerified`

const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      pendingToken
      email
      expiresAt
    }
  }
`

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      consentStatus
      emailVerified
      requiresLegalConsent
      legalVersions { tosVersion privacyVersion }
      user { ${USER_FIELDS} }
    }
  }
`

const COMPLETE_SIGNUP = gql`
  mutation CompleteSignup($input: CompleteSignupInput!) {
    completeSignup(input: $input) {
      accessToken
      consentStatus
      emailVerified
      requiresLegalConsent
      legalVersions { tosVersion privacyVersion }
      user { ${USER_FIELDS} }
    }
  }
`

const RESEND_PENDING_SIGNUP_OTP = gql`
  mutation ResendPendingSignupOtp($pendingToken: String!) {
    resendPendingSignupOtp(pendingToken: $pendingToken)
  }
`

const ACCEPT_LEGAL = gql`
  mutation AcceptLegalDocuments($input: AcceptLegalInput!) {
    acceptLegalDocuments(input: $input)
  }
`

const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`

// ── Sub-screens ───────────────────────────────────────────────────────────────

type Screen =
  | 'auth'
  | 'verify-email'
  | 'legal-consent'
  | 'consent-pending'
  | 'forgot-password'
  | 'reset-sent'

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthPage() {
  const [mode, setMode]               = useState<'login' | 'register'>('login')
  const [screen, setScreen]           = useState<Screen>('auth')

  // Form fields
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [parentEmail, setParentEmail] = useState('')

  // DOB
  const [dobYear, setDobYear]         = useState('')
  const [dobMonth, setDobMonth]       = useState('')

  // Pending auth (held until email OTP + legal consent cleared)
  const [pendingToken, setPendingToken]       = useState('')
  const [pendingUser, setPendingUser]         = useState<null | Record<string, unknown>>(null)
  const [pendingIsReg, setPendingIsReg]       = useState(false)
  const [pendingLegalVersions, setPendingLegalVersions] = useState<{ tosVersion: string; privacyVersion: string } | null>(null)

  // Legal consent checkboxes
  const [tosAccepted, setTosAccepted]         = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [legalError, setLegalError]           = useState('')

  // OTP input
  const [otpDigits, setOtpDigits]     = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError]       = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [error, setError]             = useState('')

  // CAPTCHA
  const hcaptchaRef                       = useRef<HCaptcha>(null)
  const [captchaToken, setCaptchaToken]   = useState<string | null>(null)

  // Per-field validity tracking (register mode)
  const [touched, setTouched]                 = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const markTouched = (field: string) => setTouched((t) => (t[field] ? t : { ...t, [field]: true }))

  const [showPassword, setShowPassword] = useState(false)

  const setUser            = useUserStore((s) => s.setUser)
  const setNeedsOnboarding = useUserStore((s) => s.setNeedsOnboarding)

  const [register,                  { loading: registering    }] = useMutation(REGISTER)
  const [login,                     { loading: loggingIn      }] = useMutation(LOGIN)
  const [completeSignup,            { loading: verifying      }] = useMutation(COMPLETE_SIGNUP)
  const [resendPendingSignupOtp,    { loading: resending      }] = useMutation(RESEND_PENDING_SIGNUP_OTP)
  const [acceptLegal,           { loading: acceptingLegal }] = useMutation(ACCEPT_LEGAL)
  const [requestPasswordReset,  { loading: sendingReset   }] = useMutation(REQUEST_PASSWORD_RESET)

  const [resetEmail, setResetEmail]   = useState('')
  const [resetError, setResetError]   = useState('')

  async function handleForgotPassword() {
    setResetError('')
    try {
      await requestPasswordReset({ variables: { email: resetEmail.trim().toLowerCase() } })
      setScreen('reset-sent')
    } catch {
      setResetError('Something went wrong. Please try again.')
    }
  }

  const loading = registering || loggingIn

  const ageGroup: AgeGroup = mode === 'register'
    ? getAgeGroup(parseInt(dobYear), parseInt(dobMonth))
    : null

  const dobComplete = dobYear.length === 4 && dobMonth.length > 0

  // ── Per-field validity (register mode only) ───────────────────────────────
  type Validity = 'empty' | 'partial' | 'valid'
  const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const PHONE_SHAPE = /^\+?[1-9]\d{7,14}$/

  function fieldValidity(field: string): Validity {
    switch (field) {
      case 'displayName':
        if (!displayName) return 'empty'
        return displayName.trim().length >= 2 ? 'valid' : 'partial'
      case 'email':
        if (!email) return 'empty'
        return EMAIL_SHAPE.test(email) ? 'valid' : 'partial'
      case 'phoneNumber': {
        if (!phoneNumber) return 'empty'
        const cleaned = phoneNumber.replace(/[^\d+]/g, '')
        return PHONE_SHAPE.test(cleaned) ? 'valid' : 'partial'
      }
      case 'password':
        if (!password) return 'empty'
        return passwordValid(password) ? 'valid' : 'partial'
      case 'dobMonth':
        return dobMonth ? 'valid' : 'empty'
      case 'dobYear': {
        if (!dobYear) return 'empty'
        const y = parseInt(dobYear)
        const yr = new Date().getFullYear()
        if (dobYear.length < 4 || isNaN(y) || y < yr - 120 || y > yr) return 'partial'
        return 'valid'
      }
      case 'parentEmail':
        if (!parentEmail) return 'empty'
        return EMAIL_SHAPE.test(parentEmail) ? 'valid' : 'partial'
    }
    return 'valid'
  }

  function borderClass(field: string): string {
    if (mode !== 'register') return ''
    if (!(touched[field] || submitAttempted)) return ''
    const v = fieldValidity(field)
    if (v === 'empty')   return 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
    if (v === 'partial') return 'border-orange-500 focus:border-orange-500 focus:ring-orange-500/30'
    return 'border-green-500 focus:border-green-500 focus:ring-green-500/30'
  }

  function completeLogin(data: Record<string, unknown>, isRegister: boolean) {
    const u = data.user as Record<string, unknown>
    setAuthToken(data.accessToken as string)
    setUser({
      id:                     u.id                     as string,
      email:                  u.email                  as string,
      displayName:            u.displayName            as string,
      role:                   u.role                   as 'learner' | 'parent' | 'admin',
      stateCode:              u.stateCode              as string,
      xpTotal:                u.xpTotal                as number,
      level:                  u.level                  as number,
      streakDays:             u.streakDays             as number,
      freezeTokens:           u.freezeTokens           as number,
      emailVerified:          u.emailVerified          as boolean,
      phoneVerified:          u.phoneVerified          as boolean,
      phoneNumber:            u.phoneNumber            as string | undefined,
      tosVersionAccepted:     u.tosVersionAccepted     as string | undefined,
      privacyVersionAccepted: u.privacyVersionAccepted as string | undefined,
    })
    if (isRegister) setNeedsOnboarding(true)
  }

  function goToLegalConsent(data: Record<string, unknown>, isRegister: boolean) {
    const lv = data.legalVersions as Record<string, unknown>
    setPendingUser(data)
    setPendingIsReg(isRegister)
    setPendingLegalVersions({
      tosVersion:     lv.tosVersion     as string,
      privacyVersion: lv.privacyVersion as string,
    })
    setTosAccepted(false)
    setPrivacyAccepted(false)
    setLegalError('')
    setScreen('legal-consent')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'register') setSubmitAttempted(true)

    if (mode === 'register') {
      if (!dobComplete) { setError('Please enter your date of birth.'); return }
      if (ageGroup === 'under13') return
      if (!passwordValid(password)) { setError('Password does not meet the requirements below.'); return }
      if (!/^\+?[1-9]\d{7,14}$/.test(phoneNumber.replace(/[^\d+]/g, ''))) {
        setError('Please enter a valid phone number.')
        return
      }
      if (ageGroup === 'minor' && !parentEmail) { setError("A parent or guardian's email is required."); return }
    }

    try {
      if (mode === 'register') {
        const isoDate = `${dobYear}-${String(dobMonth).padStart(2, '0')}-01`
        const res = await register({
          variables: {
            input: {
              email,
              password,
              displayName,
              phoneNumber,
              dateOfBirth: isoDate,
              stateCode: 'ok',
              parentEmail: ageGroup === 'minor' ? parentEmail : null,
              captchaToken,
            },
          },
        })
        hcaptchaRef.current?.resetCaptcha()
        setCaptchaToken(null)

        const pending = res.data?.register
        if (pending?.pendingToken) {
          setPendingToken(pending.pendingToken)
          setPendingIsReg(true)
          setOtpDigits(['', '', '', '', '', ''])
          setOtpError('')
          setScreen('verify-email')
        }
        return
      }

      const res = await login({ variables: { input: { email, password, captchaToken } } })
      const data = res.data?.login
      hcaptchaRef.current?.resetCaptcha()
      setCaptchaToken(null)

      if (data?.accessToken && data?.user) {
        if (data.consentStatus === 'pending') {
          setScreen('consent-pending')
          return
        }

        if (data.requiresLegalConsent) {
          setAuthToken(data.accessToken)
          goToLegalConsent(data, false)
          return
        }

        completeLogin(data, false)
      }
    } catch (err: unknown) {
      hcaptchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
      if (err instanceof ApolloError) {
        const code = (err.graphQLErrors[0]?.extensions?.code as string) ?? ''
        const msg  = err.graphQLErrors[0]?.message ?? err.message
        if (code === 'COPPA_UNDER_13'       || msg === 'COPPA_UNDER_13')                       return
        else if (code === 'RATE_LIMITED'    || msg === 'RATE_LIMITED')                         setError('Too many attempts. Please wait a few minutes and try again.')
        else if (code === 'CAPTCHA_REQUIRED'|| msg === 'CAPTCHA_REQUIRED')                     setError('Please complete the CAPTCHA verification.')
        else if (code === 'CAPTCHA_INVALID' || msg === 'CAPTCHA_INVALID')                      setError('CAPTCHA verification failed. Please try again.')
        else if (code === 'INVALID_CREDENTIALS' || msg.includes('Invalid email or password'))  setError('Incorrect email or password. Please try again.')
        else if (code === 'PHONE_TAKEN'     || msg.includes('Phone number already registered')) setError('An account with this phone number already exists.')
        else if (code === 'EMAIL_TAKEN'     || msg.includes('Email already registered'))       setError('An account with this email already exists.')
        else                                                                                   setError(msg || 'Something went wrong. Please try again.')
      } else {
        setError('Unable to connect. Check your internet and try again.')
      }
    }
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join('')
    if (code.length < 6) { setOtpError('Please enter all 6 digits.'); return }
    setOtpError('')
    try {
      const res = await completeSignup({
        variables: { input: { pendingToken, code } },
      })
      const data = res.data?.completeSignup
      if (!data?.accessToken || !data?.user) {
        setOtpError('Unexpected response. Please try again.')
        return
      }

      if (data.consentStatus === 'pending') {
        setScreen('consent-pending')
        return
      }

      setAuthToken(data.accessToken)

      if (data.requiresLegalConsent) {
        goToLegalConsent(data, pendingIsReg)
        return
      }

      completeLogin(data, pendingIsReg)
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        const code = (err.graphQLErrors[0]?.extensions?.code as string) ?? ''
        const msg  = err.graphQLErrors[0]?.message ?? 'Incorrect code. Please try again.'
        if (code === 'PENDING_SIGNUP_NOT_FOUND') {
          setOtpError('Your signup expired. Please start over.')
        } else {
          setOtpError(msg)
        }
      }
    }
  }

  async function handleAcceptLegal() {
    if (!tosAccepted || !privacyAccepted) {
      setLegalError('You must accept both the Terms of Service and Privacy Policy to continue.')
      return
    }
    if (!pendingLegalVersions) return
    setLegalError('')
    try {
      await acceptLegal({
        variables: {
          input: {
            tosVersion:     pendingLegalVersions.tosVersion,
            privacyVersion: pendingLegalVersions.privacyVersion,
          },
        },
      })
      completeLogin(pendingUser!, pendingIsReg)
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        setLegalError(err.graphQLErrors[0]?.message ?? 'Something went wrong. Please try again.')
      }
    }
  }

  async function handleResendOtp() {
    setOtpError('')
    try {
      await resendPendingSignupOtp({ variables: { pendingToken } })
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((c) => { if (c <= 1) { clearInterval(interval); return 0 } return c - 1 })
      }, 1000)
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        const code = (err.graphQLErrors[0]?.extensions?.code as string) ?? ''
        const msg  = err.graphQLErrors[0]?.message ?? 'Could not resend code.'
        if (code === 'PENDING_SIGNUP_NOT_FOUND') {
          setOtpError('Your signup expired. Please start over.')
        } else {
          setOtpError(msg)
        }
      }
    }
  }

  function handleOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/, '').slice(-1)
    const next = [...otpDigits]
    next[index] = digit
    setOtpDigits(next)
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  // ── Email OTP verification screen ─────────────────────────────────────────

  if (screen === 'verify-email') {
    const allFilled = otpDigits.every((d) => d !== '')
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <AppLogo height={80} />
          </div>
          <div className="card-elevated">
            <h2 className="font-display text-xl font-bold text-text-primary mb-1">Verify your email</h2>
            <p className="text-text-secondary text-sm mb-6">
              We sent a 6-digit code to <span className="text-text-primary font-medium">{email}</span>.
            </p>

            {/* OTP digit inputs */}
            <div className="flex gap-2 justify-center mb-6">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  className="w-11 h-14 text-center text-xl font-bold font-mono rounded-lg border-2 bg-surface text-text-primary focus:outline-none focus:border-green-500 transition-colors border-border"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2 mb-4">
                {otpError}
              </p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={!allFilled || verifying}
              className="btn-primary w-full h-11 mb-3"
            >
              {verifying ? 'Verifying...' : 'Verify Email'}
            </button>

            <button
              onClick={handleResendOtp}
              disabled={resending || resendCooldown > 0}
              className="w-full text-sm text-text-secondary hover:text-text-primary transition-colors py-2 disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Legal consent screen ──────────────────────────────────────────────────

  if (screen === 'legal-consent') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <AppLogo height={70} />
          </div>

          <div className="card-elevated">
            <h2 className="font-display text-xl font-bold text-text-primary mb-1">
              Before you continue
            </h2>
            <p className="text-text-secondary text-sm mb-5">
              Please review and accept our Terms of Service and Privacy Policy to use DriveReady.
            </p>

            {/* ToS summary */}
            <div className="bg-surface rounded-xl border border-border p-4 mb-3 max-h-36 overflow-y-auto text-xs text-text-secondary leading-relaxed space-y-2">
              <p className="font-semibold text-text-primary text-sm">
                Terms of Service — v{pendingLegalVersions?.tosVersion}
              </p>
              <p>DriveReady provides driver education study materials for informational purposes. Content is based on official state driver handbooks but does not guarantee passing any official exam.</p>
              <p>You agree to use this service only for lawful, personal study purposes. You must not share account credentials, scrape content, or use automated tools against the platform.</p>
              <p>We reserve the right to suspend accounts that violate these terms. You may delete your account at any time and all personal data will be removed.</p>
            </div>

            {/* Privacy Policy summary */}
            <div className="bg-surface rounded-xl border border-border p-4 mb-5 max-h-36 overflow-y-auto text-xs text-text-secondary leading-relaxed space-y-2">
              <p className="font-semibold text-text-primary text-sm">
                Privacy Policy — v{pendingLegalVersions?.privacyVersion}
              </p>
              <p>We collect your name, email, date of birth (month and year only), and study progress to operate the service. We do not sell your data to third parties.</p>
              <p>Study data (quiz scores, progress, streaks) is used to personalize your learning experience. We may use anonymized, aggregated data to improve the platform.</p>
              <p>For users under 18, a parent or guardian must provide consent before data is collected. You may request deletion of your data at any time by contacting support@driveready.app.</p>
            </div>

            {/* Checkboxes */}
            <label className="flex items-start gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-green-500 shrink-0"
              />
              <span className="text-sm text-text-secondary">
                I have read and agree to the{' '}
                <span className="text-green-500">Terms of Service</span>
              </span>
            </label>

            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-green-500 shrink-0"
              />
              <span className="text-sm text-text-secondary">
                I have read and agree to the{' '}
                <span className="text-green-500">Privacy Policy</span>
              </span>
            </label>

            {legalError && (
              <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2 mb-4">
                {legalError}
              </p>
            )}

            <button
              onClick={handleAcceptLegal}
              disabled={acceptingLegal || !tosAccepted || !privacyAccepted}
              className="btn-primary w-full h-11"
            >
              {acceptingLegal ? 'Saving...' : 'Accept & Continue'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Consent pending screen ─────────────────────────────────────────────────

  if (screen === 'consent-pending') {
    const fromRegister = mode === 'register' && parentEmail
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5">
            <Clock size={28} className="text-yellow-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            Waiting for parental approval
          </h2>
          {fromRegister ? (
            <>
              <p className="text-text-secondary text-sm leading-relaxed mb-3">
                We sent a consent request to{' '}
                <span className="text-text-primary font-medium">{parentEmail}</span>.
                Your account will be activated once they approve.
              </p>
              <p className="text-text-secondary text-xs mb-6">
                The email may take a few minutes to arrive. Ask your parent or guardian to check their spam folder too.
              </p>
            </>
          ) : (
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Your account is pending parental approval. Please ask your parent or guardian to check their email and click the approval link.
            </p>
          )}
          <button
            onClick={() => {
              setScreen('auth')
              setMode('login')
              setError('')
            }}
            className="btn-primary w-full h-11"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  // ── Forgot password screen ────────────────────────────────────────────────

  if (screen === 'forgot-password') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm card-elevated">
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Reset password</h2>
          <p className="text-sm text-text-secondary mb-6">
            Enter your account email and we'll send a reset link.
          </p>
          <div className="space-y-4">
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              autoFocus
            />
            {resetError && <p className="text-wrong text-xs">{resetError}</p>}
            <button
              onClick={handleForgotPassword}
              disabled={!resetEmail || sendingReset}
              className="btn-primary w-full h-11"
            >
              {sendingReset ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button
              onClick={() => { setScreen('auth'); setResetError('') }}
              className="w-full text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'reset-sent') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm card-elevated text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-green-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Check your inbox</h2>
          <p className="text-sm text-text-secondary mb-6">
            If <strong className="text-text-primary">{resetEmail}</strong> is registered, a reset link is on its way. It expires in 1 hour.
          </p>
          <button
            onClick={() => { setScreen('auth'); setResetEmail('') }}
            className="btn-primary w-full h-11"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // ── Main auth screen ───────────────────────────────────────────────────────

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ]

  const currentYear = new Date().getFullYear()

  // map between AuthModeToggle ('signin'/'signup') and internal ('login'/'register')
  const toggleMode: 'signin' | 'signup' = mode === 'login' ? 'signin' : 'signup'

  return (
    <AuthLayout>
      <AuthModeToggle
        mode={toggleMode}
        onChange={(m) => { setMode(m === 'signin' ? 'login' : 'register'); setError('') }}
      />

      <div className="mb-7 animate-fade-up" style={{ animationDelay: '0.08s' }}>
        <h2 className="display font-extrabold text-[26px] tracking-[-0.5px] text-white mb-1.5">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-sm text-text-secondary font-light">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError('') }}
                className="text-orange font-medium hover:underline"
              >
                Create a free account →
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="text-orange font-medium hover:underline"
              >
                Sign in →
              </button>
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-1">

        {/* Date of birth (register only) */}
        {mode === 'register' && (
          <div className="mb-4 animate-fade-up">
            <div className="text-[12px] font-medium text-text-secondary tracking-[0.04em] mb-2">
              Date of birth
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <FiCalendar size={16} />
                </span>
                <select
                  className={`w-full bg-white/[0.05] border rounded-md py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors ${
                    fieldValidity('dobMonth') === 'valid'
                      ? 'border-correct/55'
                      : (touched.dobMonth || submitAttempted) && fieldValidity('dobMonth') === 'empty'
                        ? 'border-wrong/60'
                        : 'border-white/10 focus:border-orange/55'
                  }`}
                  value={dobMonth}
                  onChange={(e) => { setDobMonth(e.target.value); setError('') }}
                  onBlur={() => markTouched('dobMonth')}
                  required
                >
                  <option value="" className="bg-navy">Month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={String(i + 1)} className="bg-navy">{m}</option>
                  ))}
                </select>
              </div>
              <AuthField
                className="w-28"
                type="number"
                placeholder="Year"
                min={currentYear - 120}
                max={currentYear}
                value={dobYear}
                onChange={(e) => { setDobYear(e.target.value); setError('') }}
                onBlur={() => markTouched('dobYear')}
                validity={(touched.dobYear || submitAttempted) ? fieldValidity('dobYear') : null}
                required
              />
            </div>

            {dobComplete && ageGroup === 'under13' && (
              <div className="mt-3 flex items-start gap-2 bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2.5">
                <AlertTriangle size={15} className="text-wrong mt-0.5 shrink-0" />
                <p className="text-wrong text-xs leading-relaxed">
                  DriveReady is not available for users under 13. Please visit with a parent or guardian.
                </p>
              </div>
            )}
            {dobComplete && ageGroup === 'minor' && (
              <p className="mt-2 text-xs text-yellow">
                Users under 18 require parental consent to create an account.
              </p>
            )}
          </div>
        )}

        {(mode === 'login' || ageGroup !== 'under13') && (
          <>
            {mode === 'register' && (
              <AuthField
                label="Display name"
                LeadingIcon={FiUser}
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => markTouched('displayName')}
                validity={(touched.displayName || submitAttempted) ? fieldValidity('displayName') : null}
                required
                minLength={2}
                maxLength={50}
              />
            )}

            <AuthField
              label="Email address"
              LeadingIcon={FiMail}
              type="email"
              placeholder="you@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => markTouched('email')}
              validity={mode === 'register' && (touched.email || submitAttempted) ? fieldValidity('email') : null}
              required
            />

            {mode === 'register' && (
              <AuthField
                label="Phone number"
                LeadingIcon={FiPhone}
                type="tel"
                placeholder="+1 555 123 4567"
                autoComplete="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                onBlur={() => markTouched('phoneNumber')}
                validity={(touched.phoneNumber || submitAttempted) ? fieldValidity('phoneNumber') : null}
                required
              />
            )}

            <AuthField
              label="Password"
              labelRight={
                mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setScreen('forgot-password'); setResetEmail(email) }}
                    className="text-[12px] text-orange font-medium hover:opacity-75 transition-opacity"
                  >
                    Forgot password?
                  </button>
                )
              }
              LeadingIcon={FiLock}
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => markTouched('password')}
              validity={mode === 'register' && (touched.password || submitAttempted) ? fieldValidity('password') : null}
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-white/40 hover:text-white/70 transition-colors p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {mode === 'register' && password.length > 0 && (
              <ul className="mt-1 mb-3 space-y-1">
                {RULES.map((rule) => {
                  const ok = rule.test(password)
                  return (
                    <li key={rule.label} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-correct' : 'text-text-secondary'}`}>
                      {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} className="text-wrong" />}
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            )}

            {mode === 'register' && ageGroup === 'minor' && (
              <AuthField
                label="Parent / guardian email"
                LeadingIcon={FiMail}
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                onBlur={() => markTouched('parentEmail')}
                validity={(touched.parentEmail || submitAttempted) ? fieldValidity('parentEmail') : null}
                required
                error="We'll send a consent request to this address."
              />
            )}

            {error && (
              <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <div className="flex justify-center mb-4">
              <HCaptcha
                ref={hcaptchaRef}
                sitekey={HCAPTCHA_SITE_KEY}
                theme="dark"
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-md bg-orange text-white display font-bold text-[15px] tracking-[-0.1px] hover:bg-orange-deep hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(244,91,38,0.35)] active:translate-y-0 active:shadow-none transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed animate-fade-up"
              style={{ animationDelay: '0.3s' }}
            >
              {loading ? 'Please wait...' : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <FiArrowRight size={16} />
                </>
              )}
            </button>
          </>
        )}
      </form>

      {/* Tagline pill */}
      <div className="flex items-center justify-center mt-8 animate-fade-up" style={{ animationDelay: '0.48s' }}>
        <div className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2 text-[11px] text-text-muted">
          <span className="font-medium"><strong className="text-yellow font-semibold">All 50 states</strong></span>
          <span className="mx-1">·</span>
          <span className="font-medium"><strong className="text-yellow font-semibold">AI-powered</strong></span>
          <span className="mx-1">·</span>
          <span className="font-medium"><strong className="text-yellow font-semibold">Free</strong> to start</span>
        </div>
      </div>

    </AuthLayout>
  )
}
