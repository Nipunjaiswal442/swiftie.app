import { useRef, useState, KeyboardEvent } from 'react'
import { useMutation } from 'convex/react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import { storage } from '../firebase'
import UserAvatar from './UserAvatar'
import { errorMessage } from '../lib/format'

interface Props {
  me: Doc<'users'>
  mode: 'create' | 'edit'
  submitLabel?: string
  onSaved?: (user: Doc<'users'> | null) => void
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/**
 * Profile editor shared by Onboarding (create) and Settings → Profile (edit).
 * Username, display name, bio, age, pronouns, location, role, interest tags,
 * profile photo and cover photo.
 */
export default function ProfileForm({ me, mode, submitLabel, onSaved }: Props) {
  const updateMe = useMutation(api.users.updateMe)

  const [username, setUsername] = useState(me.username ?? '')
  const [displayName, setDisplayName] = useState(me.displayName ?? '')
  const [bio, setBio] = useState(me.bio ?? '')
  const [age, setAge] = useState(me.age ? String(me.age) : '')
  const [location, setLocation] = useState(me.location ?? '')
  const [pronouns, setPronouns] = useState(me.pronouns ?? '')
  const [currentRole, setCurrentRole] = useState(me.currentRole ?? '')
  const [interests, setInterests] = useState<string[]>(me.interests ?? [])
  const [interestInput, setInterestInput] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const addInterest = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/,+$/, '')
    if (!tag || interests.length >= 8 || interests.includes(tag)) return
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

  const pickFile = (file: File | null, kind: 'photo' | 'cover') => {
    if (file && file.size > MAX_PHOTO_BYTES) {
      setError('Images must be under 5 MB.')
      return
    }
    setError('')
    const url = file ? URL.createObjectURL(file) : null
    if (kind === 'photo') { setPhotoFile(file); setPhotoPreview(url) }
    else { setCoverFile(file); setCoverPreview(url) }
  }

  const upload = async (file: File, name: string) => {
    const storageRef = ref(storage, `profiles/${me._id}/${name}_${Date.now()}_${file.name}`)
    const snap = await uploadBytes(storageRef, file)
    return getDownloadURL(snap.ref)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    if (!username.trim() || !displayName.trim()) {
      setError('Username and display name are required.')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setError('Username: 3-30 chars, lowercase letters, numbers, underscores only.')
      return
    }
    if (age && (Number(age) < 13 || Number(age) > 120)) {
      setError('You must be at least 13 years old to use this platform.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const profilePhotoUrl = photoFile ? await upload(photoFile, 'avatar') : undefined
      const coverPhotoUrl = coverFile ? await upload(coverFile, 'cover') : undefined
      const user = await updateMe({
        username: username.toLowerCase(),
        displayName: displayName.trim(),
        bio,
        age: age ? Number(age) : undefined,
        location,
        pronouns,
        currentRole,
        interests,
        ...(profilePhotoUrl && { profilePhotoUrl }),
        ...(coverPhotoUrl && { coverPhotoUrl }),
      })
      setPhotoFile(null)
      setCoverFile(null)
      setSuccess(mode === 'edit' ? '✔ Profile saved.' : '')
      onSaved?.(user)
    } catch (err: unknown) {
      setError(errorMessage(err, 'Failed to save. Username may be taken.'))
    } finally {
      setSaving(false)
    }
  }

  const hint: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'calc(10px * var(--font-scale, 1))',
    color: 'var(--text-dim)',
    marginTop: '6px',
    letterSpacing: '1px',
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Photos ─────────────────────────────────────── */}
      <div className="form-group">
        <label className="cyber-label">PHOTOS <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
        <div
          style={{
            height: '110px',
            background: coverPreview
              ? `url(${coverPreview}) center/cover`
              : me.coverPhotoUrl
                ? `url(${me.coverPhotoUrl}) center/cover`
                : 'linear-gradient(135deg, rgba(var(--accent-rgb),0.15), rgba(var(--accent2-rgb),0.08))',
            border: '1px solid rgba(var(--accent-rgb),0.15)',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', left: '16px', bottom: '-24px' }}>
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="user-avatar" style={{ width: 64, height: 64 }} />
            ) : (
              <UserAvatar user={me} size={64} />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '32px', flexWrap: 'wrap' }}>
          <button type="button" className="ghost-btn" onClick={() => photoInputRef.current?.click()}>
            📷 {photoFile ? photoFile.name.slice(0, 18) : 'PROFILE PHOTO'}
          </button>
          <button type="button" className="ghost-btn" onClick={() => coverInputRef.current?.click()}>
            🖼 {coverFile ? coverFile.name.slice(0, 18) : 'COVER PHOTO'}
          </button>
          {(photoFile || coverFile) && (
            <button type="button" className="ghost-btn" onClick={() => { pickFile(null, 'photo'); pickFile(null, 'cover') }}>✕ CLEAR</button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickFile(e.target.files?.[0] ?? null, 'photo')} />
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickFile(e.target.files?.[0] ?? null, 'cover')} />
        </div>
      </div>

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
        <p style={hint}>LOWERCASE · LETTERS · NUMBERS · UNDERSCORES · 3–30 CHARS</p>
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
          maxLength={300}
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
        <p style={hint}>{bio.length}/300</p>
      </div>

      {/* ── Optional richer profile fields ───────────── */}
      <div className="field-row">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="cyber-label" htmlFor="age">AGE <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
          <input id="age" className="cyber-input" type="number" placeholder="18" value={age} onChange={(e) => setAge(e.target.value)} min={13} max={120} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="cyber-label" htmlFor="pronouns">PRONOUNS <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
          <input id="pronouns" className="cyber-input" type="text" placeholder="e.g. she/her" value={pronouns} onChange={(e) => setPronouns(e.target.value)} maxLength={30} />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="cyber-label" htmlFor="location">LOCATION <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
        <input id="location" className="cyber-input" type="text" placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} />
      </div>

      <div className="form-group">
        <label className="cyber-label" htmlFor="currentRole">CURRENT ROLE <span style={{ color: 'var(--text-dim)' }}>(OPTIONAL)</span></label>
        <input id="currentRole" className="cyber-input" type="text" placeholder="3rd-yr CSE @ NIT Silchar" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} maxLength={80} />
      </div>

      <div className="form-group">
        <label className="cyber-label">
          INTERESTS <span style={{ color: 'var(--text-dim)' }}>— UP TO 8 TAGS (OPTIONAL)</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: interests.length ? '8px 0 6px' : '0' }}>
          {interests.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px',
                background: 'rgba(var(--accent-rgb),0.08)',
                border: '1px solid rgba(var(--accent-rgb),0.3)',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'calc(11px * var(--font-scale, 1))',
                letterSpacing: '1px',
                color: 'var(--saffron)',
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => setInterests((prev) => prev.filter((t) => t !== tag))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 'calc(12px * var(--font-scale, 1))', lineHeight: 1, padding: '0 0 0 2px' }}
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
        <p style={hint}>{interests.length}/8 TAGS · ENTER OR COMMA TO ADD</p>
      </div>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <button
        type="submit"
        className="cta-btn"
        disabled={saving}
        style={{ width: '100%', justifyContent: 'center', marginTop: '8px', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'SAVING...' : submitLabel ?? (mode === 'create' ? 'ENTER SWIFTIE' : 'SAVE PROFILE')} <span className="cta-arrow">➔</span>
      </button>
    </form>
  )
}
