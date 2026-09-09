// Admin console session token, kept in sessionStorage (cleared when the tab closes).
export interface AdminSession {
  token: string
  adminId: string
  expiresAt: number
}

const KEY = 'swiftie.admin'

export function loadAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminSession
    if (!parsed.token || typeof parsed.expiresAt !== 'number' || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveAdminSession(session: AdminSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable — the console still works for this page load */
  }
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
