import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { loadAdminSession, saveAdminSession } from '../lib/adminSession'
import { errorMessage } from '../lib/format'

/**
 * Admin sign-in: an ID + password checked against the Convex environment
 * variables ADMIN_ID / ADMIN_PASSWORD. Separate from the Google sign-in used
 * by regular members.
 */
export default function AdminLogin() {
  const navigate = useNavigate()
  const login = useAction(api.admin.login)
  const [adminId, setAdminId] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (loadAdminSession()) navigate('/admin/console', { replace: true })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminId.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const session = await login({ adminId: adminId.trim(), password })
      saveAdminSession(session)
      navigate('/admin/console', { replace: true })
    } catch (err) {
      const msg = errorMessage(err)
      setError(
        msg.includes('ADMIN_NOT_CONFIGURED')
          ? 'Admin login is not configured yet. Set ADMIN_PASSWORD (and optionally ADMIN_ID) in the Convex dashboard → Settings → Environment Variables, then try again.'
          : msg
      )
    } finally {
      setLoading(false)
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

      <div className="login-container">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-logo">SWIFTIE</div>
          <p className="login-tagline">Admin console</p>

          <div className="e2e-badge" style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.35)', background: 'rgba(255,107,107,0.08)' }}>
            🛡 RESTRICTED ACCESS
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="cyber-label" htmlFor="admin-id">ADMIN ID</label>
            <input
              id="admin-id"
              className="cyber-input"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              autoComplete="username"
              spellCheck={false}
            />
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="cyber-label" htmlFor="admin-password">PASSWORD</label>
            <input
              id="admin-password"
              className="cyber-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="error-msg" style={{ textAlign: 'left', lineHeight: 1.6 }}>⚠ {error}</p>}

          <button type="submit" className="cta-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} disabled={loading || !password}>
            {loading ? 'CHECKING…' : 'OPEN CONSOLE'} <span className="cta-arrow">➔</span>
          </button>

          <p className="login-privacy">
            Sessions last 12 hours. Five failed attempts lock sign-in for 15 minutes.
            <br />
            <Link to="/" style={{ color: 'var(--text-dim)' }}>← back to Swiftie</Link>
          </p>
        </form>
      </div>
    </>
  )
}
