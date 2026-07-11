import { describe, expect, it } from "vitest";
import { CRITERIA, DEMO_RESPONSES, type GeminiResult } from "./constants";
import {
  computeOverallScore,
  getGradeBand,
  scoreToBarColor,
  scoreToGlowColor,
} from "./scoring";

type CriterionId = (typeof CRITERIA)[number]["id"];

function makeResult(
  scores: Partial<Record<CriterionId, number>>,
): GeminiResult {
  return {
    criteria: CRITERIA.map((criterion) => ({
      id: criterion.id,
      score: scores[criterion.id] ?? 0,
      evidence: "",
      fix: "",
    })),
    missing_fields: [],
    severity_prediction: { severity: "Low", priority: "P4", reasoning: "" },
    injection_detected: false,
    rewritten_report_markdown: "",
    summary_verdict: "",
  };
}

describe("CRITERIA weights", () => {
  it("sum to exactly 100 so the overall score is a percentage", () => {
    const total = CRITERIA.reduce(
      (sum, criterion) => sum + criterion.weight,
      0,
    );
    expect(total).toBe(100);
  });
});

describe("computeOverallScore", () => {
  it("scores a perfect report as 100", () => {
    const scores = Object.fromEntries(
      CRITERIA.map((criterion) => [criterion.id, 10]),
    ) as Record<CriterionId, number>;
    expect(computeOverallScore(makeResult(scores))).toBe(100);
  });

  it("scores an all-zero report as 0", () => {
    expect(computeOverallScore(makeResult({}))).toBe(0);
  });

  it("applies criterion weights (steps_to_reproduce alone contributes 25)", () => {
    expect(computeOverallScore(makeResult({ steps_to_reproduce: 10 }))).toBe(
      25,
    );
  });

  it("treats criteria missing from the response as zero", () => {
    const result = makeResult({ title: 10 });
    result.criteria = result.criteria.filter((c) => c.id === "title");
    expect(computeOverallScore(result)).toBe(10);
  });

  it("matches the known totals of the bundled demo fixtures", () => {
    expect(computeOverallScore(DEMO_RESPONSES.terrible)).toBe(5);
    expect(computeOverallScore(DEMO_RESPONSES.mediocre)).toBe(49);
    expect(computeOverallScore(DEMO_RESPONSES.excellent)).toBe(99);
  });
});

describe("getGradeBand", () => {
  it("uses the documented band boundaries", () => {
    expect(getGradeBand(100).label).toBe("✓ Triage-ready");
    expect(getGradeBand(85).label).toBe("✓ Triage-ready");
    expect(getGradeBand(84).label).toBe("Minor gaps");
    expect(getGradeBand(70).label).toBe("Minor gaps");
    expect(getGradeBand(69).label).toBe("Needs work");
    expect(getGradeBand(50).label).toBe("Needs work");
    expect(getGradeBand(49).label).toBe("Rewrite required");
    expect(getGradeBand(0).label).toBe("Rewrite required");
  });
});

describe("scoreToBarColor / scoreToGlowColor", () => {
  it("uses the documented per-criterion thresholds", () => {
    expect(scoreToBarColor(10)).toBe("var(--success)");
    expect(scoreToBarColor(8)).toBe("var(--success)");
    expect(scoreToBarColor(7)).toBe("var(--warning)");
    expect(scoreToBarColor(6)).toBe("var(--warning)");
    expect(scoreToBarColor(5)).toBe("var(--orange)");
    expect(scoreToBarColor(4)).toBe("var(--orange)");
    expect(scoreToBarColor(3)).toBe("var(--destructive)");
    expect(scoreToBarColor(0)).toBe("var(--destructive)");
  });

  it("pairs every bar color with its matching glow", () => {
    expect(scoreToGlowColor(8)).toBe("var(--success-glow)");
    expect(scoreToGlowColor(6)).toBe("var(--warning-glow)");
    expect(scoreToGlowColor(4)).toBe("var(--orange-glow)");
    expect(scoreToGlowColor(0)).toBe("var(--destructive-glow)");
  });
});
