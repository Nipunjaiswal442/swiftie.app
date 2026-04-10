import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getConversations, type Conversation } from '../api'
import UserAvatar from '../components/UserAvatar'

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getConversations()
      .then(({ data }) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'NOW'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'M'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'H'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()
  }

  return (
    <div className="app-content">
      <p className="page-title">// <span>ENCRYPTED MESSAGES</span></p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          padding: '10px 16px',
          background: 'rgba(0,68,204,0.08)',
          border: '1px solid rgba(0,68,204,0.2)',
          fontFamily: "'Share Tech Mono'",
          fontSize: '11px',
          letterSpacing: '2px',
          color: 'rgba(0,180,255,0.7)',
        }}
      >
        🔒 ALL MESSAGES ENCRYPTED END-TO-END WITH SIGNAL PROTOCOL
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="loading-bar" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔐</div>
          <p className="empty-state-text">NO CONVERSATIONS YET</p>
          <p style={{ fontFamily: "'Share Tech Mono'", fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px', letterSpacing: '1px' }}>
            Search for users to start chatting
          </p>
        </div>
      ) : (
        <div className="chat-list">
          {conversations.map((conv) => (
            <Link
              key={conv._id}
              to={`/chat/${conv.conversationId}`}
              className="chat-item"
            >
              <UserAvatar user={conv.otherUser} size={48} />
              <div className="chat-item-info">
                <div className="chat-item-name">{conv.otherUser.displayName}</div>
                <div className="chat-item-preview">
                  {conv.lastMessage ? '🔒 Encrypted message' : 'Start a conversation'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                {conv.lastMessage && (
                  <div className="chat-item-time">{formatTime(conv.lastMessage.createdAt)}</div>
                )}
                {conv.unreadCount > 0 && (
                  <div className="unread-badge">{conv.unreadCount}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
