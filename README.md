# <img src="public/favicon.svg" width="40" height="40" align="center" alt="TriageReady Logo" /> TriageReady

[![Deploy](https://github.com/nrshafi/TriageReady/actions/workflows/deploy.yml/badge.svg)](https://github.com/nrshafi/TriageReady/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Live Demo:** [https://nrshafi.github.io/TriageReady/](https://nrshafi.github.io/TriageReady/)

TriageReady is a modern, client-side web application designed to help developers, QA engineers, and product managers streamline and standardize the bug triaging process. It takes raw, unstructured bug reports and analyzes them against a comprehensive 9-criterion QA rubric using the Google Gemini 3.1 Flash Lite API.

## Features

- **Rubric-Based Evaluation**: Consistently grade incoming bug reports across 9 standard QA criteria (with weighted scoring).
- **Interactive Dashboard**: A radial gauge displaying the overall score, complete with detailed category tooltips (hover, tap, or keyboard-focus) for verbatim evidence and actionable fixes.
- **Missing Information Detector**: Automatically calls out specific details or fields that are missing from the input.
- **Severity & Priority Prediction**: Provides predicted bug severity (Critical/High/Medium/Low) and ticket priority (P1–P4) with logical reasoning.
- **Structured Ticket Rewriter**: Safely rewrites user reports to remove fluff and preserve technical facts, highlighting missing fields with `[NEEDS INFO: description]` placeholders.
- **Export Formats**: Copy standardized tickets directly as Markdown or converted JIRA syntax, or download as a `.md` file.
- **Demo Mode**: Test drive the complete UI offline with the three precompiled sample reports — no API key required. (Demo mode analyzes the bundled samples only; connect a key for live analysis of your own reports.)

## Stack

- **Framework**: Vite + React + TypeScript (strict mode)
- **UI/Styles**: Tailwind CSS v4 + Lucide Icons
- **AI Engine**: Gemini 3.1 Flash Lite API (`gemini-3.1-flash-lite`)
- **Linter/Formatter**: Biome (`@biomejs/biome`)
- **Testing**: Vitest
- **Package Manager**: npm
- **Data Flow**: Pure client-side storage (localStorage) for API keys; zero remote data storage to protect key credentials. Requests authenticate via the `x-goog-api-key` header and go directly to Google's API.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v24 or higher
- npm v10 or higher (bundled with Node.js)

You'll also want a **free Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey) — or just use demo mode, which needs no key at all.

### Installation

1. Clone the repository and install the dependencies:

   ```bash
   git clone https://github.com/nrshafi/TriageReady.git
   cd TriageReady
   npm install
   ```

2. Start the local development server:

   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the displayed URL (typically `http://localhost:5173`).

### Scripts

| Command             | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the local development server                      |
| `npm run build`     | Typecheck and build the production bundle               |
| `npm run preview`   | Preview the production build locally                    |
| `npm run test`      | Run the Vitest unit test suite                          |
| `npm run typecheck` | Typecheck the project (`tsc -b`, strict mode)           |
| `npm run lint`      | Check lint issues with Biome                            |
| `npm run format`    | Auto-format all files with Biome                        |
| `npm run check`     | Run all Biome checks and auto-apply safe fixes          |
| `npm run check:ci`  | Biome CI mode — lint + format check without writing     |

### Testing

Unit tests cover the weighted scoring engine, the Markdown → Jira converter (including a regression test for fenced code blocks), and the Gemini response validator:

```bash
npm run test
```

## Deployment

Every push to `main` runs the full quality gate (Biome, typecheck, tests, build) and deploys to GitHub Pages via `.github/workflows/deploy.yml`. Pull requests run the same checks via `.github/workflows/ci.yml`.

## License

Released under the [MIT License](LICENSE).
