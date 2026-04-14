// ─── MBTI Personality Assessment — 30 Questions ──────────────────────────────
// Each question uses a 5-point Likert scale:
//   1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree
//
// direction: 1 means high score → first letter (E, S, T, J)
//            -1 means high score → second letter (I, N, F, P)

export type Dimension = "EI" | "SN" | "TF" | "JP";

export interface Question {
  id: number;
  text: string;
  dimension: Dimension;
  direction: 1 | -1; // 1 → E/S/T/J, -1 → I/N/F/P
}

export const PERSONALITY_QUESTIONS: Question[] = [
  // ── E / I (Extraversion / Introversion) — 8 questions ────────────────────
  { id: 1,  text: "I feel energised after spending time with a large group of people.", dimension: "EI", direction: 1 },
  { id: 2,  text: "I often initiate conversations with people I have just met.", dimension: "EI", direction: 1 },
  { id: 3,  text: "I prefer social gatherings over quiet evenings at home.", dimension: "EI", direction: 1 },
  { id: 4,  text: "I think out loud and enjoy talking through ideas with others.", dimension: "EI", direction: 1 },
  { id: 5,  text: "I need time alone to recharge after social events.", dimension: "EI", direction: -1 },
  { id: 6,  text: "I prefer texting over calling because it lets me think before responding.", dimension: "EI", direction: -1 },
  { id: 7,  text: "I feel most productive when working in a quiet environment by myself.", dimension: "EI", direction: -1 },
  { id: 8,  text: "I tend to have a small, close-knit friend group rather than a wide social circle.", dimension: "EI", direction: -1 },

  // ── S / N (Sensing / Intuition) — 8 questions ────────────────────────────
  { id: 9,  text: "I prefer to deal with facts and concrete details over abstract theories.", dimension: "SN", direction: 1 },
  { id: 10, text: "I trust hands-on experience more than theoretical knowledge.", dimension: "SN", direction: 1 },
  { id: 11, text: "I focus on what is real and present rather than what could be.", dimension: "SN", direction: 1 },
  { id: 12, text: "I notice the small practical details that others often miss.", dimension: "SN", direction: 1 },
  { id: 13, text: "I am drawn to big-picture ideas and future possibilities.", dimension: "SN", direction: -1 },
  { id: 14, text: "I often think about patterns and connections between seemingly unrelated things.", dimension: "SN", direction: -1 },
  { id: 15, text: "I enjoy exploring hypothetical 'what if' scenarios.", dimension: "SN", direction: -1 },
  { id: 16, text: "I trust my gut instincts and hunches, even when I cannot fully explain them.", dimension: "SN", direction: -1 },

  // ── T / F (Thinking / Feeling) — 7 questions ─────────────────────────────
  { id: 17, text: "When making decisions, I prioritise logic and objective analysis over personal feelings.", dimension: "TF", direction: 1 },
  { id: 18, text: "I believe fairness means applying the same rules to everyone, regardless of circumstances.", dimension: "TF", direction: 1 },
  { id: 19, text: "I find it easier to criticise someone's work than to comfort them emotionally.", dimension: "TF", direction: 1 },
  { id: 20, text: "I am uncomfortable when conversations become overly emotional.", dimension: "TF", direction: 1 },
  { id: 21, text: "I make decisions based on how they will affect the people involved.", dimension: "TF", direction: -1 },
  { id: 22, text: "Being kind and considerate is more important to me than being strictly correct.", dimension: "TF", direction: -1 },
  { id: 23, text: "I easily pick up on other people's emotions and adjust my response accordingly.", dimension: "TF", direction: -1 },

  // ── J / P (Judging / Perceiving) — 7 questions ───────────────────────────
  { id: 24, text: "I like to have a clear plan before starting a project.", dimension: "JP", direction: 1 },
  { id: 25, text: "I feel uncomfortable when things are left open-ended or unresolved.", dimension: "JP", direction: 1 },
  { id: 26, text: "I prefer to make decisions early rather than keep my options open.", dimension: "JP", direction: 1 },
  { id: 27, text: "I follow a daily routine and feel unsettled when it is disrupted.", dimension: "JP", direction: 1 },
  { id: 28, text: "I enjoy adapting on the fly and find rigid schedules restrictive.", dimension: "JP", direction: -1 },
  { id: 29, text: "I work best when I can explore ideas without a fixed plan.", dimension: "JP", direction: -1 },
  { id: 30, text: "I often start a new project before finishing the previous one.", dimension: "JP", direction: -1 },
];

// ─── Scores & result type ─────────────────────────────────────────────────────

export interface MBTIScores {
  E: number; I: number;
  S: number; N: number;
  T: number; F: number;
  J: number; P: number;
}

export interface MBTIResult {
  scores: MBTIScores;
  matchKey: string; // e.g. "INTJ"
}

// ─── Scoring function ─────────────────────────────────────────────────────────
// answers: Record<questionId, likertValue (1–5)>
export function scorePersonality(answers: Record<number, number>): MBTIResult {
  const scores: MBTIScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (const q of PERSONALITY_QUESTIONS) {
    const raw = answers[q.id];
    if (raw === undefined) continue;

    // Normalise to -2..+2 relative to neutral (3)
    const weighted = (raw - 3) * q.direction;

    const [letterA, letterB] = q.dimension.split("") as [keyof MBTIScores, keyof MBTIScores];

    if (weighted >= 0) {
      scores[letterA] += weighted;
    } else {
      scores[letterB] += Math.abs(weighted);
    }
  }

  const e = scores.E >= scores.I ? "E" : "I";
  const s = scores.S >= scores.N ? "S" : "N";
  const t = scores.T >= scores.F ? "T" : "F";
  const j = scores.J >= scores.P ? "J" : "P";
  const matchKey = `${e}${s}${t}${j}`;

  return { scores, matchKey };
}
