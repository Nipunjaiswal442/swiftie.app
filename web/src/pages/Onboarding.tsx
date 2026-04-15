import { useState, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function Onboarding() {
  const navigate = useNavigate()
  const updateMe = useMutation(api.users.updateMe)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [age, setAge] = useState('')
  const [location, setLocation] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [interestInput, setInterestInput] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const addInterest = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/,+$/, '')
    if (!tag) return
    if (interests.length >= 8) return
    if (interests.includes(tag)) return
    setInterests((prev) => [...prev, tag])
  }

  const handleInterestKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addInterest(interestInput)
      setInterestInput('')
    } else if (e.key === 'Backspace' && !interestInput && interests.length > 0) {
      setInterests((prev) => prev.slice(0, -1))
    }
  }

  const removeInterest = (tag: string) => {
    setInterests((prev) => prev.filter((t) => t !== tag))
  }

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
    if (age && Number(age) < 13) {
      setError('You must be at least 13 years old to use this platform.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateMe({
        username: username.toLowerCase(),
        displayName,
        bio: bio || undefined,
        age: age ? Number(age) : undefined,
        location: location || undefined,
        pronouns: pronouns || undefined,
        currentRole: currentRole || undefined,
        interests: interests.length > 0 ? interests : undefined,
      })
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
            {/* ── Required fields ──────────────────────────── */}
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

            {/* ── Optional richer profile fields ───────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="cyber-label" htmlFor="age">AGE <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
                <input
                  id="age"
                  className="cyber-input"
                  type="number"
                  placeholder="18"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={13}
                  max={120}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="cyber-label" htmlFor="pronouns">PRONOUNS <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
                <input
                  id="pronouns"
                  className="cyber-input"
                  type="text"
                  placeholder="e.g. she/her"
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="cyber-label" htmlFor="location">LOCATION <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
              <input
                id="location"
                className="cyber-input"
                type="text"
                placeholder="City, State"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={60}
              />
            </div>

            <div className="form-group">
              <label className="cyber-label" htmlFor="currentRole">CURRENT ROLE <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
              <input
                id="currentRole"
                className="cyber-input"
                type="text"
                placeholder="3rd-yr CSE @ NIT Silchar"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                maxLength={80}
              />
            </div>

            <div className="form-group">
              <label className="cyber-label">
                INTERESTS <span style={{ color: 'var(--text-dim)' }}>— UP TO 8 TAGS (OPTIONAL)</span>
              </label>
              {/* Tag chips */}
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '6px',
                padding: interests.length ? '8px 0 6px' : '0',
              }}>
                {interests.map((tag) => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px',
                    background: 'rgba(255,153,51,0.08)',
                    border: '1px solid rgba(255,153,51,0.3)',
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '11px',
                    letterSpacing: '1px',
                    color: 'var(--saffron)',
                  }}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeInterest(tag)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-dim)', fontSize: '12px', lineHeight: 1,
                        padding: '0 0 0 2px',
                      }}
                    >×</button>
                  </span>
                ))}
              </div>
              <input
                className="cyber-input"
                type="text"
                placeholder={interests.length >= 8 ? 'Max 8 tags reached' : 'Type a tag and press Enter or comma…'}
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={handleInterestKeyDown}
                onBlur={() => { if (interestInput.trim()) { addInterest(interestInput); setInterestInput('') } }}
                disabled={interests.length >= 8}
                maxLength={30}
              />
              <p style={{ fontFamily: "'Share Tech Mono'", fontSize: '10px', color: 'var(--text-dim)', marginTop: '6px', letterSpacing: '1px' }}>
                {interests.length}/8 TAGS · ENTER OR COMMA TO ADD
              </p>
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
