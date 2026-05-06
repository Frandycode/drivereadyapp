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
import { Check, X } from 'lucide-react'

const SPECIAL = /[#$&!*\-]/
const RULES = [
  { label: 'At least 8 characters',                test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter',                      test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',                      test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number',                                test: (p: string) => /\d/.test(p) },
  { label: 'Special character  # $ & ! * -',       test: (p: string) => SPECIAL.test(p) },
  { label: 'No 3+ identical characters in a row',  test: (p: string) => !/(.)\1\1/.test(p) },
]

function passwordValid(p: string) {
  return RULES.every((r) => r.test(p))
}

const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
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
      user {
        id email displayName role stateCode xpTotal level streakDays freezeTokens
      }
    }
  }
`

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  const setUser            = useUserStore((s) => s.setUser)
  const setNeedsOnboarding = useUserStore((s) => s.setNeedsOnboarding)

  const [register, { loading: registering }] = useMutation(REGISTER)
  const [login, { loading: loggingIn }] = useMutation(LOGIN)

  const loading = registering || loggingIn

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'register' && !passwordValid(password)) {
      setError('Password does not meet the requirements below.')
      return
    }

    try {
      let data
      if (mode === 'register') {
        const res = await register({ variables: { input: { email, password, displayName, stateCode: 'ok' } } })
        data = res.data?.register
      } else {
        const res = await login({ variables: { input: { email, password } } })
        data = res.data?.login
      }

      if (data?.accessToken && data?.user) {
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
        if (msg.includes('Invalid email or password')) {
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

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <AppLogo height={110} />
        <p className="text-text-secondary text-sm">
          Learn it. Know it. Drive it.
        </p>
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
            <label className="block text-sm text-text-secondary mb-1.5">
              Email
            </label>
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
            <label className="block text-sm text-text-secondary mb-1.5">
              Password
            </label>
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
        </form>
      </div>

      <p className="mt-6 text-text-secondary text-xs">
        All 50 states · AI-powered · Free to start
      </p>
    </div>
  )
}
