/**
 * Service worker registration.
 *
 * The worker itself is a plain file at public/sw.js, which Vite copies to the
 * deploy root. It must be served from the root for its scope to cover the whole
 * site — a worker at /assets/sw.js could only control /assets/.
 *
 * Registration is skipped in development: the worker serves static assets
 * cache-first, which fights with Vite's HMR. Any worker left over from a
 * production build on the same origin is torn down instead, so a dev server on
 * localhost is never hijacked by a stale cache.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  if (!import.meta.env.PROD) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister())
    }).catch(() => { /* nothing registered, or storage is blocked */ })
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // A failed registration must never take the app down with it — the site
      // works fine uninstalled, it just won't be available offline.
      console.warn('[swiftie] service worker registration failed:', err)
    })
  })
}
