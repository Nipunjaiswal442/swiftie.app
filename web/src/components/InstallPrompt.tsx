import { useEffect, useState } from 'react'

/**
 * Home-screen install nudge.
 *
 * Two different worlds:
 *  - Chromium (Android, desktop Chrome/Edge) fires `beforeinstallprompt`, which
 *    we hold on to so the install can be triggered from our own button.
 *  - iOS has no such event. Safari only installs through Share → Add to Home
 *    Screen, done by hand, so all we can do is show the instruction. Without
 *    it most iPhone users never discover installing at all.
 */

const SNOOZE_KEY = 'swiftie.install.snoozed'
/** How long a dismissal lasts before the nudge may return. */
const SNOOZE_DAYS = 30

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isSnoozed(): boolean {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at)) return false
    return Date.now() - at < SNOOZE_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()))
  } catch {
    /* storage blocked — the nudge simply returns next visit */
  }
}

/** Already launched from the home screen: nothing to advertise. */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS predates display-mode and exposes its own flag.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent
  const ios =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports itself as a Mac; touch points give it away.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (!ios) return false
  // Embedded webviews (Instagram, Facebook, X, LINE) have no share sheet entry
  // for Add to Home Screen, so the instruction would send people nowhere.
  return !/FBAN|FBAV|Instagram|LinkedInApp|Line\/|Twitter|OKApp|MicroMessenger/i.test(ua)
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isStandalone() || isSnoozed()) return

    const onBeforeInstall = (e: Event) => {
      // Stop Chrome's own mini-infobar so ours is the only prompt shown.
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setShowIosHint(false)
      snooze()
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // iOS gets the manual instruction, but not the instant someone lands —
    // let them look at the app first.
    let timer: number | undefined
    if (isIosSafari()) {
      timer = window.setTimeout(() => setShowIosHint(true), 4000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const close = () => {
    setDismissed(true)
    snooze()
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    // The event can only be used once, whatever the user chose.
    setDeferred(null)
  }

  if (dismissed) return null
  const mode = deferred ? 'prompt' : showIosHint ? 'ios' : null
  if (!mode) return null

  return (
    <div className="install-card" role="dialog" aria-label="Install Swiftie">
      <img className="install-icon" src="/icons/icon-192.png" alt="" width={44} height={44} />

      <div className="install-body">
        <p className="install-title">INSTALL SWIFTIE</p>
        {mode === 'prompt' ? (
          <p className="install-text">Add it to your home screen — full screen, no browser bars.</p>
        ) : (
          <p className="install-text">
            Tap <ShareGlyph /> in Safari's toolbar, then choose <strong>Add to Home Screen</strong>.
          </p>
        )}
      </div>

      {mode === 'prompt' && (
        <button type="button" className="install-btn" onClick={install}>
          INSTALL
        </button>
      )}

      <button type="button" className="install-close" onClick={close} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}

/** The iOS share glyph, so the instruction points at something recognisable. */
function ShareGlyph() {
  return (
    <svg
      className="install-share-glyph"
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Share"
      role="img"
    >
      <path d="M12 15V3" />
      <path d="M8 6.5 12 2.5l4 4" />
      <path d="M8 10H6a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18 10h-2" />
    </svg>
  )
}
