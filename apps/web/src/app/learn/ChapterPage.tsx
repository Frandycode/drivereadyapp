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
import { PageHeader } from '@/components/layout/PageHeader'
import { FaTrophy as Trophy } from 'react-icons/fa'
import { FiArrowLeft as ArrowLeft, FiBookOpen as BookOpen, FiCheckCircle as CheckCircle, FiCircle as Circle, FiAlertCircle as AlertCircle } from 'react-icons/fi'
import { FiArrowRight } from 'react-icons/fi'
import { LessonView } from './LessonView'
import { useState } from 'react'
import { useMinLoadTime } from '@driveready/hooks'
import { ChapterPageSkeleton } from '@/components/ui/Skeleton'

// ── GraphQL ───────────────────────────────────────────────────────────────────

export const GET_CHAPTER_LESSONS = gql`
  query GetChapterLessons($chapterId: ID!) {
    lessons(chapterId: $chapterId) {
      id
      title
      content
      sortOrder
      readAt
      quizCompletedAt
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string
  title?: string
  content: string
  sortOrder: number
  readAt?: string | null
  quizCompletedAt?: string | null
}

interface ChapterPageProps {
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  onNavigate: (path: string) => void
  onQuizStart: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChapterPage({ chapterId, chapterNumber, chapterTitle, onNavigate, onQuizStart }: ChapterPageProps) {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery(GET_CHAPTER_LESSONS, {
    variables: { chapterId },
    fetchPolicy: 'cache-and-network',
  })

  const isLoading = useMinLoadTime(loading)

  const lessons: Lesson[] = data?.lessons ?? []
  const readCount = lessons.filter((l) => l.readAt).length

  function handleLessonComplete() {
    setActiveLessonId(null)
    refetch()
  }

  const readPct = lessons.length > 0 ? Math.round((readCount / lessons.length) * 100) : 0

  const compactHeader = (
    <div className="px-4 py-3 flex items-center gap-3 max-w-dashboard mx-auto w-full">
      <button
        onClick={() => activeLessonId ? setActiveLessonId(null) : onNavigate('/learn')}
        className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="mono text-[10px] text-text-muted tracking-[0.1em] uppercase">
          Chapter {String(chapterNumber).padStart(2, '0')}
        </div>
        <h1 className="display font-bold text-sm text-white truncate -mt-0.5">
          {chapterTitle || 'Chapter'}
        </h1>
      </div>
      {!activeLessonId && lessons.length > 0 && (
        <span className="mono text-[11px] text-yellow font-semibold flex-shrink-0">
          {readPct}%
        </span>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <PageWrapper onNavigate={onNavigate} header={compactHeader}>
        <ChapterPageSkeleton />
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper onNavigate={onNavigate} header={compactHeader}>
        <div className="card border-wrong/30 mt-4">
          <p className="text-wrong text-sm">Failed to load lessons.</p>
        </div>
      </PageWrapper>
    )
  }

  // Show lesson view if one is active
  if (activeLessonId) {
    const lesson = lessons.find((l) => l.id === activeLessonId)
    if (lesson) {
      return (
        <LessonView
          lesson={lesson}
          chapterId={chapterId}
          lessonIndex={lessons.findIndex((l) => l.id === activeLessonId)}
          totalLessons={lessons.length}
          onBack={() => setActiveLessonId(null)}
          onComplete={() => handleLessonComplete()}
          onNext={() => {
            const nextIndex = lessons.findIndex((l) => l.id === activeLessonId) + 1
            refetch()
            if (nextIndex < lessons.length) {
              setActiveLessonId(lessons[nextIndex].id)
            } else {
              setActiveLessonId(null)
            }
          }}
        />
      )
    }
  }

  const allRead = lessons.length > 0 && lessons.every((l) => l.readAt)
  const quizDoneCount = lessons.filter((l) => l.quizCompletedAt).length

  return (
    <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
      <PageHeader
        eyebrow={`Chapter ${String(chapterNumber).padStart(2, '0')}`}
        title={
          <>
            {chapterTitle.split(' ').slice(0, -1).join(' ')}{' '}
            <em className="not-italic text-orange">
              {chapterTitle.split(' ').slice(-1)[0] ?? ''}
            </em>
          </>
        }
        sub="Read each lesson, then take the chapter pop quiz to cement the rules."
        stats={[
          { label: 'Lessons',  value: lessons.length || '—' },
          { label: 'Read',     value: readCount,             tone: 'orange' },
          { label: 'Quiz done',value: quizDoneCount,         tone: 'green' },
        ]}
        variant="brown"
      />

      <div className="bg-navy blueprint-grid">
        <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10 sm:py-14 grid lg:grid-cols-[260px_1fr] gap-8 items-start">

          {/* ── Lessons sidebar ─────────────────────────────────────────── */}
          <aside className="bg-surface-2 border border-border rounded-lg p-5 lg:sticky lg:top-[88px]">
            <div className="mono text-[10px] tracking-[0.12em] uppercase text-text-muted mb-3.5">
              Lessons
            </div>
            <ul className="flex flex-col gap-0.5">
              {lessons.map((lesson, idx) => {
                const isRead = !!lesson.readAt
                const isQuizDone = !!lesson.quizCompletedAt
                const num = String(idx + 1).padStart(2, '0')
                const numTone = isQuizDone ? 'text-correct' : isRead ? 'text-orange' : 'text-text-muted'
                return (
                  <li key={lesson.id}>
                    <button
                      onClick={() => setActiveLessonId(lesson.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-text-secondary hover:bg-orange-soft hover:text-white transition-colors text-left"
                    >
                      <span className={`mono text-[10px] w-5 flex-shrink-0 ${numTone}`}>{num}</span>
                      <span className="flex-1 min-w-0 text-[13px] truncate">
                        {lesson.title ?? `Lesson ${idx + 1}`}
                      </span>
                      {isQuizDone ? (
                        <CheckCircle size={13} className="text-correct flex-shrink-0" />
                      ) : isRead ? (
                        <AlertCircle size={13} className="text-orange flex-shrink-0" />
                      ) : (
                        <Circle size={13} className="text-text-faint flex-shrink-0" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Progress bar */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="mono text-[10px] text-text-muted mb-1.5 flex items-center justify-between">
                <span>Progress</span>
                <span className="text-yellow font-semibold">{readPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-yellow transition-all duration-500"
                  style={{ width: `${readPct}%` }}
                />
              </div>
            </div>
          </aside>

          {/* ── Main content ────────────────────────────────────────────── */}
          <div className="min-w-0">
            <div className="mono text-[11px] text-text-muted uppercase tracking-[0.06em] mb-4">
              Learn / <em className="not-italic text-orange">{chapterTitle}</em>
            </div>

            <h2 className="display font-extrabold text-[clamp(22px,2.6vw,32px)] tracking-[-0.6px] leading-tight text-white mb-2.5">
              Pick a lesson to start
            </h2>
            <p className="text-text-secondary font-light leading-relaxed mb-8 max-w-[560px]">
              Lessons are short — most take 1-2 minutes. Tap the sidebar to jump in, or scroll the cards below.
            </p>

            {/* Lesson card list */}
            <div className="space-y-3">
              {lessons.map((lesson, idx) => {
                const isRead     = !!lesson.readAt
                const isQuizDone = !!lesson.quizCompletedAt
                const borderTone = isQuizDone
                  ? 'border-correct/40'
                  : isRead
                    ? 'border-orange/40'
                    : 'border-border'
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`w-full text-left bg-surface-2 ${borderTone} border rounded-lg p-5 hover:bg-surface-3 hover:border-orange/40 active:scale-[0.99] transition-all duration-150 animate-fade-up`}
                    style={{ animationDelay: `${(idx % 8) * 0.03}s` }}
                  >
                    <div className="flex items-center gap-3">
                      {isQuizDone ? (
                        <CheckCircle size={18} className="text-correct flex-shrink-0" />
                      ) : isRead ? (
                        <AlertCircle size={18} className="text-orange flex-shrink-0" />
                      ) : (
                        <Circle size={18} className="text-text-muted flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="mono text-[10px] text-text-muted uppercase tracking-[0.08em] mb-0.5">
                          Lesson {String(idx + 1).padStart(2, '0')}
                        </div>
                        <p className={`display font-bold text-sm ${isQuizDone ? 'text-text-secondary' : 'text-white'}`}>
                          {lesson.title ?? `Lesson ${idx + 1}`}
                        </p>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-1 font-light">
                          {isRead && !isQuizDone ? 'Pop quiz pending' : lesson.content}
                        </p>
                      </div>
                      <BookOpen size={14} className="text-text-muted flex-shrink-0" />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pop quiz CTA */}
            {allRead && (
              <div className="mt-6 relative overflow-hidden rounded-lg p-6 bg-surface-2 border border-yellow-rim animate-fade-up">
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-yellow opacity-[0.06] pointer-events-none" />
                <div className="relative flex items-center gap-3 mb-1.5">
                  <Trophy size={18} className="text-yellow" />
                  <div className="display font-bold text-white">Chapter complete</div>
                </div>
                <p className="text-text-secondary text-sm mb-4 font-light max-w-[420px]">
                  Test your knowledge with a quick 5-question pop quiz. Beat 80% to mark the chapter done.
                </p>
                <button
                  onClick={onQuizStart}
                  className="btn-yellow inline-flex items-center gap-1.5"
                >
                  Take Pop Quiz
                  <FiArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}
