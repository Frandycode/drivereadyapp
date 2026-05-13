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
import { ArrowLeft, BookOpen, CheckCircle, Circle, AlertCircle, Trophy } from 'lucide-react'
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

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <button
        onClick={() => activeLessonId ? setActiveLessonId(null) : onNavigate('/learn')}
        className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-base font-bold text-text-primary truncate">
          {chapterNumber ? `Ch. ${chapterNumber} — ${chapterTitle}` : 'Chapter'}
        </h1>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <PageWrapper header={header}>
        <ChapterPageSkeleton />
      </PageWrapper>
    )
  }

  if (error) {
    return (
      <PageWrapper header={header}>
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

  return (
    <PageWrapper header={header}>
      {/* Progress summary */}
      <div className="mb-4 mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-text-secondary text-sm">
            {readCount} of {lessons.length} lessons completed
          </span>
          <span className="text-xs font-mono text-text-secondary">
            {lessons.length > 0 ? Math.round((readCount / lessons.length) * 100) : 0}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${lessons.length > 0 ? (readCount / lessons.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Lesson list */}
      <div className="space-y-2">
        {lessons.map((lesson, index) => {
          const isRead = !!lesson.readAt
          const isQuizDone = !!lesson.quizCompletedAt
          const borderClass = isQuizDone
            ? 'border-green-500'
            : isRead
              ? 'border-orange-500'
              : 'border-border'
          return (
            <button
              key={lesson.id}
              onClick={() => setActiveLessonId(lesson.id)}
              className={`w-full text-left card ${borderClass} hover:bg-surface-2 active:scale-[0.99] transition-all duration-150`}
            >
              <div className="flex items-center gap-3">
                {isQuizDone ? (
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                ) : isRead ? (
                  <AlertCircle size={18} className="text-orange-500 flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-text-secondary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isQuizDone ? 'text-text-secondary' : 'text-text-primary'}`}>
                    {lesson.title ?? `Lesson ${index + 1}`}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                    {isRead && !isQuizDone ? 'Pop quiz pending' : lesson.content}
                  </p>
                </div>
                <BookOpen size={14} className="text-text-secondary flex-shrink-0" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Pop quiz CTA */}
      {allRead && (
        <div className="mt-6 card border-yellow-rim">
          <p className="font-display font-bold text-text-primary mb-1 inline-flex items-center gap-2">
            <Trophy size={16} className="text-yellow" />
            Chapter Complete!
          </p>
          <p className="text-text-secondary text-sm mb-3">
            Test your knowledge with a quick 5-question pop quiz.
          </p>
          <button
            onClick={() => {
              onQuizStart()
            }}
            className="btn-gold w-full"
          >
            Take Pop Quiz
          </button>
        </div>
      )}

      <div className="h-4" />
    </PageWrapper>
  )
}