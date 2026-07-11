import { describe, expect, it } from "vitest";
import { DEMO_RESPONSES } from "./constants";
import { toJiraFormat } from "./export";

describe("toJiraFormat", () => {
  it("converts headers", () => {
    expect(toJiraFormat("## Summary")).toBe("h2. Summary");
    expect(toJiraFormat("### Details")).toBe("h3. Details");
  });

  it("converts bold, inline code, and lists", () => {
    expect(toJiraFormat("**important**")).toBe("*important*");
    expect(toJiraFormat("run `npm test` now")).toBe("run {{npm test}} now");
    expect(toJiraFormat("1. first\n2. second")).toBe("# first\n# second");
    expect(toJiraFormat("- item\n* item2")).toBe("* item\n* item2");
  });

  it("converts fenced code blocks to {code} blocks", () => {
    const out = toJiraFormat("```\nError: status 413\n```");
    expect(out).toBe("{code}\nError: status 413\n{code}");
  });

  it("strips the language tag from fenced code blocks", () => {
    const out = toJiraFormat("```js\nconsole.log(1);\n```");
    expect(out).toBe("{code}\nconsole.log(1);\n{code}");
  });

  // Regression: the previous implementation ran the inline-code replacement
  // before the fence replacement, corrupting every fenced block and mangling
  // text far beyond it (matched across the closing fence).
  it("does not corrupt fenced code blocks (regression)", () => {
    const md = [
      "## Actual Result",
      "Browser console shows:",
      "```",
      "Error: Request failed with status 413",
      "```",
      "",
      "## Steps to Reproduce",
      "1. Log in as any standard user (tested with `user@example.com`)",
      "2. Navigate to **Settings → Profile**",
    ].join("\n");

    const out = toJiraFormat(md);
    expect(out).toContain(
      "{code}\nError: Request failed with status 413\n{code}",
    );
    expect(out).toContain(
      "# Log in as any standard user (tested with {{user@example.com}})",
    );
    expect(out).toContain("# Navigate to *Settings → Profile*");
    expect(out).not.toContain("`");
  });

  it("leaves list-like lines inside code blocks untouched", () => {
    const md = "```\n1. not a list\n- also not a list\n```";
    const out = toJiraFormat(md);
    expect(out).toBe("{code}\n1. not a list\n- also not a list\n{code}");
  });

  it("handles multiple code blocks independently", () => {
    const md = "```\nfirst\n```\ntext between\n```\nsecond\n```";
    const out = toJiraFormat(md);
    expect(out).toBe(
      "{code}\nfirst\n{code}\ntext between\n{code}\nsecond\n{code}",
    );
  });

  it("survives the bundled 'excellent' demo report end-to-end", () => {
    const out = toJiraFormat(
      DEMO_RESPONSES.excellent.rewritten_report_markdown,
    );
    expect(out).toContain("h2. Summary");
    expect(out).toContain("{code}");
    expect(out).toContain("{{user@example.com}}");
    expect(out).not.toContain("`");
    expect(out).not.toContain("CODEBLOCK");
  });
});
