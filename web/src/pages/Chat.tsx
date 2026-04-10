import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import UserAvatar from '../components/UserAvatar'

export default function Chat() {
  const conversations = useQuery(api.messages.getConversations)

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'NOW'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'M'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'H'
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()
  }

  return (
    <div className="app-content">
      <p className="page-title">// <span>ENCRYPTED MESSAGES</span></p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px',
        padding: '10px 16px', background: 'rgba(0,68,204,0.08)',
        border: '1px solid rgba(0,68,204,0.2)',
        fontFamily: "'Share Tech Mono'", fontSize: '11px',
        letterSpacing: '2px', color: 'rgba(0,180,255,0.7)',
      }}>
        🔒 ALL MESSAGES ENCRYPTED END-TO-END WITH SIGNAL PROTOCOL
      </div>

      {conversations === undefined ? (
        <div className="loading-screen" style={{ minHeight: '300px' }}>
          <div className="loading-bar" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔐</div>
          <p className="empty-state-text">NO CONVERSATIONS YET</p>
          <p style={{ fontFamily: "'Share Tech Mono'", fontSize: '11px', color: 'var(--text-dim)', marginTop: '12px', letterSpacing: '1px' }}>
            Visit a user's profile to start chatting
          </p>
        </div>
      ) : (
        <div className="chat-list">
          {conversations.map((conv) => (
            <Link key={conv._id} to={`/chat/${conv._id}`} className="chat-item">
              <UserAvatar user={conv.otherUser} size={48} />
              <div className="chat-item-info">
                <div className="chat-item-name">{conv.otherUser?.displayName ?? '...'}</div>
                <div className="chat-item-preview">
                  {conv.lastMessage ? '🔒 Encrypted message' : 'Start a conversation'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                {conv.lastMessage && (
                  <div className="chat-item-time">
                    {formatTime(conv.lastMessage._creationTime)}
                  </div>
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
