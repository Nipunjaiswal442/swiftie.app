import { useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

const HEARTBEAT_EVERY_MS = 60_000

/**
 * Keeps the signed-in user's online status fresh: a heartbeat every minute
 * while the tab is visible, plus a best-effort "offline" ping when it closes.
 * Renders nothing.
 */
export default function PresenceBeacon() {
  const heartbeat = useMutation(api.users.heartbeat)
  const setOffline = useMutation(api.users.setOffline)

  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === 'visible') heartbeat().catch(() => {})
    }
    ping()
    const timer = window.setInterval(ping, HEARTBEAT_EVERY_MS)
    const onHide = () => {
      if (document.visibilityState === 'hidden') setOffline().catch(() => {})
      else ping()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [heartbeat, setOffline])

  return null
}
