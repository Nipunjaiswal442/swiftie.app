import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import UserAvatar from '../components/UserAvatar'

export default function Chat() {
  const conversations = useQuery(api.messages.getConversations)
  const myCommunityChats = useQuery(api.communityMessages.getMyCommunityChats)

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'NOW'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'M'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'H'
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()
  }

  const sectionColor = (section: string) => ({
    personality: 'var(--saffron)',
    ideology: 'var(--white-pure)',
    occupation: 'var(--neon-green)',
  }[section] ?? 'var(--saffron)')

  return (
    <div className="app-content">
      <style>{`
        .chat-section-divider {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-dim);
          text-transform: uppercase;
          padding: 4px 0 12px;
          margin-top: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 12px;
        }
        .community-chat-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(13,13,26,0.5);
          border: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .community-chat-item:hover {
          border-color: rgba(255,153,51,0.15);
          background: rgba(13,13,26,0.8);
        }
        .community-chat-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,153,51,0.08);
          border: 1px solid rgba(255,153,51,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .community-chat-info { flex: 1; min-width: 0; }
        .community-chat-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--neon-white);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .community-chat-preview {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.5px;
          color: var(--text-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .community-chat-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }
        .community-chat-time {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .community-section-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          letter-spacing: 2px;
          padding: 2px 6px;
          border-radius: 2px;
          text-transform: uppercase;
          background: rgba(255,153,51,0.08);
          border: 1px solid rgba(255,153,51,0.2);
        }
      `}</style>

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

      {/* MY COMMUNITIES section */}
      <p className="chat-section-divider">// MY COMMUNITIES</p>

      {myCommunityChats === undefined ? (
        <div className="loading-screen" style={{ minHeight: '80px' }}>
          <div className="loading-bar" />
        </div>
      ) : myCommunityChats.length === 0 ? (
        <div style={{
          padding: '20px 16px', marginBottom: '16px',
          background: 'rgba(13,13,26,0.3)',
          border: '1px dashed rgba(255,255,255,0.06)',
          fontFamily: "'Share Tech Mono'", fontSize: '10px',
          letterSpacing: '1px', color: 'var(--text-dim)', textAlign: 'center',
        }}>
          Complete an assessment on <Link to="/discover" style={{ color: 'var(--saffron)', textDecoration: 'none' }}>Discover</Link> to join community chats
        </div>
      ) : (
        <div style={{ marginBottom: '8px' }}>
          {(myCommunityChats as any[]).map(({ community, lastMessage }: { community: any; lastMessage: any }) => (
            <Link
              key={community._id}
              to={`/chat/community/${community.slug}`}
              className="community-chat-item"
            >
              <div className="community-chat-icon">{community.icon}</div>
              <div className="community-chat-info">
                <div className="community-chat-name">{community.name}</div>
                <div className="community-chat-preview">
                  {lastMessage ? lastMessage.content : 'No messages yet — say hello!'}
                </div>
              </div>
              <div className="community-chat-meta">
                {lastMessage && (
                  <span className="community-chat-time">{formatTime(lastMessage._creationTime)}</span>
                )}
                <span className="community-section-badge" style={{ color: sectionColor(community.section), borderColor: `${sectionColor(community.section)}33` }}>
                  {community.section}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* DIRECT MESSAGES section */}
      <p className="chat-section-divider" style={{ marginTop: '24px' }}>// DIRECT MESSAGES</p>

      {conversations === undefined ? (
        <div className="loading-screen" style={{ minHeight: '200px' }}>
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
