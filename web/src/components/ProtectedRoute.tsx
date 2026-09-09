import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { signOut } from 'firebase/auth'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import { auth } from '../firebase'
import { errorMessage } from '../lib/format'
import { sessionFlags } from '../lib/session'

interface Props {
  children: React.ReactNode
  /** Onboarding needs to render for users who have not picked a username yet. */
  allowIncompleteProfile?: boolean
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">SWIFTIE</div>
      <div className="loading-bar" />
    </div>
  )
}

/** Shown instead of the app when the admin has suspended the account. Lets the user appeal. */
function SuspendedScreen({ me }: { me: Doc<'users'> }) {
  const navigate = useNavigate()
  const submit = useMutation(api.feedback.submit)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const appeal = async () => {
    if (!message.trim()) return
    try {
      await submit({ type: 'complaint', subject: 'Account suspension appeal', message: message.trim() })
      setSent(true)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  const logout = async () => {
    await signOut(auth)
    navigate('/', { replace: true })
  }

  return (
    <>
      <div className="grid-bg" />
      <div className="scanlines" />
      <div className="tricolour-top"><div className="saffron" /><div className="white-bar" /><div className="green-bar" /></div>
      <div className="suspended-screen">
        <div className="onboarding-card">
          <p className="section-label visible" style={{ color: '#ff6b6b' }}>// ACCOUNT SUSPENDED</p>
          <h2 className="onboarding-title">ACCESS PAUSED</h2>
          <p className="onboarding-sub" style={{ textTransform: 'none', letterSpacing: '0.5px' }}>
            {me.suspendedReason ? `Reason: ${me.suspendedReason}` : 'Your account was suspended by the Swiftie team.'}
          </p>
          {sent ? (
            <p className="success-msg">✔ Your appeal has been sent. Maya will pass it on in her next round-up.</p>
          ) : (
            <>
              <label className="cyber-label" htmlFor="appeal">APPEAL</label>
              <textarea
                id="appeal"
                className="cyber-input"
                placeholder="Tell us why this should be reviewed…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
              />
              {error && <p className="error-msg">{error}</p>}
              <button className="cta-btn" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={appeal} disabled={!message.trim()}>
                SEND APPEAL <span className="cta-arrow">➔</span>
              </button>
            </>
          )}
          <button className="ghost-btn" style={{ marginTop: '20px' }} onClick={logout}>LOGOUT</button>
        </div>
      </div>
    </>
  )
}

/**
 * Gate for every signed-in route:
 *  1. waits for Firebase → Convex auth,
 *  2. makes sure a `users` row exists (first sign-in creates it),
 *  3. blocks suspended accounts,
 *  4. sends people without a username to onboarding — the profile is created
 *     before the feed, communities or assessments are reachable.
 */
export default function ProtectedRoute({ children, allowIncompleteProfile = false }: Props) {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : 'skip')
  const getOrCreate = useMutation(api.users.getOrCreate)
  const location = useLocation()
  const creating = useRef(false)

  // First sign-in: no users row yet → create it. Runs once per mount.
  useEffect(() => {
    if (isAuthenticated && me === null && !creating.current && !sessionFlags.deletingAccount) {
      creating.current = true
      getOrCreate().catch(() => { creating.current = false })
    }
  }, [isAuthenticated, me, getOrCreate])

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (me === undefined || me === null) return <LoadingScreen />
  if (me.status === 'suspended') return <SuspendedScreen me={me} />
  if (!me.username && !allowIncompleteProfile) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
