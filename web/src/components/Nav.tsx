import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { auth } from '../firebase'
import { api } from '../../convex/_generated/api'
import UserAvatar from './UserAvatar'

/** Wide enough to keep the menu docked beside the content instead of over it. */
const DESKTOP_QUERY = '(min-width: 1024px)'
/** Remembers whether the docked (desktop) menu was left open or collapsed. */
const DOCK_KEY = 'swiftie.nav.docked'

function prefersDocked(): boolean {
  try {
    return localStorage.getItem(DOCK_KEY) !== 'closed'
  } catch {
    return true
  }
}

function rememberDocked(open: boolean) {
  try {
    localStorage.setItem(DOCK_KEY, open ? 'open' : 'closed')
  } catch {
    /* private mode / storage disabled — the menu still works, it just won't persist */
  }
}

interface NavItem {
  to: string
  label: string
  icon: string
  /** Path prefix used to decide whether the item is the current page. */
  match: string
}

export default function Nav() {
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.getMe)
  const setOffline = useMutation(api.users.setOffline)
  const navigate = useNavigate()
  const location = useLocation()

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  )
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches && prefersDocked()
  )
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLElement>(null)

  /* Darken the top bar once the page scrolls away from the top. */
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const handler = () => bar.classList.toggle('scrolled', window.scrollY > 50)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  /* Track the breakpoint: docked on wide screens, an overlay drawer on phones. */
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const desktop = 'matches' in e ? e.matches : false
      setIsDesktop(desktop)
      setOpen(desktop ? prefersDocked() : false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  /* Shift the page content while the menu is docked open. */
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-nav', isDesktop && open ? 'docked' : 'collapsed')
    return () => root.removeAttribute('data-nav')
  }, [isDesktop, open])

  /* On phones the drawer covers the page, so freeze the page behind it. */
  useEffect(() => {
    if (isDesktop || !open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isDesktop, open])

  /* Escape closes the drawer. */
  useEffect(() => {
    if (!open || isDesktop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, isDesktop])

  /* Move focus into the drawer when it opens on a phone. */
  useEffect(() => {
    if (open && !isDesktop) {
      panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    }
  }, [open, isDesktop])

  /* Navigating away closes the overlay drawer. */
  useEffect(() => {
    if (!isDesktop) setOpen(false)
  }, [location.pathname, isDesktop])

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      if (isDesktop) rememberDocked(next)
      return next
    })
  }, [isDesktop])

  const handleLogout = async () => {
    try { await setOffline() } catch { /* best effort */ }
    await signOut(auth)
    navigate('/', { replace: true })
  }

  const items: NavItem[] = [
    { to: '/feed', label: 'FEED', icon: '▤', match: '/feed' },
    { to: '/chat', label: 'MESSAGES', icon: '✉', match: '/chat' },
    { to: '/discover', label: 'DISCOVER', icon: '◎', match: '/discover' },
    { to: '/explore', label: 'EXPLORE', icon: '⬡', match: '/explore' },
    { to: '/maya', label: 'MAYA ✦', icon: '✧', match: '/maya' },
  ]

  const profilePath = me?.username ? `/profile/${me.username}` : '/onboarding'
  const isActive = (path: string) => location.pathname.startsWith(path)

  // When the drawer is off-screen its links must stay out of the tab order.
  const hidden = !open && !isDesktop
  const linkTabIndex = hidden ? -1 : undefined

  return (
    <>
      <div className="tricolour-top">
        <div className="saffron" /><div className="white-bar" /><div className="green-bar" />
      </div>

      <header className="main-nav" ref={barRef}>
        {isAuthenticated && (
          <button
            ref={toggleRef}
            type="button"
            className={`nav-toggle${open ? ' is-open' : ''}`}
            onClick={toggle}
            aria-expanded={open}
            aria-controls="side-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className="nav-toggle-bars" aria-hidden="true">
              <span /><span /><span />
            </span>
          </button>
        )}

        <Link to={isAuthenticated ? '/feed' : '/'} className="nav-logo">
          SWIFTIE
        </Link>

        <div className="nav-topbar-end">
          {isAuthenticated && me && (
            <Link to={profilePath} className="nav-topbar-avatar" title={me.displayName ?? 'Profile'}>
              <UserAvatar user={me} size={32} />
            </Link>
          )}
          {!isAuthenticated && (
            <Link to="/login" className="nav-signin">SIGN IN</Link>
          )}
        </div>
      </header>

      {isAuthenticated && (
        <>
          <div
            className={`side-nav-backdrop${open && !isDesktop ? ' is-visible' : ''}`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <nav
            id="side-nav"
            ref={panelRef}
            className={`side-nav${open ? ' is-open' : ''}`}
            aria-label="Main menu"
            aria-hidden={hidden}
          >
            <Link to={profilePath} className="side-nav-me" tabIndex={linkTabIndex}>
              <UserAvatar user={me ?? null} size={40} />
              <span className="side-nav-me-text">
                <span className="side-nav-me-name">{me?.displayName ?? 'PROFILE'}</span>
                {me?.username && <span className="side-nav-me-handle">@{me.username}</span>}
              </span>
            </Link>

            <ul className="side-nav-list">
              {items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    tabIndex={linkTabIndex}
                    className={`side-nav-link${isActive(item.match) ? ' is-active' : ''}`}
                    aria-current={isActive(item.match) ? 'page' : undefined}
                  >
                    <span className="side-nav-icon" aria-hidden="true">{item.icon}</span>
                    <span className="side-nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to={profilePath}
                  tabIndex={linkTabIndex}
                  className={`side-nav-link${isActive('/profile') ? ' is-active' : ''}`}
                  aria-current={isActive('/profile') ? 'page' : undefined}
                >
                  <span className="side-nav-icon" aria-hidden="true">◉</span>
                  <span className="side-nav-label">PROFILE</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/settings"
                  tabIndex={linkTabIndex}
                  className={`side-nav-link${isActive('/settings') ? ' is-active' : ''}`}
                  aria-current={isActive('/settings') ? 'page' : undefined}
                >
                  <span className="side-nav-icon" aria-hidden="true">⚙</span>
                  <span className="side-nav-label">SETTINGS</span>
                </Link>
              </li>
            </ul>

            <div className="side-nav-foot">
              <button type="button" className="side-nav-link side-nav-logout" onClick={handleLogout} tabIndex={linkTabIndex}>
                <span className="side-nav-icon" aria-hidden="true">⏻</span>
                <span className="side-nav-label">LOGOUT</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  )
}
