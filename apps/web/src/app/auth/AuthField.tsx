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

import { ReactNode, InputHTMLAttributes } from 'react'
import { FiCheck } from 'react-icons/fi'
import { clsx } from 'clsx'
import type { IconType } from 'react-icons'

export type AuthFieldValidity = 'empty' | 'partial' | 'valid'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  /** Right-aligned label-row link (e.g. "Forgot password?") */
  labelRight?: ReactNode
  /** Leading icon inside the input */
  LeadingIcon?: IconType
  /** Custom right slot (overrides default check + suffix). */
  suffix?: ReactNode
  /** Driving the border color: red/orange/green map. */
  validity?: AuthFieldValidity | null
  /** Inline error message under the input */
  error?: string
}

export function AuthField({
  label,
  labelRight,
  LeadingIcon,
  suffix,
  validity,
  error,
  className,
  ...inputProps
}: AuthFieldProps) {
  const borderClass =
    validity === 'empty'
      ? 'border-wrong/60 focus:border-wrong focus:ring-wrong/20'
      : validity === 'partial'
        ? 'border-orange/60 focus:border-orange focus:ring-orange/20'
        : validity === 'valid'
          ? 'border-correct/55 focus:border-correct focus:ring-correct/20'
          : 'border-white/10 focus:border-orange/55 focus:ring-orange/20'

  return (
    <div className="mb-4 animate-fade-up">
      {(label || labelRight) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-[12px] font-medium text-text-secondary tracking-[0.04em]">
              {label}
            </span>
          )}
          {labelRight}
        </div>
      )}
      <div className="relative">
        {LeadingIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <LeadingIcon size={16} />
          </span>
        )}
        <input
          {...inputProps}
          className={clsx(
            'w-full bg-white/[0.05] border rounded-md py-3 text-sm text-white placeholder:text-white/30',
            'outline-none transition-[border-color,background,box-shadow] duration-200',
            'focus:bg-orange/[0.04] focus:ring-[3px]',
            LeadingIcon ? 'pl-11' : 'pl-4',
            suffix || validity === 'valid' ? 'pr-11' : 'pr-4',
            borderClass,
            className,
          )}
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {validity === 'valid' && !suffix && (
            <FiCheck size={16} className="text-correct" strokeWidth={3} />
          )}
          {suffix}
        </div>
      </div>
      {error && (
        <div className="text-[11px] text-wrong/90 mt-1.5 animate-fade-in">{error}</div>
      )}
    </div>
  )
}
