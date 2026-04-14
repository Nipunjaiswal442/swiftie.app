// ─── Ideology Assessment — 30 Questions ──────────────────────────────────────
// 3 bipolar axes × 10 questions each. 5-point Likert scale.
//   direction: 1 → first pole (EL, SP, LB)
//            -1 → second pole (ER, ST, AU)
//
// EC  — Economic Left (EL) vs Economic Right (ER)
// SOC — Social Progressive (SP) vs Social Traditional (ST)
// AUTH— Libertarian (LB) vs Statist/Authoritarian (AU)

export type IdeologyDimension = "EC" | "SOC" | "AUTH";

export interface IdeologyQuestion {
  id: number;
  text: string;
  dimension: IdeologyDimension;
  direction: 1 | -1;
}

export const IDEOLOGY_QUESTIONS: IdeologyQuestion[] = [
  // ── EC — Economic Left vs Economic Right (10 questions) ──────────────────
  { id: 1,  text: "Wealth inequality is one of the most urgent problems facing society today.", dimension: "EC", direction: 1 },
  { id: 2,  text: "The government should guarantee a basic income to every citizen regardless of employment status.", dimension: "EC", direction: 1 },
  { id: 3,  text: "Large corporations should be required to share a greater portion of their profits with their workers.", dimension: "EC", direction: 1 },
  { id: 4,  text: "Public services like healthcare and education work better when run by the state than by private companies.", dimension: "EC", direction: 1 },
  { id: 5,  text: "Progressive taxation — where the wealthy pay a higher percentage of their income — is fair and necessary.", dimension: "EC", direction: 1 },
  { id: 6,  text: "Free markets, when left largely unregulated, tend to produce better outcomes than state-managed economies.", dimension: "EC", direction: -1 },
  { id: 7,  text: "Lower corporate taxes encourage investment and ultimately benefit everyone in society.", dimension: "EC", direction: -1 },
  { id: 8,  text: "Privatising public services generally leads to greater efficiency and better quality.", dimension: "EC", direction: -1 },
  { id: 9,  text: "Individuals, not the government, should be primarily responsible for their own financial security.", dimension: "EC", direction: -1 },
  { id: 10, text: "Reducing the size of the welfare state would create stronger incentives for people to work and innovate.", dimension: "EC", direction: -1 },

  // ── SOC — Social Progressive vs Social Traditional (10 questions) ─────────
  { id: 11, text: "Cultural diversity makes a society stronger and more resilient.", dimension: "SOC", direction: 1 },
  { id: 12, text: "Laws and institutions should actively work to correct historical injustices against marginalised groups.", dimension: "SOC", direction: 1 },
  { id: 13, text: "Gender roles are social constructs and people should be free to define their own identity without restriction.", dimension: "SOC", direction: 1 },
  { id: 14, text: "Immigration, managed well, is broadly positive for a country's culture and economy.", dimension: "SOC", direction: 1 },
  { id: 15, text: "Sex education in schools should be comprehensive and include topics like contraception and consent.", dimension: "SOC", direction: 1 },
  { id: 16, text: "Traditional family structures — centred on marriage and biological parenthood — are the healthiest foundation for society.", dimension: "SOC", direction: -1 },
  { id: 17, text: "A shared national culture and common set of values is essential to a cohesive society.", dimension: "SOC", direction: -1 },
  { id: 18, text: "Rapid social change often creates more problems than it solves and should be approached with caution.", dimension: "SOC", direction: -1 },
  { id: 19, text: "Religious values have an important role to play in shaping public policy.", dimension: "SOC", direction: -1 },
  { id: 20, text: "High levels of immigration put pressure on social cohesion and public services.", dimension: "SOC", direction: -1 },

  // ── AUTH — Libertarian vs Statist (10 questions) ──────────────────────────
  { id: 21, text: "Adults should have the right to make personal choices — including risky ones — without government interference.", dimension: "AUTH", direction: 1 },
  { id: 22, text: "Drug policy should prioritise individual freedom and personal responsibility over criminalisation.", dimension: "AUTH", direction: 1 },
  { id: 23, text: "Mass surveillance by governments is an unacceptable violation of civil liberties.", dimension: "AUTH", direction: 1 },
  { id: 24, text: "People should be free to say nearly anything they want, even if others find it offensive.", dimension: "AUTH", direction: 1 },
  { id: 25, text: "The fewer laws governing personal behaviour, the better.", dimension: "AUTH", direction: 1 },
  { id: 26, text: "Some restrictions on individual liberty are justified when they serve the common good.", dimension: "AUTH", direction: -1 },
  { id: 27, text: "A strong state is necessary to maintain social order and protect citizens from harm.", dimension: "AUTH", direction: -1 },
  { id: 28, text: "The government has a responsibility to regulate online speech to prevent misinformation and hate.", dimension: "AUTH", direction: -1 },
  { id: 29, text: "Compulsory civic duties — like voting or military service — strengthen democratic societies.", dimension: "AUTH", direction: -1 },
  { id: 30, text: "Security and stability are sometimes more important than absolute freedom.", dimension: "AUTH", direction: -1 },
];

// ─── Score types ──────────────────────────────────────────────────────────────

export interface IdeologyScores {
  EL: number; ER: number;  // Economic Left / Economic Right
  SP: number; ST: number;  // Social Progressive / Social Traditional
  LB: number; AU: number;  // Libertarian / Statist (Authoritarian)
}

export interface IdeologyResult {
  scores: IdeologyScores;
  matchKey: "progressive" | "liberal" | "conservative" | "libertarian";
}

// ─── Scoring function ─────────────────────────────────────────────────────────
// answers: Record<questionId, likertValue (1–5)>
export function scoreIdeology(answers: Record<number, number>): IdeologyResult {
  const scores: IdeologyScores = { EL: 0, ER: 0, SP: 0, ST: 0, LB: 0, AU: 0 };

  const poleMap: Record<IdeologyDimension, [keyof IdeologyScores, keyof IdeologyScores]> = {
    EC:   ["EL", "ER"],
    SOC:  ["SP", "ST"],
    AUTH: ["LB", "AU"],
  };

  for (const q of IDEOLOGY_QUESTIONS) {
    const raw = answers[q.id];
    if (raw === undefined) continue;

    // Normalise to -2..+2 relative to neutral (3)
    const weighted = (raw - 3) * q.direction;

    const [poleA, poleB] = poleMap[q.dimension];
    if (weighted >= 0) {
      scores[poleA] += weighted;
    } else {
      scores[poleB] += Math.abs(weighted);
    }
  }

  // matchKey logic:
  // A strong libertarian signal on AUTH overrides the EC/SOC quadrant.
  // Max per axis question: (5-3)*1 = 2 pts × 10 questions = 20 per pole max.
  // Threshold of 5 means LB leads AU by at least 25% of the max possible gap.
  const libertyMargin = scores.LB - scores.AU;
  const economicLeft  = scores.EL > scores.ER;
  const socialProg    = scores.SP > scores.ST;

  let matchKey: IdeologyResult["matchKey"];
  if (libertyMargin > 5) {
    matchKey = "libertarian";
  } else if (economicLeft && socialProg) {
    matchKey = "progressive";
  } else if (!economicLeft && socialProg) {
    matchKey = "liberal";
  } else {
    matchKey = "conservative";
  }

  return { scores, matchKey };
}
