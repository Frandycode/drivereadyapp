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
import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi'
import { BottomSheet } from '@/components/ui/BottomSheet'

const DELETE_ACCOUNT = gql`
  mutation DeleteAccountFromSettings($password: String!) {
    deleteAccount(password: $password)
  }
`

interface DeleteAccountSheetProps {
  open: boolean
  onClose: () => void
  /** Called on successful deletion — caller signs the user out. */
  onDeleted: () => void
}

const CONFIRM_PHRASE = 'DELETE'

export function DeleteAccountSheet({ open, onClose, onDeleted }: DeleteAccountSheetProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')

  const [deleteAccount, { loading }] = useMutation(DELETE_ACCOUNT)

  const canSubmit = password.length > 0 && confirm.trim() === CONFIRM_PHRASE

  function reset() {
    setPassword('')
    setConfirm('')
    setError('')
  }

  async function handleDelete() {
    if (!canSubmit) return
    setError('')
    try {
      await deleteAccount({ variables: { password } })
      reset()
      onClose()
      onDeleted()
    } catch (err: unknown) {
      if (err instanceof ApolloError) {
        const msg = err.graphQLErrors[0]?.message ?? 'Could not delete account.'
        setError(msg.toLowerCase().includes('password') ? 'Incorrect password.' : msg)
      } else {
        setError('Network error — try again.')
      }
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Delete account"
      size="tall"
    >
      <div className="flex flex-col gap-5 pb-2">
        {/* Warning */}
        <div className="flex items-start gap-3 bg-wrong/10 border border-wrong/30 rounded-lg p-4">
          <FiAlertTriangle size={18} className="text-wrong flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white">
            <p className="font-medium mb-1">This cannot be undone.</p>
            <p className="text-text-secondary text-xs leading-relaxed">
              Your account, progress, streaks, bookmarks, decks, and saved sessions will be
              permanently removed. You'll be signed out immediately.
            </p>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">
            Confirm your password
          </label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            autoComplete="current-password"
          />
        </div>

        {/* Confirm phrase */}
        <div>
          <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">
            Type <span className="mono text-wrong">{CONFIRM_PHRASE}</span> to confirm
          </label>
          <input
            type="text"
            className="input mono uppercase"
            placeholder={CONFIRM_PHRASE}
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setError('') }}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {error && (
          <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => { reset(); onClose() }}
            disabled={loading}
            className="flex-1 h-11 rounded-md border border-border text-sm text-text-secondary hover:text-white hover:bg-surface-3 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canSubmit || loading}
            className="flex-1 h-11 rounded-md bg-wrong text-white font-medium text-sm inline-flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Deleting…'
            ) : (
              <>
                <FiTrash2 size={14} />
                Delete forever
              </>
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
