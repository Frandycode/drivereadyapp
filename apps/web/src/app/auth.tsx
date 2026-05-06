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
import { useMutation, gql, ApolloError } from '@apollo/client'
import { setAuthToken } from '@driveready/api-client'
import { useUserStore } from '@/stores'
import { AppLogo } from '@/components/layout/AppLogo'
import { Check, X, AlertTriangle, Clock } from 'lucide-react'

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

const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      consentStatus
      user {
        id email displayName role stateCode xpTotal level streakDays freezeTokens
      }
    }
  }
`

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      consentStatus
      user {
        id email displayName role stateCode xpTotal level streakDays freezeTokens
      }
    }
  }
`

// ── Sub-screens ───────────────────────────────────────────────────────────────

type Screen =
  | 'auth'          // main login/register form
  | 'consent-pending' // after minor registers, waiting for parent

// ── Component ─────────────────────────────────────────────────────────────────

export function AuthPage() {
  const [mode, setMode]               = useState<'login' | 'register'>('login')
  const [screen, setScreen]           = useState<Screen>('auth')

  // Fields
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [parentEmail, setParentEmail] = useState('')

  // DOB
  const [dobYear, setDobYear]         = useState('')
  const [dobMonth, setDobMonth]       = useState('')

  const [error, setError]             = useState('')

  const setUser            = useUserStore((s) => s.setUser)
  const setNeedsOnboarding = useUserStore((s) => s.setNeedsOnboarding)

  const [register, { loading: registering }] = useMutation(REGISTER)
  const [login,    { loading: loggingIn   }] = useMutation(LOGIN)

  const loading = registering || loggingIn

  const ageGroup: AgeGroup = mode === 'register'
    ? getAgeGroup(parseInt(dobYear), parseInt(dobMonth))
    : null

  const dobComplete = dobYear.length === 4 && dobMonth.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (!dobComplete) { setError('Please enter your date of birth.'); return }
      if (ageGroup === 'under13') return // button is hidden for under-13
      if (!passwordValid(password)) { setError('Password does not meet the requirements below.'); return }
      if (ageGroup === 'minor' && !parentEmail) { setError("A parent or guardian's email is required."); return }
    }

    try {
      let data
      if (mode === 'register') {
        const dob = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, 1)
        const isoDate = `${dobYear}-${String(dobMonth).padStart(2, '0')}-01`
        const res = await register({
          variables: {
            input: {
              email,
              password,
              displayName,
              dateOfBirth: isoDate,
              stateCode: 'ok',
              parentEmail: ageGroup === 'minor' ? parentEmail : null,
            },
          },
        })
        void dob
        data = res.data?.register
      } else {
        const res = await login({ variables: { input: { email, password } } })
        data = res.data?.login
      }

      if (data?.accessToken && data?.user) {
        if (data.consentStatus === 'pending') {
          setScreen('consent-pending')
          return
        }

        setAuthToken(data.accessToken)
        setUser({
          id:           data.user.id,
          email:        data.user.email,
          displayName:  data.user.displayName,
          role:         data.user.role,
          stateCode:    data.user.stateCode,
          xpTotal:      data.user.xpTotal,
          level:        data.user.level,
          streakDays:   data.user.streakDays,
          freezeTokens: data.user.freezeTokens,
        })
        if (mode === 'register') {
          setNeedsOnboarding(true)
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        const msg = err.graphQLErrors[0]?.message ?? err.message
        if (msg === 'COPPA_UNDER_13') {
          // Should never reach here (button hidden), but handle defensively
          return
        } else if (msg.includes('Invalid email or password')) {
          setError('Incorrect email or password. Please try again.')
        } else if (msg.includes('already registered')) {
          setError('An account with this email already exists.')
        } else {
          setError(msg || 'Something went wrong. Please try again.')
        }
      } else {
        setError('Unable to connect. Check your internet and try again.')
      }
    }
  }

  // ── Consent pending screen ─────────────────────────────────────────────────

  if (screen === 'consent-pending') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-5">
            <Clock size={28} className="text-yellow-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            Check your parent's inbox
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-4">
            We sent a consent request to <span className="text-text-primary font-medium">{parentEmail}</span>.
            Your account will be activated once they approve.
          </p>
          <p className="text-text-secondary text-xs mb-6">
            The email may take a few minutes to arrive. Ask your parent or guardian to check their spam folder too.
          </p>
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

  // ── Main auth screen ───────────────────────────────────────────────────────

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ]

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <AppLogo height={110} />
        <p className="text-text-secondary text-sm">Learn it. Know it. Drive it.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card-elevated">
        {/* Tab switcher */}
        <div className="flex bg-surface rounded-md p-1 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded text-sm font-medium capitalize transition-all duration-150 ${
                mode === m
                  ? 'bg-green-500 text-bg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Date of birth (register only) ── */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Date of Birth
              </label>
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={dobMonth}
                  onChange={(e) => { setDobMonth(e.target.value); setError('') }}
                  required
                >
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
                <input
                  className="input w-24"
                  type="number"
                  placeholder="Year"
                  min={currentYear - 120}
                  max={currentYear}
                  value={dobYear}
                  onChange={(e) => { setDobYear(e.target.value); setError('') }}
                  required
                />
              </div>

              {/* Age gate feedback */}
              {dobComplete && ageGroup === 'under13' && (
                <div className="mt-3 flex items-start gap-2 bg-wrong/10 border border-wrong/30 rounded-lg px-3 py-2.5">
                  <AlertTriangle size={15} className="text-wrong mt-0.5 shrink-0" />
                  <p className="text-wrong text-xs leading-relaxed">
                    DriveReady is not available for users under 13. Please visit with a parent or guardian.
                  </p>
                </div>
              )}

              {dobComplete && ageGroup === 'minor' && (
                <p className="mt-2 text-xs text-yellow-400">
                  Users under 18 require parental consent to create an account.
                </p>
              )}
            </div>
          )}

          {/* ── Fields hidden for under-13 ── */}
          {(mode === 'login' || ageGroup !== 'under13') && (
            <>
              {mode === 'register' && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Display Name
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder={mode === 'register' ? 'Create a strong password' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {mode === 'register' && password.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {RULES.map((rule) => {
                      const ok = rule.test(password)
                      return (
                        <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-500' : 'text-text-secondary'}`}>
                          {ok
                            ? <Check size={11} strokeWidth={3} />
                            : <X size={11} strokeWidth={3} className="text-wrong" />
                          }
                          {rule.label}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* ── Parent email (minors only) ── */}
              {mode === 'register' && ageGroup === 'minor' && (
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Parent / Guardian Email
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="parent@example.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                  />
                  <p className="mt-1.5 text-xs text-text-secondary">
                    We'll send a consent request to this address.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11 text-base"
              >
                {loading
                  ? 'Please wait...'
                  : mode === 'login' ? 'Sign In' : 'Create Account'
                }
              </button>
            </>
          )}

        </form>
      </div>

      <p className="mt-6 text-text-secondary text-xs">
        All 50 states · AI-powered · Free to start
      </p>
    </div>
  )
}
