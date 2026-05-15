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
import { useQuery, useMutation, gql } from '@apollo/client'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { BookMarked, BookOpen, List, FolderOpen, Zap, Clock, Plus, Trash2, X } from 'lucide-react'
import { useUserStore } from '@/stores'
import { useMinLoadTime } from '@driveready/hooks'
import { StudyPageSkeleton } from '@/components/ui/Skeleton'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const GET_STUDY_DATA = gql`
  query GetStudyData($stateCode: String!) {
    myBookmarks { id questionText chapter }
    myDecks { id name isSmart }
    chapters(stateCode: $stateCode) { id number title }
    questions(stateCode: $stateCode, count: 999) { id questionText chapter }
    chapterGroups(stateCode: $stateCode) { id name chapterNumbers isPreset }
  }
`

const CREATE_GROUP = gql`
  mutation CreateChapterGroup($name: String!, $stateCode: String!, $chapterNumbers: [Int!]!) {
    createChapterGroup(name: $name, stateCode: $stateCode, chapterNumbers: $chapterNumbers) {
      id name chapterNumbers isPreset
    }
  }
`

const DELETE_GROUP = gql`
  mutation DeleteChapterGroup($id: ID!) {
    deleteChapterGroup(id: $id)
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export type StudyMode = 'free' | 'drill' | 'blitz'
export type DeckSource = 'smart' | 'chapter' | 'saved' | 'group'

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
  { id: 'smart',   label: 'Smart Deck',   description: 'Bookmarks + weak areas',   Icon: BookMarked  },
  { id: 'chapter', label: 'By Chapter',   description: 'Pick a specific chapter',  Icon: BookOpen    },
  { id: 'saved',   label: 'Saved Decks',  description: 'Your custom collections',  Icon: List        },
  { id: 'group',   label: 'By Group',     description: 'Multi-chapter collections', Icon: FolderOpen },
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
    <div className="flex flex-col items-center py-1.5">
      <div className={`w-px h-3 transition-colors duration-500 ${active ? 'bg-orange/70' : 'bg-border'}`} />
      <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-500 ${
        active ? 'border-orange bg-orange-soft animate-pulse' : 'border-border bg-surface-2'
      }`} />
      <div className={`w-px h-3 transition-colors duration-500 ${active ? 'bg-orange/70' : 'bg-border'}`} />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── Create Group Modal ────────────────────────────────────────────────────────

interface ChapterGroupRaw {
  id: string
  name: string
  chapterNumbers: number[]
  isPreset: boolean
}

function CreateGroupModal({
  chapters,
  stateCode,
  onCreated,
  onClose,
}: {
  chapters: { id: string; number: number; title: string }[]
  stateCode: string
  onCreated: (group: ChapterGroupRaw) => void
  onClose: () => void
}) {
  const [groupName, setGroupName] = useState('')
  const [selected, setSelected]   = useState<number[]>([])
  const [createGroup, { loading }] = useMutation(CREATE_GROUP)

  function toggleChapter(num: number) {
    setSelected((prev) => prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num])
  }

  async function handleCreate() {
    if (!groupName.trim() || selected.length === 0) return
    const result = await createGroup({
      variables: { name: groupName.trim(), stateCode, chapterNumbers: selected },
      refetchQueries: [{ query: GET_STUDY_DATA, variables: { stateCode } }],
    })
    if (result.data?.createChapterGroup) onCreated(result.data.createChapterGroup)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-surface border border-border rounded-2xl p-5 w-full max-w-sm max-h-[80dvh] flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-text-primary mb-1">New Chapter Group</h2>
              <p className="text-text-secondary text-xs">Name your group and pick chapters to include.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tier3-hover grid h-8 w-8 place-items-center rounded-md border border-border text-text-secondary hover:text-white"
              aria-label="Close group creator"
            >
              <X size={16} />
            </button>
          </div>

          <input
            className="input mb-4"
            placeholder="Group name (e.g. Signs & Safety)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={60}
          />

          <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Chapters</p>
          <div className="overflow-y-auto flex-1 space-y-1 mb-4 pr-1">
            {chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleChapter(c.number)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${
                  selected.includes(c.number)
                    ? 'border-orange bg-orange-soft'
                    : 'border-border bg-surface hover:border-orange/40'
                }`}
              >
                <span className={`text-sm font-medium ${selected.includes(c.number) ? 'text-orange' : 'text-text-primary'}`}>
                  Ch. {c.number} — {c.title}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selected.length === 0}
            className="btn-primary w-full h-11 text-sm font-semibold disabled:opacity-40"
          >
            {loading ? 'Creating…' : `Create Group (${selected.length} chapters)`}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StudyPage({ onNavigate, onStart }: StudyPageProps) {
  const stateCode = useUserStore((s) => s.user?.stateCode ?? 'ok')

  const [source, setSource]               = useState<DeckSource>('smart')
  const [mode, setMode]                   = useState<StudyMode>('free')
  const [selectedChapterId, setChapterId] = useState<string>('')
  const [selectedDeckId, setDeckId]       = useState<string>('')
  const [selectedGroupId, setGroupId]     = useState<string>('')
  const [cardCount, setCardCount]         = useState(10)
  const [blitzSeconds, setBlitzSeconds]   = useState(60)
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  const { data, loading } = useQuery(GET_STUDY_DATA, { variables: { stateCode } })
  const [deleteGroup] = useMutation(DELETE_GROUP)
  const isLoading = useMinLoadTime(loading)

  const bookmarks    = data?.myBookmarks    ?? []
  const decks        = data?.myDecks        ?? []
  const chapters     = data?.chapters       ?? []
  const allQuestions = data?.questions      ?? []
  const groups: ChapterGroupRaw[] = data?.chapterGroups ?? []

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
    if (source === 'group') {
      const group = groups.find((g) => g.id === selectedGroupId)
      if (!group) return []
      return allQuestions
        .filter((q: { chapter: number }) => group.chapterNumbers.includes(q.chapter))
        .map((q: { id: string }) => q.id)
        .slice(0, cardCount)
    }
    return []
  }

  async function handleDeleteGroup(id: string) {
    await deleteGroup({
      variables: { id },
      refetchQueries: [{ query: GET_STUDY_DATA, variables: { stateCode } }],
    })
    if (selectedGroupId === id) setGroupId('')
  }

  function handleStart() {
    const questionIds = buildQuestionIds()
    if (questionIds.length === 0) return
    const chap  = chapters.find((c: { id: string }) => c.id === selectedChapterId)
    const deck  = decks.find((d: { id: string }) => d.id === selectedDeckId)
    const group = groups.find((g) => g.id === selectedGroupId)
    const deckName =
      source === 'smart'   ? 'Smart Deck' :
      source === 'chapter' ? chap?.title  ?? 'Chapter' :
      source === 'group'   ? group?.name  ?? 'Group' :
                             deck?.name   ?? 'Saved Deck'
    onStart({
      mode, source,
      chapterId: selectedChapterId || undefined,
      chapterNumber: chap?.number,
      deckId: selectedDeckId || undefined,
      deckName, cardCount, blitzSeconds, questionIds,
    })
  }

  const step1Done =
    source === 'smart' ||
    (source === 'chapter' && !!selectedChapterId) ||
    (source === 'saved'   && !!selectedDeckId) ||
    (source === 'group'   && !!selectedGroupId)
  const step2Done = !!mode
  const canStart  = step1Done && allQuestions.length > 0

  const pageHeader = (
    <PageHeader
      eyebrow="Flashcards · drill · blitz"
      title={
        <>
          Practice on <em className="not-italic text-orange">your terms.</em>
        </>
      }
      sub="Pick a deck, pick a mode, then run. Bookmarks bubble up first, weak areas auto-fill the rest."
      stats={[
        { label: 'Decks',     value: decks.length    || '—' },
        { label: 'Bookmarks', value: bookmarks.length || '—', tone: 'orange' },
        { label: 'Groups',    value: groups.length    || '—', tone: 'gold' },
      ]}
      slab="orange"
    />
  )

  if (isLoading) {
    return (
      <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
        {pageHeader}
        <div className="bg-navy blueprint-grid">
          <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10">
            <StudyPageSkeleton />
          </div>
        </div>
      </PageWrapper>
    )
  }

  return (
    <>
    <PageWrapper onNavigate={onNavigate} className="!max-w-dashboard !px-0">
      {pageHeader}
      <div className="bg-navy blueprint-grid">
       <div className="max-w-dashboard mx-auto px-4 sm:px-10 py-10 pb-12 space-y-1">

        {/* ── Step 1: Deck ──────────────────────────────────────────────── */}
        <div className="card">
          <div className="inline-flex items-center gap-2 mb-4 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Step 1 · Choose your deck
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {SOURCES.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setSource(id); setChapterId(''); setDeckId(''); setGroupId('') }}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-md border-2 transition-all duration-150 ${
                  source === id
                    ? 'border-orange bg-orange-soft'
                    : 'border-border bg-surface hover:border-orange/40'
                }`}
              >
                <Icon size={20} className={source === id ? 'text-orange' : 'text-text-secondary'} />
                <span className={`text-xs font-medium leading-tight text-center ${source === id ? 'text-orange' : 'text-text-secondary'}`}>
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
          {source === 'group' && (
            <div className="mt-1 space-y-2">
              {groups.length === 0 && (
                <p className="text-xs text-text-secondary">No groups yet. Create one below.</p>
              )}
              {groups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setGroupId(g.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md border-2 cursor-pointer transition-all ${
                    selectedGroupId === g.id
                      ? 'border-orange bg-orange-soft'
                      : 'border-border bg-surface hover:border-orange/40'
                  }`}
                >
                  <FolderOpen size={16} className={selectedGroupId === g.id ? 'text-orange' : 'text-text-secondary'} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedGroupId === g.id ? 'text-orange' : 'text-text-primary'}`}>
                      {g.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {g.chapterNumbers.length === 1
                        ? `Ch. ${g.chapterNumbers[0]}`
                        : `Ch. ${g.chapterNumbers.slice().sort((a, b) => a - b).join(', ')}`}
                      {g.isPreset && <span className="ml-1.5 text-yellow">preset</span>}
                    </p>
                  </div>
                  {!g.isPreset && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id) }}
                      className="text-text-secondary hover:text-wrong transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md border-2 border-dashed border-border hover:border-orange/40 transition-colors text-text-secondary hover:text-orange"
              >
                <Plus size={14} />
                <span className="text-xs font-medium">Create New Group</span>
              </button>
            </div>
          )}
        </div>

        <StepConnector active={step1Done} />

        {/* ── Step 2: Mode ──────────────────────────────────────────────── */}
        <div className="card">
          <div className="inline-flex items-center gap-2 mb-4 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Step 2 · Choose your mode
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-md border-2 transition-all duration-150 ${
                  mode === id
                    ? 'border-orange bg-orange-soft'
                    : 'border-border bg-surface hover:border-orange/40'
                }`}
              >
                <Icon size={20} className={mode === id ? 'text-orange' : 'text-text-secondary'} />
                <span className={`text-xs font-medium leading-tight text-center ${mode === id ? 'text-orange' : 'text-text-secondary'}`}>
                  {label}
                </span>
                <span className="text-[10px] text-text-muted leading-tight text-center hidden sm:block">
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <StepConnector active={step2Done} />

        {/* ── Step 3: Settings + Start ───────────────────────────────────── */}
        <div className="card">
          <div className="inline-flex items-center gap-2 mb-4 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
            <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
            Step 3 · Settings & start
          </div>

          {mode !== 'blitz' && (
            <div className="mb-4">
              <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Number of cards</p>
              <div className="flex gap-2">
                {CARD_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCardCount(n)}
                    className={`flex-1 py-2 rounded-md mono text-sm font-bold tabular-nums transition-all border ${
                      cardCount === n
                        ? 'bg-orange text-white border-orange'
                        : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
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
                <Clock size={12} className="text-yellow" />
                <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em]">Time limit</p>
              </div>
              <div className="flex gap-2">
                {BLITZ_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setBlitzSeconds(s)}
                    className={`flex-1 py-2 rounded-md mono text-sm font-bold tabular-nums transition-all border ${
                      blitzSeconds === s
                        ? 'bg-orange text-white border-orange'
                        : 'bg-white/[0.04] border-border text-text-secondary hover:text-white hover:border-orange/40'
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
            className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-40 mt-1"
          >
            Start Session
          </button>
        </div>

       </div>
      </div>
    </PageWrapper>

    {showCreateGroup && (
      <CreateGroupModal
        chapters={chapters}
        stateCode={stateCode}
        onCreated={(g) => setGroupId(g.id)}
        onClose={() => setShowCreateGroup(false)}
      />
    )}
    </>
  )
}
