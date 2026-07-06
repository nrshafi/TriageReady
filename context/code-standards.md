# Code Standards

## General

- **Principle**: Keep modules small, isolated, and single-purpose. Ensure scoring calculations, API interactions, and UI components remain distinct.
- **Principle**: Fix root causes; do not layer workarounds over structural code defects.
- **Principle**: Do not mix unrelated concerns in one component. Keep UI layout, error handling, and file export helpers decoupled.

## TypeScript

- **Rule**: Strict mode is required throughout the project. Check types exhaustively during compile/build.
- **Rule**: Avoid `any` — use explicit interfaces (`GeminiResult`, `CriterionResult`, `GradeBand`) or narrowly scoped types for all state and helper functions.
- **Rule**: Validate unknown external input (such as raw Gemini API responses) at system boundaries before trusting it in components.
- **Framework**: Vite + React + TS.
- **Convention**: Default to functional client-side components using hooks (`useState`, `useCallback`, `useEffect`) for transient state.
- **Convention**: Avoid third-party state managers; rely on React component state hierarchy or context if sharing becomes necessary.
- **Convention**: Keep asynchronous API request functions isolated in dedicated communication handlers.

## Styling

- **Rule**: Use CSS custom property tokens defined in `src/styles/theme.css`. Do not use hardcoded hex values in component styling.
- **Rule**: Follow the border radius scale defined in `context/ui-context.md` (e.g. `rounded-xl` for cards, `rounded-lg` for inputs).

## API Integration

- **Rule**: Validate and parse response input (such as checking JSON structure and using optional chaining `?.`) before any scoring or rendering logic runs.
- **Rule**: Secure API credentials. Retrieve keys strictly from local user input or client `localStorage` storage; never commit keys or authorization secrets.
- **Rule**: Return consistent, predictable response shapes from API handlers utilizing TypeScript interface contracts.

## Data and Storage

- **Rule**: User preferences and security tokens (like `localStorage` settings) belong in local browser storage.
- **Rule**: Large generated content (such as analysis outputs and markdown exports) belongs in transient component state or downloaded locally by the user.
- **Rule**: Do not store heavy report payloads or high-volume files directly in `localStorage` to avoid quota failures.

## File Organization

- `src/app/` — Houses primary application source code: UI components (`App.tsx`), model integration client (`api.ts`), weighted rating engine (`scoring.ts`), and static content assets (`constants.ts`).
- `src/styles/` — Core layout configuration establishing CSS variable mappings, tailwind utility rules, and font definitions.
- `src/assets/` — Static icon elements, SVG logos, and favicon representations.
- `context/` — Project specification files outlining application goals, UI parameters, architecture decisions, and workflow tracking.



