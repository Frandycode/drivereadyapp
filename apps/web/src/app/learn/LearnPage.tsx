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
import { FiCheck, FiLock } from 'react-icons/fi'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { useUserStore } from '@/stores'
import { useMinLoadTime } from '@driveready/hooks'
import { LearnPageSkeleton } from '@/components/ui/Skeleton'

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
  onChapterSelect: (id: string, number: number, title: string) => void
}

export function LearnPage({ onNavigate, onChapterSelect }: LearnPageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const { data, loading, error } = useQuery(GET_CHAPTERS, { variables: { stateCode } })
  const isLoading = useMinLoadTime(loading)

  const chapters: Chapter[] = data?.chapters ?? []
  const progressList: Progress[] = data?.myProgress ?? []
  const progressMap = progressList.reduce<Record<number, Progress>>((acc, p) => {
    acc[p.chapter] = p
    return acc
  }, {})

  const totalLessons = progressList.reduce((sum, p) => sum + p.lessonsTotal, 0)
  const completedChapters = chapters.filter((ch) => {
    const p = progressMap[ch.number]
    return p && p.lessonsCompleted > 0 && p.lessonsCompleted >= p.lessonsTotal
  }).length

  const header = (
    <PageHeader
      eyebrow="Curriculum · Oklahoma DPS"
      title={
        <>
          Every chapter, <em className="not-italic text-orange">every sign,</em>
          <br />every rule.
        </>
      }
      sub="Twelve chapters, bite-sized cards, end-of-chapter pop quizzes. Bookmark anything tricky and the AI will keep it warm."
      stats={[
        { label: 'Chapters',  value: chapters.length || '—' },
        { label: 'Lessons',   value: totalLessons || '—',          tone: 'gold' },
        { label: 'Completed', value: completedChapters,            tone: 'orange' },
      ]}
      slab="yellow"
    />
  )

  if (isLoading) {
    return (
      <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
        {header}
        <div className="bg-navy blueprint-grid">
          <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10">
            <LearnPageSkeleton />
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
        {header}
        <div className="bg-navy blueprint-grid">
          <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10">
            <div className="card border-wrong/30">
              <p className="text-wrong text-sm">Failed to load chapters. Check your connection.</p>
            </div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
      {header}

      <div className="bg-navy blueprint-grid">
        <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10 sm:py-14">

          {/* Section header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-3 text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Chapters
            </div>
            <h2 className="display font-extrabold text-[clamp(22px,2.6vw,32px)] leading-tight tracking-[-0.6px] text-white mb-2.5">
              Work top to bottom, or pick your gap.
            </h2>
            <p className="text-text-secondary font-light leading-relaxed max-w-[560px]">
              Each chapter ends with a quick pop quiz. Hit 80% to mark it done — anything red is fair game for adaptive practice later.
            </p>
          </div>

          {/* Chapter grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chapters.map((chapter, index) => {
              const progress = progressMap[chapter.number]
              const lessonsCompleted = progress?.lessonsCompleted ?? 0
              const lessonsTotal     = progress?.lessonsTotal ?? 0
              const isStarted        = lessonsCompleted > 0
              const isComplete       = isStarted && lessonsTotal > 0 && lessonsCompleted >= lessonsTotal
              const prevProgress     = index > 0 ? progressMap[chapters[index - 1].number] : null
              const isLocked         = index > 0 && !prevProgress && !isStarted
              const pct              = lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0

              return (
                <ChapterCard
                  key={chapter.id}
                  chapter={chapter}
                  lessonsCompleted={lessonsCompleted}
                  lessonsTotal={lessonsTotal}
                  pct={pct}
                  isLocked={isLocked}
                  isStarted={isStarted}
                  isComplete={isComplete}
                  delaySec={(index % 6) * 0.05}
                  onClick={() => !isLocked && onChapterSelect(chapter.id, chapter.number, chapter.title)}
                />
              )
            })}
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}

// ── Chapter card ─────────────────────────────────────────────────────────────

interface ChapterCardProps {
  chapter: Chapter
  lessonsCompleted: number
  lessonsTotal: number
  pct: number
  isLocked: boolean
  isStarted: boolean
  isComplete: boolean
  delaySec: number
  onClick: () => void
}

function ChapterCard({
  chapter,
  lessonsCompleted,
  lessonsTotal,
  pct,
  isLocked,
  isStarted,
  isComplete,
  delaySec,
  onClick,
}: ChapterCardProps) {
  const status: 'done' | 'active' | 'locked' | 'open' = isComplete
    ? 'done'
    : isLocked
      ? 'locked'
      : isStarted
        ? 'active'
        : 'open'

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      style={{ animationDelay: `${delaySec}s` }}
      className={`group relative flex flex-col text-left rounded-lg overflow-hidden bg-surface-2 border transition-all duration-200 animate-fade-up
        ${isLocked
          ? 'opacity-50 cursor-not-allowed border-border'
          : 'border-border hover:bg-surface-3 hover:border-orange/40 hover:-translate-y-0.5 cursor-pointer'
        }`}
    >
      {/* Head */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="min-w-0">
          <div className="mono text-[11px] text-text-muted uppercase tracking-[0.1em] mb-1.5">
            Chapter {String(chapter.number).padStart(2, '0')}
          </div>
          <div className="display font-bold text-base leading-tight tracking-[-0.2px] text-white">
            {chapter.title}
          </div>
        </div>
        <div className="mono text-[34px] font-bold text-orange/50 leading-none flex-shrink-0">
          {String(chapter.number).padStart(2, '0')}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-5 py-4">
        <div className="flex items-center gap-3 mb-3 mono text-[10px] text-text-muted uppercase tracking-[0.08em]">
          <span>{lessonsTotal || '—'} lessons</span>
          <span className="w-[3px] h-[3px] rounded-full bg-text-faint" />
          <span>~{Math.max(8, lessonsTotal * 2)} min</span>
        </div>
        {chapter.description && (
          <p className="text-[13px] text-text-secondary leading-relaxed mb-4 flex-1">
            {chapter.description}
          </p>
        )}

        {/* Foot */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex-1 min-w-0">
            <div className="mono text-[11px] font-semibold text-yellow mb-1.5">
              {lessonsCompleted} / {lessonsTotal || '—'} lessons
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-correct' : 'bg-orange-yellow'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <StatusChip status={status} />
        </div>
      </div>
    </button>
  )
}

function StatusChip({ status }: { status: 'done' | 'active' | 'locked' | 'open' }) {
  const base =
    'inline-flex items-center gap-1 mono text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-md flex-shrink-0 border'
  if (status === 'done') {
    return (
      <span className={`${base} bg-green-soft text-correct border-correct/30`}>
        <FiCheck size={10} strokeWidth={3} /> Done
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className={`${base} bg-orange-soft text-orange border-orange/30`}>
        In progress
      </span>
    )
  }
  if (status === 'locked') {
    return (
      <span className={`${base} bg-white/[0.04] text-text-muted border-strong`}>
        <FiLock size={10} /> Locked
      </span>
    )
  }
  return (
    <span className={`${base} bg-white/[0.04] text-text-muted border-strong`}>Open</span>
  )
}
