# <img src="src/assets/logo.png" width="40" height="40" align="center" alt="TriageReady Logo" /> TriageReady

TriageReady is a modern, client-side web application designed to help developers, QA engineers, and product managers streamline and standardize the bug triaging process. It takes raw, unstructured bug reports and analyzes them against a comprehensive 9-criterion QA rubric using the Google Gemini 3.1 Flash Lite API.

## Features

- **Rubric-Based Evaluation**: Consistently grade incoming bug reports across 9 standard QA criteria (with weighted scoring).
- **Interactive Dashboard**: A radial gauge displaying the overall score, complete with detailed category hover-tooltips for verbatim evidence and actionable fixes.
- **Missing Information Detector**: Automatically calls out specific details or fields that are missing from the input.
- **Severity & Priority Prediction**: Provides predicted bug severity (Critical/High/Medium/Low) and ticket priority (P1–P4) with logical reasoning.
- **Structured Ticket Rewriter**: Safely rewrites user reports to remove fluff and preserve technical facts, highlighting missing fields with `[NEEDS INFO: description]` placeholders.
- **Export Formats**: Copy standardized tickets directly as Markdown or converted JIRA syntax, or download as a `.md` file.
- **Demo Mode**: Test drive the complete UI and review responses offline using precompiled sample templates (no API key required).

## Stack

- **Framework**: Vite + React + TypeScript
- **UI/Styles**: Tailwind CSS v4 + Lucide Icons
- **AI Engine**: Gemini 3.1 Flash Lite API (`gemini-3.1-flash-lite`)
- **Data Flow**: Pure client-side storage (localStorage) for API keys; zero remote data storage to protect key credentials.

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the displayed URL (typically `http://localhost:5173`).