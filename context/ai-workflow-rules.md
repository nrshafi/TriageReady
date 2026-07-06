# AI Workflow Rules

## Approach

Build TriageReady incrementally using a client-focused, spec-driven workflow. Context files define what components exist, their boundaries, styling parameters, and the exact state of implementation. Implement code changes strictly against these files to prevent straying from the original client design system.

## Scoping Rules

- Work on one logical UI or utility module at a time.
- Verify changes client-side locally before staging production builds.
- Refrain from mixing layout restructuring and scoring modifications in the same development chunk.

## When to Split Work

Split an implementation step if it combines:
- Custom state changes (e.g. key management, local storage logic) and rubric parsing adjustments.
- Adding raw mock data inputs and revising the prompt schema definitions in `api.ts`.
- Changes to the custom markdown renderer engine and unrelated CSS visual modifications.

If a set of edits cannot be verified immediately inside the dev preview, the scope is too broad—split the changes.

## Handling Missing Requirements

- Never assume product behavior. If instructions are missing for visual layouts or key transitions, verify them in the original Figma files.
- Document any unresolved queries or client specs in the open questions section of `progress-tracker.md` before coding.

## Protected Files

Do not modify the following unless explicitly instructed:
- Core Radix UI primitives under `src/app/components/ui/*` (these are boilerplate and shouldn't be altered unless adding specific styling overrides).
- Global theme definitions inside `src/styles/fonts.css` and `src/styles/globals.css`.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:
- Evaluated rubric parameters or weighting percentages in `src/app/constants.ts`.
- CSS variable token maps in the layout engine.
- High-level application state machine phases (`setup`, `input`, `loading`, `results`).

## Before Moving to the Next Unit

1. Run the local dev server and ensure all layout visuals adjust cleanly.
2. Verify TypeScript compile checks pass successfully (`npm run build`).
3. Complete the current goals list in `progress-tracker.md` to reflect new achievements.

