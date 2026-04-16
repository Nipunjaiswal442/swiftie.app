import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const IDENTIFICATION_OPTIONS = [
  'Identify strongly',
  'Exploring out of curiosity',
  'Disagree but want to engage',
]
const DURATION_OPTIONS = [
  '<6 months',
  '6mo-2yrs',
  '2+ years',
  'All my life',
]

export default function ApplyToCommunity() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const community = useQuery(api.communities.getOne, { slug: slug ?? '' })
  const me = useQuery(api.users.getMe)
  const applyToJoin = useMutation(api.communities.applyToJoin)

  const [whyJoin, setWhyJoin] = useState('')
  const [currentFit, setCurrentFit] = useState('')
  const [identification, setIdentification] = useState('')
  const [duration, setDuration] = useState('')
  const [willRetake, setWillRetake] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ status: string; communitySlug: string } | null>(null)

  // Get the user's current match in this community's section
  const currentMatchKey =
    community?.section === 'personality' ? (me as any)?.personalityResult :
    community?.section === 'ideology'    ? (me as any)?.ideologyResult    :
    community?.section === 'occupation'  ? (me as any)?.occupationResult  : undefined

  const sectionColor = community ? ({
    personality: 'var(--saffron)',
    ideology:    'var(--white-pure)',
    occupation:  'var(--neon-green)',
    custom:      'var(--saffron)',
  }[community.section] ?? 'var(--saffron)') : 'var(--saffron)'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!community?._id) return
    if (!identification) { setError('Please select how you identify with this community.'); return }
    if (!duration) { setError('Please select how long you have held these views.'); return }
    if (willRetake === null) { setError('Please answer whether you are willing to retake the assessment.'); return }
    if (!whyJoin.trim() || whyJoin.trim().length < 50) {
      setError('Please write at least 50 characters for why you want to join.')
      return
    }

    setSubmitting(true)
    try {
      const res = await applyToJoin({
        communityId: community._id,
        answers: {
          whyJoin: whyJoin.trim(),
          currentFit: currentFit.trim(),
          identification,
          duration,
          willRetake: willRetake!,
        },
      })
      setResult({ status: res.status, communitySlug: res.communitySlug })
      if (res.status === 'auto-approved') {
        setTimeout(() => navigate(`/chat/community/${res.communitySlug}`), 2000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (community === undefined) {
    return (
      <div className="app-content">
        <div className="loading-screen" style={{ minHeight: '400px' }}>
          <div className="loading-bar" />
        </div>
      </div>
    )
  }

  if (community === null) {
    return (
      <div className="app-content">
        <div className="empty-state">
          <div className="empty-state-icon">🏛️</div>
          <p className="empty-state-text">COMMUNITY NOT FOUND</p>
          <Link to="/explore" style={{ color: 'var(--saffron)', fontFamily: "'Share Tech Mono'", fontSize: '11px', letterSpacing: '2px' }}>← EXPLORE</Link>
        </div>
      </div>
    )
  }

  // ── Result screens ──────────────────────────────────────────
  if (result?.status === 'auto-approved') {
    return (
      <div className="app-content">
        <div style={{ maxWidth: '560px', margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>{community.icon}</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-green)', letterSpacing: '3px', marginBottom: '12px' }}>
            YOU'RE IN!
          </h2>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', letterSpacing: '2px', color: 'rgba(0,255,65,0.8)', marginBottom: '24px' }}>
            Auto-approved · Redirecting to community chat…
          </p>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '15px', color: 'rgba(224,224,255,0.7)', lineHeight: 1.6 }}>
            You've been added to <strong style={{ color: sectionColor }}>{community.name}</strong>. Welcome!
          </p>
        </div>
      </div>
    )
  }

  if (result?.status === 'pending') {
    return (
      <div className="app-content">
        <div style={{ maxWidth: '560px', margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📬</div>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--saffron)', letterSpacing: '3px', marginBottom: '12px' }}>
            APPLICATION SUBMITTED
          </h2>
          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '11px', letterSpacing: '1.5px', color: 'var(--text-dim)', marginBottom: '24px', lineHeight: 1.8 }}>
            Your application to join <span style={{ color: sectionColor }}>{community.name}</span> is under review.
            A moderator will review it shortly.
          </p>
          <Link to="/explore" style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '10px',
            letterSpacing: '2px',
            color: 'var(--saffron)',
            textDecoration: 'none',
            padding: '8px 20px',
            border: '1px solid rgba(255,153,51,0.3)',
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
          }}>← BACK TO EXPLORE</Link>
        </div>
      </div>
    )
  }

  // ── Application form ────────────────────────────────────────
  return (
    <div className="app-content">
      <style>{`
        .apply-form { max-width: 640px; }
        .apply-question {
          margin-bottom: 28px;
        }
        .apply-q-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--text-dim);
          margin-bottom: 8px;
          display: block;
        }
        .apply-q-text {
          font-family: 'Rajdhani', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--neon-white);
          margin-bottom: 12px;
          line-height: 1.4;
        }
        .apply-textarea {
          width: 100%;
          padding: 12px 14px;
          background: rgba(13,13,26,0.7);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--neon-white);
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          line-height: 1.5;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          min-height: 100px;
          transition: border-color 0.2s;
        }
        .apply-textarea:focus { border-color: rgba(255,153,51,0.3); }
        .apply-textarea::placeholder { color: var(--text-dim); }
        .apply-char-hint {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          color: var(--text-dim);
          margin-top: 4px;
        }
        .apply-radio-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .apply-radio-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(13,13,26,0.5);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          font-family: 'Rajdhani', sans-serif;
          font-size: 15px;
          color: rgba(224,224,255,0.8);
          user-select: none;
        }
        .apply-radio-option.selected {
          background: rgba(255,153,51,0.08);
          border-color: rgba(255,153,51,0.3);
          color: var(--neon-white);
        }
        .apply-radio-option:hover { background: rgba(255,255,255,0.04); }
        .apply-radio-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.15s;
        }
        .apply-radio-option.selected .apply-radio-dot {
          border-color: var(--saffron);
        }
        .apply-radio-option.selected .apply-radio-dot::after {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--saffron);
        }
        .apply-submit-btn {
          font-family: 'Orbitron', sans-serif;
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 2px;
          padding: 14px 32px;
          border: none;
          cursor: pointer;
          clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
          transition: opacity 0.2s;
          color: var(--bg-dark);
        }
        .apply-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .apply-submit-btn:not(:disabled):hover { opacity: 0.85; }
      `}</style>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Link to="/explore" style={{ fontFamily: "'Share Tech Mono'", fontSize: '11px', letterSpacing: '2px', color: 'var(--text-dim)', textDecoration: 'none' }}>
          ← EXPLORE
        </Link>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '18px 20px', marginBottom: '28px',
        background: 'rgba(13,13,26,0.5)',
        border: `1px solid ${sectionColor}33`,
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
      }}>
        <span style={{ fontSize: '32px' }}>{community.icon}</span>
        <div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: '14px', letterSpacing: '3px', color: sectionColor }}>
            {community.name}
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', letterSpacing: '1px', color: 'var(--text-dim)', marginTop: '3px' }}>
            {community.memberCount} members · {community.matchKey?.toUpperCase() ?? community.section.toUpperCase()} · {community.section.toUpperCase()}
          </div>
        </div>
      </div>

      <p className="page-title" style={{ marginBottom: '24px' }}>// <span>APPLICATION</span></p>

      <form className="apply-form" onSubmit={handleSubmit}>

        {/* Q1 — Why join */}
        <div className="apply-question">
          <span className="apply-q-label">QUESTION 1 OF 5</span>
          <p className="apply-q-text">
            Why do you want to join <span style={{ color: sectionColor }}>{community.name}</span> specifically?
          </p>
          <textarea
            className="apply-textarea"
            placeholder="Share your honest reason — minimum 50 characters…"
            value={whyJoin}
            onChange={(e) => setWhyJoin(e.target.value)}
            maxLength={500}
          />
          <p className="apply-char-hint">{whyJoin.trim().length}/500 CHARS · MIN 50</p>
        </div>

        {/* Q2 — Current fit (optional if no current match) */}
        <div className="apply-question">
          <span className="apply-q-label">QUESTION 2 OF 5</span>
          <p className="apply-q-text">
            {currentMatchKey
              ? `What about your current matched community (${currentMatchKey.toUpperCase()}) feels like a poor fit?`
              : 'What draws you to explore outside your currently matched community? (Optional)'}
          </p>
          <textarea
            className="apply-textarea"
            placeholder={currentMatchKey ? "Be honest about what doesn't resonate\u2026" : 'Leave blank if you have no current match in this section'}
            value={currentFit}
            onChange={(e) => setCurrentFit(e.target.value)}
            maxLength={500}
          />
          <p className="apply-char-hint">{currentFit.trim().length}/500 CHARS</p>
        </div>

        {/* Q3 — Identification */}
        <div className="apply-question">
          <span className="apply-q-label">QUESTION 3 OF 5</span>
          <p className="apply-q-text">
            Do you genuinely identify with the{' '}
            <span style={{ color: sectionColor }}>{community.matchKey?.toUpperCase() ?? community.name}</span>{' '}
            worldview, or are you exploring?
          </p>
          <div className="apply-radio-group">
            {IDENTIFICATION_OPTIONS.map((opt) => (
              <div
                key={opt}
                className={`apply-radio-option${identification === opt ? ' selected' : ''}`}
                onClick={() => setIdentification(opt)}
              >
                <div className="apply-radio-dot" />
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* Q4 — Duration */}
        <div className="apply-question">
          <span className="apply-q-label">QUESTION 4 OF 5</span>
          <p className="apply-q-text">How long have you held these views / interests?</p>
          <div className="apply-radio-group">
            {DURATION_OPTIONS.map((opt) => (
              <div
                key={opt}
                className={`apply-radio-option${duration === opt ? ' selected' : ''}`}
                onClick={() => setDuration(opt)}
              >
                <div className="apply-radio-dot" />
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* Q5 — Willing to retake */}
        <div className="apply-question">
          <span className="apply-q-label">QUESTION 5 OF 5</span>
          <p className="apply-q-text">
            Are you willing to retake the relevant assessment to verify the fit?
          </p>
          <div className="apply-radio-group">
            {(['Yes', 'No'] as const).map((opt) => {
              const val = opt === 'Yes'
              return (
                <div
                  key={opt}
                  className={`apply-radio-option${willRetake === val ? ' selected' : ''}`}
                  onClick={() => setWillRetake(val)}
                >
                  <div className="apply-radio-dot" />
                  {opt}
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', marginBottom: '20px',
            background: 'rgba(255,51,51,0.08)',
            border: '1px solid rgba(255,51,51,0.25)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px', letterSpacing: '1px',
            color: 'rgba(255,100,100,0.9)',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="apply-submit-btn"
          disabled={submitting}
          style={{ background: sectionColor === 'var(--white-pure)' ? 'rgba(255,255,255,0.9)' : sectionColor }}
        >
          {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION ➔'}
        </button>
      </form>
    </div>
  )
}
