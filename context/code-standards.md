# Code Standards

## General

- **Modular Functions**: Isolate logical subsystems. Ensure scoring formulas, API connectivity, and visual components stay separated.
- **Pure Client State**: Rely strictly on React hooks (`useState`, `useEffect`, `useCallback`) to manage local states without external backend synchronization.
- **Robust Rendering**: Avoid template assumptions. Use standard parsing expressions to safely display markdown or highlight specific inline text tokens without crashing the UI thread.

## TypeScript

- **Strict Type Validation**: Enforce complete interfaces (`GeminiResult`, `CriterionResult`, `GradeBand`) for all API transactions and local helper states.
- **No Implicit Any**: Explicitly type functions, helpers, state attributes, and inline event handlers to prevent compiler ambiguity.
- **Safe Object Safekeeping**: Use standard optional chaining syntax (`?.`) when referencing nested properties of external API results.

## Vite + React

- **Functional Components**: Build views as pure, single-purpose components leveraging React's virtual DOM reconciliation loop.
- **Custom React Hooks**: Encapsulate complex operations (such as clipboard copy handlers or responsive width queries) in separate callback/state routines to improve code readability.
- **Key Uniqueness**: Generate distinct keys for all dynamically rendered components (e.g. lists inside the custom markdown renderer). Do not tie rendering keys to raw indices when items can re-sort.

## Styling

- **Tailwind Utility Classes**: Avoid custom external stylesheets for visual layout styling. Configure CSS custom variables in `src/styles/theme.css` and reference them using Tailwind utilities.
- **Vibrant Consistency**: Follow the precise state coloring guidelines (green for triage-ready, red for rewrite required) configured in `scoring.ts` to ensure consistent visual UX.

## API Integration

- **Strict Schema Enforcement**: Configure strict JSON response expectations (`generationConfig.responseSchema`) on the Gemini model parameter list to secure schema matching.
- **Safe Keys**: Extract API keys securely from local states; do not commit hardcoded credentials to repository logs.

## File Organization

- `src/app/` — Houses primary source components (`App.tsx`), Gemini REST handlers (`api.ts`), custom constants/prompts (`constants.ts`), and rating computations (`scoring.ts`).
- `src/app/components/ui/` — Low-level, reusable visual components implementing the global stylesheet variables.
- `src/app/components/figma/` — Bridge wrapper elements connecting figma designs (e.g. fallback layout handlers).
- `src/styles/` — Style configuration layer establishing CSS variable references, typography overrides, and custom fonts.

