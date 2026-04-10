import { useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuthStore } from '../store/authStore'
import UserAvatar from './UserAvatar'

export default function Nav() {
  const { user, logout } = useAuthStore()
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
    logout()
    navigate('/', { replace: true })
  }

  const isActive = (path: string) => location.pathname.startsWith(path)
    ? { color: 'var(--saffron)' }
    : {}

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
          <li><Link to="/feed" style={isActive('/feed')}>FEED</Link></li>
          <li><Link to="/chat" style={isActive('/chat')}>MESSAGES</Link></li>
          {user && (
            <li>
              <Link to={`/profile/${user.username}`} style={isActive('/profile')} title={user.displayName}>
                <UserAvatar user={user} size={28} />
              </Link>
            </li>
          )}
          <li>
            <button onClick={handleLogout}>LOGOUT</button>
          </li>
        </ul>
      </nav>
    </>
  )
}
