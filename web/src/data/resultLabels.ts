// Human-readable names and blurbs for assessment results. Used by the profile
// "Assessment insights" section that fills in automatically after a test.

export interface ResultLabel {
  title: string
  blurb: string
}

export const PERSONALITY_LABELS: Record<string, ResultLabel> = {
  INTJ: { title: 'The Architect', blurb: 'Strategic, independent and always three moves ahead.' },
  INTP: { title: 'The Logician', blurb: 'Curious theorist who loves a good thought experiment.' },
  ENTJ: { title: 'The Commander', blurb: 'Natural leader who turns plans into results.' },
  ENTP: { title: 'The Debater', blurb: 'Quick-witted idea machine who enjoys intellectual sparring.' },
  INFJ: { title: 'The Advocate', blurb: 'Idealistic visionary with a cause and deep empathy.' },
  INFP: { title: 'The Mediator', blurb: 'Poetic soul guided by values and authenticity.' },
  ENFJ: { title: 'The Protagonist', blurb: 'Charismatic mentor who lifts everyone around them.' },
  ENFP: { title: 'The Campaigner', blurb: 'Free spirit who sees possibility everywhere.' },
  ISTJ: { title: 'The Logistician', blurb: 'Reliable, practical and quietly dependable.' },
  ISFJ: { title: 'The Defender', blurb: 'Warm protector who remembers the small things.' },
  ESTJ: { title: 'The Executive', blurb: 'Organiser who keeps things running on time.' },
  ESFJ: { title: 'The Consul', blurb: 'Caring, sociable and the glue of every group.' },
  ISTP: { title: 'The Virtuoso', blurb: 'Hands-on problem solver who learns by doing.' },
  ISFP: { title: 'The Adventurer', blurb: 'Gentle artist living fully in the moment.' },
  ESTP: { title: 'The Entrepreneur', blurb: 'Bold doer who thrives on action and risk.' },
  ESFP: { title: 'The Entertainer', blurb: 'Spontaneous spark who makes everything more fun.' },
}

export const IDEOLOGY_LABELS: Record<string, ResultLabel> = {
  progressive: { title: 'Progressive', blurb: 'Reform-minded on both the economy and society.' },
  liberal: { title: 'Classical Liberal', blurb: 'Individual liberty, open markets, social openness.' },
  conservative: { title: 'Conservative', blurb: 'Tradition, continuity and ordered liberty.' },
  libertarian: { title: 'Libertarian', blurb: 'Minimal state, maximum personal freedom.' },
}

export const OCCUPATION_LABELS: Record<string, ResultLabel> = {
  tech: { title: 'Technology', blurb: 'Building, debugging and shipping things that run.' },
  design: { title: 'Design', blurb: 'Making things beautiful, usable and considered.' },
  art: { title: 'Art & Performance', blurb: 'Music, film and visual expression.' },
  science: { title: 'Science & Research', blurb: 'Experiments, evidence and figuring out how things work.' },
  humanities: { title: 'Humanities', blurb: 'Ideas, history, texts and the big questions.' },
  writing: { title: 'Writing', blurb: 'Stories, essays and words that land.' },
  commerce: { title: 'Commerce', blurb: 'Founders, operators and people who grow things.' },
  health: { title: 'Health & Wellness', blurb: 'Medicine, psychology, fitness and care.' },
}

export function labelFor(section: 'personality' | 'ideology' | 'occupation', matchKey: string): ResultLabel {
  const table = section === 'personality' ? PERSONALITY_LABELS : section === 'ideology' ? IDEOLOGY_LABELS : OCCUPATION_LABELS
  return table[matchKey] ?? table[matchKey.toUpperCase()] ?? table[matchKey.toLowerCase()] ?? { title: matchKey.toUpperCase(), blurb: '' }
}

/** Score keys grouped as opposing pairs (personality/ideology) or single categories (occupation). */
export const SCORE_PAIRS: Record<'personality' | 'ideology', Array<[string, string, string, string]>> = {
  // [leftKey, leftLabel, rightKey, rightLabel]
  personality: [
    ['E', 'Extraverted', 'I', 'Introverted'],
    ['S', 'Observant', 'N', 'Intuitive'],
    ['T', 'Thinking', 'F', 'Feeling'],
    ['J', 'Judging', 'P', 'Prospecting'],
  ],
  ideology: [
    ['EL', 'Economic left', 'ER', 'Economic right'],
    ['SP', 'Socially progressive', 'ST', 'Socially traditional'],
    ['LB', 'Liberty', 'AU', 'Authority'],
  ],
}

export const OCCUPATION_SCORE_LABELS: Record<string, string> = {
  TECH: 'Technology',
  DESIGN: 'Design',
  ART: 'Art',
  SCI: 'Science',
  HUM: 'Humanities',
  WRITE: 'Writing',
  COM: 'Commerce',
  HEALTH: 'Health',
}

export const SECTION_META = {
  personality: { label: 'PERSONALITY', icon: '🧠', color: 'var(--saffron)', border: 'rgba(var(--accent-rgb), 0.35)' },
  ideology: { label: 'IDEOLOGY', icon: '⚐', color: 'var(--white-pure)', border: 'rgba(var(--fg-rgb), 0.25)' },
  occupation: { label: 'OCCUPATION', icon: '🔧', color: 'var(--neon-green)', border: 'rgba(var(--accent2-rgb), 0.35)' },
} as const
