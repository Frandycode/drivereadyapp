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

import { useState, useEffect } from 'react'
import { useMutation, gql } from '@apollo/client'
import { useUserStore, applyTheme } from '@/stores'
import { refreshAccessToken } from '@driveready/api-client'
import { BottomNav } from '@/components/layout/BottomNav'
import { AuthPage } from '@/app/auth'
import { ResetPasswordPage } from '@/app/ResetPasswordPage'
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
  const [difficulty, setDifficulty]   = useState<'pawn' | 'rogue' | 'king'>('pawn')
  const [timer, setTimer]             = useState<number | null>(null)
  const [questionCount, setQuestionCount] = useState(5)

  const DIFFICULTIES = [
    { id: 'pawn'  as const, label: '♟ Pawn',   desc: 'Unlimited hints & skips · 1× XP', activeClass: 'border-bronze-500 bg-bronze-500/5' },
    { id: 'rogue' as const, label: '♞ Knight', desc: 'Limited hints & skips · 2× XP',   activeClass: 'border-silver-500 bg-silver-500/5' },
    { id: 'king'  as const, label: '♔ King',   desc: 'No hints or skips · 3× XP',        activeClass: 'border-gold-600 bg-gold-500/5'    },
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
            {DIFFICULTIES.map(({ id, label, desc, activeClass }) => (
              <button
                key={id}
                onClick={() => setDifficulty(id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  difficulty === id ? activeClass : 'border-border hover:border-green-700'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">{desc}</p>
              </button>
            ))}
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

const RECORD_CHAPTER_POP_QUIZ_COMPLETED = gql`
  mutation RecordChapterPopQuizCompleted($chapterId: ID!) {
    recordChapterPopQuizCompleted(chapterId: $chapterId)
  }
`

export default function App() {
  const [path, setPath]           = useState(window.location.pathname)
  const [appScreen, setAppScreen] = useState<AppScreen>({ screen: 'home' })
  const [tokenReady, setTokenReady] = useState(false)
  const { user, theme, isHydrated, needsOnboarding, clearUser } = useUserStore()
  const [recordChapterPopQuizCompleted] = useMutation(RECORD_CHAPTER_POP_QUIZ_COMPLETED)

  useEffect(() => { applyTheme(theme) }, [theme])

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

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
    window.history.pushState({}, '', to)
    setPath(to)
    // Map path to screen
    if (to === '/')          setAppScreen({ screen: 'home' })
    if (to === '/learn')     setAppScreen({ screen: 'learn' })
    if (to === '/study')     setAppScreen({ screen: 'study' })
    if (to === '/challenge') setAppScreen({ screen: 'challenge' })
    if (to === '/profile')   setAppScreen({ screen: 'profile' })

    const chapterMatch = to.match(/^\/learn\/([^/]+)$/)
    if (chapterMatch) setAppScreen({ screen: 'chapter', id: chapterMatch[1], number: 0, title: '' })

    const quizMatch = to.match(/^\/learn\/([^/]+)\/quiz$/)
    if (quizMatch) setAppScreen({ screen: 'quiz-settings', chapterId: quizMatch[1], chapterNumber: 0, chapterTitle: '' })
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

  if (!isHydrated || !tokenReady) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="text-green-500 font-display text-xl animate-pulse">DriveReady</div>
      </div>
    )
  }

  if (!user) return <AuthPage />

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
      </div>
    )
  }

  // Chapter page
  if (appScreen.screen === 'chapter') {
    return (
      <div className="bg-bg min-h-dvh">
        <ChapterPage
          chapterId={appScreen.id}
          chapterNumber={appScreen.number}
          chapterTitle={appScreen.title}
          onNavigate={navigate}
          onQuizStart={() => setAppScreen({ screen: 'quiz-settings', chapterId: appScreen.id, chapterNumber: appScreen.number, chapterTitle: appScreen.title })}
        />
        <BottomNav activePath="/learn" onNavigate={navigate} />
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
    profile: <ProfilePage />,
  }

  const pageKey = appScreen.screen as string
  const currentPage = PAGES[pageKey] ?? PAGES['home']

  return (
    <div className="bg-bg min-h-dvh">
      {currentPage}
      <BottomNav activePath={activeNavPath} onNavigate={navigate} />
    </div>
  )
}