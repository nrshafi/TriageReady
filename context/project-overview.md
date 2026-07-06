# TriageReady

## Overview

TriageReady is a web application designed for QA engineers, product managers, and developers to streamline the bug triaging process. The tool takes raw, unstructured bug reports (often written as high-level summaries or unstructured rants) and grades them against a comprehensive 9-criterion QA rubric using the Gemini API. It outputs a score, identifies missing details, and provides a polished, professional rewrite with placeholders (like `[NEEDS INFO]`) for missing data, converting raw feedback into structured, actionable bug reports.

## Goals

1. **Rubric-Based Evaluation**: Assess bug reports consistently against 9 standard QA criteria with weighted scoring.
2. **Quality Improvement**: Guide bug reporters to write better reports by highlighting specific deficiencies, evidence gaps, and suggested improvements.
3. **Structured Standardization**: Standardize the formatting of incoming bugs for engineering teams by exporting professional Markdown or Jira-formatted ticket content.
4. **Offline Capability / Demo Mode**: Allow users to trial the tool's interface and capabilities immediately without an active Gemini API key.

## Core User Flow

1. **Authentication / Access**: The user connects their Gemini API key (persisted in browser localStorage) or elects to try the application in Demo Mode.
2. **Input**: The user inputs a raw bug report in the text area, optionally pre-populating it with one of three quick samples ("Terrible", "Mediocre", or "Excellent").
3. **Analysis**: The user triggers "Analyze report", sending the report to the Gemini 3.1 Flash Lite API with a dedicated system instruction and JSON output schema (or simulating via pre-defined responses in Demo Mode).
4. **Review Dashboard**: The user views the overall grade (e.g., Triage-ready, Minor gaps, Needs work, Rewrite required), radial gauge score, detailed category breakdown tooltips, missing fields warnings, and predicted severity/priority.
5. **Comparison & Export**: The user reviews the side-by-side comparison of the original text and the rewritten structured markdown, then copies the Markdown or Jira format to the clipboard, or downloads a `.md` file.

## Features

### Grader & Predictor Dashboard
- **Weighted Grading**: Calculates a score from 0 to 100 based on 9 specific categories with custom weights.
- **Hover Detail Tooltips**: Displays the specific verbatim evidence and recommendations/fixes for each criterion on hover.
- **Missing Information Detector**: Enumerates the specific fields that are missing from the input report.
- **Severity & Priority Prediction**: Uses the LLM to predict impact severity (Critical/High/Medium/Low) and ticket priority (P1–P4) with logical reasoning.

### Ticket Rewriter & Exporter
- **No-Hallucination Rewriting**: Generates professional ticket copy preserving all facts while mapping missing fields to `[NEEDS INFO: description]` placeholders.
- **Multi-Format Copiers**: Direct copy to clipboard for standard Markdown or converted Jira format.
- **Local Downloader**: Downloads the rewritten report as a local `.md` file.
- **Vibrant Interactive Theme**: Clean dark mode with animations, custom radial gauge, and color-coded state indicators.

## Scope

### In Scope
- Client-side React web application with Vite and Tailwind CSS.
- Integrates directly with the Google Gemini 3.1 Flash Lite API.
- Offline Demo Mode utilizing pre-recorded responses for sample inputs.
- Locally managed user settings and API key storage via localStorage.

### Out of Scope
- Server-side infrastructure, remote user accounts, or server-persisted database storage.
- Multi-user authentication or team collaboration workspaces.
- Direct synchronization plugins for JIRA/Linear API integrations.

## Success Criteria

1. A user can paste a bug report, connect their API key, and successfully fetch a rubric analysis and report rewrite.
2. The user can interact with the score breakdown and copy/download formatted results.
3. Demo mode correctly mocks response payload behavior for all three quick sample categories.

