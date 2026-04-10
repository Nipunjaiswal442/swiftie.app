import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import UserAvatar from '../components/UserAvatar'

export default function MayaChat() {
  const navigate = useNavigate()
  const me = useQuery(api.users.getMe)
  const maya = useQuery(api.maya.getMaya)
  
  const getOrCreateConversation = useMutation(api.messages.getOrCreateConversation)
  const sendToMaya = useMutation(api.maya.sendToMaya)
  const messagesQuery = useQuery(api.messages.getMessages)
  
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  // Initialize conversation with Maya on mount
  useEffect(() => {
    const initConversation = async () => {
      if (!maya || !me) return
      
      try {
        const convId = await getOrCreateConversation({ otherUserId: maya._id })
        setConversationId(convId)
      } catch (error) {
        console.error('Error creating conversation:', error)
      }
    }
    
    initConversation()
  }, [maya, me, getOrCreateConversation])

  // Load messages when conversation is ready
  useEffect(() => {
    if (conversationId && messagesQuery) {
      setMessages(messagesQuery)
    }
  }, [conversationId, messagesQuery])

  const handleSend = async () => {
    if (!text.trim() || !conversationId || sending) return
    setSending(true)
    try {
      await sendToMaya({ conversationId: conversationId as any, content: text.trim() })
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

  if (maya === undefined || me === undefined) {
    return (
      <div className="app-content">
        <div className="loading-screen" style={{ minHeight: '400px' }}>
          <div className="loading-bar" />
        </div>
      </div>
    )
  }

  if (!maya) {
    return (
      <div className="app-content">
        <div className="empty-state">
          <div className="empty-state-icon">🤖</div>
          <p className="empty-state-text">MAYA NOT FOUND</p>
        </div>
      </div>
    )
  }

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
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--saffron)', 
            cursor: 'pointer', 
            fontFamily: "'Share Tech Mono'", 
            fontSize: '13px', 
            letterSpacing: '2px' 
          }}
        >
          ← BACK
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <UserAvatar user={maya} size={40} />
          <div>
            <div style={{ fontFamily: "'Orbitron'", fontSize: '13px', letterSpacing: '2px', color: 'var(--neon-white)' }}>
              {maya.displayName}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'rgba(0,180,255,0.7)', letterSpacing: '1px' }}>
              🌸 ONLINE • AI FRIEND
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <UserAvatar user={maya} size={100} />
        </div>
        <h2 style={{ 
          fontFamily: "'Orbitron'", 
          fontSize: '18px', 
          textAlign: 'center',
          color: 'var(--neon-white)',
          marginBottom: '8px'
        }}>
          {maya.displayName}
        </h2>
        <p style={{ 
          fontFamily: "'Share Tech Mono'", 
          fontSize: '11px', 
          textAlign: 'center',
          color: 'rgba(0,180,255,0.8)',
          letterSpacing: '1px',
          marginBottom: '12px'
        }}>
          @{maya.username}
        </p>
        <p style={{ 
          fontFamily: "'Share Tech Mono'", 
          fontSize: '12px', 
          textAlign: 'center',
          color: 'var(--text-dim)',
          lineHeight: '1.6'
        }}>
          {maya.bio}
        </p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '16px', 
          marginTop: '16px',
          fontFamily: "'Share Tech Mono'",
          fontSize: '11px',
          color: 'rgba(255,153,51,0.8)'
        }}>
          <span>🌸 Assamese</span>
          <span>💻 CSE Student</span>
          <span>🎨 Designer</span>
          <span>✨ ESFJ</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-thread">
        <div className="chat-messages" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <p className="empty-state-text">SAY HI TO MAYA!</p>
              <p style={{ fontFamily: "'Share Tech Mono'", fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
                She loves talking about coding, design, and Assamese culture 🌸
              </p>
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
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Say hi to Maya... (Enter to send)"
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
            {sending ? '...' : 'SEND'}
          </button>
        </div>
      </div>
    </div>
  )
}
