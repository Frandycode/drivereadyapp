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
import { useMutation, gql, ApolloError } from '@apollo/client'
import { FiSend as Send } from 'react-icons/fi'
import { RiSparklingFill as Sparkles } from 'react-icons/ri'
import { PageWrapper } from '@/components/layout/PageWrapper'

const START_THREAD = gql`
  mutation StartChatThread {
    startChatThread { id title createdAt }
  }
`

const SEND_MESSAGE = gql`
  mutation SendChatMessage($threadId: ID!, $content: String!) {
    sendChatMessage(threadId: $threadId, content: $content) {
      id role content createdAt
    }
  }
`

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: string
}

export function TutorPage() {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft]       = useState('')
  const [error, setError]       = useState('')
  const scrollRef               = useRef<HTMLDivElement>(null)

  const [startThread] = useMutation(START_THREAD)
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE)

  useEffect(() => {
    startThread().then((r) => {
      const id = r.data?.startChatThread?.id
      if (id) setThreadId(id)
    })
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  async function handleSend() {
    if (!threadId || !draft.trim() || sending) return
    const content = draft.trim()
    setDraft('')
    setError('')
    const tempId = `local-${Date.now()}`
    setMessages((m) => [...m, { id: tempId, role: 'user', content }])

    try {
      const r = await sendMessage({ variables: { threadId, content } })
      const reply = r.data?.sendChatMessage
      if (reply) {
        setMessages((m) => [...m, { id: reply.id, role: reply.role, content: reply.content, createdAt: reply.createdAt }])
      }
    } catch (err) {
      if (err instanceof ApolloError) {
        const code = err.graphQLErrors[0]?.extensions?.code
        if (code === 'RATE_LIMITED') setError('You\'ve hit the hourly chat limit. Try again later.')
        else setError(err.graphQLErrors[0]?.message ?? 'Something went wrong.')
      } else {
        setError('Network error — try again.')
      }
    }
  }

  const header = (
    <div className="px-4 pt-4 pb-3 flex items-center gap-3 max-w-[760px] mx-auto">
      <div className="w-8 h-8 rounded-md bg-orange-soft border border-orange/30 flex items-center justify-center flex-shrink-0">
        <Sparkles size={15} className="text-orange" />
      </div>
      <div className="inline-flex items-center gap-2 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
        <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
        AI tutor
      </div>
    </div>
  )

  return (
    <PageWrapper header={header}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 space-y-2.5 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-md bg-orange-soft border border-orange/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={22} className="text-orange" />
            </div>
            <div className="inline-flex items-center gap-2 mb-3 mono text-[10px] font-semibold tracking-[0.14em] uppercase text-orange">
              <span className="w-[18px] h-[1.5px] rounded-full bg-orange" />
              Ask anything
            </div>
            <p className="display text-white font-bold text-base mb-1.5 tracking-[-0.2px]">
              Driving rules, road signs, permit prep.
            </p>
            <p className="text-[13px] text-text-secondary">I’m here when you need a second read.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[80%] bg-orange text-white rounded-md px-3 py-2 text-[14px] leading-relaxed'
                : 'mr-auto max-w-[85%] bg-surface-2 border border-border rounded-md px-3 py-2 text-[14px] leading-relaxed text-text-primary'
            }
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="mr-auto bg-surface-2 border border-border rounded-md px-3 py-2 text-[13px] text-text-secondary italic animate-pulse">
            Thinking…
          </div>
        )}
      </div>

      {error && (
        <p className="text-wrong text-[13px] bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2 mb-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 pb-2">
        <input
          className="input flex-1"
          placeholder="Ask about driving rules…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          disabled={!threadId || sending}
        />
        <button
          onClick={handleSend}
          disabled={!threadId || sending || !draft.trim()}
          className="btn-primary px-4 h-11 disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </PageWrapper>
  )
}
