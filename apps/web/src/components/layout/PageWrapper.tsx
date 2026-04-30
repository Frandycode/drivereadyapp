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

import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  /** Set true on pages that shouldn't have the bottom nav offset */
  fullScreen?: boolean
  /** Optional sticky header content */
  header?: ReactNode
}

export function PageWrapper({ children, className, fullScreen, header }: PageWrapperProps) {
  return (
    <div className={clsx('min-h-dvh bg-bg', !fullScreen && 'pb-20')}>
      {header && (
        <div className="sticky top-0 z-40 bg-bg/90 backdrop-blur-sm border-b border-border">
          {header}
        </div>
      )}
      <main className={clsx('px-4 pt-4 max-w-content mx-auto', className)}>
        {children}
      </main>
    </div>
  )
}
