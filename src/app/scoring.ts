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
  hex: string; // retains the name but holds a CSS variable, e.g. "var(--success)"
  glow: string; // new field for the matching glow CSS variable, e.g. "var(--success-glow)"
  pillBg: string;
  pillText: string;
  barColor: string;
};

export function getGradeBand(score: number): GradeBand {
  if (score >= 85)
    return {
      label: "✓ Triage-ready",
      hex: "var(--success)",
      glow: "var(--success-glow)",
      pillBg: "bg-green-500/15 border border-green-500/30",
      pillText: "text-green-400",
      barColor: "var(--success)",
    };
  if (score >= 70)
    return {
      label: "Minor gaps",
      hex: "var(--warning)",
      glow: "var(--warning-glow)",
      pillBg: "bg-yellow-500/15 border border-yellow-500/30",
      pillText: "text-yellow-400",
      barColor: "var(--warning)",
    };
  if (score >= 50)
    return {
      label: "Needs work",
      hex: "var(--orange)",
      glow: "var(--orange-glow)",
      pillBg: "bg-orange-500/15 border border-orange-500/30",
      pillText: "text-orange-400",
      barColor: "var(--orange)",
    };
  return {
    label: "Rewrite required",
    hex: "var(--destructive)",
    glow: "var(--destructive-glow)",
    pillBg: "bg-red-500/15 border border-red-500/30",
    pillText: "text-red-400",
    barColor: "var(--destructive)",
  };
}

export function scoreToBarColor(score: number): string {
  if (score >= 8) return "var(--success)";
  if (score >= 6) return "var(--warning)";
  if (score >= 4) return "var(--orange)";
  return "var(--destructive)";
}

export function scoreToGlowColor(score: number): string {
  if (score >= 8) return "var(--success-glow)";
  if (score >= 6) return "var(--warning-glow)";
  if (score >= 4) return "var(--orange-glow)";
  return "var(--destructive-glow)";
}
