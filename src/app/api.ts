import { CRITERIA, type GeminiResult, SYSTEM_PROMPT } from "./constants";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-3.1-flash-lite";
const REQUEST_TIMEOUT_MS = 30_000;

const CRITERION_IDS = CRITERIA.map((criterion) => criterion.id);

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    criteria: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING", enum: CRITERION_IDS },
          score: { type: "INTEGER", minimum: 0, maximum: 10 },
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
        severity: {
          type: "STRING",
          enum: ["Critical", "High", "Medium", "Low", "Unknown"],
        },
        priority: { type: "STRING", enum: ["P1", "P2", "P3", "P4"] },
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

/**
 * fetch wrapper shared by all Gemini calls: authenticates via the
 * x-goog-api-key header (keys in query strings leak into proxy and history
 * logs), aborts after REQUEST_TIMEOUT_MS, and normalizes API error messages.
 */
async function apiFetch(
  apiKey: string,
  path: string,
  init?: Omit<RequestInit, "headers" | "signal">,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    if (
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s — check your connection and try again.`,
      );
    }
    throw err;
  }

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const err = await response.json();
      message = err?.error?.message || message;
    } catch {}
    throw new Error(message);
  }

  return response;
}

export function validateGeminiResult(data: unknown): GeminiResult {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid response format: expected a JSON object");
  }

  const obj = data as Record<string, unknown>;

  // Validate criteria
  if (!Array.isArray(obj.criteria)) {
    throw new Error("Invalid response format: 'criteria' must be an array");
  }
  const seenIds = new Set<string>();
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
    if (!(CRITERION_IDS as string[]).includes(c.id)) {
      throw new Error(
        `Invalid response format: unknown criterion id '${c.id}'`,
      );
    }
    if (seenIds.has(c.id)) {
      throw new Error(
        `Invalid response format: duplicate criterion id '${c.id}'`,
      );
    }
    seenIds.add(c.id);
    if (
      typeof c.score !== "number" ||
      !Number.isInteger(c.score) ||
      c.score < 0 ||
      c.score > 10
    ) {
      throw new Error(
        "Invalid response format: criterion 'score' must be an integer between 0 and 10",
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
  for (const id of CRITERION_IDS) {
    if (!seenIds.has(id)) {
      throw new Error(
        `Invalid response format: missing evaluation for criterion '${id}'`,
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

  const response = await apiFetch(apiKey, `/models/${MODEL}:generateContent`, {
    method: "POST",
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

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini API");

  const parsed = JSON.parse(text);
  return validateGeminiResult(parsed);
}

/**
 * Validate an API key with a free metadata request (GET /models) instead of
 * a billable generateContent call.
 */
export async function checkApiKey(apiKey: string): Promise<boolean> {
  await apiFetch(apiKey, "/models?pageSize=1", { method: "GET" });
  return true;
}
