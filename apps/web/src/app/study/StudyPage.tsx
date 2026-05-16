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
import { BookMarked, BookOpen, List, FolderOpen, Zap, Clock, Plus, Trash2, X, Layers, RotateCcw } from 'lucide-react'
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

  const deckReady =
    source === 'smart' ||
    (source === 'chapter' && !!selectedChapterId) ||
    (source === 'saved'   && !!selectedDeckId) ||
    (source === 'group'   && !!selectedGroupId)
  const canStart  = deckReady && allQuestions.length > 0
  const currentSource = SOURCES.find((item) => item.id === source)
  const currentMode = MODES.find((item) => item.id === mode)

  const pageHeader = (
    <PageHeader
      eyebrow="Flashcards · drill · blitz"
      title={
        <>
          Build the <em className="not-italic text-orange">muscle memory.</em>
        </>
      }
      sub="Three focused modes for steady permit-test practice. Warm up, drill weak spots, or race the timer when you need pressure."
      stats={[
        { label: 'Cards seen', value: allQuestions.length || '—', tone: 'gold' },
        { label: 'Bookmarks',  value: bookmarks.length || '—' },
        { label: 'Groups',     value: groups.length || '—', tone: 'orange' },
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
      <div className="page-tabs">
        <div className="page-tabs-inner">
          <a className="pt-btn pt-btn-active" href="#study-modes"><Layers size={17} /> Modes</a>
          <a className="pt-btn" href="#study-builder"><RotateCcw size={17} /> Session</a>
          <a className="pt-btn" href="#study-decks"><FolderOpen size={17} /> Decks</a>
        </div>
      </div>
      <div className="bg-navy blueprint-grid">
       <div className="max-w-dashboard mx-auto px-[var(--pad-x)] py-10 pb-12 space-y-12">
        <section id="study-modes" className="scroll-mt-32">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Pick your mode
            </div>
            <h2 className="font-display text-[clamp(26px,3vw,34px)] font-extrabold leading-tight text-cream">
              How do you want to study right now?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODES.map(({ id, label, description, Icon }) => {
              const active = mode === id
              const tint =
                id === 'free' ? 'text-green border-green/30 bg-green-soft' :
                id === 'drill' ? 'text-orange border-orange/30 bg-orange-soft' :
                                'text-yellow border-yellow-rim bg-yellow-soft'
              return (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`card card-hover text-left min-h-[220px] p-6 border-2 ${active ? 'border-orange bg-orange-soft' : ''}`}
                >
                  <div className={`mb-5 grid h-12 w-12 place-items-center rounded-md border ${tint}`}>
                    <Icon size={23} />
                  </div>
                  <div className="font-display text-xl font-extrabold text-cream mb-2">{label}</div>
                  <p className="text-sm leading-relaxed text-text-secondary mb-5">{description}</p>
                  <div className="mt-auto flex items-center gap-2 mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                    {id === 'free' && <><span>Untimed</span><span className="h-1 w-1 rounded-full bg-text-muted" /><span>Browse</span></>}
                    {id === 'drill' && <><span>Spaced rep</span><span className="h-1 w-1 rounded-full bg-text-muted" /><span>XP</span></>}
                    {id === 'blitz' && <><span>{blitzSeconds}s</span><span className="h-1 w-1 rounded-full bg-text-muted" /><span>Pressure</span></>}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section id="study-builder" className="scroll-mt-32 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5 items-start">
          <div className="card p-6 sm:p-7">
            <div className="mb-5">
              <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-yellow">
                <span className="w-[18px] h-[1.5px] rounded-full bg-yellow" />
                Session builder
              </div>
              <h2 className="font-display text-2xl font-extrabold text-cream">Choose the deck.</h2>
              <p className="text-sm text-text-secondary mt-1">Bookmarks bubble up first, weak areas fill the rest.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {SOURCES.map(({ id, label, description, Icon }) => (
                <button
                  key={id}
                  onClick={() => { setSource(id); setChapterId(''); setDeckId(''); setGroupId('') }}
                  className={`card card-hover flex items-start gap-3 p-4 text-left ${source === id ? 'border-orange bg-orange-soft' : ''}`}
                >
                  <Icon size={19} className={source === id ? 'text-orange' : 'text-text-secondary'} />
                  <span className="min-w-0">
                    <span className={`block text-sm font-bold ${source === id ? 'text-orange' : 'text-cream'}`}>{label}</span>
                    <span className="block text-xs text-text-muted mt-0.5">{description}</span>
                  </span>
                </button>
              ))}
            </div>

            {source === 'chapter' && (
              <select value={selectedChapterId} onChange={(e) => setChapterId(e.target.value)} className="input">
                <option value="">Select a chapter...</option>
                {chapters.map((c: { id: string; number: number; title: string }) => (
                  <option key={c.id} value={c.id}>Ch. {c.number} — {c.title}</option>
                ))}
              </select>
            )}
            {source === 'saved' && decks.length > 0 && (
              <select value={selectedDeckId} onChange={(e) => setDeckId(e.target.value)} className="input">
                <option value="">Select a deck...</option>
                {decks.map((d: { id: string; name: string }) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            {source === 'saved' && decks.length === 0 && (
              <p className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text-secondary">No saved decks yet. Custom builder coming soon.</p>
            )}
            {source === 'smart' && (
              <p className="rounded-md border border-yellow-rim bg-yellow-soft px-4 py-3 text-sm text-text-secondary">
                {bookmarks.length > 0
                  ? `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''} will lead this session, then weak areas fill in.`
                  : 'This session pulls from your weakest areas until bookmarks are available.'}
              </p>
            )}
            {source === 'group' && (
              <div className="space-y-2">
                {groups.length === 0 && (
                  <p className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm text-text-secondary">No groups yet. Create one below.</p>
                )}
                {groups.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setGroupId(g.id)}
                    className={`card card-hover flex cursor-pointer items-center gap-3 p-4 ${selectedGroupId === g.id ? 'border-orange bg-orange-soft' : ''}`}
                  >
                    <FolderOpen size={18} className={selectedGroupId === g.id ? 'text-orange' : 'text-text-secondary'} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${selectedGroupId === g.id ? 'text-orange' : 'text-text-primary'}`}>{g.name}</p>
                      <p className="text-xs text-text-secondary">
                        {g.chapterNumbers.length === 1
                          ? `Ch. ${g.chapterNumbers[0]}`
                          : `Ch. ${g.chapterNumbers.slice().sort((a, b) => a - b).join(', ')}`}
                        {g.isPreset && <span className="ml-1.5 text-yellow">preset</span>}
                      </p>
                    </div>
                    {!g.isPreset && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id) }}
                        className="tier3-hover grid h-8 w-8 place-items-center rounded-md border border-border text-text-secondary hover:text-orange"
                        aria-label={`Delete ${g.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="tier3-hover flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm font-semibold text-text-secondary hover:text-orange"
                >
                  <Plus size={15} />
                  Create New Group
                </button>
              </div>
            )}
          </div>

          <div className="card p-6 sm:p-7 lg:sticky lg:top-28">
            <div className="card-eyebrow"><span className="ey-dot bg-orange" />Active setup</div>
            <div className="space-y-5">
              <div>
                <div className="text-sm text-text-muted mb-1">Deck source</div>
                <div className="font-display text-xl font-extrabold text-cream">{currentSource?.label ?? 'Deck'}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted mb-1">Mode</div>
                <div className="font-display text-xl font-extrabold text-cream">{currentMode?.label ?? 'Study'}</div>
              </div>

              {mode !== 'blitz' ? (
                <div>
                  <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em] mb-2">Number of cards</p>
                  <div className="segmented flex w-full">
                    {CARD_COUNTS.map((n) => (
                      <button key={n} onClick={() => setCardCount(n)} className={`seg-btn flex-1 justify-center ${cardCount === n ? 'seg-btn-active' : ''}`}>{n}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={13} className="text-yellow" />
                    <p className="mono text-[10px] font-semibold text-text-muted uppercase tracking-[0.12em]">Time limit</p>
                  </div>
                  <div className="segmented flex w-full">
                    {BLITZ_OPTIONS.map((s) => (
                      <button key={s} onClick={() => setBlitzSeconds(s)} className={`seg-btn flex-1 justify-center ${blitzSeconds === s ? 'seg-btn-active' : ''}`}>{s}s</button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleStart} disabled={!canStart} className="btn-primary btn-primary-pop w-full h-12 text-base font-semibold disabled:opacity-40">
                Start Studying Free
              </button>
              {!deckReady && <p className="text-xs text-text-muted">Choose a deck option to unlock the session.</p>}
            </div>
          </div>
        </section>

        <section id="study-decks" className="scroll-mt-32">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-green">
              <span className="w-[18px] h-[1.5px] rounded-full bg-green" />
              My decks
            </div>
            <h2 className="font-display text-[clamp(26px,3vw,34px)] font-extrabold leading-tight text-cream">Saved and custom sets.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card card-hover p-6">
              <div className="card-eyebrow"><span className="ey-dot bg-orange" />AI-balanced</div>
              <div className="font-display text-xl font-extrabold text-cream mb-2">Smart Deck</div>
              <p className="text-sm text-text-secondary mb-5">Auto-built from bookmarks, misses, and weak chapters.</p>
              <div className="prog"><div className="prog-fill" style={{ width: `${Math.min(100, Math.max(12, bookmarks.length * 12))}%` }} /></div>
              <div className="mt-2 flex justify-between mono text-[10px] uppercase tracking-[0.1em] text-text-muted"><span>{bookmarks.length} bookmarks</span><span>Ready</span></div>
            </div>
            <div className="card card-hover p-6">
              <div className="card-eyebrow"><span className="ey-dot bg-yellow" />Saved</div>
              <div className="font-display text-xl font-extrabold text-cream mb-2">Saved Decks</div>
              <p className="text-sm text-text-secondary mb-5">{decks.length > 0 ? `${decks.length} deck${decks.length === 1 ? '' : 's'} available for focused review.` : 'Saved decks will appear here as learners build custom sets.'}</p>
              <div className="prog"><div className="prog-fill-gold" style={{ width: decks.length > 0 ? '72%' : '0%' }} /></div>
              <div className="mt-2 flex justify-between mono text-[10px] uppercase tracking-[0.1em] text-text-muted"><span>{decks.length} decks</span><span>{decks.length > 0 ? 'Available' : 'Empty'}</span></div>
            </div>
            <div className="card card-hover p-6">
              <div className="card-eyebrow"><span className="ey-dot bg-green" />Chapter groups</div>
              <div className="font-display text-xl font-extrabold text-cream mb-2">Grouped Practice</div>
              <p className="text-sm text-text-secondary mb-5">Combine related chapters, then run them as one study set.</p>
              <button onClick={() => setShowCreateGroup(true)} className="btn-secondary w-full justify-center">
                <Plus size={15} />
                New Group
              </button>
            </div>
          </div>
        </section>
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
