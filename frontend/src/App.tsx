import { useState, useEffect } from 'react'
import { useUserStore, applyTheme } from '@/stores'
import { BottomNav } from '@/components/layout/BottomNav'
import { AuthPage } from '@/app/auth'
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

// ── Placeholder ───────────────────────────────────────────────────────────────

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center pb-20">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-green-500 mb-2">{title}</h2>
        <p className="text-text-secondary text-sm">Coming soon</p>
      </div>
    </div>
  )
}

// ── Quiz Settings Modal ───────────────────────────────────────────────────────

interface QuizSettingsModalProps {
  chapterId: string
  chapterNumber: number
  chapterTitle: string
  onStart: (config: QuizConfig) => void
  onCancel: () => void
}

function QuizSettingsModal({
  chapterNumber,
  chapterTitle,
  onStart,
  onCancel,
}: QuizSettingsModalProps) {
  const [difficulty, setDifficulty] = useState<'pawn' | 'rogue' | 'king'>('pawn')
  const [timer, setTimer] = useState<number | null>(null)
  const [questionCount, setQuestionCount] = useState(5)

  const DIFFICULTIES = [
    { id: 'pawn',  label: '♟ Pawn',   desc: 'Unlimited hints & skips. 1× XP' },
    { id: 'rogue', label: '♞ Knight', desc: 'Limited hints & skips. 2× XP' },
    { id: 'king',  label: '♔ King',   desc: 'No hints or skips. 3× XP' },
  ] as const

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

          {/* Question count */}
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
            Questions
          </p>
          <div className="flex gap-2 mb-5">
            {[5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                  questionCount === n
                    ? 'bg-green-500 text-bg'
                    : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Difficulty */}
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
            Difficulty
          </p>
          <div className="space-y-2 mb-5">
            {DIFFICULTIES.map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setDifficulty(id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  difficulty === id
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-border hover:border-green-700'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">{desc}</p>
              </button>
            ))}
          </div>

          {/* Timer */}
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">
            Timer per question
          </p>
          <div className="flex gap-2 mb-6">
            {TIMERS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setTimer(value)}
                className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                  timer === value
                    ? 'bg-green-500 text-bg'
                    : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              onStart({
                stateCode: 'ok',
                chapterNumber,
                chapterTitle,
                questionCount,
                difficulty,
                timerSeconds: timer,
              })
            }
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

export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [studyConfig, setStudyConfig] = useState<StudyConfig | null>(null)
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null)
  const [challengeConfig, setChallengeConfig] = useState<ChallengeConfig | null>(null)

  const { user, theme, isHydrated } = useUserStore()

  useEffect(() => { applyTheme(theme) }, [theme])

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  function navigate(to: string) {
    window.history.pushState({}, '', to)
    setPath(to)
    if (!to.startsWith('/study'))     setStudyConfig(null)
    if (!to.startsWith('/learn'))     setQuizConfig(null)
    if (!to.startsWith('/challenge')) setChallengeConfig(null)
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

  // /learn/:chapterId/quiz — active quiz session
  const quizMatch = path.match(/^\/learn\/([^/]+)\/quiz$/)
  if (quizMatch) {
    const chapterId = quizMatch[1]

    if (quizConfig) {
      return (
        <QuizSession
          config={quizConfig}
          onExit={() => {
            setQuizConfig(null)
            navigate(`/learn/${chapterId}`)
          }}
        />
      )
    }

    return (
      <div className="bg-bg min-h-dvh">
        <ChapterPage chapterId={chapterId} onNavigate={navigate} />
        <BottomNav activePath="/learn" onNavigate={navigate} />
        <QuizSettingsModal
          chapterId={chapterId}
          chapterNumber={0}
          chapterTitle="Pop Quiz"
          onStart={(cfg) => setQuizConfig(cfg)}
          onCancel={() => navigate(`/learn/${chapterId}`)}
        />
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
        <StudySession config={studyConfig} onExit={() => setStudyConfig(null)} />
      </div>
    )
  }

  // /challenge — active session
  if (path === '/challenge' && challengeConfig) {
    const onExit = () => setChallengeConfig(null)

    if (challengeConfig.type === 'quiz') {
      return <QuizSession config={challengeConfig} onExit={onExit} />
    }
    if (challengeConfig.type === 'puzzle') {
      return <PuzzleSession config={challengeConfig} onExit={onExit} />
    }
    if (challengeConfig.type === 'flipper') {
      return <FlipperSession config={challengeConfig} onExit={onExit} />
    }
    if (challengeConfig.type === 'trivia') {
      return <TriviaSession config={challengeConfig} onExit={onExit} />
    }
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
    '/challenge': (
      <ChallengePage onStart={(config) => setChallengeConfig(config)} />
    ),
    '/profile': <PlaceholderPage title="Profile" />,
  }

  return (
    <div className="bg-bg min-h-dvh">
      {PAGES[path] ?? PAGES['/']}
      <BottomNav activePath={path} onNavigate={navigate} />
    </div>
  )
}