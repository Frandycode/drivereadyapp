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

import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded bg-surface-2',
        'after:absolute after:inset-0 after:opacity-15',
        'after:bg-[linear-gradient(90deg,transparent,rgba(245,240,230,0.22),transparent)]',
        'after:bg-[length:200%_100%] after:animate-shimmer',
        className,
      )}
    />
  )
}

// ── Page-specific skeletons ───────────────────────────────────────────────────

export function LearnPageSkeleton() {
  return (
    <div className="space-y-3 mt-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex items-start gap-3">
            <Skeleton className="w-9 h-9 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <div className="mt-2.5 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChapterPageSkeleton() {
  return (
    <div className="space-y-2 mt-2">
      {/* Progress bar placeholder */}
      <div className="mb-4 animate-pulse">
        <div className="flex justify-between mb-1.5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex items-center gap-3">
            <Skeleton className="w-[18px] h-[18px] rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="w-[14px] h-[14px] rounded flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StudyPageSkeleton() {
  return (
    <div className="space-y-4 mt-2 animate-pulse">
      {/* Step 1 card */}
      <div className="card">
        <Skeleton className="h-3 w-40 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Connector */}
      <div className="flex flex-col items-center py-1 gap-1">
        <Skeleton className="w-px h-3" />
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
        <Skeleton className="w-px h-3" />
      </div>
      {/* Step 2 card */}
      <div className="card">
        <Skeleton className="h-3 w-40 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
      {/* Connector */}
      <div className="flex flex-col items-center py-1 gap-1">
        <Skeleton className="w-px h-3" />
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
        <Skeleton className="w-px h-3" />
      </div>
      {/* Step 3 card */}
      <div className="card">
        <Skeleton className="h-3 w-40 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function QuizQuestionSkeleton() {
  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-content mx-auto animate-pulse">
          <div className="w-5 h-5 bg-surface-3 rounded flex-shrink-0" />
          <div className="flex-1 h-2 bg-surface-3 rounded" />
          <div className="w-12 h-4 bg-surface-3 rounded" />
        </div>
      </div>
      {/* Content */}
      <div className="px-4 pt-6 max-w-content mx-auto w-full animate-pulse">
        <div className="card-elevated mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-surface-3 rounded w-full" />
            <div className="h-4 bg-surface-3 rounded w-4/5" />
            <div className="h-4 bg-surface-3 rounded w-3/5" />
          </div>
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-2 border border-border rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
