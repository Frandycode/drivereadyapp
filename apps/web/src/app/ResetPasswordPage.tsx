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
import { Check, Eye, EyeOff } from 'lucide-react'
import { AppLogo } from '@/components/layout/AppLogo'

const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`

const RULES = [
  { label: 'At least 8 characters',                    test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter',                          test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',                          test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number',                                    test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character (# $ & ! * -)',           test: (p: string) => /[#$&!*\-]/.test(p) },
]

interface Props {
  token: string
  onDone: () => void
}

export function ResetPasswordPage({ token, onDone }: Props) {
  const [password, setPassword]   = useState('')
  const [confirm,  setConfirm]    = useState('')
  const [error,    setError]      = useState('')
  const [success,  setSuccess]    = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD)

  const allRulesMet = RULES.every((r) => r.test(password))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!allRulesMet) { setError('Password does not meet all requirements.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    try {
      await resetPassword({ variables: { token, newPassword: password } })
      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        setError(err.graphQLErrors[0]?.message ?? 'Reset failed. The link may have expired.')
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm card-elevated text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-green-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">Password updated</h2>
          <p className="text-sm text-text-secondary mb-6">
            You've been signed out of all other devices. Sign in with your new password.
          </p>
          <button onClick={onDone} className="btn-primary w-full h-11">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center flex flex-col items-center gap-3">
        <AppLogo height={80} />
      </div>

      <div className="w-full max-w-sm card-elevated">
        <h2 className="font-display text-xl font-bold text-text-primary mb-2">Choose a new password</h2>
        <p className="text-sm text-text-secondary mb-6">Must meet all requirements below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              className="input pr-10"
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {password.length > 0 && (
            <ul className="space-y-1">
              {RULES.map((rule) => (
                <li key={rule.label} className={`flex items-center gap-2 text-xs transition-colors ${rule.test(password) ? 'text-green-500' : 'text-text-secondary'}`}>
                  <Check size={11} className={rule.test(password) ? 'opacity-100' : 'opacity-30'} />
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          <div className="relative">
            <input
              className="input pr-10"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !allRulesMet || !confirm}
            className="btn-primary w-full h-11"
          >
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
