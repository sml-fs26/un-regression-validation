/*
 * pi-decomposition.test.ts — Vitest suite for the step-4 fixtures,
 * the pi store parser, and the lint-rule binding that keeps the
 * stroke-only palette exception contained to PiCellLine2Underline.svelte.
 *
 * Covers:
 *   - The fixture shape matches DESIGN.md §Data pipeline line 41
 *     (alpha, point, ci, terms: {feature_id, weight, role_at_build}).
 *   - The cv-optimal step has exactly 5 terms (BRAINSTORM CH3 wow #1).
 *   - The cv-optimal step renders Line 1 as `[$78,400, $94,900]`
 *     (DESIGN.md state machine line 633).
 *   - The cv-optimal weights sum to ~1.0.
 *   - pi_shuffled's cv-optimal step is ≥ 78% red (BRAINSTORM CH3 wow #2).
 *   - `role_at_build: 'authored'` on exactly one cv-optimal term of
 *     pi_decomposition ("four red underlines. One green.").
 *   - The parser accepts every valid input and rejects invalid ones.
 *   - The <PiCellLine2Underline>.svelte source file is the only file
 *     outside tokens.css / role-palette.css that references a
 *     var(--role-*) value in a fill/color/border-color property
 *     (matching the Stylelint rule's allowlist).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  parsePiBundle,
  formatCiBracket,
  type PiBundle
} from '../src/lib/stores/pi.js';

const FIXTURE_REAL = resolve(
  process.cwd(),
  'static/data/nor/pi_decomposition.json'
);
const FIXTURE_SHUFFLED = resolve(
  process.cwd(),
  'static/data/nor/pi_shuffled.json'
);

function loadBundle(path: string): PiBundle {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return parsePiBundle(raw);
}

describe('pi bundle: fixture shape', () => {
  it('pi_decomposition.json is a valid PiBundle', () => {
    const b = loadBundle(FIXTURE_REAL);
    expect(b.iso3).toBe('NOR');
    expect(b.shuffled).toBe(false);
    expect(b.steps.length).toBeGreaterThanOrEqual(3);
    expect(b.steps[b.cv_optimal_index].is_cv_optimal).toBe(true);
  });

  it('pi_shuffled.json is a valid PiBundle', () => {
    const b = loadBundle(FIXTURE_SHUFFLED);
    expect(b.iso3).toBe('NOR');
    expect(b.shuffled).toBe(true);
    expect(b.steps[b.cv_optimal_index].is_cv_optimal).toBe(true);
  });

  it('cv-optimal step of the real bundle has exactly 5 terms (BRAINSTORM CH3 wow #1)', () => {
    const b = loadBundle(FIXTURE_REAL);
    const cv = b.steps[b.cv_optimal_index];
    expect(cv.terms.length).toBe(5);
  });

  it('cv-optimal terms of the real bundle sum to 1.0 weight', () => {
    const b = loadBundle(FIXTURE_REAL);
    const cv = b.steps[b.cv_optimal_index];
    const sum = cv.terms.reduce((acc, t) => acc + t.weight, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it('cv-optimal line 1 formats to [$78,400, $94,900] (DESIGN.md line 633)', () => {
    const b = loadBundle(FIXTURE_REAL);
    const cv = b.steps[b.cv_optimal_index];
    expect(formatCiBracket(cv.ci)).toBe('[$78,400, $94,900]');
  });

  it('real bundle: exactly ONE cv-optimal term has role_at_build="authored" (green) and four have "spurious" (red)', () => {
    const b = loadBundle(FIXTURE_REAL);
    const cv = b.steps[b.cv_optimal_index];
    const authored = cv.terms.filter((t) => t.role_at_build === 'authored');
    const spurious = cv.terms.filter((t) => t.role_at_build === 'spurious');
    expect(authored.length).toBe(1); // BRAINSTORM: "One green."
    expect(spurious.length).toBe(4); // BRAINSTORM: "Four red underlines."
  });

  it('shuffled bundle: cv-optimal ≥ 78% red (BRAINSTORM CH3 wow #2)', () => {
    const b = loadBundle(FIXTURE_SHUFFLED);
    const cv = b.steps[b.cv_optimal_index];
    const redShare = cv.terms
      .filter((t) => t.role_at_build === 'spurious')
      .reduce((acc, t) => acc + t.weight, 0);
    expect(redShare).toBeGreaterThanOrEqual(0.78);
  });

  it('every term carries the non-schema display field `abbrev`', () => {
    const b = loadBundle(FIXTURE_REAL);
    for (const step of b.steps) {
      for (const t of step.terms) {
        expect(t.abbrev.length).toBeGreaterThan(0);
        expect(t.abbrev.length).toBeLessThanOrEqual(6);
      }
    }
  });

  it('cv-optimal step label is literally "cv-optimal"', () => {
    const b = loadBundle(FIXTURE_REAL);
    const cv = b.steps[b.cv_optimal_index];
    expect(cv.step_label).toBe('cv-optimal');
  });

  it('extreme-max step has empty terms and null ci endpoints', () => {
    const b = loadBundle(FIXTURE_REAL);
    const last = b.steps[b.steps.length - 1];
    expect(last.terms.length).toBe(0);
    expect(last.ci[0]).toBeNull();
    expect(last.ci[1]).toBeNull();
    expect(formatCiBracket(last.ci)).toBe('');
  });
});

describe('pi bundle: parser rejects invalid input', () => {
  it('rejects a non-object top-level value', () => {
    expect(() => parsePiBundle([])).toThrow(/expected object/);
    expect(() => parsePiBundle(null)).toThrow(/expected object/);
    expect(() => parsePiBundle(42)).toThrow(/expected object/);
  });

  it('rejects a non-3-char iso3', () => {
    expect(() =>
      parsePiBundle({
        iso3: 'NO',
        shuffled: false,
        cv_optimal_index: 0,
        steps: []
      })
    ).toThrow(/iso3/);
  });

  it('rejects a cv_optimal_index that does not reference an is_cv_optimal step', () => {
    expect(() =>
      parsePiBundle({
        iso3: 'NOR',
        shuffled: false,
        cv_optimal_index: 0,
        steps: [
          {
            alpha: 0.1,
            step_label: 'x',
            is_cv_optimal: false,
            point: 1,
            ci: [1, 2],
            terms: []
          }
        ]
      })
    ).toThrow(/cv_optimal_index/);
  });

  it('rejects a term missing feature_id', () => {
    const malformed = {
      iso3: 'NOR',
      shuffled: false,
      cv_optimal_index: 0,
      steps: [
        {
          alpha: 0.1,
          step_label: 'cv-optimal',
          is_cv_optimal: true,
          point: 1,
          ci: [1, 2],
          terms: [{ weight: 1, abbrev: 'a', role_at_build: 'spurious' }]
        }
      ]
    };
    expect(() => parsePiBundle(malformed)).toThrow(/feature_id/);
  });

  it('rejects a term with an unknown role_at_build', () => {
    const malformed = {
      iso3: 'NOR',
      shuffled: false,
      cv_optimal_index: 0,
      steps: [
        {
          alpha: 0.1,
          step_label: 'cv-optimal',
          is_cv_optimal: true,
          point: 1,
          ci: [1, 2],
          terms: [
            { feature_id: 'x', weight: 1, abbrev: 'x', role_at_build: 'zz' }
          ]
        }
      ]
    };
    expect(() => parsePiBundle(malformed)).toThrow(/role_at_build/);
  });

  it('rejects a term with negative weight', () => {
    const malformed = {
      iso3: 'NOR',
      shuffled: false,
      cv_optimal_index: 0,
      steps: [
        {
          alpha: 0.1,
          step_label: 'cv-optimal',
          is_cv_optimal: true,
          point: 1,
          ci: [1, 2],
          terms: [
            {
              feature_id: 'x',
              weight: -0.1,
              abbrev: 'x',
              role_at_build: 'spurious'
            }
          ]
        }
      ]
    };
    expect(() => parsePiBundle(malformed)).toThrow(/weight/);
  });
});

describe('formatCiBracket', () => {
  it('returns the canonical `[$78,400, $94,900]` at cv-optimal', () => {
    expect(formatCiBracket([78400, 94900])).toBe('[$78,400, $94,900]');
  });
  it('returns empty string on null-null ci (α=∞)', () => {
    expect(formatCiBracket([null, null])).toBe('');
  });
  it('formats wide brackets at extreme-min', () => {
    expect(formatCiBracket([65200, 108100])).toBe('[$65,200, $108,100]');
  });
});

describe('pi bundle: feature_ids match features.json', () => {
  it('every cv-optimal feature_id has a matching row in features.json', () => {
    const features = JSON.parse(
      readFileSync(resolve(process.cwd(), 'static/data/features.json'), 'utf8')
    ) as Array<{ id: string }>;
    const known = new Set(features.map((f) => f.id));
    const b = loadBundle(FIXTURE_REAL);
    const cv = b.steps[b.cv_optimal_index];
    for (const t of cv.terms) {
      expect(known.has(t.feature_id), `feature_id ${t.feature_id} not in features.json`).toBe(true);
    }
  });
});

/**
 * Structural test for DESIGN.md §CC#5 line 295:
 *   "The Stylelint plugin role-color-stroke-only exempts only this
 *    file path [src/lib/components/ch3/PiCellLine2Underline.svelte]."
 *
 * The Stylelint rule already fires at lint time. This unit test is a
 * belt-and-braces check that NO other file under src/ references a
 * var(--role-*) in a fill/color/border-color declaration. It's cheap,
 * runs under Vitest, and would catch a careless future commit that
 * edits the Stylelint allowlist.
 */
describe('stroke-only palette: file-scope containment', () => {
  const ROLE_VAR_IN_FILL_RE =
    /(?:background|color|border(?:-\w+)?|fill)\s*:[^;]*var\(\s*--role-(?:causal|spurious|incidental|unlabeled)\s*[,)]/i;

  // Allowed files:
  const ALLOWED = [
    'src/lib/styles/tokens.css',
    'src/lib/styles/role-palette.css',
    'src/lib/components/ch3/PiCellLine2Underline.svelte'
  ];

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        out.push(...walk(full));
      } else if (/\.(css|svelte)$/.test(full)) {
        out.push(full);
      }
    }
    return out;
  }

  it('no file outside the DESIGN.md allowlist references var(--role-*) as a fill', () => {
    const files = walk(resolve(process.cwd(), 'src'));
    const offenders: string[] = [];
    for (const file of files) {
      if (ALLOWED.some((suffix) => file.replace(/\\/g, '/').endsWith(suffix))) continue;
      const body = readFileSync(file, 'utf8');
      if (ROLE_VAR_IN_FILL_RE.test(body)) {
        offenders.push(file);
      }
    }
    expect(
      offenders,
      `Files outside DESIGN.md §CC#5 allowlist reference --role-* as a fill:\n` +
        offenders.join('\n')
    ).toEqual([]);
  });

  it('PiCellLine2Underline.svelte IS the one permitted exception (contains the role-colored border)', () => {
    const body = readFileSync(
      resolve(
        process.cwd(),
        'src/lib/components/ch3/PiCellLine2Underline.svelte'
      ),
      'utf8'
    );
    // The file must actually contain the `var(--role-*)` token as a
    // border color reference — otherwise the exception is vestigial.
    expect(body).toMatch(/var\(--role-causal\)/);
    expect(body).toMatch(/var\(--role-spurious\)/);
    expect(body).toMatch(/var\(--role-incidental\)/);
  });
});
