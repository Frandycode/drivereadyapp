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
import { FiCheck as Check, FiEye as Eye, FiEyeOff as EyeOff } from 'react-icons/fi'
import { FiLock, FiArrowRight } from 'react-icons/fi'
import { AuthLayout } from '@/app/auth/AuthLayout'
import { AuthField } from '@/app/auth/AuthField'

const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $newPassword: String!) {
    resetPassword(token: $token, newPassword: $newPassword)
  }
`

const RULES = [
  { label: 'At least 8 characters',                    test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter',                         test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',                         test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number',                                   test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character (# $ & ! * -)',          test: (p: string) => /[#$&!*\-]/.test(p) },
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

  const allRulesMet  = RULES.every((r) => r.test(password))
  const passValidity = password.length === 0 ? null : allRulesMet ? 'valid' : 'partial'
  const confirmValidity =
    confirm.length === 0 ? null : confirm === password && allRulesMet ? 'valid' : 'partial'

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
      <AuthLayout>
        <div className="text-center animate-fade-up">
          <div className="w-12 h-12 rounded-full bg-correct/10 border border-correct/40 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-correct" />
          </div>
          <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-correct">
            <span className="w-[18px] h-[1.5px] rounded-full bg-correct" />
            Password updated
          </div>
          <h2 className="display font-extrabold text-[26px] tracking-[-0.5px] text-white mb-2">
            You&apos;re back in.
          </h2>
          <p className="text-sm text-text-secondary mb-6 font-light">
            You&apos;ve been signed out of all other devices. Sign in with your new password.
          </p>
          <button
            onClick={onDone}
            className="w-full py-3.5 rounded-md bg-orange text-white display font-bold text-[15px] tracking-[-0.1px] hover:bg-orange-deep hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(244,91,38,0.35)] active:translate-y-0 active:shadow-none transition-all duration-200 inline-flex items-center justify-center gap-2"
          >
            Sign in
            <FiArrowRight size={16} />
          </button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mb-7 animate-fade-up">
        <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
          <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
          Reset password
        </div>
        <h2 className="display font-extrabold text-[26px] tracking-[-0.5px] text-white mb-1.5">
          Choose a new password.
        </h2>
        <p className="text-sm text-text-secondary font-light">
          Must meet all five rules below.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <AuthField
          label="New password"
          LeadingIcon={FiLock}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          validity={passValidity}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-text-secondary hover:text-white transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {password.length > 0 && (
          <ul className="mb-4 -mt-1 space-y-1.5 animate-fade-up">
            {RULES.map((rule) => {
              const ok = rule.test(password)
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 mono text-[11px] tracking-[0.04em] transition-colors ${
                    ok ? 'text-correct' : 'text-text-muted'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                      ok ? 'bg-correct/15 border-correct/40' : 'border-white/[0.08]'
                    }`}
                  >
                    <Check size={10} className={ok ? 'opacity-100' : 'opacity-20'} />
                  </span>
                  {rule.label}
                </li>
              )
            })}
          </ul>
        )}

        <AuthField
          label="Confirm password"
          LeadingIcon={FiLock}
          type={showConfirm ? 'text' : 'password'}
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          validity={confirmValidity}
          suffix={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="text-text-secondary hover:text-white transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {error && (
          <p className="text-wrong text-xs bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !allRulesMet || !confirm}
          className="w-full py-3.5 rounded-md bg-orange text-white display font-bold text-[15px] tracking-[-0.1px] hover:bg-orange-deep hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(244,91,38,0.35)] active:translate-y-0 active:shadow-none transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mb-3"
        >
          {loading ? 'Updating…' : (<>Set new password <FiArrowRight size={16} /></>)}
        </button>
      </form>
    </AuthLayout>
  )
}
