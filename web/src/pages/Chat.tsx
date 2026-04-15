import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import UserAvatar from '../components/UserAvatar'

// Section display config
const SECTIONS = [
  {
    key: 'personality' as const,
    label: 'PERSONALITY',
    icon: '🧠',
    color: 'var(--saffron)',
    glowColor: 'rgba(255,153,51,0.15)',
    assessRoute: '/assess/personality',
  },
  {
    key: 'ideology' as const,
    label: 'IDEOLOGY',
    icon: '⚐',
    color: 'var(--white-pure)',
    glowColor: 'rgba(255,255,255,0.08)',
    assessRoute: '/assess/ideology',
  },
  {
    key: 'occupation' as const,
    label: 'OCCUPATION',
    icon: '🔧',
    color: 'var(--neon-green)',
    glowColor: 'rgba(0,255,65,0.08)',
    assessRoute: '/assess/occupation',
  },
]

export default function Chat() {
  const me = useQuery(api.users.getMe)
  const myBySection = useQuery(api.communities.getMyCommunitiesBySection)
  const conversations = useQuery(api.messages.getConversations)

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'NOW'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'M'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'H'
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()
  }

  // Get matchKey from cached user fields
  const matchKeys: Record<string, string | undefined> = {
    personality: (me as any)?.personalityResult,
    ideology:    (me as any)?.ideologyResult,
    occupation:  (me as any)?.occupationResult,
  }

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
          margin-bottom: 16px;
        }
        .section-community-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(13,13,26,0.6);
          border: 1px solid;
          margin-bottom: 12px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
        }
        .section-community-card:hover {
          background: rgba(13,13,26,0.9);
          box-shadow: 0 0 20px var(--card-glow, rgba(255,153,51,0.08));
        }
        .section-community-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          border: 1px solid;
          background: rgba(13,13,26,0.4);
        }
        .match-key-badge {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: 3px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .community-card-name {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 1.5px;
          color: rgba(224,224,255,0.7);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        .community-card-members {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--text-dim);
          margin-top: 2px;
        }
        .section-card-label {
          position: absolute;
          top: 10px;
          right: 14px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 8px;
          letter-spacing: 2px;
          opacity: 0.45;
        }
        .section-placeholder-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(13,13,26,0.3);
          border: 1px dashed;
          margin-bottom: 12px;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
        }
        .placeholder-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          opacity: 0.3;
        }
        .placeholder-text {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .unlock-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-decoration: none;
          padding: 6px 14px;
          border: 1px solid;
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
          display: inline-block;
          transition: opacity 0.2s;
        }
        .unlock-btn:hover { opacity: 0.75; }
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

      {/* ── Three community section cards ────────────────── */}
      <p className="chat-section-divider">// MY COMMUNITIES</p>

      {myBySection === undefined || me === undefined ? (
        <div className="loading-screen" style={{ minHeight: '80px' }}>
          <div className="loading-bar" />
        </div>
      ) : (
        <div style={{ marginBottom: '8px' }}>
          {SECTIONS.map(({ key, label, icon, color, glowColor, assessRoute }) => {
            const matchKey = matchKeys[key]
            const communities = (myBySection as any)[key] ?? []
            // Primary community: the one matching the matchKey, else first joined
            const primaryCommunity = communities.find((c: any) => c.matchKey === matchKey) ?? communities[0] ?? null

            if (!matchKey || !primaryCommunity) {
              // Placeholder: assessment not taken or no community yet
              return (
                <div
                  key={key}
                  className="section-placeholder-card"
                  style={{ borderColor: `${color}33` }}
                >
                  <div className="placeholder-icon" style={{ borderColor: `${color}44`, border: `1px solid ${color}44` }}>
                    {icon}
                  </div>
                  <div>
                    <p className="placeholder-text">
                      TAKE THE {label} ASSESSMENT TO UNLOCK YOUR COMMUNITY
                    </p>
                    <Link
                      to={assessRoute}
                      className="unlock-btn"
                      style={{ color, borderColor: `${color}66` }}
                    >
                      TAKE ASSESSMENT →
                    </Link>
                  </div>
                  <span className="section-card-label" style={{ color }}>{label}</span>
                </div>
              )
            }

            return (
              <Link
                key={key}
                to={`/chat/community/${primaryCommunity.slug}`}
                className="section-community-card"
                style={{
                  borderColor: `${color}44`,
                  '--card-glow': glowColor,
                } as React.CSSProperties}
              >
                <div
                  className="section-community-icon"
                  style={{ borderColor: `${color}44`, color }}
                >
                  {primaryCommunity.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="match-key-badge" style={{ color }}>
                    {matchKey.toUpperCase()}
                  </div>
                  <div className="community-card-name">{primaryCommunity.name}</div>
                  <div className="community-card-members">
                    {primaryCommunity.memberCount} member{primaryCommunity.memberCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="section-card-label" style={{ color }}>{label}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Direct Messages ──────────────────────────────── */}
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
