import { useEffect, useRef, useState } from 'react'
import { useQuery, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

// Inline SVG avatar for Maya — consistent, no external dependency
export function MayaAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '50%', flexShrink: 0 }}
    >
      {/* Background */}
      <circle cx="50" cy="50" r="50" fill="#1a0a00" />
      <circle cx="50" cy="50" r="48" fill="rgba(var(--accent-rgb),0.08)" stroke="rgba(var(--accent-rgb),0.4)" strokeWidth="1" />

      {/* Hair — long dark hair */}
      <ellipse cx="50" cy="30" rx="24" ry="22" fill="#1a0805" />
      <rect x="26" y="30" width="10" height="38" rx="5" fill="#1a0805" />
      <rect x="64" y="30" width="10" height="38" rx="5" fill="#1a0805" />

      {/* Face */}
      <ellipse cx="50" cy="46" rx="18" ry="20" fill="#c8825a" />

      {/* Bindi */}
      <circle cx="50" cy="33" r="2.5" style={{ fill: 'var(--saffron)' }} />

      {/* Eyes */}
      <ellipse cx="43" cy="44" rx="4" ry="4.5" fill="#1a0805" />
      <ellipse cx="57" cy="44" rx="4" ry="4.5" fill="#1a0805" />
      <circle cx="44.5" cy="42.5" r="1.2" fill="white" />
      <circle cx="58.5" cy="42.5" r="1.2" fill="white" />

      {/* Eyebrows */}
      <path d="M39 39 Q43 37 47 39" stroke="#1a0805" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M53 39 Q57 37 61 39" stroke="#1a0805" strokeWidth="1.8" strokeLinecap="round" />

      {/* Smile */}
      <path d="M44 54 Q50 59 56 54" stroke="#7a3020" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <ellipse cx="50" cy="50" rx="2" ry="1.5" fill="#b06040" />

      {/* Dupatta hint — saffron color at shoulders */}
      <path d="M32 66 Q50 72 68 66 L68 80 Q50 86 32 80 Z" fill="rgba(var(--accent-rgb),0.6)" />

      {/* Mekhela chador pattern detail */}
      <path d="M32 72 L68 72" stroke="rgba(var(--fg-rgb),0.3)" strokeWidth="0.8" />
    </svg>
  )
}

// Typing indicator dots
function TypingDots() {
  return (
    <div className="chat-bubble received" style={{ padding: '14px 18px', display: 'flex', gap: '6px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'rgba(var(--accent2-rgb),0.6)',
            display: 'inline-block',
            animation: 'maya-dot-bounce 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes maya-dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default function MayaChat() {
  const messages = useQuery(api.maya.getMayaMessages)
  const sendToMaya = useAction(api.maya.sendToMaya)

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)
    setError(null)
    try {
      await sendToMaya({ content: msg })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
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

  return (
    <div className="app-content" style={{ paddingBottom: 0 }}>

      {/* Maya's Profile Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px',
        padding: '20px 24px',
        background: 'rgba(var(--accent-rgb),0.04)',
        border: '1px solid rgba(var(--accent-rgb),0.15)',
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <MayaAvatar size={72} />
          {/* Online indicator */}
          <span style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: 'var(--neon-green)',
            border: '2px solid var(--bg-dark)',
            boxShadow: '0 0 6px var(--neon-green)',
          }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: 'calc(18px * var(--font-scale, 1))',
              letterSpacing: '3px',
              color: 'var(--neon-white)',
              margin: 0,
            }}>
              MAYA BORA
            </h2>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 'calc(11px * var(--font-scale, 1))',
              color: 'rgba(var(--accent3-rgb),0.7)',
              letterSpacing: '1px',
            }}>
              @maya_bora
            </span>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 'calc(10px * var(--font-scale, 1))',
              color: 'var(--neon-green)',
              letterSpacing: '1px',
              textShadow: '0 0 8px var(--neon-green)',
            }}>
              ● ONLINE
            </span>
          </div>

          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: 'calc(12px * var(--font-scale, 1))',
            color: 'rgba(var(--fg-rgb),0.65)',
            margin: '6px 0 8px',
            letterSpacing: '0.5px',
            lineHeight: 1.6,
          }}>
            3rd yr CSE @ NIT Silchar · UI/UX nerd · Assamese 🌸
          </p>

          {/* Tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['20 yrs', 'ESFJ', 'Guwahati, Assam', 'Figma lover', 'Bihu 🎶'].map((tag) => (
              <span key={tag} style={{
                fontFamily: "var(--font-mono)",
                fontSize: 'calc(10px * var(--font-scale, 1))',
                padding: '3px 10px',
                border: '1px solid rgba(var(--accent-rgb),0.3)',
                color: 'rgba(var(--accent-rgb),0.8)',
                letterSpacing: '1px',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                background: 'rgba(var(--accent-rgb),0.05)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-thread">
        <div className="chat-messages">
          {messages === undefined ? (
            <div className="loading-screen" style={{ minHeight: '200px' }}>
              <div className="loading-bar" />
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <div style={{ marginBottom: '16px' }}>
                <MayaAvatar size={64} />
              </div>
              <p className="empty-state-text">
                SAY HI TO MAYA — SHE'S WAITING! 🌸
              </p>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: 'calc(11px * var(--font-scale, 1))',
                color: 'rgba(var(--fg-rgb),0.35)',
                marginTop: '8px',
                letterSpacing: '1px',
              }}>
                "Eti koi diu — let's chat!" — Maya
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat-bubble ${msg.role === 'user' ? 'sent' : 'received'}`}
              >
                {msg.role === 'assistant' && (
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 'calc(9px * var(--font-scale, 1))',
                    letterSpacing: '1.5px',
                    color: 'rgba(var(--accent2-rgb),0.5)',
                    marginBottom: '4px',
                  }}>
                    MAYA
                  </div>
                )}
                <div className="bubble-text">{msg.content}</div>
                <div className="bubble-time">{formatTime(msg._creationTime)}</div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {sending && <TypingDots />}

          {/* Error */}
          {error && (
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 'calc(11px * var(--font-scale, 1))',
              color: '#ff4444',
              padding: '8px 12px',
              border: '1px solid rgba(255,68,68,0.3)',
              letterSpacing: '1px',
            }}>
              ⚠ {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Message Maya... (Enter to send)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
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
