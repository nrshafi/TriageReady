import { SYSTEM_PROMPT, type GeminiResult } from "./constants";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    criteria: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          score: { type: "INTEGER" },
          evidence: { type: "STRING" },
          fix: { type: "STRING" },
        },
        required: ["id", "score", "evidence", "fix"],
      },
    },
    missing_fields: { type: "ARRAY", items: { type: "STRING" } },
    severity_prediction: {
      type: "OBJECT",
      properties: {
        severity: { type: "STRING" },
        priority: { type: "STRING" },
        reasoning: { type: "STRING" },
      },
      required: ["severity", "priority", "reasoning"],
    },
    injection_detected: { type: "BOOLEAN" },
    rewritten_report_markdown: { type: "STRING" },
    summary_verdict: { type: "STRING" },
  },
  required: [
    "criteria",
    "missing_fields",
    "severity_prediction",
    "injection_detected",
    "rewritten_report_markdown",
    "summary_verdict",
  ],
};

export async function analyzeReport(
  apiKey: string,
  reportText: string
): Promise<GeminiResult> {
  const userMessage = `<bug_report>\n${reportText}\n</bug_report>\n\nAnalyze this bug report against the QA rubric and return a JSON response.`;

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const err = await response.json();
      message = err?.error?.message || message;
    } catch {}
    throw new Error(message);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API");

  return JSON.parse(text) as GeminiResult;
}
