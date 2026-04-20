/*
 * assert-serif-budget.test.ts
 *
 * CI enforcement of DESIGN.md §Typography system, lines 139-161:
 *   "The single cross-chapter invariant the CI enforces is:
 *    cumulative italic-DM-Serif DOM count over a full scroll == 4."
 *
 * This test parses every built HTML file under `build/` (produced by
 * `npm run build` via SvelteKit + adapter-static) and counts the
 * number of elements whose class attribute carries one of the three
 * italic-serif role classes defined in src/lib/styles/typography.css.
 *
 * The per-chapter and total budget live in
 * tests/serif-budget.expected.json; each chapter-build step
 * (DESIGN.md §Stage 2 handoff → Build order, items 6-10) updates that
 * file when it adds the chapter's italic-serif line. At Step 1, no
 * chapter is built yet, so `currentExpectedTotal` is 0 and
 * `currentlyBuiltChapters` is empty.
 *
 * When all five chapters ship, `currentExpectedTotal` must equal
 * `totalBudget` (4).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  countItalicSerifFromHtml,
  ITALIC_SERIF_CLASSES
} from '../src/lib/dev/serifAudit.js';

interface SerifBudgetConfig {
  perChapter: { ch1: number; ch2: number; ch3: number; ch4: number; ch5: number };
  totalBudget: number;
  currentlyBuiltChapters: Array<'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5'>;
  currentExpectedTotal: number;
}

const expected: SerifBudgetConfig = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/serif-budget.expected.json'), 'utf8')
);

const BUILD_DIR = resolve(process.cwd(), 'build');

function walkHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkHtmlFiles(full));
    } else if (st.isFile() && full.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

describe('.assert-serif-budget — cumulative italic-DM-Serif DOM count over a full scroll', () => {
  it('the build directory exists (npm run build produced static HTML)', () => {
    const htmlFiles = walkHtmlFiles(BUILD_DIR);
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  it('every italic-serif class is listed in both the CSS tokens and the auditor', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/lib/styles/typography.css'),
      'utf8'
    );
    for (const cls of ITALIC_SERIF_CLASSES) {
      expect(
        css.includes(`.${cls}`),
        `typography.css must define .${cls}; the auditor's allowlist drifted.`
      ).toBe(true);
    }
  });

  it('the currently-expected total equals the sum of currently-built chapters', () => {
    const sum = expected.currentlyBuiltChapters.reduce(
      (acc, ch) => acc + expected.perChapter[ch],
      0
    );
    expect(expected.currentExpectedTotal).toBe(sum);
  });

  it('the site-wide italic-DM-Serif count matches the currently-expected total', () => {
    const htmlFiles = walkHtmlFiles(BUILD_DIR);
    let total = 0;
    const perFile: Array<{ file: string; count: number }> = [];
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      const count = countItalicSerifFromHtml(html);
      total += count;
      perFile.push({ file, count });
    }
    // Dump per-file counts on mismatch for diagnostics.
    expect(
      total,
      `Expected ${expected.currentExpectedTotal} italic-serif elements ` +
        `across ${htmlFiles.length} built HTML files; got ${total}.\n` +
        `Per-file counts:\n${perFile
          .map((f) => `  ${f.count}  ${f.file}`)
          .join('\n')}`
    ).toBe(expected.currentExpectedTotal);
  });

  it('totalBudget across the full scroll is 4 (DESIGN.md line 149)', () => {
    // This is the site-wide architectural invariant. It does not change;
    // the only thing that changes from step to step is how many chapters
    // contribute yet.
    expect(expected.totalBudget).toBe(4);
    const sumAllChapters = Object.values(expected.perChapter).reduce(
      (a, b) => a + b,
      0
    );
    expect(sumAllChapters).toBe(expected.totalBudget);
  });
});
