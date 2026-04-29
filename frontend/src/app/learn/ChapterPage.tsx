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
import { ArrowLeft, BookOpen, CheckCircle, Circle } from 'lucide-react'
import { LessonView } from './LessonView'
import { useState } from 'react'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_CHAPTER_LESSONS = gql`
  query GetChapterLessons($chapterId: ID!, $stateCode: String!) {
    lessons(chapterId: $chapterId) {
      id
      title
      content
      sortOrder
    }
    chapters(stateCode: $stateCode) {
      id
      number
      title
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string
  title?: string
  content: string
  sortOrder: number
}

interface ChapterPageProps {
  chapterId: string
  onNavigate: (path: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChapterPage({ chapterId, onNavigate }: ChapterPageProps) {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const { data, loading, error } = useQuery(GET_CHAPTER_LESSONS, {
    variables: { chapterId, stateCode: 'ok' },
  })

  const lessons: Lesson[] = data?.lessons ?? []
  const chapters = data?.chapters ?? []
  const chapter = chapters.find((c: { id: string }) => c.id === chapterId)

  function handleLessonComplete(lessonId: string) {
    setCompletedIds((prev) => new Set([...prev, lessonId]))
    setActiveLessonId(null)
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
          {chapter ? `Ch. ${chapter.number} — ${chapter.title}` : 'Chapter'}
        </h1>
      </div>
    </div>
  )

  if (loading) {
    return (
      <PageWrapper header={header}>
        <div className="space-y-3 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-surface-3 rounded w-1/2 mb-2" />
              <div className="h-3 bg-surface-3 rounded w-full" />
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
          onComplete={() => handleLessonComplete(lesson.id)}
          onNext={() => {
            handleLessonComplete(lesson.id)
            const nextIndex = lessons.findIndex((l) => l.id === activeLessonId) + 1
            if (nextIndex < lessons.length) {
              setActiveLessonId(lessons[nextIndex].id)
            }
          }}
        />
      )
    }
  }

  const allComplete = lessons.length > 0 && lessons.every((l) => completedIds.has(l.id))

  return (
    <PageWrapper header={header}>
      {/* Progress summary */}
      <div className="mb-4 mt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-text-secondary text-sm">
            {completedIds.size} of {lessons.length} lessons completed
          </span>
          <span className="text-xs font-mono text-text-secondary">
            {lessons.length > 0 ? Math.round((completedIds.size / lessons.length) * 100) : 0}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${lessons.length > 0 ? (completedIds.size / lessons.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Lesson list */}
      <div className="space-y-2">
        {lessons.map((lesson, index) => {
          const isDone = completedIds.has(lesson.id)
          return (
            <button
              key={lesson.id}
              onClick={() => setActiveLessonId(lesson.id)}
              className="w-full text-left card hover:border-green-700 hover:bg-surface-2 active:scale-[0.99] transition-all duration-150"
            >
              <div className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-text-secondary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? 'text-text-secondary' : 'text-text-primary'}`}>
                    {lesson.title ?? `Lesson ${index + 1}`}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                    {lesson.content}
                  </p>
                </div>
                <BookOpen size={14} className="text-text-secondary flex-shrink-0" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Pop quiz CTA */}
      {allComplete && (
        <div className="mt-6 card border-gold-600/50">
          <p className="font-display font-bold text-text-primary mb-1">
            Chapter Complete! 🎉
          </p>
          <p className="text-text-secondary text-sm mb-3">
            Test your knowledge with a quick 5-question pop quiz.
          </p>
          <button
            onClick={() => {
              onNavigate(`/learn/${chapterId}/quiz`)
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