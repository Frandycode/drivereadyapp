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

import { useState } from 'react'
import { useQuery, gql } from '@apollo/client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Layers, BookMarked, BookOpen, List, Zap, Clock } from 'lucide-react'
import { useUserStore } from '@/stores'
import { useMinLoadTime } from '@/hooks/useMinLoadTime'
import { StudyPageSkeleton } from '@/components/ui/Skeleton'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_STUDY_DATA = gql`
  query GetStudyData($stateCode: String!) {
    myBookmarks { id questionText chapter }
    myDecks { id name isSmart }
    chapters(stateCode: $stateCode) { id number title }
    questions(stateCode: $stateCode, count: 999) { id questionText chapter }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export type StudyMode = 'free' | 'drill' | 'blitz'
export type DeckSource = 'smart' | 'chapter' | 'saved'

export interface StudyConfig {
  mode: StudyMode
  source: DeckSource
  chapterId?: string
  chapterNumber?: number
  deckId?: string
  deckName: string
  cardCount: number
  blitzSeconds: number
  questionIds: string[]
}

interface StudyPageProps {
  onNavigate: (path: string) => void
  onStart: (config: StudyConfig) => void
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SOURCES: { id: DeckSource; label: string; description: string; Icon: React.ElementType }[] = [
  { id: 'smart',   label: 'Smart Deck',   description: 'Bookmarks + weak areas',   Icon: BookMarked },
  { id: 'chapter', label: 'By Chapter',   description: 'Pick a specific chapter',  Icon: BookOpen },
  { id: 'saved',   label: 'Saved Decks',  description: 'Your custom collections',  Icon: List },
]

const MODES: { id: StudyMode; label: string; description: string; Icon: React.ElementType }[] = [
  { id: 'free',  label: 'Free Study',   description: 'Flip at your own pace. No scoring.',              Icon: BookOpen },
  { id: 'drill', label: 'Drill Mode',   description: '"Got it" or "Still learning" — cards repeat.',    Icon: List },
  { id: 'blitz', label: 'Timer Blitz',  description: 'Race the clock. How many can you flip?',          Icon: Zap },
]

const BLITZ_OPTIONS   = [30, 60, 90, 120]
const CARD_COUNTS     = [5, 10, 15, 20]

// ── Step connector ────────────────────────────────────────────────────────────

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className={`w-px h-3 transition-colors duration-500 ${active ? 'bg-green-500/70' : 'bg-border'}`} />
      <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 ${
        active ? 'border-green-500 bg-green-500/20 animate-pulse' : 'border-border bg-surface-2'
      }`} />
      <div className={`w-px h-3 transition-colors duration-500 ${active ? 'bg-green-500/70' : 'bg-border'}`} />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StudyPage({ onStart }: StudyPageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [source, setSource]               = useState<DeckSource>('smart')
  const [mode, setMode]                   = useState<StudyMode>('free')
  const [selectedChapterId, setChapterId] = useState<string>('')
  const [selectedDeckId, setDeckId]       = useState<string>('')
  const [cardCount, setCardCount]         = useState(10)
  const [blitzSeconds, setBlitzSeconds]   = useState(60)

  const { data, loading } = useQuery(GET_STUDY_DATA, { variables: { stateCode } })
  const isLoading = useMinLoadTime(loading)

  const bookmarks    = data?.myBookmarks ?? []
  const decks        = data?.myDecks     ?? []
  const chapters     = data?.chapters    ?? []
  const allQuestions = data?.questions   ?? []

  function buildQuestionIds(): string[] {
    if (source === 'smart') {
      const bookmarkIds = bookmarks.map((q: { id: string }) => q.id)
      if (bookmarkIds.length >= cardCount) return bookmarkIds.slice(0, cardCount)
      const rest = allQuestions
        .filter((q: { id: string }) => !bookmarkIds.includes(q.id))
        .map((q: { id: string }) => q.id)
      return [...bookmarkIds, ...rest].slice(0, cardCount)
    }
    if (source === 'chapter') {
      const chap = chapters.find((c: { id: string }) => c.id === selectedChapterId)
      if (!chap) return []
      return allQuestions
        .filter((q: { chapter: number }) => q.chapter === chap.number)
        .map((q: { id: string }) => q.id)
        .slice(0, cardCount)
    }
    if (source === 'saved') {
      const deck = decks.find((d: { id: string }) => d.id === selectedDeckId)
      return (deck?.question_ids ?? []).slice(0, cardCount)
    }
    return []
  }

  function handleStart() {
    const questionIds = buildQuestionIds()
    if (questionIds.length === 0) return
    const chap = chapters.find((c: { id: string }) => c.id === selectedChapterId)
    const deck = decks.find((d: { id: string }) => d.id === selectedDeckId)
    const deckName =
      source === 'smart'   ? 'Smart Deck' :
      source === 'chapter' ? chap?.title ?? 'Chapter' :
                             deck?.name  ?? 'Saved Deck'
    onStart({ mode, source, chapterId: selectedChapterId || undefined, chapterNumber: chap?.number, deckId: selectedDeckId || undefined, deckName, cardCount, blitzSeconds, questionIds })
  }

  const step1Done = source === 'smart' || (source === 'chapter' && !!selectedChapterId) || (source === 'saved' && !!selectedDeckId)
  const step2Done = !!mode
  const canStart  = step1Done && allQuestions.length > 0

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <Layers size={20} className="text-green-500" />
      <h1 className="font-display text-lg font-bold text-text-primary">Study</h1>
    </div>
  )

  if (isLoading) {
    return (
      <PageWrapper header={header}>
        <StudyPageSkeleton />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper header={header}>
      <div className="mt-1 pb-4">

        {/* ── Step 1: Deck ──────────────────────────────────────────────── */}
        <div className="card">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">
            Step 1 · Choose your deck
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {SOURCES.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setSource(id); setChapterId(''); setDeckId('') }}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-150 ${
                  source === id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border bg-surface hover:border-green-700'
                }`}
              >
                <Icon size={20} className={source === id ? 'text-green-500' : 'text-text-secondary'} />
                <span className={`text-xs font-medium leading-tight text-center ${source === id ? 'text-green-400' : 'text-text-secondary'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Sub-selectors */}
          {source === 'chapter' && (
            <select
              value={selectedChapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="input mt-1"
            >
              <option value="">Select a chapter...</option>
              {chapters.map((c: { id: string; number: number; title: string }) => (
                <option key={c.id} value={c.id}>Ch. {c.number} — {c.title}</option>
              ))}
            </select>
          )}
          {source === 'saved' && decks.length > 0 && (
            <select
              value={selectedDeckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="input mt-1"
            >
              <option value="">Select a deck...</option>
              {decks.map((d: { id: string; name: string }) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
          {source === 'saved' && decks.length === 0 && (
            <p className="text-xs text-text-secondary mt-1">No saved decks yet. Custom builder coming soon!</p>
          )}
          {source === 'smart' && (
            <p className="text-xs text-text-secondary">
              {bookmarks.length > 0
                ? `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''} + fills from weak areas`
                : 'Pulls questions from your weakest areas'}
            </p>
          )}
        </div>

        <StepConnector active={step1Done} />

        {/* ── Step 2: Mode ──────────────────────────────────────────────── */}
        <div className="card">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">
            Step 2 · Choose your mode
          </p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-150 ${
                  mode === id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border bg-surface hover:border-green-700'
                }`}
              >
                <Icon size={20} className={mode === id ? 'text-green-500' : 'text-text-secondary'} />
                <span className={`text-xs font-medium leading-tight text-center ${mode === id ? 'text-green-400' : 'text-text-secondary'}`}>
                  {label}
                </span>
                <span className="text-[10px] text-text-secondary leading-tight text-center hidden sm:block">
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <StepConnector active={step2Done} />

        {/* ── Step 3: Settings + Start ───────────────────────────────────── */}
        <div className="card">
          <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">
            Step 3 · Settings & start
          </p>

          {mode !== 'blitz' && (
            <div className="mb-4">
              <p className="text-sm font-medium text-text-primary mb-2">Number of cards</p>
              <div className="flex gap-2">
                {CARD_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCardCount(n)}
                    className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                      cardCount === n
                        ? 'bg-green-500 text-bg'
                        : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'blitz' && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-text-secondary" />
                <p className="text-sm font-medium text-text-primary">Time limit</p>
              </div>
              <div className="flex gap-2">
                {BLITZ_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setBlitzSeconds(s)}
                    className={`flex-1 py-2 rounded-md text-sm font-mono font-medium transition-all ${
                      blitzSeconds === s
                        ? 'bg-green-500 text-bg'
                        : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40"
          >
            Start Session
          </button>
        </div>

      </div>
    </PageWrapper>
  )
}
