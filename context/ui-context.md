# UI Context

## Theme

The design language represents a dark technical workspace—near-black backgrounds (`#0d1117`), layered dark gray surfaces (`#161b22`, `#21262d`), subtle borders (`#30363d`), and bright color-coded visual accents to highlight application states, scoring metrics, and key interactive controls.

## Colors

All colors are defined as CSS variables in `src/styles/theme.css`. The application maps these to custom Tailwind colors in the CSS `@theme` container.

| Role            | CSS Variable       | Value / Reference |
| --------------- | ------------------ | ----------------- |
| Page background | `--background`     | `#0d1117`         |
| Surface / Cards | `--card`           | `#161b22`         |
| Primary text    | `--foreground`     | `#e6edf3`         |
| Muted text      | `--muted-foreground` | `#8b949e`       |
| Primary accent  | `--primary`        | `#4493f8`         |
| Secondary/Input | `--secondary`      | `#21262d`         |
| Border          | `--border`         | `#30363d`         |
| Error Accent    | `--destructive`    | `#f85149`         |
| Triage-Ready state | `getGradeBand()` | `#3fb950`         |
| Minor Gaps state| `getGradeBand()`    | `#d29922`         |
| Needs Work state| `getGradeBand()`    | `#f0883e`         |

## Typography

| Role      | Font              | Variable      | Description |
| --------- | ----------------- | ------------- | ----------- |
| UI text   | Inter             | `--font-sans` | Standard UI and body copy |
| Code/mono | JetBrains/System  | `--font-mono` | Console code blocks and missing field warning labels |

## Border Radius

| Context           | Class            | Value / Variable |
| ----------------- | ---------------- | ---------------- |
| Inline / small UI | `rounded-md`     | `calc(var(--radius) - 2px)` / `4px` |
| Cards / panels    | `rounded-xl`     | `12px` |
| Form inputs       | `rounded-lg`     | `var(--radius)` / `6px` |

## Component Library

Custom components are built on top of Tailwind CSS using Radix UI accessible primitives. Components are located in `src/app/components/ui/` (e.g. `dialog.tsx`, `progress.tsx`, `separator.tsx`, `tooltip.tsx`, `alert.tsx`, etc.). Custom layout controls (like `RadialGauge`, `CategoryBar`, `SkeletonDashboard`) are implemented inside `src/app/App.tsx`.

## Layout Patterns

- **Sticky Navigation**: Header bar fixed at the top of the viewport with a bottom border, containing logo branding and connection state elements.
- **Centered Layout**: Centered workspace using `max-w-4xl mx-auto px-6` to ensure comfortable reading width on large desktop monitors.
- **Grids**: Responsive two-column layouts for before-and-after ticket comparisons and supplementary status dashboards (Missing fields vs. Severity predictions).
- **Tooltips**: Floating hover popovers showing verbatim evidence quotes and suggested recommendations positioned dynamically relative to the target item.

## Icons

Lucide React is used for all icon imagery (stroke-based vectors). Common icons include:
- `Key`: Indicating API key connection settings.
- `Zap`: Prompting Gemini API run execution.
- `AlertTriangle`: Representing warnings, prompt injection risks, or missing information fields.
- `Copy` and `Download`: Managing user copy/export actions.
- Size Standard: `h-3.5 w-3.5` for inline text/copy modifiers, `h-4 w-4` for standard buttons, and `h-5 w-5` for setup forms.

