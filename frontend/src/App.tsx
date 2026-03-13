import { useState, useEffect } from 'react'
import { useUserStore, applyTheme } from '@/stores'
import { BottomNav } from '@/components/layout/BottomNav'
import { AuthPage } from '@/app/auth'
import { HomePage } from '@/app/index'
import { LearnPage } from '@/app/learn/LearnPage'
import { ChapterPage } from '@/app/learn/ChapterPage'
import { StudyPage, type StudyConfig } from '@/app/study/StudyPage'
import { StudySession } from '@/app/study/StudySession'

// Placeholder for phases 3+
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center pb-20">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-green-500 mb-2">{title}</h2>
        <p className="text-text-secondary text-sm">Coming in Phase 3+</p>
      </div>
    </div>
  )
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [studyConfig, setStudyConfig] = useState<StudyConfig | null>(null)
  const { user, theme, isHydrated } = useUserStore()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  function navigate(to: string) {
    window.history.pushState({}, '', to)
    setPath(to)
    if (!to.startsWith('/study')) setStudyConfig(null)
  }

  if (!isHydrated) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="text-green-500 font-display text-xl animate-pulse">DriveReady</div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  // ── Route matching ─────────────────────────────────────────────────────────

  // /learn/:chapterId/quiz
  const quizMatch = path.match(/^\/learn\/([^/]+)\/quiz$/)
  if (quizMatch) {
    return (
      <div className="bg-bg min-h-dvh">
        <PlaceholderPage title="Pop Quiz — Coming in Phase 3" />
        <BottomNav activePath="/learn" onNavigate={navigate} />
      </div>
    )
  }

  // /learn/:chapterId
  const chapterMatch = path.match(/^\/learn\/([^/]+)$/)
  if (chapterMatch) {
    return (
      <div className="bg-bg min-h-dvh">
        <ChapterPage chapterId={chapterMatch[1]} onNavigate={navigate} />
        <BottomNav activePath="/learn" onNavigate={navigate} />
      </div>
    )
  }

  // /study — active session
  if (path === '/study' && studyConfig) {
    return (
      <div className="bg-bg min-h-dvh">
        <StudySession
          config={studyConfig}
          onExit={() => setStudyConfig(null)}
        />
      </div>
    )
  }

  // Top-level routes
  const PAGES: Record<string, React.ReactNode> = {
    '/': <HomePage />,
    '/learn': <LearnPage onNavigate={navigate} />,
    '/study': (
      <StudyPage
        onNavigate={navigate}
        onStart={(config) => setStudyConfig(config)}
      />
    ),
    '/challenge': <PlaceholderPage title="Challenge" />,
    '/profile': <PlaceholderPage title="Profile" />,
  }

  const currentPage = PAGES[path] ?? PAGES['/']

  return (
    <div className="bg-bg min-h-dvh">
      {currentPage}
      <BottomNav activePath={path} onNavigate={navigate} />
    </div>
  )
}