// Small formatting helpers shared by feed, comments, profile and admin pages.

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'NOW'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}M`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}H`
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}D`
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error) {
    // Convex wraps thrown errors as "Uncaught Error: <message>" — show only the message.
    const m = err.message.match(/Uncaught Error:\s*([^\n]+)/)
    return (m ? m[1] : err.message).trim() || fallback
  }
  return fallback
}
