// ─── Occupation / Interests Assessment — 30 Questions ────────────────────────
// 8 categories, 3–4 questions each. Direct sum scoring (1–5 per answer).
// The category with the highest total determines the matchKey.
//
// Categories:
//   TECH    → "tech"       Builders' Den
//   DESIGN  → "design"     Design Lab
//   ART     → "art"        Creative Studio
//   SCI     → "science"    Science & Research
//   HUM     → "humanities" Humanities Forum
//   WRITE   → "writing"    Writers' Room
//   COM     → "commerce"   Commerce Corner
//   HEALTH  → "health"     Health & Wellness

export type OccupationCategory = "TECH" | "DESIGN" | "ART" | "SCI" | "HUM" | "WRITE" | "COM" | "HEALTH";

export interface OccupationQuestion {
  id: number;
  text: string;
  category: OccupationCategory;
}

export const OCCUPATION_QUESTIONS: OccupationQuestion[] = [
  // ── TECH — 4 questions ────────────────────────────────────────────────────
  { id: 1,  text: "I enjoy breaking down a complex problem into smaller logical steps and solving each one.", category: "TECH" },
  { id: 2,  text: "I find satisfaction in building things that work — whether it's code, circuits, or mechanical systems.", category: "TECH" },
  { id: 3,  text: "I like learning how software or hardware actually works under the hood.", category: "TECH" },
  { id: 4,  text: "I enjoy automating repetitive tasks or finding technical shortcuts.", category: "TECH" },

  // ── DESIGN — 4 questions ──────────────────────────────────────────────────
  { id: 5,  text: "I pay close attention to how things look and feel — layout, colour, and visual balance matter to me.", category: "DESIGN" },
  { id: 6,  text: "I enjoy thinking about how a product or interface can be made more intuitive for users.", category: "DESIGN" },
  { id: 7,  text: "I find myself rearranging or redesigning spaces, posters, or screens to make them more appealing.", category: "DESIGN" },
  { id: 8,  text: "I often notice when a design is visually inconsistent and feel compelled to fix it.", category: "DESIGN" },

  // ── ART — 4 questions ─────────────────────────────────────────────────────
  { id: 9,  text: "I regularly create things for the joy of it — music, drawings, photography, or film.", category: "ART" },
  { id: 10, text: "Expressing emotion or a personal perspective through a creative medium is important to me.", category: "ART" },
  { id: 11, text: "I spend time exploring different artistic styles or genres and experimenting with my own.", category: "ART" },
  { id: 12, text: "I feel most alive when I'm performing or creating something for an audience.", category: "ART" },

  // ── SCI — 4 questions ─────────────────────────────────────────────────────
  { id: 13, text: "I enjoy reading about scientific discoveries and understanding how the natural world works.", category: "SCI" },
  { id: 14, text: "I am drawn to experiments and the process of testing hypotheses with real data.", category: "SCI" },
  { id: 15, text: "I find statistical patterns and data analysis genuinely interesting rather than just useful.", category: "SCI" },
  { id: 16, text: "I would be excited to contribute to original research, even if the results are uncertain.", category: "SCI" },

  // ── HUM — 4 questions ─────────────────────────────────────────────────────
  { id: 17, text: "I enjoy exploring history, philosophy, or culture to understand how societies have evolved.", category: "HUM" },
  { id: 18, text: "I find debates about ethics, meaning, and the human condition compelling.", category: "HUM" },
  { id: 19, text: "I like analysing texts, arguments, or social phenomena to find deeper meaning.", category: "HUM" },
  { id: 20, text: "Questions about why people think and behave the way they do fascinate me.", category: "HUM" },

  // ── WRITE — 4 questions ───────────────────────────────────────────────────
  { id: 21, text: "I often write in my spare time — journals, short stories, blog posts, or essays.", category: "WRITE" },
  { id: 22, text: "I enjoy crafting a well-structured argument or narrative that guides the reader.", category: "WRITE" },
  { id: 23, text: "I pay attention to word choice and think carefully about how to phrase things precisely.", category: "WRITE" },
  { id: 24, text: "I find researching and then explaining a topic to others in writing deeply satisfying.", category: "WRITE" },

  // ── COM — 3 questions ─────────────────────────────────────────────────────
  { id: 25, text: "I am energised by the challenge of turning an idea into a viable product or business.", category: "COM" },
  { id: 26, text: "I think about markets, customer needs, and how to create or capture value.", category: "COM" },
  { id: 27, text: "I enjoy negotiating, persuading, and building relationships to get things done.", category: "COM" },

  // ── HEALTH — 3 questions ──────────────────────────────────────────────────
  { id: 28, text: "I am genuinely curious about how the human body and mind work.", category: "HEALTH" },
  { id: 29, text: "Helping people feel better — physically or emotionally — is deeply fulfilling to me.", category: "HEALTH" },
  { id: 30, text: "I find myself drawn to questions about wellbeing, mental health, nutrition, or medicine.", category: "HEALTH" },
];

// ─── Score types ──────────────────────────────────────────────────────────────

export interface OccupationScores {
  TECH: number; DESIGN: number; ART: number;   SCI: number;
  HUM:  number; WRITE:  number; COM: number; HEALTH: number;
}

export type OccupationMatchKey =
  | "tech" | "design" | "art" | "science"
  | "humanities" | "writing" | "commerce" | "health";

export interface OccupationResult {
  scores: OccupationScores;
  matchKey: OccupationMatchKey;
}

const CATEGORY_TO_MATCH: Record<OccupationCategory, OccupationMatchKey> = {
  TECH:   "tech",
  DESIGN: "design",
  ART:    "art",
  SCI:    "science",
  HUM:    "humanities",
  WRITE:  "writing",
  COM:    "commerce",
  HEALTH: "health",
};

// ─── Scoring function ─────────────────────────────────────────────────────────
// answers: Record<questionId, likertValue (1–5)>
// Returns the category with the highest total score as matchKey.
export function scoreOccupation(answers: Record<number, number>): OccupationResult {
  const scores: OccupationScores = {
    TECH: 0, DESIGN: 0, ART: 0,   SCI: 0,
    HUM:  0, WRITE:  0, COM: 0, HEALTH: 0,
  };

  for (const q of OCCUPATION_QUESTIONS) {
    const raw = answers[q.id];
    if (raw === undefined) continue;
    scores[q.category] += raw; // direct accumulation — 1 to 5 per question
  }

  // Find the top-scoring category
  let topCategory: OccupationCategory = "TECH";
  let topScore = -1;
  for (const [cat, val] of Object.entries(scores) as [OccupationCategory, number][]) {
    if (val > topScore) {
      topScore = val;
      topCategory = cat;
    }
  }

  return { scores, matchKey: CATEGORY_TO_MATCH[topCategory] };
}
