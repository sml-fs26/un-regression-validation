/*
 * serifAudit.ts — the `.assert-serif-budget` runtime + static counters.
 *
 * Spec: DESIGN.md §Typography system, lines 139-161.
 *
 * Two counters live here:
 *
 *   1. `countItalicSerifRuntime(root)` — dev-mode browser check. Walks
 *      the DOM, resolves each element's computed style, and counts
 *      elements whose font-family includes 'DM Serif Display' AND
 *      whose font-style is 'italic'. Called from a +layout.svelte onMount
 *      in DEV mode; logs console.error + surfaces a dev overlay if the
 *      count diverges from the per-chapter budget table at line 154.
 *
 *   2. `countItalicSerifFromHtml(html)` — static-HTML counter used by
 *      the CI Vitest test (tests/assert-serif-budget.test.ts). Because
 *      static HTML has no CSS-engine attached, the runtime approach
 *      does not work: we count by the three utility classes in
 *      src/lib/styles/typography.css that materialize an italic DM
 *      Serif font declaration (`.type-voice14`, `.type-voice32`,
 *      `.type-voice48`). Any future italic-serif role MUST be added
 *      here AND to typography.css or the total will drift.
 *
 * The cross-chapter invariant (DESIGN.md line 149) is:
 *     cumulative italic-DM-Serif DOM count over a full scroll === 4.
 *
 * Per-chapter permitted counts (DESIGN.md lines 155-161):
 *     CH1 = 0, CH2 = 1, CH3 = 1, CH4 = 0, CH5 = 2.
 *
 * The test loads these from tests/serif-budget.expected.json so the
 * file-size of this module is not the source of truth.
 */

/** The three utility classes whose `font` shorthand resolves to
 * italic DM Serif Display. Any new italic-serif role must be
 * added here AND to src/lib/styles/typography.css. */
export const ITALIC_SERIF_CLASSES: readonly string[] = [
  'type-voice14',
  'type-voice32',
  'type-voice48'
];

/**
 * Count italic-DM-Serif elements in a live browser DOM.
 * Called by a DEV-mode MutationObserver; inert in production.
 */
export function countItalicSerifRuntime(root: ParentNode = document): number {
  const all = root.querySelectorAll<HTMLElement>('*');
  let count = 0;
  for (const el of all) {
    const cs = window.getComputedStyle(el);
    const family = cs.fontFamily || '';
    const style = cs.fontStyle || '';
    if (family.includes('DM Serif Display') && style === 'italic') {
      count += 1;
    }
  }
  return count;
}

/**
 * Count italic-DM-Serif elements in a string of static HTML.
 * Used by the CI Vitest test. Matches any element carrying at
 * least one of the ITALIC_SERIF_CLASSES class tokens.
 *
 * This is a dependency-free regex scan — small and fast enough
 * for the built HTML files we produce, and avoids dragging in
 * jsdom or cheerio for a Node-only audit.
 */
export function countItalicSerifFromHtml(html: string): number {
  // Match opening tags: <tag ... class="...">, handling both single
  // and double quotes. We extract the class attribute value and split
  // on whitespace, then check for any of the ITALIC_SERIF_CLASSES.
  const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)\s+[^>]*class\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/g;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const classes = (m[2] ?? m[3] ?? '').split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      if (ITALIC_SERIF_CLASSES.includes(cls)) {
        count += 1;
        break; // don't double-count a single element with two matching classes
      }
    }
  }
  return count;
}
