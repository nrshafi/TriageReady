import { CRITERIA, type GeminiResult } from "./constants";

export function computeOverallScore(result: GeminiResult): number {
  const total = CRITERIA.reduce((sum, criterion) => {
    const match = result.criteria.find((c) => c.id === criterion.id);
    const score = match?.score ?? 0;
    return sum + (score / 10) * criterion.weight;
  }, 0);
  return Math.round(total);
}

export type GradeBand = {
  label: string;
  hex: string;
  pillBg: string;
  pillText: string;
  barColor: string;
};

export function getGradeBand(score: number): GradeBand {
  if (score >= 85)
    return {
      label: "✓ Triage-ready",
      hex: "#3fb950",
      pillBg: "bg-green-500/15 border border-green-500/30",
      pillText: "text-green-400",
      barColor: "#3fb950",
    };
  if (score >= 70)
    return {
      label: "Minor gaps",
      hex: "#d29922",
      pillBg: "bg-yellow-500/15 border border-yellow-500/30",
      pillText: "text-yellow-400",
      barColor: "#d29922",
    };
  if (score >= 50)
    return {
      label: "Needs work",
      hex: "#f0883e",
      pillBg: "bg-orange-500/15 border border-orange-500/30",
      pillText: "text-orange-400",
      barColor: "#f0883e",
    };
  return {
    label: "Rewrite required",
    hex: "#f85149",
    pillBg: "bg-red-500/15 border border-red-500/30",
    pillText: "text-red-400",
    barColor: "#f85149",
  };
}

export function scoreToBarColor(score: number): string {
  if (score >= 8) return "#3fb950";
  if (score >= 6) return "#d29922";
  if (score >= 4) return "#f0883e";
  return "#f85149";
}
