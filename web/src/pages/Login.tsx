import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useConvexAuth } from 'convex/react'

export default function Login() {
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const particlesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAuthenticated) navigate('/feed', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const container = particlesRef.current
    if (!container) return
    const colors = ['#FF9933', '#FFFFFF', '#00FF41', '#0044FF', '#FFB347', '#00FF6A']
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      p.style.left = Math.random() * 100 + '%'
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      p.style.animationDuration = (8 + Math.random() * 12) + 's'
      p.style.animationDelay = Math.random() * 10 + 's'
      const size = (1 + Math.random() * 2) + 'px'
      p.style.width = size
      p.style.height = size
      container.appendChild(p)
    }
    return () => { container.innerHTML = '' }
  }, [])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    try {
      // Firebase signs in — Convex picks up the token automatically via ConvexProviderWithAuth
      await signInWithPopup(auth, googleProvider)
      // After sign-in, ConvexProviderWithAuth gets the Firebase token and authenticates Convex
      // The user will be redirected once isAuthenticated becomes true (useEffect above)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="grid-bg" />
      <div className="scanlines" />
      <div className="ambient-glow" />
      <div className="particles" ref={particlesRef} />

      <div className="tricolour-top">
        <div className="saffron" />
        <div className="white-bar" />
        <div className="green-bar" />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">SWIFTIE</div>
          <p className="login-tagline">Connect · Chat · Encrypt</p>

          <div className="e2e-badge">
            🔒 End-to-end encrypted
          </div>

          <button
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '12px', letterSpacing: '2px' }}>
                AUTHENTICATING...
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                CONTINUE WITH GOOGLE
              </>
            )}
          </button>

          {error && (
            <p className="error-msg" style={{ marginTop: '16px', textAlign: 'center' }}>
              ⚠ {error}
            </p>
          )}

          <p className="login-privacy">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your messages are encrypted and cannot be read by anyone — including us.
          </p>
        </div>
      </div>
    </>
  )
}
