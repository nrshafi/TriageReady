import { type GeminiResult, SYSTEM_PROMPT } from "./constants";

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

export function validateGeminiResult(data: unknown): GeminiResult {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid response format: expected a JSON object");
  }

  const obj = data as Record<string, unknown>;

  // Validate criteria
  if (!Array.isArray(obj.criteria)) {
    throw new Error("Invalid response format: 'criteria' must be an array");
  }
  for (const criterion of obj.criteria) {
    if (typeof criterion !== "object" || criterion === null) {
      throw new Error(
        "Invalid response format: 'criteria' items must be objects",
      );
    }
    const c = criterion as Record<string, unknown>;
    if (typeof c.id !== "string") {
      throw new Error(
        "Invalid response format: criterion 'id' must be a string",
      );
    }
    if (typeof c.score !== "number" || Number.isNaN(c.score)) {
      throw new Error(
        "Invalid response format: criterion 'score' must be a number",
      );
    }
    if (typeof c.evidence !== "string") {
      throw new Error(
        "Invalid response format: criterion 'evidence' must be a string",
      );
    }
    if (typeof c.fix !== "string") {
      throw new Error(
        "Invalid response format: criterion 'fix' must be a string",
      );
    }
  }

  // Validate missing_fields
  if (!Array.isArray(obj.missing_fields)) {
    throw new Error(
      "Invalid response format: 'missing_fields' must be an array",
    );
  }
  for (const field of obj.missing_fields) {
    if (typeof field !== "string") {
      throw new Error(
        "Invalid response format: 'missing_fields' items must be strings",
      );
    }
  }

  // Validate severity_prediction
  if (
    typeof obj.severity_prediction !== "object" ||
    obj.severity_prediction === null
  ) {
    throw new Error(
      "Invalid response format: 'severity_prediction' must be an object",
    );
  }
  const sev = obj.severity_prediction as Record<string, unknown>;
  if (typeof sev.severity !== "string") {
    throw new Error(
      "Invalid response format: 'severity_prediction.severity' must be a string",
    );
  }
  if (typeof sev.priority !== "string") {
    throw new Error(
      "Invalid response format: 'severity_prediction.priority' must be a string",
    );
  }
  if (typeof sev.reasoning !== "string") {
    throw new Error(
      "Invalid response format: 'severity_prediction.reasoning' must be a string",
    );
  }

  // Validate injection_detected
  if (typeof obj.injection_detected !== "boolean") {
    throw new Error(
      "Invalid response format: 'injection_detected' must be a boolean",
    );
  }

  // Validate rewritten_report_markdown
  if (typeof obj.rewritten_report_markdown !== "string") {
    throw new Error(
      "Invalid response format: 'rewritten_report_markdown' must be a string",
    );
  }

  // Validate summary_verdict
  if (typeof obj.summary_verdict !== "string") {
    throw new Error(
      "Invalid response format: 'summary_verdict' must be a string",
    );
  }

  return data as GeminiResult;
}

export async function analyzeReport(
  apiKey: string,
  reportText: string,
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

  const parsed = JSON.parse(text);
  return validateGeminiResult(parsed);
}
