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
import { FiArrowRight } from 'react-icons/fi'
import { useEffect, useRef, useState } from 'react'

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

const MARK_LESSON_READ = gql`
  mutation MarkLessonRead($lessonId: ID!) {
    markLessonRead(lessonId: $lessonId)
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

  const [markLessonRead] = useMutation(MARK_LESSON_READ, {
    variables: { lessonId: lesson.id },
    onError: (err) => {
      console.warn('markLessonRead error:', err.message)
    },
  })

  async function handleComplete() {
    await Promise.all([completeLesson(), markLessonRead()])
    onComplete()
  }

  const isLast = lessonIndex === totalLessons - 1

  // ── Scroll-progress ribbon ─────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPct, setScrollPct] = useState(0)

  useEffect(() => {
    function onScroll() {
      const el = scrollRef.current
      if (!el) return
      const max = el.scrollHeight - el.clientHeight
      if (max <= 0) { setScrollPct(100); return }
      setScrollPct(Math.min(100, Math.max(0, (el.scrollTop / max) * 100)))
    }
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll)
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [lesson.id])

  const header = (
    <div className="relative">
      <div className="px-4 py-3 flex items-center gap-3 max-w-content mx-auto">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-text-secondary hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="mono text-[11px] text-text-muted">
              {String(lessonIndex + 1).padStart(2, '0')} / {String(totalLessons).padStart(2, '0')}
            </span>
            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-yellow rounded-full transition-all duration-300"
                style={{ width: `${((lessonIndex + 1) / totalLessons) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setBookmarked((b) => !b)}
          className={`p-1 transition-colors ${bookmarked ? 'text-yellow' : 'text-text-secondary hover:text-yellow'}`}
          aria-label="Bookmark"
        >
          <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
      {/* Reading-progress ribbon (within the current lesson) */}
      <div className="absolute left-0 right-0 -bottom-px h-[2px] bg-transparent">
        <div
          className="h-full bg-orange transition-[width] duration-100"
          style={{ width: `${scrollPct}%` }}
        />
      </div>
    </div>
  )

  return (
    <PageWrapper header={header} fullScreen hideFooter>
      <div ref={scrollRef} className="overflow-y-auto px-4 sm:px-10 py-10 sm:py-14 max-w-content mx-auto w-full" style={{ height: 'calc(100dvh - 64px)' }}>
        <div className="mono text-[11px] text-text-muted uppercase tracking-[0.06em] mb-4 animate-fade-up">
          Lesson <em className="not-italic text-orange">{String(lessonIndex + 1).padStart(2, '0')}</em>
        </div>

        {lesson.title && (
          <h1 className="display font-extrabold text-[clamp(28px,3.6vw,40px)] leading-[1.05] tracking-[-0.9px] text-white mb-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            {lesson.title}
          </h1>
        )}

        <div className="text-[17px] font-light leading-[1.65] text-text-secondary mb-8 max-w-[640px] animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {/* Lede is first paragraph (or full content fallback) — bigger styling */}
          {lesson.content.length > 280 ? lesson.content.slice(0, 240).trim() + '…' : lesson.content}
        </div>

        {/* Full body */}
        <div className="text-[15px] leading-[1.75] text-text-primary max-w-[680px] whitespace-pre-wrap animate-fade-up" style={{ animationDelay: '0.15s' }}>
          {lesson.content}
        </div>

        {/* Foot navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-12 pt-6 border-t border-border max-w-[680px]">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-surface-2 border border-border text-text-secondary hover:text-white hover:border-orange/40 hover:bg-surface-3 transition-all"
          >
            <ArrowLeft size={16} />
            <div className="text-left leading-tight">
              <div className="mono text-[10px] text-text-muted uppercase tracking-[0.1em]">Back</div>
              <div className="display font-bold text-[13px] text-white">Lessons</div>
            </div>
          </button>

          <button
            onClick={handleComplete}
            disabled={completing}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-orange text-white display font-bold text-[14px] hover:bg-orange-deep hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(244,91,38,0.35)] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {completing
              ? 'Saving…'
              : isLast
                ? <>Complete Lesson <CheckCircle size={16} /></>
                : <>Next Lesson <FiArrowRight size={16} /></>
            }
          </button>
        </div>
      </div>
    </PageWrapper>
  )
}