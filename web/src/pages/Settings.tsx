import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { deleteUser, reauthenticateWithPopup, signOut } from 'firebase/auth'
import { api } from '../../convex/_generated/api'
import { auth, googleProvider } from '../firebase'
import ProfileForm from '../components/ProfileForm'
import {
  applyAppearance,
  DEFAULT_APPEARANCE,
  FONT_FAMILIES,
  FONT_SCALES,
  loadLocalAppearance,
  normalizeAppearance,
  PALETTES,
  saveLocalAppearance,
  STORAGE_KEY,
  type Appearance,
} from '../appearance'
import { errorMessage, formatDate, formatDateTime } from '../lib/format'
import { sessionFlags } from '../lib/session'

type FeedbackType = 'complaint' | 'request' | 'bug' | 'other'

const FEEDBACK_TYPES: Array<{ key: FeedbackType; label: string; hint: string }> = [
  { key: 'request', label: 'Feature request', hint: 'Something you wish Swiftie did' },
  { key: 'complaint', label: 'Complaint', hint: 'Something that bothered you' },
  { key: 'bug', label: 'Bug report', hint: 'Something that is broken' },
  { key: 'other', label: 'Other', hint: 'Anything else for the team' },
]

export default function Settings() {
  const navigate = useNavigate()
  const location = useLocation()
  const me = useQuery(api.users.getMe)
  const myFeedback = useQuery(api.feedback.mine)
  const updatePrefs = useMutation(api.users.updatePrefs)
  const submitFeedback = useMutation(api.feedback.submit)
  const deleteMyAccount = useMutation(api.users.deleteMyAccount)

  // ── Appearance ────────────────────────────────────────────────────────────
  const [appearance, setAppearance] = useState<Appearance>(() => loadLocalAppearance())
  const [prefsError, setPrefsError] = useState<string | null>(null)
  const serverPrefs = JSON.stringify(me?.prefs ?? null)
  useEffect(() => {
    if (me?.prefs) setAppearance(normalizeAppearance(me.prefs))
  }, [serverPrefs]) // eslint-disable-line react-hooks/exhaustive-deps

  const setPref = async (patch: Partial<Appearance>) => {
    const next = { ...appearance, ...patch }
    setAppearance(next)
    applyAppearance(next)
    saveLocalAppearance(next)
    setPrefsError(null)
    try {
      await updatePrefs({ prefs: next })
    } catch (err) {
      setPrefsError(errorMessage(err))
    }
  }

  // ── Jump to #section ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!location.hash || me === undefined) return
    const el = document.querySelector(location.hash)
    if (el) window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }, [location.hash, me === undefined])

  // ── Help & feedback ───────────────────────────────────────────────────────
  const [fbType, setFbType] = useState<FeedbackType>('request')
  const [fbSubject, setFbSubject] = useState('')
  const [fbMessage, setFbMessage] = useState('')
  const [fbSending, setFbSending] = useState(false)
  const [fbDone, setFbDone] = useState('')
  const [fbError, setFbError] = useState('')

  const sendFeedback = async () => {
    setFbSending(true)
    setFbError('')
    setFbDone('')
    try {
      await submitFeedback({ type: fbType, subject: fbSubject, message: fbMessage })
      setFbSubject('')
      setFbMessage('')
      setFbDone('✔ Sent. Maya will include it in her next round-up for the team.')
    } catch (err) {
      setFbError(errorMessage(err))
    } finally {
      setFbSending(false)
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (confirmText !== 'DELETE' || deleting) return
    setDeleting(true)
    setDeleteError(null)
    sessionFlags.deletingAccount = true
    try {
      await deleteMyAccount()
    } catch (err) {
      setDeleteError(errorMessage(err))
      sessionFlags.deletingAccount = false
      setDeleting(false)
      return
    }
    // Swiftie data is gone. Now remove the Google sign-in identity (best effort).
    let authWarning = ''
    const user = auth.currentUser
    if (user) {
      try {
        await deleteUser(user)
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code
        try {
          if (code === 'auth/requires-recent-login') {
            await reauthenticateWithPopup(user, googleProvider)
            await deleteUser(user)
          } else {
            throw err
          }
        } catch (inner) {
          authWarning = errorMessage(inner)
        }
      }
    }
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    applyAppearance(DEFAULT_APPEARANCE)
    await signOut(auth)
    sessionFlags.deletingAccount = false
    if (authWarning) {
      window.alert(`Your Swiftie data has been deleted. The Google sign-in link could not be removed (${authWarning}); signing in again will simply start a fresh, empty account.`)
    }
    navigate('/', { replace: true })
  }

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/', { replace: true })
  }

  if (me === undefined || me === null) {
    return (
      <div className="app-content">
        <div className="loading-screen" style={{ minHeight: '300px' }}><div className="loading-bar" /></div>
      </div>
    )
  }

  const jump: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'calc(10px * var(--font-scale, 1))',
    letterSpacing: '2px',
    color: 'var(--text-dim)',
    textDecoration: 'none',
  }

  return (
    <div className="app-content">
      <p className="page-title">// <span>SETTINGS</span></p>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <a href="#appearance" style={jump}>APPEARANCE</a>
        <a href="#profile" style={jump}>PROFILE</a>
        <a href="#feedback" style={jump}>HELP &amp; FEEDBACK</a>
        <a href="#account" style={jump}>ACCOUNT</a>
      </div>

      {/* ── Appearance ─────────────────────────────────────────────────── */}
      <section id="appearance" className="card settings-section">
        <p className="settings-section-title">🎨 APPEARANCE</p>
        <p className="settings-section-sub">Colour palette, text size and font. Saved to your account and applied on every device.</p>

        <label className="cyber-label">COLOUR PALETTE</label>
        <div className="option-grid" style={{ marginBottom: '22px' }}>
          {PALETTES.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`option-card${appearance.palette === p.key ? ' selected' : ''}`}
              onClick={() => setPref({ palette: p.key })}
            >
              <div className="swatches">
                {p.swatches.map((c) => <span key={c} className="swatch" style={{ background: c }} />)}
              </div>
              <div className="option-card-title">{p.label}</div>
              <div className="option-card-desc">{p.description}</div>
            </button>
          ))}
        </div>

        <label className="cyber-label">TEXT SIZE</label>
        <div className="option-grid" style={{ marginBottom: '22px' }}>
          {FONT_SCALES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`option-card${appearance.fontScale === s.key ? ' selected' : ''}`}
              onClick={() => setPref({ fontScale: s.key })}
            >
              <div className="option-card-title">{s.label}</div>
              <div className="option-card-desc">{s.description}</div>
            </button>
          ))}
        </div>

        <label className="cyber-label">FONT</label>
        <div className="option-grid" style={{ marginBottom: '22px' }}>
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`option-card${appearance.fontFamily === f.key ? ' selected' : ''}`}
              onClick={() => setPref({ fontFamily: f.key })}
            >
              <div className="option-card-title">{f.label}</div>
              <div className="option-card-desc">{f.description}</div>
            </button>
          ))}
        </div>

        <div className="toggle-row">
          <div>
            <div className="toggle-label">Reduce motion &amp; effects</div>
            <div className="toggle-hint">Turns off the grid pulse, particles, scanlines and glow animations</div>
          </div>
          <button
            type="button"
            className={`switch${appearance.reduceMotion ? ' on' : ''}`}
            role="switch"
            aria-checked={appearance.reduceMotion}
            onClick={() => setPref({ reduceMotion: !appearance.reduceMotion })}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="ghost-btn" onClick={() => setPref(DEFAULT_APPEARANCE)}>↺ RESET TO DEFAULTS</button>
          {prefsError && <span className="error-msg" style={{ marginTop: 0 }}>{prefsError}</span>}
        </div>
      </section>

      {/* ── Profile ────────────────────────────────────────────────────── */}
      <section id="profile" className="card settings-section">
        <p className="settings-section-title">👤 PROFILE</p>
        <p className="settings-section-sub">
          Your handle, photos, bio and tags. Assessment results are added to your profile automatically when you finish a test.
        </p>
        <ProfileForm me={me} mode="edit" />
      </section>

      {/* ── Help & feedback ────────────────────────────────────────────── */}
      <section id="feedback" className="card settings-section">
        <p className="settings-section-title">💬 HELP &amp; FEEDBACK</p>
        <p className="settings-section-sub">
          Complaints, requests and bug reports go straight to the Swiftie team. Maya rounds them up for the admin every day, and you can also just tell her in chat.
        </p>

        <div className="option-grid" style={{ marginBottom: '18px' }}>
          {FEEDBACK_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`option-card${fbType === t.key ? ' selected' : ''}`}
              onClick={() => setFbType(t.key)}
            >
              <div className="option-card-title">{t.label}</div>
              <div className="option-card-desc">{t.hint}</div>
            </button>
          ))}
        </div>
        <div className="form-group">
          <label className="cyber-label" htmlFor="fb-subject">SUBJECT</label>
          <input id="fb-subject" className="cyber-input" value={fbSubject} onChange={(e) => setFbSubject(e.target.value)} maxLength={120} placeholder="One line summary" />
        </div>
        <div className="form-group">
          <label className="cyber-label" htmlFor="fb-message">MESSAGE</label>
          <textarea id="fb-message" className="cyber-input" value={fbMessage} onChange={(e) => setFbMessage(e.target.value)} maxLength={2000} placeholder="What happened, or what would you like to see?" />
        </div>
        {fbError && <p className="error-msg">{fbError}</p>}
        {fbDone && <p className="success-msg">{fbDone}</p>}
        <button className="cta-btn" style={{ padding: '12px 28px', fontSize: 'calc(12px * var(--font-scale, 1))' }} onClick={sendFeedback} disabled={fbSending || !fbSubject.trim() || !fbMessage.trim()}>
          {fbSending ? 'SENDING…' : 'SEND TO THE TEAM'} <span className="cta-arrow">➔</span>
        </button>

        {myFeedback && myFeedback.length > 0 && (
          <div style={{ marginTop: '26px' }}>
            <label className="cyber-label">YOUR SUBMISSIONS</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myFeedback.map((f) => (
                <div key={f._id} style={{ padding: '12px 14px', background: 'rgba(var(--surface-rgb),0.55)', border: '1px solid rgba(var(--fg-rgb),0.06)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span className={`status-chip ${f.status}`}>{f.status}</span>
                    <span className="status-chip" style={{ color: 'var(--text-dim)', borderColor: 'rgba(var(--fg-rgb),0.15)' }}>{f.type}</span>
                    {f.source === 'maya' && <span className="status-chip" style={{ color: 'var(--neon-green)', borderColor: 'rgba(var(--accent2-rgb),0.3)' }}>via Maya</span>}
                    <span className="toggle-hint" style={{ marginTop: 0 }}>{formatDateTime(f._creationTime)}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'calc(14px * var(--font-scale, 1))', color: 'var(--neon-white)' }}>{f.subject}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'calc(13px * var(--font-scale, 1))', color: 'rgba(var(--text-rgb),0.65)', whiteSpace: 'pre-wrap' }}>{f.message}</div>
                  {f.adminNote && (
                    <div style={{ marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: 'calc(10px * var(--font-scale, 1))', color: 'var(--saffron)', letterSpacing: '0.5px' }}>
                      TEAM: {f.adminNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Account ────────────────────────────────────────────────────── */}
      <section id="account" className="card settings-section danger-zone">
        <p className="settings-section-title" style={{ color: '#ff6b6b' }}>⚠ ACCOUNT</p>
        <p className="settings-section-sub">
          Signed in as {me.email || me.displayName} · joined {formatDate(me._creationTime)}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="ghost-btn" onClick={handleSignOut}>SIGN OUT</button>
          <button className="danger-btn" onClick={() => { setDeleteOpen(true); setConfirmText('') }}>DELETE MY ACCOUNT</button>
        </div>
        <p className="toggle-hint" style={{ marginTop: '12px' }}>
          Deleting removes your profile, posts, comments, likes, follows, messages, Maya history, assessment results and community memberships. This cannot be undone.
        </p>
      </section>

      {deleteOpen && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title" style={{ color: '#ff6b6b' }}>DELETE ACCOUNT</p>
            <p className="modal-sub">
              This permanently deletes @{me.username ?? me.displayName} and everything attached to it. Type <b style={{ color: 'var(--neon-white)' }}>DELETE</b> to confirm.
            </p>
            <input
              className="cyber-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="DELETE"
              autoFocus
              disabled={deleting}
            />
            {deleteError && <p className="error-msg">{deleteError}</p>}
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setDeleteOpen(false)} disabled={deleting}>CANCEL</button>
              <button className="danger-btn" onClick={handleDelete} disabled={confirmText !== 'DELETE' || deleting}>
                {deleting ? 'DELETING…' : 'DELETE EVERYTHING'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
