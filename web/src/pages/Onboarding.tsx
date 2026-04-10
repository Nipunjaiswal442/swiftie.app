import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function Onboarding() {
  const navigate = useNavigate()
  const updateMe = useMutation(api.users.updateMe)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !displayName.trim()) {
      setError('Username and display name are required.')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setError('Username: 3-30 chars, lowercase letters, numbers, underscores only.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateMe({ username: username.toLowerCase(), displayName, bio: bio || undefined })
      navigate('/feed', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Username may be taken.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="grid-bg" />
      <div className="scanlines" />
      <div className="ambient-glow" />

      <div className="tricolour-top">
        <div className="saffron" /><div className="white-bar" /><div className="green-bar" />
      </div>

      <div className="onboarding-container">
        <div className="onboarding-card">
          <p className="section-label visible" style={{ marginBottom: '8px' }}>// SETUP YOUR IDENTITY</p>
          <h2 className="onboarding-title">INITIALIZE PROFILE</h2>
          <p className="onboarding-sub">Choose your handle and set up your presence on Swiftie.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="cyber-label" htmlFor="username">USERNAME</label>
              <input
                id="username"
                className="cyber-input"
                type="text"
                placeholder="your_handle"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                maxLength={30}
                autoComplete="off"
                spellCheck={false}
              />
              <p style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px', letterSpacing: '1px' }}>
                LOWERCASE · LETTERS · NUMBERS · UNDERSCORES · 3–30 CHARS
              </p>
            </div>

            <div className="form-group">
              <label className="cyber-label" htmlFor="displayName">DISPLAY NAME</label>
              <input
                id="displayName"
                className="cyber-input"
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label className="cyber-label" htmlFor="bio">BIO <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
              <textarea
                id="bio"
                className="cyber-input"
                placeholder="Tell the world who you are..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button
              type="submit"
              className="cta-btn"
              disabled={saving}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'SAVING...' : 'ENTER SWIFTIE'} <span className="cta-arrow">➔</span>
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
