import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  role: 'learner' | 'parent' | 'admin'
  stateCode: string
  xpTotal: number
  level: number
  streakDays: number
  freezeTokens: number
  testDate?: string
}

export type Difficulty = 'pawn' | 'rogue' | 'king'
export type AssessmentMode = 'quiz' | 'puzzle' | 'flipper' | 'trivia'

export interface AnswerRecord {
  questionId: string
  selectedIds: string[]
  isCorrect: boolean
  hintUsed: boolean
  skipped: boolean
  timeTakenMs?: number
}

export interface SessionConfig {
  mode: AssessmentMode | 'flashcard_drill' | 'flashcard_blitz' | 'bot_battle' | 'peer_battle'
  difficulty: Difficulty
  questionCount: number
  chapters: number[]
  sessionId?: string
}

// ── User Store ────────────────────────────────────────────────────────────────

interface UserStore {
  user: User | null
  theme: 'dark' | 'light' | 'system'
  isHydrated: boolean
  setUser: (user: User) => void
  clearUser: () => void
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  updateXP: (newXP: number, newLevel: number) => void
  updateStreak: (days: number) => void
  setHydrated: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      theme: 'dark',
      isHydrated: false,

      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setTheme: (theme) => set({ theme }),
      updateXP: (newXP, newLevel) =>
        set((state) => ({
          user: state.user ? { ...state.user, xpTotal: newXP, level: newLevel } : null,
        })),
      updateStreak: (days) =>
        set((state) => ({
          user: state.user ? { ...state.user, streakDays: days } : null,
        })),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'driveready-user',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)

// ── Session Store — active quiz/study session ─────────────────────────────────

interface SessionStore {
  config: SessionConfig | null
  sessionId: string | null
  currentIndex: number
  questionIds: string[]
  answers: Record<string, AnswerRecord>
  hintsRemaining: number
  skipsRemaining: number
  startedAt: Date | null
  isActive: boolean

  startSession: (config: SessionConfig, questionIds: string[], sessionId: string) => void
  recordAnswer: (record: AnswerRecord) => void
  advanceQuestion: () => void
  useHint: () => void
  useSkip: () => void
  endSession: () => void
}

function calcAllowance(difficulty: Difficulty, count: number): number {
  if (difficulty === 'pawn') return 9999
  if (difficulty === 'rogue') return Math.max(1, Math.floor(count / 5))
  return 0
}

export const useSessionStore = create<SessionStore>()((set, get) => ({
  config: null,
  sessionId: null,
  currentIndex: 0,
  questionIds: [],
  answers: {},
  hintsRemaining: 0,
  skipsRemaining: 0,
  startedAt: null,
  isActive: false,

  startSession: (config, questionIds, sessionId) => {
    const allowance = calcAllowance(config.difficulty, config.questionCount)
    set({
      config,
      sessionId,
      questionIds,
      currentIndex: 0,
      answers: {},
      hintsRemaining: allowance,
      skipsRemaining: allowance,
      startedAt: new Date(),
      isActive: true,
    })
  },

  recordAnswer: (record) =>
    set((state) => ({
      answers: { ...state.answers, [record.questionId]: record },
    })),

  advanceQuestion: () =>
    set((state) => ({ currentIndex: state.currentIndex + 1 })),

  useHint: () =>
    set((state) => ({
      hintsRemaining: Math.max(0, state.hintsRemaining - 1),
    })),

  useSkip: () =>
    set((state) => ({
      skipsRemaining: Math.max(0, state.skipsRemaining - 1),
      currentIndex: state.currentIndex + 1,
    })),

  endSession: () =>
    set({
      isActive: false,
      config: null,
      sessionId: null,
      questionIds: [],
      currentIndex: 0,
      answers: {},
      hintsRemaining: 0,
      skipsRemaining: 0,
      startedAt: null,
    }),
}))

// ── Theme Store — applies dark/light class to <html> ─────────────────────────

export function applyTheme(theme: 'dark' | 'light' | 'system') {
  const root = document.documentElement
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (theme === 'dark' || (theme === 'system' && prefersDark)) {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}
