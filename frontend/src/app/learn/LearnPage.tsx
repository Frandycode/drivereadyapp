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

import { useQuery, gql } from '@apollo/client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { BookOpen, Lock, ChevronRight, CheckCircle } from 'lucide-react'
import { useUserStore } from '@/stores'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_CHAPTERS = gql`
  query GetChapters($stateCode: String!) {
    chapters(stateCode: $stateCode) {
      id
      number
      title
      description
    }
    myProgress {
      chapter
      lessonsCompleted
      lessonsTotal
      questionsCorrect
      questionsSeen
      accuracy
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface Chapter {
  id: string
  number: number
  title: string
  description?: string
}

interface Progress {
  chapter: number
  lessonsCompleted: number
  lessonsTotal: number
  questionsCorrect: number
  questionsSeen: number
  accuracy: number
}

interface LearnPageProps {
  onNavigate: (path: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LearnPage({ onNavigate }: LearnPageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const { data, loading, error } = useQuery(GET_CHAPTERS, {
    variables: { stateCode },
  })

  const chapters: Chapter[] = data?.chapters ?? []
  const progressList: Progress[] = data?.myProgress ?? []

  const progressMap = progressList.reduce<Record<number, Progress>>((acc, p) => {
    acc[p.chapter] = p
    return acc
  }, {})

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <BookOpen size={20} className="text-green-500" />
      <h1 className="font-display text-lg font-bold text-text-primary">Learn</h1>
    </div>
  )

  if (loading) {
    return (
      <PageWrapper header={header}>
        <div className="space-y-3 mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-surface-3 rounded w-2/3 mb-2" />
              <div className="h-3 bg-surface-3 rounded w-full mb-3" />
              <div className="h-2 bg-surface-3 rounded w-full" />
            </div>
          ))}
        </div>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper header={header}>
        <div className="card border-wrong/30 mt-4">
          <p className="text-wrong text-sm">Failed to load chapters. Check your connection.</p>
        </div>
      </PageWrapper>
    )
  }

  const completedCount = chapters.filter((ch) => {
    const p = progressMap[ch.number]
    return p && p.lessonsCompleted > 0 && p.lessonsCompleted >= p.lessonsTotal
  }).length

  return (
    <PageWrapper header={header}>
      {/* Summary row */}
      <div className="flex items-center justify-between mb-4 mt-1">
        <p className="text-text-secondary text-sm">
          {completedCount} of {chapters.length} chapters started
        </p>
        <span className="text-xs text-green-500 bg-green-500/10 border border-green-700/40 px-2 py-0.5 rounded-full">
          Oklahoma
        </span>
      </div>

      {/* Chapter list */}
      <div className="space-y-3">
        {chapters.map((chapter, index) => {
          const progress = progressMap[chapter.number]
          const lessonsCompleted = progress?.lessonsCompleted ?? 0
          const lessonsTotal = progress?.lessonsTotal ?? 0
          const isStarted = lessonsCompleted > 0
          const isComplete = isStarted && lessonsTotal > 0 && lessonsCompleted >= lessonsTotal

          // Lock chapters after the first if nothing started yet
          // (only lock if previous chapter hasn't been touched at all)
          const prevProgress = index > 0 ? progressMap[chapters[index - 1].number] : null
          const isLocked = index > 0 && !prevProgress && !isStarted

          const pct = lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0

          return (
            <button
              key={chapter.id}
              onClick={() => !isLocked && onNavigate(`/learn/${chapter.id}`)}
              disabled={isLocked}
              className={`w-full text-left card transition-all duration-150 ${
                isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:border-green-700 hover:bg-surface-2 active:scale-[0.99]'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Chapter number badge */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold font-mono ${
                  isComplete
                    ? 'bg-green-500/20 text-green-500 border border-green-700/50'
                    : isStarted
                    ? 'bg-surface-3 text-text-primary border border-border'
                    : 'bg-surface-2 text-text-secondary border border-border'
                }`}>
                  {isComplete ? <CheckCircle size={16} className="text-green-500" /> : chapter.number}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-text-primary text-sm leading-tight">
                      {chapter.title}
                    </h3>
                    {isLocked ? (
                      <Lock size={14} className="text-text-secondary flex-shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-text-secondary flex-shrink-0" />
                    )}
                  </div>

                  {chapter.description && (
                    <p className="text-text-secondary text-xs mt-0.5 line-clamp-1">
                      {chapter.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">
                        {isStarted ? `${lessonsCompleted} / ${lessonsTotal} lessons` : 'Not started'}
                      </span>
                      {isStarted && (
                        <span className={`text-xs font-mono font-medium ${
                          isComplete ? 'text-green-500' : 'text-text-secondary'
                        }`}>
                          {pct}%
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-green-500' : 'bg-green-700'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="h-4" />
    </PageWrapper>
  )
}