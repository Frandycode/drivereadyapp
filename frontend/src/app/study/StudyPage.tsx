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
import { Layers, BookMarked, BookOpen, List, Zap, Clock, ChevronRight } from 'lucide-react'
import { useUserStore } from '@/stores'

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

const MODES: { id: StudyMode; label: string; description: string; Icon: React.ElementType }[] = [
  {
    id: 'free',
    label: 'Free Study',
    description: 'Flip at your own pace. No scoring.',
    Icon: BookOpen,
  },
  {
    id: 'drill',
    label: 'Drill Mode',
    description: '"Got it" or "Still learning" — cards repeat until done.',
    Icon: List,
  },
  {
    id: 'blitz',
    label: 'Timer Blitz',
    description: 'Race the clock. How many can you flip?',
    Icon: Zap,
  },
]

const BLITZ_OPTIONS = [30, 60, 90, 120]
const CARD_COUNT_OPTIONS = [5, 10, 15, 20]

// ── Component ─────────────────────────────────────────────────────────────────

export function StudyPage({ onStart }: StudyPageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [source, setSource] = useState<DeckSource>('smart')
  const [mode, setMode] = useState<StudyMode>('free')
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [selectedDeckId, setSelectedDeckId] = useState<string>('')
  const [cardCount, setCardCount] = useState(10)
  const [blitzSeconds, setBlitzSeconds] = useState(60)

  const { data, loading } = useQuery(GET_STUDY_DATA, {
    variables: { stateCode },
  })

  const bookmarks = data?.myBookmarks ?? []
  const decks = data?.myDecks ?? []
  const chapters = data?.chapters ?? []
  const allQuestions = data?.questions ?? []

  // Build question pool based on selected source
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
      source === 'smart'
        ? 'Smart Deck'
        : source === 'chapter'
        ? chap?.title ?? 'Chapter'
        : deck?.name ?? 'Saved Deck'

    onStart({
      mode,
      source,
      chapterId: selectedChapterId || undefined,
      chapterNumber: chap?.number,
      deckId: selectedDeckId || undefined,
      deckName,
      cardCount,
      blitzSeconds,
      questionIds,
    })
  }

  const canStart =
    source === 'smart'
      ? allQuestions.length > 0
      : source === 'chapter'
      ? !!selectedChapterId
      : !!selectedDeckId

  const header = (
    <div className="px-4 py-3 flex items-center gap-3">
      <Layers size={20} className="text-green-500" />
      <h1 className="font-display text-lg font-bold text-text-primary">Study</h1>
    </div>
  )

  if (loading) {
    return (
      <PageWrapper header={header}>
        <div className="space-y-4 mt-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 bg-surface-2" />
          ))}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper header={header}>
      <div className="space-y-6 mt-1">

        {/* ── Deck source ────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Choose your deck
          </h2>
          <div className="space-y-2">

            {/* Smart Deck */}
            <button
              onClick={() => setSource('smart')}
              className={`w-full text-left card transition-all duration-150 ${
                source === 'smart' ? 'border-green-500 bg-green-500/5' : 'hover:border-green-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookMarked size={18} className={source === 'smart' ? 'text-green-500' : 'text-text-secondary'} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-text-primary">Smart Deck</p>
                  <p className="text-xs text-text-secondary">
                    {bookmarks.length > 0
                      ? `${bookmarks.length} bookmarks + fill from weak areas`
                      : 'Questions from your weakest areas'}
                  </p>
                </div>
                {source === 'smart' && <ChevronRight size={16} className="text-green-500" />}
              </div>
            </button>

            {/* By Chapter */}
            <button
              onClick={() => setSource('chapter')}
              className={`w-full text-left card transition-all duration-150 ${
                source === 'chapter' ? 'border-green-500 bg-green-500/5' : 'hover:border-green-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={18} className={source === 'chapter' ? 'text-green-500' : 'text-text-secondary'} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-text-primary">By Chapter</p>
                  <p className="text-xs text-text-secondary">Pick a specific chapter to study</p>
                </div>
                {source === 'chapter' && <ChevronRight size={16} className="text-green-500" />}
              </div>
            </button>

            {/* Chapter picker */}
            {source === 'chapter' && (
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="input mt-1"
              >
                <option value="">Select a chapter...</option>
                {chapters.map((c: { id: string; number: number; title: string }) => (
                  <option key={c.id} value={c.id}>
                    Ch. {c.number} — {c.title}
                  </option>
                ))}
              </select>
            )}

            {/* Saved Decks */}
            <button
              onClick={() => setSource('saved')}
              className={`w-full text-left card transition-all duration-150 ${
                source === 'saved' ? 'border-green-500 bg-green-500/5' : 'hover:border-green-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <List size={18} className={source === 'saved' ? 'text-green-500' : 'text-text-secondary'} />
                <div className="flex-1">
                  <p className="font-medium text-sm text-text-primary">Saved Decks</p>
                  <p className="text-xs text-text-secondary">
                    {decks.length > 0 ? `${decks.length} saved deck${decks.length > 1 ? 's' : ''}` : 'No saved decks yet'}
                  </p>
                </div>
                {source === 'saved' && <ChevronRight size={16} className="text-green-500" />}
              </div>
            </button>

            {/* Saved deck picker */}
            {source === 'saved' && decks.length > 0 && (
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="input mt-1"
              >
                <option value="">Select a deck...</option>
                {decks.map((d: { id: string; name: string }) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}

            {source === 'saved' && decks.length === 0 && (
              <p className="text-xs text-text-secondary px-1">
                You haven't created any decks yet. Custom deck builder coming soon!
              </p>
            )}
          </div>
        </section>

        {/* ── Mode ──────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Choose your mode
          </h2>
          <div className="space-y-2">
            {MODES.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`w-full text-left card transition-all duration-150 ${
                  mode === id ? 'border-green-500 bg-green-500/5' : 'hover:border-green-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={mode === id ? 'text-green-500' : 'text-text-secondary'} />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary">{description}</p>
                  </div>
                  {mode === id && <ChevronRight size={16} className="text-green-500" />}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Settings ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
            Settings
          </h2>
          <div className="card space-y-4">

            {/* Card count — not shown for blitz */}
            {mode !== 'blitz' && (
              <div>
                <p className="text-sm font-medium text-text-primary mb-2">Number of cards</p>
                <div className="flex gap-2">
                  {CARD_COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setCardCount(n)}
                      className={`flex-1 py-1.5 rounded-md text-sm font-mono font-medium transition-all ${
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

            {/* Blitz duration */}
            {mode === 'blitz' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-text-secondary" />
                  <p className="text-sm font-medium text-text-primary">Time limit</p>
                </div>
                <div className="flex gap-2">
                  {BLITZ_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setBlitzSeconds(s)}
                      className={`flex-1 py-1.5 rounded-md text-sm font-mono font-medium transition-all ${
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
          </div>
        </section>

        {/* ── Start button ──────────────────────────────────────────────── */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="btn-primary w-full h-12 text-base font-semibold"
        >
          Start Session
        </button>

        <div className="h-2" />
      </div>
    </PageWrapper>
  )
}