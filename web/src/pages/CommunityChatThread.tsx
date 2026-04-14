import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function CommunityChatThread() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const community = useQuery(api.communities.getOne, { slug: slug ?? '' })
  const isMember = useQuery(
    api.communities.isMember,
    community?._id ? { communityId: community._id } : 'skip'
  )
  const messages = useQuery(
    api.communityMessages.getMessages,
    community?._id ? { communityId: community._id } : 'skip'
  )

  // Get current user's identity for own-message detection
  const me = useQuery(api.users.getMe)

  const sendMessage = useMutation(api.communityMessages.send)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const handleSend = async () => {
    if (!input.trim() || !community?._id) return
    setSending(true)
    try {
      await sendMessage({ communityId: community._id, content: input.trim() })
      setInput('')
    } catch {
      // error silently — retry
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

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
    })
  }

  if (community === undefined) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', letterSpacing: '2px' }}>
        LOADING...
      </div>
    )
  }

  if (community === null) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--saffron)', letterSpacing: '4px', marginBottom: '16px' }}>COMMUNITY NOT FOUND</p>
        <button onClick={() => navigate('/chat')} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', letterSpacing: '3px', color: 'var(--text-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}>← MESSAGES</button>
      </div>
    )
  }

  const sectionColor = {
    personality: 'var(--saffron)',
    ideology: 'var(--white-pure)',
    occupation: 'var(--neon-green)',
  }[community.section] ?? 'var(--saffron)'

  return (
    <div className="community-chat-page">
      <style>{`
        .community-chat-page {
          max-width: 760px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 120px);
          padding: 0 24px;
        }
        .cc-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 0 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .cc-back-btn {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          color: var(--text-dim);
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .cc-back-btn:hover { color: var(--saffron); }
        .cc-header-icon { font-size: 28px; flex-shrink: 0; }
        .cc-header-info { flex: 1; min-width: 0; }
        .cc-header-name {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 14px;
          letter-spacing: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cc-header-meta {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          color: var(--text-dim);
          margin-top: 3px;
        }
        .cc-view-link {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
          color: var(--text-dim);
          text-decoration: none;
          padding: 5px 10px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .cc-view-link:hover { color: var(--saffron); border-color: rgba(255,153,51,0.3); }
        .cc-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .cc-messages-area::-webkit-scrollbar { width: 4px; }
        .cc-messages-area::-webkit-scrollbar-track { background: transparent; }
        .cc-messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .cc-msg-group { margin-bottom: 12px; }
        .cc-msg-sender {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
          color: var(--text-dim);
          margin-bottom: 4px;
          padding-left: 4px;
        }
        .cc-msg-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .cc-msg-row.mine {
          flex-direction: row-reverse;
        }
        .cc-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,153,51,0.12);
          border: 1px solid rgba(255,153,51,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          color: var(--saffron);
          flex-shrink: 0;
          overflow: hidden;
        }
        .cc-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .cc-bubble-wrap { display: flex; flex-direction: column; max-width: 68%; }
        .cc-msg-row.mine .cc-bubble-wrap { align-items: flex-end; }
        .cc-bubble {
          padding: 10px 14px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          line-height: 1.5;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .cc-bubble.theirs {
          background: rgba(13,13,26,0.8);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(224,224,255,0.85);
          border-radius: 0 8px 8px 8px;
        }
        .cc-bubble.mine {
          background: rgba(255,153,51,0.12);
          border: 1px solid rgba(255,153,51,0.2);
          color: var(--neon-white);
          border-radius: 8px 0 8px 8px;
        }
        .cc-time {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.5px;
          color: var(--text-dim);
          margin-top: 3px;
          padding: 0 2px;
        }
        .cc-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          color: var(--text-dim);
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 2px;
        }
        .cc-input-area {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 14px 0;
          flex-shrink: 0;
        }
        .cc-non-member {
          padding: 16px;
          text-align: center;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: var(--text-dim);
          background: rgba(13,13,26,0.4);
          border: 1px dashed rgba(255,255,255,0.06);
        }
        .cc-input-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }
        .cc-textarea {
          flex: 1;
          padding: 12px 14px;
          background: rgba(13,13,26,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--neon-white);
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          line-height: 1.4;
          resize: none;
          outline: none;
          max-height: 120px;
          overflow-y: auto;
          transition: border-color 0.2s;
        }
        .cc-textarea:focus { border-color: rgba(255,153,51,0.3); }
        .cc-textarea::placeholder { color: var(--text-dim); }
        .cc-send-btn {
          padding: 12px 20px;
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 2px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
          flex-shrink: 0;
          color: var(--bg-dark);
        }
        .cc-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cc-send-btn:not(:disabled):hover { opacity: 0.85; transform: translateY(-1px); }
        .cc-hint {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--text-dim);
          margin-top: 6px;
        }
        @media (max-width: 600px) {
          .community-chat-page { padding: 0 12px; }
          .cc-bubble-wrap { max-width: 82%; }
        }
      `}</style>

      {/* Header */}
      <div className="cc-header">
        <button className="cc-back-btn" onClick={() => navigate('/chat')}>← BACK</button>
        <span className="cc-header-icon">{community.icon}</span>
        <div className="cc-header-info">
          <div className="cc-header-name" style={{ color: sectionColor }}>{community.name}</div>
          <div className="cc-header-meta">{community.memberCount} member{community.memberCount !== 1 ? 's' : ''}</div>
        </div>
        <Link to={`/community/${community.slug}`} className="cc-view-link">VIEW COMMUNITY ↗</Link>
      </div>

      {/* Messages area */}
      <div className="cc-messages-area">
        {messages === undefined ? (
          <div className="cc-empty">LOADING...</div>
        ) : messages.length === 0 ? (
          <div className="cc-empty">
            <span style={{ fontSize: '28px' }}>{community.icon}</span>
            <span>No messages yet — be the first to say hello!</span>
          </div>
        ) : (
          (messages as any[]).map((msg: any, idx: number) => {
            const isMe = me && msg.sender._id === me._id
            const prevMsg = idx > 0 ? messages[idx - 1] : null
            const showSender = !isMe && (!prevMsg || prevMsg.sender._id !== msg.sender._id)

            return (
              <div key={msg._id} className="cc-msg-group">
                {showSender && (
                  <div className="cc-msg-sender">
                    {msg.sender.username ? `@${msg.sender.username}` : msg.sender.displayName}
                  </div>
                )}
                <div className={`cc-msg-row${isMe ? ' mine' : ''}`}>
                  {!isMe && (
                    <div className="cc-avatar">
                      {msg.sender.profilePhotoUrl
                        ? <img src={msg.sender.profilePhotoUrl} alt="" />
                        : (msg.sender.displayName ?? 'U')[0].toUpperCase()
                      }
                    </div>
                  )}
                  <div className="cc-bubble-wrap">
                    <div className={`cc-bubble ${isMe ? 'mine' : 'theirs'}`}>
                      {msg.content}
                    </div>
                    <div className="cc-time">{formatTime(msg._creationTime)}</div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="cc-input-area">
        {isMember === false ? (
          <div className="cc-non-member">
            <Link to={`/community/${community.slug}`} style={{ color: sectionColor, textDecoration: 'none' }}>
              JOIN COMMUNITY
            </Link>{' '}
            TO PARTICIPATE IN THIS CHAT
          </div>
        ) : (
          <>
            <div className="cc-input-row">
              <textarea
                className="cc-textarea"
                rows={1}
                placeholder="Send a message... (Enter to send, Shift+Enter for newline)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={1000}
              />
              <button
                className="cc-send-btn"
                style={{ background: sectionColor === 'var(--white-pure)' ? 'rgba(255,255,255,0.9)' : sectionColor }}
                onClick={handleSend}
                disabled={sending || !input.trim()}
              >
                {sending ? '...' : 'SEND ➔'}
              </button>
            </div>
            <div className="cc-hint">Enter to send · Shift+Enter for new line</div>
          </>
        )}
      </div>
    </div>
  )
}
