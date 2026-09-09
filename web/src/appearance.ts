// Appearance preferences: colour palette, text size, font family and motion.
// Applied as data-attributes on <html> (see theme.css), cached in localStorage
// so the first paint is already themed, and synced to the user's Convex
// profile (users.prefs) so they follow the account across devices.

export type Palette = 'tricolour' | 'cyan' | 'magenta' | 'amber' | 'mono' | 'light'
export type FontScale = 'small' | 'medium' | 'large' | 'xlarge'
export type FontFamily = 'cyber' | 'readable' | 'mono'

export interface Appearance {
  palette: Palette
  fontScale: FontScale
  fontFamily: FontFamily
  reduceMotion: boolean
}

export const STORAGE_KEY = 'swiftie.appearance'

export const DEFAULT_APPEARANCE: Appearance = {
  palette: 'tricolour',
  fontScale: 'medium',
  fontFamily: 'cyber',
  reduceMotion: false,
}

export const PALETTES: Array<{ key: Palette; label: string; description: string; swatches: string[] }> = [
  { key: 'tricolour', label: 'Tricolour', description: 'Saffron, white and green on deep navy. The original.', swatches: ['#FF9933', '#FFFFFF', '#00FF41', '#0A0A0F'] },
  { key: 'cyan', label: 'Cyan Circuit', description: 'Electric cyan and lime on midnight blue.', swatches: ['#00E5FF', '#A8FF60', '#FF5FD2', '#050B12'] },
  { key: 'magenta', label: 'Magenta Pulse', description: 'Hot pink and mint on violet black.', swatches: ['#FF40C4', '#7CFFDF', '#8C96FF', '#0C0612'] },
  { key: 'amber', label: 'Amber Terminal', description: 'Warm CRT amber on near-black.', swatches: ['#FFB000', '#FFD166', '#FF8C42', '#0D0900'] },
  { key: 'mono', label: 'Monochrome', description: 'Greys and white. Calm and quiet.', swatches: ['#E6E6F0', '#BEBED0', '#8A8A9A', '#0A0A0C'] },
  { key: 'light', label: 'Daylight', description: 'Light background, deeper accents.', swatches: ['#E0640A', '#0E8A3C', '#1D5FD1', '#F6F7FB'] },
]

export const FONT_SCALES: Array<{ key: FontScale; label: string; description: string }> = [
  { key: 'small', label: 'Small', description: '90% — more on screen' },
  { key: 'medium', label: 'Medium', description: '100% — the default' },
  { key: 'large', label: 'Large', description: '115% — easier on the eyes' },
  { key: 'xlarge', label: 'Extra large', description: '130% — maximum legibility' },
]

export const FONT_FAMILIES: Array<{ key: FontFamily; label: string; description: string }> = [
  { key: 'cyber', label: 'Cyber', description: 'Orbitron headings, Rajdhani body, Share Tech Mono labels' },
  { key: 'readable', label: 'Readable', description: 'System sans-serif everywhere. Best for long reading' },
  { key: 'mono', label: 'Terminal', description: 'Monospace for everything, like a console' },
]

const PALETTE_KEYS = new Set<string>(PALETTES.map((p) => p.key))
const SCALE_KEYS = new Set<string>(FONT_SCALES.map((s) => s.key))
const FAMILY_KEYS = new Set<string>(FONT_FAMILIES.map((f) => f.key))

/** Turn any partial / untrusted prefs object into a complete Appearance. */
export function normalizeAppearance(raw: unknown): Appearance {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const palette = typeof obj.palette === 'string' && PALETTE_KEYS.has(obj.palette) ? (obj.palette as Palette) : DEFAULT_APPEARANCE.palette
  const fontScale = typeof obj.fontScale === 'string' && SCALE_KEYS.has(obj.fontScale) ? (obj.fontScale as FontScale) : DEFAULT_APPEARANCE.fontScale
  const fontFamily = typeof obj.fontFamily === 'string' && FAMILY_KEYS.has(obj.fontFamily) ? (obj.fontFamily as FontFamily) : DEFAULT_APPEARANCE.fontFamily
  const reduceMotion = typeof obj.reduceMotion === 'boolean' ? obj.reduceMotion : DEFAULT_APPEARANCE.reduceMotion
  return { palette, fontScale, fontFamily, reduceMotion }
}

export function applyAppearance(a: Appearance) {
  const root = document.documentElement
  root.setAttribute('data-palette', a.palette)
  root.setAttribute('data-font-scale', a.fontScale)
  root.setAttribute('data-font', a.fontFamily)
  root.setAttribute('data-motion', a.reduceMotion ? 'reduced' : 'full')
}

export function loadLocalAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return normalizeAppearance(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

export function saveLocalAppearance(a: Appearance) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a))
  } catch {
    /* private mode / storage disabled — the attribute-based theme still works for this session */
  }
}

export function sameAppearance(a: Appearance, b: Appearance): boolean {
  return a.palette === b.palette && a.fontScale === b.fontScale && a.fontFamily === b.fontFamily && a.reduceMotion === b.reduceMotion
}
