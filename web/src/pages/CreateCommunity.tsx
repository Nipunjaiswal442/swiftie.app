import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const PRESET_EMOJIS = [
  '🌐', '🔥', '⚡', '🎯', '🧩',
  '🎮', '📡', '🌌', '🏴', '🦾',
  '💡', '🔮', '🌊', '🎲', '🏆',
]

const SECTION_OPTIONS = [
  { key: 'custom'      as const, label: 'CUSTOM',      color: 'var(--saffron)',    desc: 'Open category — anything goes' },
  { key: 'personality' as const, label: 'PERSONALITY', color: 'var(--saffron)',    desc: 'Personality-based discussions' },
  { key: 'ideology'    as const, label: 'IDEOLOGY',    color: 'var(--white-pure)', desc: 'Political & philosophical views' },
  { key: 'occupation'  as const, label: 'OCCUPATION',  color: 'var(--neon-green)', desc: 'Career & skill-based groups' },
]

type SectionKey = typeof SECTION_OPTIONS[number]['key']

export default function CreateCommunity() {
  const navigate = useNavigate()
  const createCommunity = useMutation(api.communities.createCommunity)

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon]               = useState('🌐')
  const [customIcon, setCustomIcon]   = useState('')
  const [section, setSection]         = useState<SectionKey>('custom')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  const activeIcon = customIcon.trim() || icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || name.trim().length < 3) {
      setError('Community name must be at least 3 characters.')
      return
    }
    if (name.trim().length > 60) {
      setError('Community name must be 60 characters or fewer.')
      return
    }
    if (!description.trim() || description.trim().length < 20) {
      setError('Description must be at least 20 characters.')
      return
    }
    setSubmitting(true)
    try {
      const result = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        icon: activeIcon,
        section,
      })
      navigate(`/chat/community/${result.slug}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="app-content">
      <style>{`
        .cc-form { max-width: 560px; }
        .cc-field { margin-bottom: 28px; }
        .cc-field-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2.5px;
          color: var(--text-dim);
          display: block;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .cc-input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(13,13,26,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--neon-white);
          font-family: 'Rajdhani', sans-serif;
          font-size: 16px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
        }
        .cc-input:focus { border-color: rgba(255,153,51,0.4); }
        .cc-input::placeholder { color: var(--text-dim); opacity: 0.6; }
        .cc-textarea {
          width: 100%;
          padding: 12px 14px;
          background: rgba(13,13,26,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--neon-white);
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          line-height: 1.55;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          min-height: 90px;
          transition: border-color 0.2s;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
        }
        .cc-textarea:focus { border-color: rgba(255,153,51,0.4); }
        .cc-textarea::placeholder { color: var(--text-dim); opacity: 0.6; }
        .cc-char-hint {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--text-dim);
          margin-top: 5px;
        }
        /* Emoji grid */
        .cc-emoji-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .cc-emoji-btn {
          width: 44px;
          height: 44px;
          font-size: 20px;
          background: rgba(13,13,26,0.5);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s, background 0.15s;
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
        }
        .cc-emoji-btn.selected {
          border-color: rgba(255,153,51,0.55);
          background: rgba(255,153,51,0.1);
        }
        .cc-emoji-btn:hover { border-color: rgba(255,255,255,0.25); }
        .cc-emoji-custom-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .cc-emoji-custom-input {
          width: 90px;
          padding: 10px 12px;
          background: rgba(13,13,26,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--neon-white);
          font-size: 20px;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
          clip-path: polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%);
        }
        .cc-emoji-custom-input:focus { border-color: rgba(255,153,51,0.4); }
        .cc-preview-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }
        .cc-preview-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255,153,51,0.08);
          border: 1px solid rgba(255,153,51,0.22);
          font-size: 26px;
          flex-shrink: 0;
        }
        .cc-preview-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
          color: var(--text-dim);
        }
        /* Section tiles */
        .cc-section-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .cc-section-option {
          padding: 13px 15px;
          background: rgba(13,13,26,0.5);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          display: flex;
          flex-direction: column;
          gap: 5px;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
          user-select: none;
        }
        .cc-section-option.selected {
          background: rgba(255,153,51,0.07);
          border-color: rgba(255,153,51,0.38);
        }
        .cc-section-option:hover { background: rgba(255,255,255,0.03); }
        .cc-section-label-text {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          transition: color 0.15s;
        }
        .cc-section-desc {
          font-family: 'Rajdhani', sans-serif;
          font-size: 12px;
          color: var(--text-dim);
          line-height: 1.35;
        }
        /* Error + submit */
        .cc-error {
          padding: 12px 16px;
          margin-bottom: 22px;
          background: rgba(255,51,51,0.08);
          border: 1px solid rgba(255,51,51,0.25);
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          color: rgba(255,110,110,0.9);
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
        }
        .cc-submit-btn {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 2px;
          padding: 15px 36px;
          background: var(--saffron);
          border: none;
          color: var(--bg-dark);
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
          transition: opacity 0.2s, transform 0.2s;
        }
        .cc-submit-btn:not(:disabled):hover { opacity: 0.85; transform: translateY(-1px); }
        .cc-submit-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        @media (max-width: 500px) {
          .cc-section-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Back breadcrumb */}
      <div style={{ marginBottom: '10px' }}>
        <Link to="/chat" style={{
          fontFamily: "'Share Tech Mono'", fontSize: '11px',
          letterSpacing: '2px', color: 'var(--text-dim)', textDecoration: 'none',
          transition: 'color 0.2s',
        }}>
          ← MESSAGES
        </Link>
      </div>

      <p className="page-title" style={{ marginBottom: '32px' }}>// <span>CREATE COMMUNITY</span></p>

      <form className="cc-form" onSubmit={handleSubmit}>

        {/* ── Icon picker ── */}
        <div className="cc-field">
          <span className="cc-field-label">COMMUNITY ICON</span>
          <div className="cc-emoji-grid">
            {PRESET_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`cc-emoji-btn${icon === e && !customIcon.trim() ? ' selected' : ''}`}
                onClick={() => { setIcon(e); setCustomIcon('') }}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="cc-emoji-custom-row">
            <input
              className="cc-emoji-custom-input"
              placeholder="✏️"
              value={customIcon}
              onChange={(e) => setCustomIcon(e.target.value)}
              maxLength={4}
              title="Or type any emoji"
            />
            <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '9px', letterSpacing: '1.5px', color: 'var(--text-dim)' }}>
              OR TYPE YOUR OWN
            </span>
          </div>
          <div className="cc-preview-wrap">
            <div className="cc-preview-icon">{activeIcon}</div>
            <span className="cc-preview-label">PREVIEW</span>
          </div>
        </div>

        {/* ── Name ── */}
        <div className="cc-field">
          <span className="cc-field-label">COMMUNITY NAME</span>
          <input
            className="cc-input"
            placeholder="e.g. Night Owl Devs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
          <p className="cc-char-hint">{name.trim().length} / 60 · MIN 3</p>
        </div>

        {/* ── Description ── */}
        <div className="cc-field">
          <span className="cc-field-label">DESCRIPTION</span>
          <textarea
            className="cc-textarea"
            placeholder="What is this community about? Who is it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={400}
          />
          <p className="cc-char-hint">{description.trim().length} / 400 · MIN 20</p>
        </div>

        {/* ── Category ── */}
        <div className="cc-field">
          <span className="cc-field-label">CATEGORY</span>
          <div className="cc-section-grid">
            {SECTION_OPTIONS.map((opt) => (
              <div
                key={opt.key}
                className={`cc-section-option${section === opt.key ? ' selected' : ''}`}
                onClick={() => setSection(opt.key)}
              >
                <span
                  className="cc-section-label-text"
                  style={{ color: section === opt.key ? opt.color : 'var(--neon-white)' }}
                >
                  {opt.label}
                </span>
                <span className="cc-section-desc">{opt.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="cc-error">{error}</div>}

        <button type="submit" className="cc-submit-btn" disabled={submitting}>
          {submitting ? 'CREATING...' : 'CREATE COMMUNITY ➔'}
        </button>

      </form>
    </div>
  )
}
