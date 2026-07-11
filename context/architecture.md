# Architecture Context

## Stack

| Layer     | Technology                  | Role   |
| --------- | --------------------------- | ------ |
| Framework | Vite + React + TypeScript   | Frontend Client application framework (strict TS via `tsc -b`) |
| UI/Styles | Tailwind CSS v4             | Utility-first styling engine |
| Icons     | Lucide React                | Stroke-based icon set |
| Testing   | Vitest                      | Unit tests for scoring, export, and validation logic |
| Tooling   | Bun + Biome                 | Package manager and unified linter/formatter |
| Hosting   | Client-only deployment      | Pure frontend client, no server backend needed |
| API Layer | Gemini 3.1 Flash Lite API   | REST endpoint for parsing and rewriting reports |

## System Boundaries

- `src/main.tsx` — Application entry point; mounts React App component to the index DOM root.
- `src/app/App.tsx` — Handles high-level state machine (`setup` | `input` | `loading` | `results`), renders the main page layout, handles key connection storage, and parses inline markdown rendering.
- `src/app/ErrorBoundary.tsx` — Catches unhandled render errors and shows a recoverable fallback instead of a blank page.
- `src/app/api.ts` — Manages communication logic to Google Generative Language REST APIs; defines system prompts, response schema constraints (enums, score ranges), request timeouts, and boundary validation.
- `src/app/export.ts` — Markdown → Jira wiki-markup conversion and clipboard helpers, isolated for unit testing.
- `src/app/constants.ts` — Holds hardcoded application data including evaluation guidelines, raw system prompt context, sample bug reports, and mock demo responses.
- `src/app/scoring.ts` — Implements overall weighted score calculation formulas and translates numerical grades to semantic categories and colors.
- `src/app/*.test.ts` — Vitest unit suites covering scoring math, Jira export (incl. the code-block regression), and Gemini response validation.
- `src/styles/` — Core design sheets storing CSS custom property tokens, tailwind imports, and custom font definitions.

## Storage Model

- **localStorage (`triageready_apikey`)**: Stores the user's Google Gemini API key locally to enable persistency across sessions. No server storage exists.
- **Mock State (`DEMO_RESPONSES`)**: Static, read-only response mockups housed directly in source constants to enable fully offline simulation capabilities.

## Auth and Access Model

- **Client-only Access**: The application does not require backend authentication.
- **API Key Authorization**: Requests to the Gemini API are authorized client-side by sending the user's API key in the `x-goog-api-key` request header (never in the URL, where keys leak into proxy and history logs). All requests abort after a 30-second timeout. Key verification uses the free `GET /v1beta/models` metadata endpoint rather than a billable generation call.

## Invariants

1. **No External Storage**: Sensitive user information, including API keys and pasted bug report contents, must never be logged, saved, or uploaded to any intermediate/external database server (only sent directly to the official Google Gemini endpoint).
2. **Deterministic Weighted Scoring**: The overall score calculated by the scoring utility must strictly match the weighted formula defined by the QA rubric parameters.
3. **No LLM Hallucinations**: In rewritten reports, missing details must be strictly marked as `[NEEDS INFO: description]` rather than guessed or fabricated by the LLM.
4. **Demo Mode Stability**: Triggering demo mode must be completely functional in offline settings, rendering precompiled results for sample tickets without relying on any network connections.

