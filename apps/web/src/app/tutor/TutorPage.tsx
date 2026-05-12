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
import { Send, Sparkles } from 'lucide-react'
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
    <div className="px-4 py-3 flex items-center gap-3">
      <Sparkles size={18} className="text-green-500" />
      <h1 className="font-display text-base font-bold text-text-primary">Ask DriveReady</h1>
    </div>
  )

  return (
    <PageWrapper header={header}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="text-center text-text-secondary text-sm py-8 px-4">
            <Sparkles size={24} className="mx-auto mb-2 text-green-500/50" />
            Ask me anything about driving rules, road signs, or the OK permit exam.
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === 'user'
                ? 'ml-auto max-w-[80%] bg-green-500 text-bg rounded-lg px-3 py-2 text-sm'
                : 'mr-auto max-w-[85%] bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary'
            }
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="mr-auto bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-secondary italic">
            Thinking…
          </div>
        )}
      </div>

      {error && (
        <p className="text-wrong text-sm bg-wrong/10 border border-wrong/30 rounded-md px-3 py-2 mb-2">
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
          className="btn-primary px-4 disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </div>
    </PageWrapper>
  )
}
