import { useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { useConvexAuth, useQuery } from 'convex/react'
import { auth } from '../firebase'
import { api } from '../../convex/_generated/api'
import UserAvatar from './UserAvatar'

export default function Nav() {
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.getMe)
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const handler = () => {
      if (window.scrollY > 50) nav.classList.add('scrolled')
      else nav.classList.remove('scrolled')
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/', { replace: true })
  }

  const isActive = (path: string): React.CSSProperties =>
    location.pathname.startsWith(path) ? { color: 'var(--saffron)' } : {}

  return (
    <>
      <div className="tricolour-top">
        <div className="saffron" /><div className="white-bar" /><div className="green-bar" />
      </div>
      <nav className="main-nav" ref={navRef}>
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
          SWIFTIE
        </Link>
        <ul className="nav-links">
          {isAuthenticated && (
            <>
              <li><Link to="/feed" style={isActive('/feed')}>FEED</Link></li>
              <li><Link to="/chat" style={isActive('/chat')}>MESSAGES</Link></li>
              <li><Link to="/discover" style={isActive('/discover')}>DISCOVER</Link></li>
              <li><Link to="/explore" style={isActive('/explore')}>EXPLORE</Link></li>
              <li><Link to="/maya" style={isActive('/maya')}>MAYA ✦</Link></li>
              {me && (
                <li>
                  <Link
                    to={me.username ? `/profile/${me.username}` : '/onboarding'}
                    style={{ ...isActive('/profile'), display: 'flex', alignItems: 'center', gap: '8px' }}
                    title={me.displayName ?? 'Profile'}
                  >
                    <UserAvatar user={me} size={28} />
                    <span>PROFILE</span>
                  </Link>
                </li>
              )}
              <li><button onClick={handleLogout}>LOGOUT</button></li>
            </>
          )}
          {!isAuthenticated && (
            <li><Link to="/login">SIGN IN</Link></li>
          )}
        </ul>
      </nav>
    </>
  )
}
