import { describe, expect, it } from "vitest";
import { validateGeminiResult } from "./api";
import { DEMO_RESPONSES } from "./constants";

/** Deep-clone a known-valid fixture so tests can freely corrupt it. */
function clone() {
  return JSON.parse(JSON.stringify(DEMO_RESPONSES.excellent));
}

describe("validateGeminiResult", () => {
  it("accepts every bundled demo fixture", () => {
    for (const fixture of Object.values(DEMO_RESPONSES)) {
      expect(validateGeminiResult(fixture)).toBe(fixture);
    }
  });

  it("rejects non-object payloads", () => {
    expect(() => validateGeminiResult(null)).toThrow(/JSON object/);
    expect(() => validateGeminiResult("nope")).toThrow(/JSON object/);
    expect(() => validateGeminiResult(42)).toThrow(/JSON object/);
  });

  it("rejects a missing or non-array criteria field", () => {
    const v = clone();
    v.criteria = undefined;
    expect(() => validateGeminiResult(v)).toThrow(
      /'criteria' must be an array/,
    );
  });

  it("rejects non-integer scores", () => {
    const v = clone();
    v.criteria[0].score = 7.5;
    expect(() => validateGeminiResult(v)).toThrow(/integer between 0 and 10/);
  });

  it("rejects out-of-range scores", () => {
    const high = clone();
    high.criteria[0].score = 11;
    expect(() => validateGeminiResult(high)).toThrow(
      /integer between 0 and 10/,
    );

    const low = clone();
    low.criteria[0].score = -1;
    expect(() => validateGeminiResult(low)).toThrow(/integer between 0 and 10/);
  });

  it("rejects a response missing one of the nine criteria", () => {
    const v = clone();
    v.criteria = v.criteria.slice(1);
    expect(() => validateGeminiResult(v)).toThrow(
      /missing evaluation for criterion 'title'/,
    );
  });

  it("rejects duplicate criterion ids", () => {
    const v = clone();
    v.criteria[1].id = v.criteria[0].id;
    expect(() => validateGeminiResult(v)).toThrow(/duplicate criterion id/);
  });

  it("rejects unknown criterion ids", () => {
    const v = clone();
    v.criteria[0].id = "vibes";
    expect(() => validateGeminiResult(v)).toThrow(
      /unknown criterion id 'vibes'/,
    );
  });

  it("rejects malformed severity predictions", () => {
    const v = clone();
    v.severity_prediction.severity = 5;
    expect(() => validateGeminiResult(v)).toThrow(/severity/);

    const w = clone();
    w.severity_prediction = null;
    expect(() => validateGeminiResult(w)).toThrow(/severity_prediction/);
  });

  it("rejects non-boolean injection_detected", () => {
    const v = clone();
    v.injection_detected = "false";
    expect(() => validateGeminiResult(v)).toThrow(/injection_detected/);
  });

  it("rejects non-string missing_fields entries", () => {
    const v = clone();
    v.missing_fields = ["ok", 3];
    expect(() => validateGeminiResult(v)).toThrow(/missing_fields/);
  });

  it("rejects a non-string rewritten report", () => {
    const v = clone();
    v.rewritten_report_markdown = null;
    expect(() => validateGeminiResult(v)).toThrow(/rewritten_report_markdown/);
  });
});
