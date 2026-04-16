import { useState } from 'react'
import { useQuery } from 'convex/react'
import { Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import UserAvatar from '../components/UserAvatar'

const TABS = [
  { key: 'personality', label: 'PERSONALITY', color: 'var(--saffron)',    icon: '🧠' },
  { key: 'ideology',    label: 'IDEOLOGY',    color: 'var(--white-pure)', icon: '⚐'  },
  { key: 'occupation',  label: 'OCCUPATION',  color: 'var(--neon-green)', icon: '🔧' },
  { key: 'custom',      label: 'MINE',        color: 'var(--saffron)',    icon: '✦'  },
] as const

type TabKey = typeof TABS[number]['key']

export default function Chat() {
  const me = useQuery(api.users.getMe)
  const myBySection = useQuery(api.communities.getMyCommunitiesBySection)
  const conversations = useQuery(api.messages.getConversations)

  const [activeTab, setActiveTab] = useState<TabKey>('personality')

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts
    if (diff < 60000) return 'NOW'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'M'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'H'
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()
  }

  const tabCommunities: any[] = myBySection ? (myBySection as any)[activeTab] ?? [] : []
  const activeTabConfig = TABS.find(t => t.key === activeTab)!

  return (
    <div className="app-content">
      <style>{`
        .chat-section-divider {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-dim);
          text-transform: uppercase;
          padding: 0;
          margin: 0;
        }
        /* ── Communities header row ── */
        .communities-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .add-community-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--saffron);
          text-decoration: none;
          padding: 7px 14px;
          border: 1px solid rgba(255,153,51,0.35);
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
          transition: background 0.2s, box-shadow 0.2s;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .add-community-btn:hover {
          background: rgba(255,153,51,0.08);
          box-shadow: 0 0 14px rgba(255,153,51,0.2);
        }
        /* ── Tabs ── */
        .community-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .community-tab {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--text-dim);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 8px 14px;
          cursor: pointer;
          transition: color 0.2s, border-bottom-color 0.2s;
          text-transform: uppercase;
          margin-bottom: -1px;
        }
        .community-tab:hover { color: var(--neon-white); }
        /* ── Empty state ── */
        .community-tab-empty {
          padding: 28px 0 20px;
          text-align: center;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--text-dim);
        }
        .tab-empty-link {
          display: inline-block;
          margin-top: 12px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--neon-green);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .tab-empty-link:hover { opacity: 0.75; }
        /* ── Community card grid ── */
        .community-card-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 8px;
        }
        .community-grid-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          background: rgba(13,13,26,0.55);
          border: 1px solid rgba(255,255,255,0.07);
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
          transition: background 0.2s, border-color 0.2s;
        }
        .community-grid-card:hover {
          background: rgba(13,13,26,0.85);
          border-color: rgba(255,153,51,0.15);
        }
        .community-grid-icon {
          font-size: 22px;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,153,51,0.06);
          border-radius: 50%;
          border: 1px solid rgba(255,153,51,0.12);
        }
        .community-grid-info { flex: 1; min-width: 0; }
        .community-grid-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
          color: var(--neon-white);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .community-grid-members {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--text-dim);
        }
        .community-grid-chat-btn {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          text-decoration: none;
          padding: 7px 14px;
          border: 1px solid currentColor;
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
          opacity: 0.75;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .community-grid-chat-btn:hover { opacity: 1; }
        /* ── DMs section divider ── */
        .dm-divider {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          color: var(--text-dim);
          text-transform: uppercase;
          padding: 4px 0 12px;
          margin-top: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 16px;
        }
      `}</style>

      <p className="page-title">// <span>MESSAGES</span></p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px',
        padding: '10px 16px', background: 'rgba(0,68,204,0.08)',
        border: '1px solid rgba(0,68,204,0.2)',
        fontFamily: "'Share Tech Mono'", fontSize: '11px',
        letterSpacing: '2px', color: 'rgba(0,180,255,0.7)',
      }}>
        🔒 ALL MESSAGES ENCRYPTED END-TO-END WITH SIGNAL PROTOCOL
      </div>

      {/* ── My Communities Header ────────────────────────── */}
      <div className="communities-header-row">
        <p className="chat-section-divider">// MY COMMUNITIES</p>
        <Link to="/community/create" className="add-community-btn">
          + ADD COMMUNITY
        </Link>
      </div>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '18px' }} />

      {/* ── Tab row ── */}
      <div className="community-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className="community-tab"
            style={activeTab === tab.key
              ? { color: tab.color, borderBottomColor: tab.color }
              : {}}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {myBySection === undefined || me === undefined ? (
        <div className="loading-screen" style={{ minHeight: '80px' }}>
          <div className="loading-bar" />
        </div>
      ) : tabCommunities.length === 0 ? (
        <div className="community-tab-empty">
          <span style={{ fontSize: '26px', marginBottom: '10px', display: 'block' }}>
            {activeTabConfig.icon}
          </span>
          <p>NO COMMUNITIES YET</p>
          {activeTab === 'custom' ? (
            <Link to="/community/create" className="tab-empty-link">
              CREATE YOUR FIRST COMMUNITY →
            </Link>
          ) : (
            <Link to="/discover" className="tab-empty-link">
              DISCOVER COMMUNITIES →
            </Link>
          )}
        </div>
      ) : (
        <div className="community-card-grid">
          {tabCommunities.map((community: any) => (
            <div key={community._id} className="community-grid-card">
              <div className="community-grid-icon">{community.icon}</div>
              <div className="community-grid-info">
                <div className="community-grid-name">{community.name}</div>
                <div className="community-grid-members">
                  {community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
                </div>
              </div>
              <Link
                to={`/chat/community/${community.slug}`}
                className="community-grid-chat-btn"
                style={{ color: activeTabConfig.color }}
              >
                CHAT →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── Direct Messages ──────────────────────────────── */}
      <p className="dm-divider">// DIRECT MESSAGES</p>

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
