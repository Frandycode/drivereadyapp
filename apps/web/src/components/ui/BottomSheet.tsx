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

import { ReactNode, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { clsx } from 'clsx'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  /** Visual size: `auto` (content height) or `tall` (~85vh). */
  size?: 'auto' | 'tall'
  children: ReactNode
  /** Hide the X close button (still closes on backdrop tap + ESC). */
  hideClose?: boolean
}

export function BottomSheet({
  open,
  onClose,
  title,
  size = 'auto',
  hideClose,
  children,
}: BottomSheetProps) {
  // Close on ESC
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm motion-safe:animate-fade-in"
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={clsx(
          'fixed left-0 right-0 bottom-0 z-[61]',
          'bg-surface-2 border-t border-border rounded-t-2xl',
          'shadow-[0_-16px_40px_-12px_rgba(0,0,0,0.6)]',
          'motion-safe:animate-slide-up flex flex-col',
          size === 'tall' ? 'max-h-[85dvh]' : 'max-h-[85dvh]',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-9 h-[5px] rounded-full bg-text-muted" />
        </div>

        {/* Header */}
        {(title || !hideClose) && (
          <div className="px-5 pb-3 flex items-center justify-between">
            {title && (
              <h2
                id="bottom-sheet-title"
                className="display font-bold text-base text-white"
              >
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 -mr-1.5 rounded-md text-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content (scrolls if it overflows) */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </>
  )
}
