// ─── Export helpers: Jira conversion, clipboard ──────────────────────────────

/**
 * Placeholder delimiter for extracted code blocks. The NUL character cannot
 * occur in real report text, so the inline transformations can never touch
 * or collide with a placeholder.
 */
const NUL = "\u0000";
const PLACEHOLDER_PATTERN = new RegExp(`${NUL}CODEBLOCK(\\d+)${NUL}`, "g");

/**
 * Convert the rewritten Markdown report to Jira wiki markup.
 *
 * Fenced code blocks are extracted FIRST and restored at the end so their
 * contents are never touched by the inline transformations (bold, inline
 * code, list markers). Running the inline-code replacement before the fence
 * replacement corrupts the output — see export.test.ts for the regression.
 */
export function toJiraFormat(md: string): string {
  const codeBlocks: string[] = [];
  const withPlaceholders = md.replace(
    /```[\w]*\n([\s\S]*?)```/g,
    (_match, code: string) => {
      codeBlocks.push(code);
      return `${NUL}CODEBLOCK${codeBlocks.length - 1}${NUL}`;
    },
  );

  const converted = withPlaceholders
    .replace(/^## (.+)$/gm, "h2. $1")
    .replace(/^### (.+)$/gm, "h3. $1")
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/`([^`]+)`/g, "{{$1}}")
    .replace(/^\d+\.\s/gm, "# ")
    .replace(/^[-*]\s/gm, "* ");

  return converted.replace(
    PLACEHOLDER_PATTERN,
    (_match, index: string) => `{code}\n${codeBlocks[Number(index)]}{code}`,
  );
}

/** Copy text to the clipboard, falling back to execCommand for older engines. */
export async function copyText(text: string): Promise<boolean> {
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
