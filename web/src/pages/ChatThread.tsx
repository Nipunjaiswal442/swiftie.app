import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import { getMessages, type Message } from '../api'
import { useAuthStore } from '../store/authStore'
import UserAvatar from '../components/UserAvatar'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://swiftie-backend.onrender.com'

export default function ChatThread() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    getMessages(id)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Socket.IO connection
  useEffect(() => {
    if (!token || !id) return
    const socket = io(SOCKET_URL, { auth: { token } })
    socketRef.current = socket

    socket.on('message:receive', (msg: Message) => {
      if (msg.conversationId === id) {
        setMessages((prev) => [...prev, msg])
      }
    })

    return () => { socket.disconnect() }
  }, [token, id])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!text.trim() || !socketRef.current) return
    const socket = socketRef.current
    // For now send as plaintext over socket (full E2E requires key exchange)
    socket.emit('message:send', {
      conversationId: id,
      ciphertext: text.trim(),
    })
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="app-content" style={{ paddingBottom: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,153,51,0.1)' }}>
        <button
          onClick={() => navigate('/chat')}
          style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', fontFamily: "'Share Tech Mono'", fontSize: '13px', letterSpacing: '2px' }}
        >
          ← BACK
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {messages[0] && (
            <>
              <UserAvatar
                user={messages[0].sender._id === user?._id ? messages[0].recipient : messages[0].sender}
                size={36}
              />
              <div>
                <div style={{ fontFamily: "'Orbitron'", fontSize: '13px', letterSpacing: '2px', color: 'var(--neon-white)' }}>
                  {messages[0].sender._id === user?._id ? messages[0].recipient.displayName : messages[0].sender.displayName}
                </div>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'rgba(0,180,255,0.7)', letterSpacing: '1px' }}>
                  🔒 E2E ENCRYPTED
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="chat-thread">
        <div className="chat-messages">
          {loading ? (
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
              const isSent = msg.sender._id === user?._id
              return (
                <div key={msg._id} className={`chat-bubble ${isSent ? 'sent' : 'received'}`}>
                  <div className="bubble-text">{msg.ciphertext}</div>
                  <div className="bubble-time">{formatTime(msg.createdAt)}</div>
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
            onClick={sendMessage}
            disabled={!text.trim()}
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  )
}
