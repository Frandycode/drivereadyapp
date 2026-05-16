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

import { useState, useEffect, useRef } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useUserStore, applyDisplayPreferences, applyTheme } from '@/stores'
import { refreshAccessToken } from '@driveready/api-client'
import { BottomNav } from '@/components/layout/BottomNav'
import { AppTopNav } from '@/components/layout/AppTopNav'
import { AuthPage } from '@/app/auth'
import { LandingPage } from '@/app/landing/LandingPage'
import { ResetPasswordPage } from '@/app/ResetPasswordPage'
import { VariantPreviewPage } from '@/app/__variantPreview'
import { OnboardingPage } from '@/app/onboarding/OnboardingPage'
import { HomePage } from '@/app/index'
import { LearnPage } from '@/app/learn/LearnPage'
import { ChapterPage } from '@/app/learn/ChapterPage'
import { StudyPage, type StudyConfig } from '@/app/study/StudyPage'
import { StudySession } from '@/app/study/StudySession'
import { QuizSession, type QuizConfig } from '@/app/quiz/QuizSession'
import { PuzzleSession } from '@/app/quiz/PuzzleSession'
import { FlipperSession } from '@/app/quiz/FlipperSession'
import { TriviaSession } from '@/app/quiz/TriviaSession'
import { ChallengePage, type ChallengeConfig } from '@/app/quiz/ChallengePage'
import { ExamSession } from '@/app/quiz/ExamSession'
import { BotSelectScreen, type BotBattleConfig } from '@/app/battle/BotSelectScreen'
import { BotBattleSession } from '@/app/battle/BotBattleSession'
import { PeerBattleLobby, type PeerBattleSetup } from '@/app/battle/PeerBattleLobby'
import { PeerBattleSession } from '@/app/battle/PeerBattleSession'
import { ProfilePage } from '@/app/profile/ProfilePage'
import { ParentPage } from '@/app/parent/ParentPage'
import { TutorPage } from '@/app/tutor/TutorPage'
import { AdaptivePage } from '@/app/study/AdaptivePage'
import { SettingsPage } from '@/app/settings/SettingsPage'
import { OnboardingTutorialSheet } from '@/app/settings/OnboardingTutorialSheet'
import { DeleteAccountSheet } from '@/app/settings/DeleteAccountSheet'
import { clearAuthToken } from '@driveready/api-client'
import { FloatingBBT } from '@/components/layout/FloatingBBT'
import { DifficultyBars, getDifficultyCopy, type DifficultyCode } from '@/lib/difficulty'
import { FiPlayCircle } from 'react-icons/fi'

// ── Quiz Settings Modal ───────────────────────────────────────────────────────

function QuizSettingsModal({
  chapterId: _chapterId,
  chapterNumber,
  chapterTitle,
  onStart,
  onCancel,
}: {
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  onStart: (config: QuizConfig) => void
  onCancel: () => void
}) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')
  const [difficulty, setDifficulty]   = useState<DifficultyCode>('beginner')
  const [timer, setTimer]             = useState<number | null>(null)
  const [questionCount, setQuestionCount] = useState(5)

  const DIFFICULTIES = [
    { id: 'beginner'  as const },
    { id: 'pro' as const },
    { id: 'expert'  as const },
  ]

  const TIMERS = [
    { value: null, label: 'Off' },
    { value: 15,   label: '15s' },
    { value: 30,   label: '30s' },
    { value: 45,   label: '45s' },
    { value: 60,   label: '60s' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-5 w-full max-w-sm">
          <h2 className="font-display text-lg font-bold text-text-primary mb-1">Pop Quiz</h2>
          <p className="text-text-secondary text-sm mb-5">
            Ch. {chapterNumber} — {chapterTitle}
          </p>

          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">Questions</p>
          <div className="flex gap-2 mb-5">
            {[5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                  questionCount === n ? 'bg-green-500 text-bg' : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">Difficulty</p>
          <div className="space-y-2 mb-5">
            {DIFFICULTIES.map(({ id }) => {
              const cfg = getDifficultyCopy(id)
              return (
              <button
                key={id}
                onClick={() => setDifficulty(id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  difficulty === id ? cfg.activeClass : 'border-border hover:border-orange/40'
                }`}
              >
                <p className="text-sm font-medium text-text-primary flex items-center justify-between gap-3">
                  <span>{cfg.label}</span>
                  <DifficultyBars difficulty={id} compact />
                </p>
                <p className="text-xs text-text-secondary">{cfg.desc} · {cfg.xp}</p>
              </button>
              )
            })}
          </div>

          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">Timer per question</p>
          <div className="flex gap-2 mb-6">
            {TIMERS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setTimer(value)}
                className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                  timer === value ? 'bg-green-500 text-bg' : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => onStart({ stateCode, chapterNumber, chapterTitle, questionCount, difficulty, timerSeconds: timer })}
            className="btn-primary w-full h-12 text-base font-semibold"
          >
            Start Quiz
          </button>
        </div>
      </div>
    </>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

type AppScreen =
  | { screen: 'home' }
  | { screen: 'learn' }
  | { screen: 'chapter'; id: string; number: number; title: string }
  | { screen: 'quiz'; chapterId: string; chapterNumber: number; chapterTitle: string; config: QuizConfig }
  | { screen: 'quiz-settings'; chapterId: string; chapterNumber: number; chapterTitle: string }
  | { screen: 'study' }
  | { screen: 'study-session'; config: StudyConfig }
  | { screen: 'challenge' }
  | { screen: 'challenge-session'; config: ChallengeConfig }
  | { screen: 'bot-select' }
  | { screen: 'bot-battle'; config: BotBattleConfig }
  | { screen: 'peer-battle-lobby' }
  | { screen: 'peer-battle'; setup: PeerBattleSetup }
  | { screen: 'exam' }
  | { screen: 'profile' }
  | { screen: 'parent' }
  | { screen: 'tutor' }
  | { screen: 'adaptive' }
  | { screen: 'settings' }

const RECORD_CHAPTER_POP_QUIZ_COMPLETED = gql`
  mutation RecordChapterPopQuizCompleted($chapterId: ID!) {
    recordChapterPopQuizCompleted(chapterId: $chapterId)
  }
`

function screenForPath(to: string): AppScreen {
  if (to === '/')          return { screen: 'home' }
  if (to === '/learn')     return { screen: 'learn' }
  if (to === '/study')     return { screen: 'study' }
  if (to === '/challenge') return { screen: 'challenge' }
  if (to === '/profile')   return { screen: 'profile' }
  if (to === '/parent')    return { screen: 'parent' }
  if (to === '/tutor')     return { screen: 'tutor' }
  if (to === '/adaptive')  return { screen: 'adaptive' }
  if (to === '/settings')  return { screen: 'settings' }

  const chapterMatch = to.match(/^\/learn\/([^/]+)$/)
  if (chapterMatch) return { screen: 'chapter', id: chapterMatch[1], number: 0, title: '' }

  const quizMatch = to.match(/^\/learn\/([^/]+)\/quiz$/)
  if (quizMatch) return { screen: 'quiz-settings', chapterId: quizMatch[1], chapterNumber: 0, chapterTitle: '' }

  return { screen: 'home' }
}

export default function App() {
  const [path, setPath]           = useState(window.location.pathname)
  const [appScreen, setAppScreen] = useState<AppScreen>({ screen: 'home' })
  const [tokenReady, setTokenReady] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [showAuth, setShowAuth]         = useState(false)
  const [authMode, setAuthMode]         = useState<'login' | 'register'>('login')
  const scrollPositions = useRef(new Map<string, number>())
  const touchStart = useRef<{ x: number; y: number; target: EventTarget | null } | null>(null)
  const {
    user,
    theme,
    displayFontScale,
    displayBrightness,
    isHydrated,
    needsOnboarding,
    clearUser,
  } = useUserStore()
  const [recordChapterPopQuizCompleted] = useMutation(RECORD_CHAPTER_POP_QUIZ_COMPLETED)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = () => applyTheme('system')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])
  useEffect(() => {
    applyDisplayPreferences({
      fontScale: displayFontScale,
      brightness: displayBrightness,
    })
  }, [displayFontScale, displayBrightness])

  useEffect(() => {
    const handlePop = () => {
      scrollPositions.current.set(path, window.scrollY)
      const nextPath = window.location.pathname
      setPath(nextPath)
      setAppScreen(screenForPath(nextPath))
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [path])

  useEffect(() => {
    const saved = scrollPositions.current.get(path)
    if (saved === undefined) return
    window.setTimeout(() => window.scrollTo({ top: saved, behavior: 'auto' }), 0)
  }, [path, appScreen.screen])

  useEffect(() => {
    function isInteractiveTarget(target: EventTarget | null) {
      if (!(target instanceof Element)) return false
      return Boolean(target.closest('input, textarea, select, button, a, [role="button"], [data-swipe-lock], .perspective-1200'))
    }

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      if (!touch || isInteractiveTarget(e.target)) return
      touchStart.current = { x: touch.clientX, y: touch.clientY, target: e.target }
    }

    function handleTouchEnd(e: TouchEvent) {
      const start = touchStart.current
      touchStart.current = null
      const touch = e.changedTouches[0]
      if (!start || !touch || isInteractiveTarget(start.target)) return

      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      if (Math.abs(dx) < 90 || Math.abs(dx) < Math.abs(dy) * 1.4) return

      scrollPositions.current.set(path, window.scrollY)
      if (dx > 0) window.history.back()
      else window.history.forward()
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [path])

  useEffect(() => {
    if (!isHydrated) return
    if (!user) { setTokenReady(true); return }
    // User is in persisted store but access token is gone — silently refresh
    refreshAccessToken().then((ok) => {
      if (!ok) clearUser()
      setTokenReady(true)
    })
  }, [isHydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isHydrated && !user) {
      setAppScreen({ screen: 'home' })
      window.history.replaceState({}, '', '/')
      setPath('/')
    }
  }, [user, isHydrated])

  function navigate(to: string) {
    scrollPositions.current.set(path, window.scrollY)
    window.history.pushState({}, '', to)
    setPath(to)
    setAppScreen(screenForPath(to))
  }

  // Password reset deep link — handle before auth check
  const resetToken = new URLSearchParams(window.location.search).get('token')
  if (path === '/reset-password' && resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onDone={() => {
          window.history.replaceState({}, '', '/')
          setPath('/')
        }}
      />
    )
  }

  if (path === '/__variantPreview') return <VariantPreviewPage />

  if (!isHydrated || !tokenReady) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="text-green-500 font-display text-xl animate-pulse">DriveReady</div>
      </div>
    )
  }

  if (!user) {
    if (showAuth) return <AuthPage key={authMode} initialMode={authMode} />
    return (
      <LandingPage
        onStartFree={() => {
          setAuthMode('register')
          setShowAuth(true)
        }}
      />
    )
  }

  if (needsOnboarding) {
    return <OnboardingPage onDone={() => setAppScreen({ screen: 'home' })} />
  }

  const activeNavPath =
    appScreen.screen === 'home'               ? '/' :
    appScreen.screen.startsWith('learn') ||
    appScreen.screen === 'chapter' ||
    appScreen.screen.startsWith('quiz')       ? '/learn' :
    appScreen.screen.startsWith('study')      ? '/study' :
    appScreen.screen.startsWith('challenge') ||
    appScreen.screen.startsWith('bot') ||
    appScreen.screen.startsWith('peer') ||
    appScreen.screen === 'exam'               ? '/challenge' : '/'

  // ── Screen routing ─────────────────────────────────────────────────────────

  // Active quiz session (pop quiz)
  if (appScreen.screen === 'quiz') {
    return (
      <QuizSession
        config={appScreen.config}
        onExit={() => setAppScreen({ screen: 'chapter', id: appScreen.chapterId, number: appScreen.chapterNumber, title: appScreen.chapterTitle })}
        onQuizComplete={() => {
          recordChapterPopQuizCompleted({ variables: { chapterId: appScreen.chapterId } }).catch((err) => {
            console.warn('recordChapterPopQuizCompleted error:', err.message)
          })
        }}
      />
    )
  }

  // Quiz settings modal
  if (appScreen.screen === 'quiz-settings') {
    return (
      <div className="bg-bg min-h-dvh">
        <AppTopNav
          activePath="/learn"
          displayName={user?.displayName}
          xpTotal={user?.xpTotal}
          onNavigate={navigate}
          onTutorial={() => setTutorialOpen(true)}
        />
        <ChapterPage
          chapterId={appScreen.chapterId}
          chapterNumber={appScreen.chapterNumber}
          chapterTitle={appScreen.chapterTitle}
          onNavigate={navigate}
          onQuizStart={() => {}}
        />
        <BottomNav activePath="/learn" onNavigate={navigate} />
        <QuizSettingsModal
          chapterId={appScreen.chapterId}
          chapterNumber={appScreen.chapterNumber}
          chapterTitle={appScreen.chapterTitle}
          onStart={(cfg) => setAppScreen({ screen: 'quiz', chapterId: appScreen.chapterId, chapterNumber: appScreen.chapterNumber, chapterTitle: appScreen.chapterTitle, config: cfg })}
          onCancel={() => setAppScreen({ screen: 'chapter', id: appScreen.chapterId, number: appScreen.chapterNumber, title: appScreen.chapterTitle })}
        />
        <OnboardingTutorialSheet open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      </div>
    )
  }

  // Chapter page
  if (appScreen.screen === 'chapter') {
    return (
      <div className="bg-bg min-h-dvh">
        <AppTopNav
          activePath="/learn"
          displayName={user?.displayName}
          xpTotal={user?.xpTotal}
          onNavigate={navigate}
          onTutorial={() => setTutorialOpen(true)}
        />
        <ChapterPage
          chapterId={appScreen.id}
          chapterNumber={appScreen.number}
          chapterTitle={appScreen.title}
          onNavigate={navigate}
          onQuizStart={() => setAppScreen({ screen: 'quiz-settings', chapterId: appScreen.id, chapterNumber: appScreen.number, chapterTitle: appScreen.title })}
        />
        <BottomNav activePath="/learn" onNavigate={navigate} />
        <OnboardingTutorialSheet open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      </div>
    )
  }

  // Study session
  if (appScreen.screen === 'study-session') {
    return (
      <StudySession
        config={appScreen.config}
        onExit={() => setAppScreen({ screen: 'study' })}
      />
    )
  }

  // Challenge session
  if (appScreen.screen === 'challenge-session') {
    const cfg = appScreen.config
    const onExit = () => setAppScreen({ screen: 'challenge' })
    if (cfg.type === 'quiz')    return <QuizSession    config={cfg} onExit={onExit} />
    if (cfg.type === 'puzzle')  return <PuzzleSession  config={cfg} onExit={onExit} />
    if (cfg.type === 'flipper') return <FlipperSession config={cfg} onExit={onExit} />
    if (cfg.type === 'trivia')  return <TriviaSession  config={cfg} onExit={onExit} />
  }

  // Bot select screen
  if (appScreen.screen === 'bot-select') {
    return (
      <BotSelectScreen
        onStart={(cfg) => setAppScreen({ screen: 'bot-battle', config: cfg })}
        onBack={() => setAppScreen({ screen: 'challenge' })}
      />
    )
  }

  // Bot battle session
  if (appScreen.screen === 'bot-battle') {
    return (
      <BotBattleSession
        config={appScreen.config}
        onExit={() => setAppScreen({ screen: 'challenge' })}
      />
    )
  }

  // Peer battle lobby
  if (appScreen.screen === 'peer-battle-lobby') {
    return (
      <PeerBattleLobby
        onStart={(setup) => setAppScreen({ screen: 'peer-battle', setup })}
        onBack={() => setAppScreen({ screen: 'challenge' })}
      />
    )
  }

  // Peer battle session
  if (appScreen.screen === 'peer-battle') {
    return (
      <PeerBattleSession
        setup={appScreen.setup}
        onExit={() => setAppScreen({ screen: 'challenge' })}
      />
    )
  }

  // Exam session
  if (appScreen.screen === 'exam') {
    return (
      <ExamSession onExit={() => setAppScreen({ screen: 'challenge' })} />
    )
  }

  // Top-level pages
  const PAGES: Record<string, React.ReactNode> = {
    home: <HomePage onNavigate={navigate} />,
    learn: (
      <LearnPage
        onNavigate={navigate}
        onChapterSelect={(id, number, title) => {
          window.history.pushState({}, '', `/learn/${id}`)
          setPath(`/learn/${id}`)
          setAppScreen({ screen: 'chapter', id, number, title })
        }}
      />
    ),
    study: (
      <StudyPage
        onNavigate={navigate}
        onStart={(config) => setAppScreen({ screen: 'study-session', config })}
      />
    ),
    challenge: (
      <ChallengePage
        onStart={(config) => setAppScreen({ screen: 'challenge-session', config })}
        onBotBattle={() => setAppScreen({ screen: 'bot-select' })}
        onPeerBattle={() => setAppScreen({ screen: 'peer-battle-lobby' })}
        onExam={() => setAppScreen({ screen: 'exam' })}
      />
    ),
    profile: <ProfilePage onNavigate={navigate} />,
    parent: <ParentPage onNavigate={navigate} />,
    tutor: <TutorPage />,
    adaptive: <AdaptivePage stateCode={user?.stateCode ?? 'ok'} />,
    settings: (
      <SettingsPage
        onNavigate={navigate}
        onOpenTutorial={() => setTutorialOpen(true)}
        onSignOut={() => {
          clearAuthToken()
          clearUser()
        }}
        onDeleteAccount={() => setDeleteOpen(true)}
      />
    ),
  }

  const pageKey = appScreen.screen as string
  const currentPage = PAGES[pageKey] ?? PAGES['home']

  // FloatingBBT visible only on dashboard-style pages, never during sessions
  const showFloatingBBT = pageKey in PAGES

  return (
    <div className="bg-bg min-h-dvh">
      <AppTopNav
        activePath={activeNavPath}
        displayName={user?.displayName}
        xpTotal={user?.xpTotal}
        onNavigate={navigate}
        onTutorial={() => setTutorialOpen(true)}
      />
      {currentPage}
      {showFloatingBBT && (
        <button
          onClick={() => setTutorialOpen(true)}
          className="fixed right-4 top-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-yellow-rim/30 bg-yellow-soft px-3 py-2 text-[11px] font-semibold text-yellow shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur-md transition-colors hover:bg-yellow/15 hover:border-yellow-rim lg:hidden"
        >
          <FiPlayCircle size={13} />
          See how it works
        </button>
      )}
      {showFloatingBBT && (
        <FloatingBBT onClick={() => setAppScreen({ screen: 'bot-select' })} />
      )}
      <BottomNav activePath={activeNavPath} onNavigate={navigate} />
      <OnboardingTutorialSheet open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <DeleteAccountSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          clearAuthToken()
          clearUser()
        }}
      />
    </div>
  )
}
