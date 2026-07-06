import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import {
  Key,
  AlertTriangle,
  Copy,
  Download,
  Loader2,
  ChevronUp,
  ChevronDown,
  Zap,
  FlaskConical,
  FileText,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { CRITERIA, SAMPLE_REPORTS, DEMO_RESPONSES, type GeminiResult } from "./constants";
import { analyzeReport } from "./api";
import { computeOverallScore, getGradeBand, scoreToBarColor, scoreToGlowColor } from "./scoring";

// ─── Markdown renderer with [NEEDS INFO] highlighting ────────────────────────

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let k = 0; // independent key counter — never tied to `i`

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={k++} className="bg-background border border-border rounded p-3 my-3 overflow-x-auto text-xs font-mono text-secondary-foreground">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={k++} className="text-sm font-semibold text-foreground mt-5 mb-2 pb-1 border-b border-border/50 font-sans tracking-wide uppercase text-[11px] text-muted-foreground">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={k++} className="text-sm font-semibold text-foreground mt-4 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={k++} className="list-decimal list-inside space-y-1 my-2 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-foreground/90 leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={k++} className="space-y-1 my-2 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-foreground/90 leading-relaxed flex gap-2">
              <span className="text-muted-foreground mt-0.5 shrink-0">–</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      nodes.push(<div key={k++} className="h-2" />);
      i++;
      continue;
    }

    // Paragraph
    nodes.push(
      <p key={k++} className="text-sm text-foreground/90 leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function renderInline(text: string): ReactNode[] {
  // Split on [NEEDS INFO: ...], **bold**, *italic*, `code`
  const parts: ReactNode[] = [];
  const regex = /(\[NEEDS INFO:[^\]]*\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("[NEEDS INFO:")) {
      const content = token.slice(1, -1);
      parts.push(
        <span
          key={match.index}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 cursor-help"
          title="TriageReady flags unknowns instead of inventing them."
        >
          {content}
        </span>
      );
    } else if (token.startsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={match.index} className="italic text-foreground/80">{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      parts.push(<code key={match.index} className="px-1 py-0.5 rounded text-[11px] font-mono bg-background border border-border text-secondary-foreground">{token.slice(1, -1)}</code>);
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

// ─── Logo Component ──────────────────────────────────────────────────────────

function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="50%" stopColor="var(--logo-cyan)" />
          <stop offset="100%" stopColor="var(--success)" />
        </linearGradient>
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="var(--success)" floodOpacity="0.6"/>
        </filter>
        <filter id="logoBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="var(--primary)" floodOpacity="0.4"/>
        </filter>
      </defs>

      {/* Outer target circle segment */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="url(#logoGrad)" strokeWidth="4.5" strokeDasharray="18 14" strokeLinecap="round" opacity="0.8" />

      {/* Inner target circle */}
      <circle cx="50" cy="50" r="30" fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="url(#logoGrad)" strokeWidth="4" strokeDasharray="70 90" strokeLinecap="round" />

      {/* Stylized T-Checkmark combo */}
      <g transform="translate(0, 1)">
        <rect x="24" y="28" width="52" height="6" rx="3" fill="var(--foreground)" filter="url(#logoBlueGlow)" />
        <path d="M50 28 V 56" stroke="var(--foreground)" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M38 52 L 49.5 63.5 L 74 31" fill="none" stroke="var(--success)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" filter="url(#logoGlow)" />
      </g>
    </svg>
  );
}

// ─── Radial Gauge ─────────────────────────────────────────────────────────────

function RadialGauge({ score, color, glow }: { score: number; color: string; glow: string }) {
  const [animated, setAnimated] = useState(false);
  const [displayNum, setDisplayNum] = useState(0);
  const circumference = 2 * Math.PI * 40;

  useEffect(() => {
    const t1 = setTimeout(() => setAnimated(true), 80);
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayNum(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      clearTimeout(t1);
      cancelAnimationFrame(frame);
    };
  }, [score]);

  const dashArray = animated ? (score / 100) * circumference : 0;
  const dashOffset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <svg
        viewBox="0 0 100 100"
        width={160}
        height={160}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="7"
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dashArray} ${circumference}`}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: `drop-shadow(0 0 6px ${glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-semibold leading-none"
          style={{ fontSize: 38, color: color, letterSpacing: "-0.02em" }}
        >
          {displayNum}
        </span>
        <span className="text-xs text-muted-foreground font-mono mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ─── Category bar with tooltip ────────────────────────────────────────────────

function CategoryBar({
  label,
  weight,
  score,
  evidence,
  fix,
}: {
  label: string;
  weight: number;
  score: number;
  evidence: string;
  fix: string;
}) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const color = scoreToBarColor(score);
  const glow = scoreToGlowColor(score);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
    >
      <div className="flex items-center gap-3 py-2">
        <span className="text-sm text-muted-foreground w-44 shrink-0 font-sans">{label}</span>
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${(score / 10) * 100}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${glow}`,
            }}
          />
        </div>
        <span className="font-mono text-sm w-10 text-right" style={{ color }}>
          {score}/10
        </span>
        <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border w-10 text-center shrink-0">
          ×{weight}
        </span>
      </div>

      {tooltipVisible && (
        <div className="absolute left-48 top-0 z-50 w-80 bg-tooltip-background border border-border rounded-lg p-3 shadow-xl pointer-events-none">
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Evidence</span>
            <p className="text-xs text-foreground/80 mt-1 font-mono leading-relaxed">{evidence}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Suggested fix</span>
            <p className="text-xs text-primary mt-1 leading-relaxed">{fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded bg-secondary animate-pulse ${className}`}
    />
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-6 flex gap-8 items-center">
        <Skeleton className="w-40 h-40 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <Skeleton className="h-3 w-40 mb-4" />
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="flex-1 h-1.5" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Clipboard helper with execCommand fallback ───────────────────────────────

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────

type AppState = "setup" | "input" | "loading" | "results";

export default function App() {
  const [appState, setAppState] = useState<AppState>("setup");
  const [apiKey, setApiKey] = useState("");
  const [rememberKey, setRememberKey] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [reportText, setReportText] = useState("");
  const [result, setResult] = useState<GeminiResult | null>(null);
  const [score, setScore] = useState(0);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [copyingMd, setCopyingMd] = useState(false);
  const [copyingJira, setCopyingJira] = useState(false);

  // Load saved key on mount
  useEffect(() => {
    const saved = localStorage.getItem("triageready_apikey");
    if (saved) {
      setApiKey(saved);
      setAppState("input");
    }
  }, []);

  const handleSaveAndContinue = useCallback(() => {
    if (!apiKey.trim()) {
      toast.error("Please enter your Gemini API key.");
      return;
    }
    if (rememberKey) {
      localStorage.setItem("triageready_apikey", apiKey.trim());
    }
    setDemoMode(false);
    setAppState("input");
  }, [apiKey, rememberKey]);

  const handleDemoMode = useCallback(() => {
    setDemoMode(true);
    setApiKey("");
    setAppState("input");
  }, []);

  const handleSamplePick = useCallback((key: keyof typeof SAMPLE_REPORTS) => {
    setReportText(SAMPLE_REPORTS[key]);
    setActiveSample(key);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!reportText.trim()) {
      toast.error("Paste a bug report to analyze.");
      return;
    }
    setAppState("loading");
    try {
      let res: GeminiResult;
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 1400));
        const key = activeSample ?? "mediocre";
        res = DEMO_RESPONSES[key] ?? DEMO_RESPONSES.mediocre;
      } else {
        res = await analyzeReport(apiKey, reportText);
      }
      setResult(res);
      setScore(computeOverallScore(res));
      setAppState("results");
      setInputCollapsed(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Analysis failed: ${msg}`, {
        action: demoMode
          ? undefined
          : {
              label: "Use demo mode",
              onClick: () => {
                setDemoMode(true);
                toast.success("Switched to demo mode.");
              },
            },
      });
      setAppState("input");
    }
  }, [reportText, demoMode, apiKey, activeSample]);

  const handleReset = useCallback(() => {
    setResult(null);
    setScore(0);
    setReportText("");
    setActiveSample(null);
    setInputCollapsed(false);
    setAppState("input");
  }, []);

  const handleForgetKey = useCallback(() => {
    localStorage.removeItem("triageready_apikey");
    setApiKey("");
    setDemoMode(false);
    setResult(null);
    setScore(0);
    setAppState("setup");
  }, []);

  const toJiraFormat = (md: string) =>
    md
      .replace(/^## (.+)$/gm, "h2. $1")
      .replace(/^### (.+)$/gm, "h3. $1")
      .replace(/\*\*([^*]+)\*\*/g, "*$1*")
      .replace(/`([^`]+)`/g, "{{$1}}")
      .replace(/```[\w]*\n([\s\S]*?)```/g, "{code}\n$1{code}")
      .replace(/^\d+\.\s/gm, "# ")
      .replace(/^[-*]\s/gm, "* ");

  const handleCopyMd = async () => {
    if (!result) return;
    const ok = await copyText(result.rewritten_report_markdown);
    if (ok) {
      setCopyingMd(true);
      toast.success("Markdown copied!");
      setTimeout(() => setCopyingMd(false), 1500);
    } else {
      toast.error("Copy blocked by browser — try opening in a new tab.");
    }
  };

  const handleCopyJira = async () => {
    if (!result) return;
    const ok = await copyText(toJiraFormat(result.rewritten_report_markdown));
    if (ok) {
      setCopyingJira(true);
      toast.success("Jira format copied!");
      setTimeout(() => setCopyingJira(false), 1500);
    } else {
      toast.error("Copy blocked by browser — try opening in a new tab.");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.rewritten_report_markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bug-report-rewritten.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const gradeBand = result ? getGradeBand(score) : null;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
          },
        }}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 shrink-0" />
            <span className="font-semibold text-sm text-foreground tracking-tight">TriageReady</span>
            <span className="hidden sm:block text-[11px] text-muted-foreground border-l border-border pl-3 ml-1">
              From rant to triage-ready in one click.
            </span>
          </div>
          <div className="flex items-center gap-3">
            {appState !== "setup" && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                {demoMode ? (
                  <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                    <FlaskConical className="w-3 h-3" /> demo mode
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
                    <Key className="w-3 h-3" /> key connected
                  </span>
                )}
                {appState === "results" && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border hover:border-[#4493f8]/50"
                  >
                    <RotateCcw className="w-3 h-3" /> new report
                  </button>
                )}
                <button
                  onClick={handleForgetKey}
                  className="text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-transparent hover:border-border text-[11px]"
                >
                  forget key
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-16">

        {/* ── SETUP STATE ── */}
        {appState === "setup" && (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-secondary border border-border/80 mb-4 shadow-inner">
                  <Logo className="w-14 h-14 animate-[pulse_3s_infinite_ease-in-out]" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-2">Connect your Gemini key</h1>
                <p className="text-sm text-muted-foreground">
                  Grade bug reports against a 9-criterion QA rubric.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveAndContinue()}
                    placeholder="AIza..."
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#4493f8]/50 focus:border-[#4493f8]/50 transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setRememberKey(!rememberKey)}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                      rememberKey
                        ? "bg-[#4493f8] border-[#4493f8]"
                        : "bg-transparent border-border"
                    }`}
                  >
                    {rememberKey && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Remember on this device</span>
                </label>

                <div className="pt-1 flex flex-col gap-2">
                  <button
                    onClick={handleSaveAndContinue}
                    className="w-full bg-[#4493f8] hover:bg-[#3b82f6] text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
                  >
                    Save & continue
                  </button>
                  <button
                    onClick={handleDemoMode}
                    className="w-full bg-transparent hover:bg-secondary text-muted-foreground hover:text-foreground font-medium text-sm py-2.5 rounded-lg border border-border transition-colors flex items-center justify-center gap-2"
                  >
                    <FlaskConical className="w-4 h-4" /> Try demo mode
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-1">
                  Your key stays in your browser and is sent only to Google's API.{" "}
                  <span className="text-foreground/60">This site has no server.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── INPUT STATE ── */}
        {(appState === "input" || appState === "loading") && (
          <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Info & Sample Picker Card */}
            <div className="lg:col-span-4 space-y-6">
              {/* App intro / Info Card */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Logo className="w-10 h-10 shrink-0" />
                  <div>
                    <h2 className="text-sm font-semibold text-foreground leading-tight">TriageReady Grader</h2>
                    <p className="text-[11px] text-muted-foreground">QA Assistant</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Paste your raw, unstructured bug report or feedback. The system analyzes it against a 9-criterion rubric to grade its quality and generate a clean, structured, non-hallucinated rewrite.
                </p>
                <div className="border-t border-border/60 pt-3">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block mb-2">Evaluation Rubric</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-foreground/80 font-mono">
                    <div>• Title (10%)</div>
                    <div>• Repro steps (25%)</div>
                    <div>• Expected behavior (10%)</div>
                    <div>• Actual behavior (10%)</div>
                    <div>• Environment (15%)</div>
                    <div>• Severity/Priority (10%)</div>
                    <div>• Reproducibility (5%)</div>
                    <div>• Evidence (5%)</div>
                    <div>• Clarity/Scope (10%)</div>
                  </div>
                </div>
              </div>

              {/* Sample Cards Selection */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block px-1">Select a Quick Sample</span>
                <div className="flex flex-col gap-2.5">
                  {(["terrible", "mediocre", "excellent"] as const).map((key, idx) => {
                    const titles = ["😱 Terrible Report", "😐 Mediocre Report", "✨ Excellent Report"];
                    const descs = [
                      "Extremely vague. No environment, steps, expected or actual results.",
                      "Some useful information, but missing key environment specifications and evidence.",
                      "Highly structured. Contains steps, environments, and precise descriptions."
                    ];
                    const active = activeSample === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSamplePick(key)}
                        disabled={appState === "loading"}
                        className={`text-left p-3.5 rounded-xl border transition-all duration-300 ${
                          active
                            ? "bg-[#4493f8]/10 border-[#4493f8] shadow-[0_0_12px_rgba(68,147,248,0.15)]"
                            : "bg-card border-border hover:border-[#4493f8]/40 hover:bg-[#161b22]/80"
                        } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold ${active ? "text-[#4493f8]" : "text-foreground group-hover:text-foreground"}`}>
                            {titles[idx]}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                            {key === "terrible" ? "Score ~10" : key === "mediocre" ? "Score ~50" : "Score ~95"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {descs[idx]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Text Area Input */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Raw Bug Content
                  </label>
                  {activeSample && (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      Sample loaded: {activeSample}
                    </span>
                  )}
                </div>

                <textarea
                  value={reportText}
                  onChange={(e) => {
                    setReportText(e.target.value);
                    setActiveSample(null);
                  }}
                  placeholder="Paste your raw bug report here, or click one of the quick samples on the left to populate..."
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/40 font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#4493f8]/50 focus:border-[#4493f8]/50 transition-colors h-[380px]"
                  spellCheck={false}
                  disabled={appState === "loading"}
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                    {reportText.length > 0 && (
                      <span>{reportText.length} characters</span>
                    )}
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={appState === "loading" || !reportText.trim()}
                    className="flex items-center gap-2 bg-[#4493f8] hover:bg-[#3b82f6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {appState === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing report...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Analyze Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {appState === "loading" && (
          <div className="mt-6">
            <SkeletonDashboard />
          </div>
        )}

        {/* ── RESULTS STATE ── */}
        {appState === "results" && result && gradeBand && (
          <div className="pt-6 space-y-6">
            {/* Collapsed input bar */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setInputCollapsed(!inputCollapsed)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-[11px] uppercase tracking-wider font-medium">Original report</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{reportText.length} chars</span>
                </div>
                {inputCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              {!inputCollapsed && (
                <div className="px-4 pb-4 border-t border-border">
                  <pre className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap pt-3 max-h-40 overflow-y-auto">
                    {reportText}
                  </pre>
                </div>
              )}
            </div>

            {/* Injection warning */}
            {result.injection_detected && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-red-400 font-medium">
                  ⚠ This report attempted to manipulate the grader — scored on actual content.
                </span>
              </div>
            )}

            {/* Top Grid: Left (Score, Severity, Missing Info) & Right (Rubric Details) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column on Desktop */}
              <div className="lg:col-span-5 space-y-6">
                {/* Hero score */}
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start hover:border-[#4493f8]/20 transition-all duration-300">
                  <div className="shrink-0">
                    <RadialGauge score={score} color={gradeBand.hex} glow={gradeBand.glow} />
                  </div>
                  <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono mb-2">
                      Is this report triage-ready?
                    </p>
                    <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
                      <span className="font-mono text-4xl font-semibold text-foreground">{score}</span>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${gradeBand.pillBg} ${gradeBand.pillText}`}
                      >
                        {gradeBand.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.summary_verdict}
                    </p>
                  </div>
                </div>

                {/* Severity prediction */}
                <div className="bg-card border border-border rounded-xl p-5 hover:border-[#4493f8]/20 transition-all duration-300">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-3">
                    Severity Prediction
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
                        result.severity_prediction.severity === "Critical"
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : result.severity_prediction.severity === "High"
                          ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                          : result.severity_prediction.severity === "Medium"
                          ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                          : "bg-secondary border-border text-muted-foreground"
                      }`}
                    >
                      {result.severity_prediction.severity}
                    </span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded border bg-[#4493f8]/10 border-[#4493f8]/30 text-[#4493f8]">
                      {result.severity_prediction.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.severity_prediction.reasoning}
                  </p>
                </div>

                {/* Missing info */}
                <div className="bg-card border border-border rounded-xl p-5 hover:border-[#4493f8]/20 transition-all duration-300">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Missing Information
                  </h2>
                  {result.missing_fields.length === 0 ? (
                    <p className="text-xs text-green-400 flex items-center gap-2 font-mono">
                      <CheckCircle2 className="w-4 h-4" /> All required fields present.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {result.missing_fields.map((field, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs">
                          <span className="w-3.5 h-3.5 rounded border border-amber-500/40 bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          </span>
                          <span className="text-foreground/80 font-mono">{field}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Column on Desktop */}
              <div className="lg:col-span-7">
                {/* Category breakdown */}
                <div className="bg-card border border-border rounded-xl p-6 hover:border-[#4493f8]/20 transition-all duration-300">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-4">
                    Category Breakdown
                  </h2>
                  <div className="space-y-0.5">
                    {CRITERIA.map((criterion) => {
                      const cr = result.criteria.find((c) => c.id === criterion.id);
                      return (
                        <CategoryBar
                          key={criterion.id}
                          label={criterion.label}
                          weight={criterion.weight}
                          score={cr?.score ?? 0}
                          evidence={cr?.evidence ?? "Not present"}
                          fix={cr?.fix ?? "No suggestion available."}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-5 font-mono border-t border-border/50 pt-3">
                    Hover a row to inspect evidence quote and suggested fix.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Panel: Before / After Report Compare */}
            <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-[#4493f8]/10 transition-all duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                {/* Before */}
                <div className="p-6">
                  <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mb-4">
                    Original (as submitted)
                  </h2>
                  <pre className="text-xs font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-1">
                    {reportText}
                  </pre>
                </div>

                {/* After */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                      Rewritten (triage-ready)
                    </h2>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      [NEEDS INFO] = flags unknowns
                    </span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto pr-1">
                    {renderMarkdown(result.rewritten_report_markdown)}
                  </div>
                </div>
              </div>
            </div>

            {/* Export actions */}
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Export:</span>
              <button
                onClick={handleCopyMd}
                className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground bg-card border border-border hover:border-[#4493f8]/40 px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copyingMd ? "Copied!" : "Copy Markdown"}
              </button>
              <button
                onClick={handleCopyJira}
                className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground bg-card border border-border hover:border-[#4493f8]/40 px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copyingJira ? "Copied!" : "Copy Jira format"}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground bg-card border border-border hover:border-[#4493f8]/40 px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download .md
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
