import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { useQuery as useConvexQuery } from 'convex/react'
import UserAvatar from '../components/UserAvatar'

export default function ChatThread() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const me = useConvexQuery(api.users.getMe)
  const conversationId = id as Id<'conversations'>

  // Real-time messages via Convex — no Socket.IO needed
  const messages = useQuery(api.messages.getMessages, id ? { conversationId } : 'skip')
  const sendMessage = useMutation(api.messages.send)
  const markRead = useMutation(api.messages.markRead)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when thread is opened
  useEffect(() => {
    if (id) markRead({ conversationId }).catch(() => {})
  }, [id, markRead, conversationId])

  const handleSend = async () => {
    if (!text.trim() || !id || sending) return
    setSending(true)
    try {
      await sendMessage({ conversationId, content: text.trim() })
      setText('')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  // Derive the other user from the first message
  const otherUser = messages?.find(
    (m) => m.sender?._id !== me?._id
  )?.sender ?? null

  return (
    <div className="app-content" style={{ paddingBottom: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        marginBottom: '16px', paddingBottom: '16px',
        borderBottom: '1px solid rgba(255,153,51,0.1)'
      }}>
        <button
          onClick={() => navigate('/chat')}
          style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontSize: '13px', letterSpacing: '2px' }}
        >
          ← BACK
        </button>
        {otherUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <UserAvatar user={otherUser} size={36} />
            <div>
              <div style={{ fontFamily: "'Orbitron'", fontSize: '13px', letterSpacing: '2px', color: 'var(--neon-white)' }}>
                {otherUser.displayName}
              </div>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'rgba(0,180,255,0.7)', letterSpacing: '1px' }}>
                🔒 E2E ENCRYPTED
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-thread">
        <div className="chat-messages">
          {messages === undefined ? (
            <div className="loading-screen" style={{ minHeight: '200px' }}>
              <div className="loading-bar" />
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔐</div>
              <p className="empty-state-text">NO MESSAGES YET — SAY HELLO</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSent = msg.sender?._id === me?._id
              return (
                <div key={msg._id} className={`chat-bubble ${isSent ? 'sent' : 'received'}`}>
                  <div className="bubble-text">{msg.content}</div>
                  <div className="bubble-time">{formatTime(msg._creationTime)}</div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Type a message... (Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
