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

import { useMutation, gql } from '@apollo/client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ArrowLeft, ArrowRight, CheckCircle, Bookmark } from 'lucide-react'
import { useState } from 'react'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const COMPLETE_LESSON = gql`
  mutation CompleteLesson($lessonId: ID!) {
    completeLesson(lessonId: $lessonId) {
      chapter
      lessonsCompleted
      lessonsTotal
    }
  }
`

const SAVE_BOOKMARK = gql`
  mutation SaveBookmark($questionId: ID!) {
    saveBookmark(questionId: $questionId) {
      id
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

interface LessonViewProps {
  lesson: Lesson
  chapterId: string
  lessonIndex: number
  totalLessons: number
  onBack: () => void
  onComplete: () => void
  onNext: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LessonView({
  lesson,
  lessonIndex,
  totalLessons,
  onBack,
  onComplete,
  onNext,
}: LessonViewProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const [completeLesson, { loading: completing }] = useMutation(COMPLETE_LESSON, {
    variables: { lessonId: lesson.id },
    onCompleted: () => {
      setIsCompleted(true)
    },
    onError: (err) => {
      // If not logged in or other error, still mark complete locally
      console.warn('completeLesson error:', err.message)
      setIsCompleted(true)
    },
  })

  async function handleComplete() {
    await completeLesson()
    onComplete()
  }

  const isLast = lessonIndex === totalLessons - 1

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <button
        onClick={onBack}
        className="p-1 -ml-1 text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-mono">
            {lessonIndex + 1} / {totalLessons}
          </span>
          <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${((lessonIndex + 1) / totalLessons) * 100}%` }}
            />
          </div>
        </div>
      </div>
      {/* Bookmark button — visual only for now */}
      <button
        onClick={() => setBookmarked((b) => !b)}
        className={`p-1 transition-colors ${bookmarked ? 'text-gold-500' : 'text-text-secondary hover:text-gold-500'}`}
        aria-label="Bookmark"
      >
        <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
      </button>
    </div>
  )

  return (
    <PageWrapper header={header} fullScreen={false}>
      <div className="mt-2">
        {/* Lesson card */}
        <div className="card-elevated mb-6">
          {lesson.title && (
            <h2 className="font-display text-xl font-bold text-text-primary mb-3">
              {lesson.title}
            </h2>
          )}
          <p className="text-text-primary text-base leading-relaxed">
            {lesson.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isLast ? (
            <>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Got it
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="btn-primary w-full flex items-center justify-center gap-2 h-12 text-base"
            >
              {completing ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle size={18} />
                  Complete Lesson
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}