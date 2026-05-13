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
import { Footer } from './Footer'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  /** Set true on pages that shouldn't have the bottom nav offset */
  fullScreen?: boolean
  /** Optional sticky header content */
  header?: ReactNode
  /** Hide the footer (for full-screen sessions like quizzes, exam, etc.) */
  hideFooter?: boolean
  /** Optional onNavigate forwarded to footer status link */
  onNavigate?: (path: string) => void
}

export function PageWrapper({
  children,
  className,
  fullScreen,
  header,
  hideFooter,
  onNavigate,
}: PageWrapperProps) {
  return (
    <div className={clsx('min-h-dvh bg-bg flex flex-col', !fullScreen && 'pb-20')}>
      {header && (
        <div className="sticky top-0 z-40 glass border-b border-border">
          {header}
        </div>
      )}
      <main className={clsx('flex-1 px-4 pt-4 max-w-content mx-auto w-full', className)}>
        {children}
      </main>
      {!hideFooter && !fullScreen && <Footer onNavigate={onNavigate} />}
    </div>
  )
}
