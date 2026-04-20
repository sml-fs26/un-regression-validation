/*
 * pi.ts — typed loader for `nor/pi_decomposition.json` and
 * `nor/pi_shuffled.json`, used by <PiCell> / <PiCellComposition>
 * (Stage 2 step 4).
 *
 * DESIGN.md §Data pipeline, line 41:
 *   "nor/pi_decomposition.json |
 *    {alpha, point: float, ci: [float, float],
 *     terms: {feature_id, weight, role_at_build}[]}
 *    for each α step | ≤ 60 KB | CH3 PI cell"
 *
 * DESIGN.md §CH3 Data requirements lines 640-641:
 *   "- nor/pi_decomposition.json (PI cell line 1 + line 2 contributions per α step).
 *    - nor/pi_shuffled.json (shuffled-Y median PI decomposition, same schema)."
 *
 * The fixture at scripts/gen-pi-decomposition-fixture.mjs is step-4's
 * stand-in; step 5 (DESIGN.md §Stage 2 handoff line 933) replaces it
 * with real Python output. The schema accepts an additional `abbrev`
 * field per term, documented in the generator's header: the DESIGN.md
 * minimum is {feature_id, weight, role_at_build}; the display
 * abbreviation (`num`, `mcd`, `scr`, `bw`, `rule` at cv-optimal per
 * BRAINSTORM CH3 wow #1) is a presentational field the fixture carries
 * so the 7pt line-2 equation can be rendered without the component
 * inventing its own abbreviation policy.
 *
 * The parser is strict: any missing field throws so a stale fixture
 * is surfaced at mount time, not at first render in a later chapter.
 */

import type { Role } from './features';

/** A single term in the line-2 decomposition. */
export interface PiTerm {
  /** Matches a row id in features.json. Downstream subscribers look it up. */
  readonly feature_id: string;
  /** Fraction of the interval-narrowing attributable to this feature. */
  readonly weight: number;
  /**
   * 3-6 char display abbreviation used in the 7pt line-2 equation. Chosen
   * by the build pipeline (BRAINSTORM CH3 wow #1 lists `num / mcd / scr
   * / bw / rule` verbatim at cv-optimal α). Fixture field; step 5 may
   * refine.
   */
  readonly abbrev: string;
  /**
   * The role the Lasso build assigned to the feature. Different from the
   * reader's own `roleAssignments` — the reader's tag overrides this
   * for UI color. The stream uses it as a fallback when the reader
   * hasn't tagged the feature.
   */
  readonly role_at_build: Role;
}

/** One α step's PI-cell state. */
export interface PiStep {
  /** The Lasso regularisation strength at this step. */
  readonly alpha: number;
  /** `extreme-min` | `cv-optimal` | `extreme-max` at minimum; step 5 adds intermediate ids. */
  readonly step_label: string;
  /** True for exactly one step (cv_optimal_index). */
  readonly is_cv_optimal: boolean;
  /**
   * Point estimate for Norway's fitted value; null only at α=∞ (no
   * features kept → cell empty).
   */
  readonly point: number | null;
  /**
   * 95% prediction interval bracket: `[low, high]`. `[null, null]` at
   * α=∞ (empty cell); at α→0 the bracket may be wide (`[-∞, +∞]` in the
   * state machine; the fixture uses finite bounds for rendering).
   */
  readonly ci: readonly [number | null, number | null];
  /** Line-2 terms at this α, sorted by descending weight. */
  readonly terms: readonly PiTerm[];
}

/** The loaded + parsed bundle. */
export interface PiBundle {
  readonly iso3: string;
  readonly shuffled: boolean;
  /** Index into `steps` of the cv-optimal step. */
  readonly cv_optimal_index: number;
  readonly steps: readonly PiStep[];
}

const cache = new Map<string, Promise<PiBundle>>();

/**
 * Load a pi_decomposition.json or pi_shuffled.json file. Returns the
 * same Promise on repeated calls for the same URL (cached).
 */
export function loadPiBundle(
  url: string,
  fetchFn: typeof fetch = fetch
): Promise<PiBundle> {
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = fetchFn(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`pi bundle fetch failed (${res.status}) at ${url}`);
      }
      const raw = (await res.json()) as unknown;
      return parsePiBundle(raw);
    })
    .catch((err: unknown) => {
      cache.delete(url);
      throw err;
    });
  cache.set(url, promise);
  return promise;
}

export function parsePiBundle(raw: unknown): PiBundle {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('pi bundle: expected object at top level');
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.iso3 !== 'string' || r.iso3.length !== 3) {
    throw new Error('pi bundle: iso3 must be a 3-char string');
  }
  if (typeof r.shuffled !== 'boolean') {
    throw new Error('pi bundle: shuffled must be boolean');
  }
  if (typeof r.cv_optimal_index !== 'number' || !Number.isInteger(r.cv_optimal_index)) {
    throw new Error('pi bundle: cv_optimal_index must be an integer');
  }
  if (!Array.isArray(r.steps)) {
    throw new Error('pi bundle: steps must be an array');
  }
  const steps = r.steps.map((s, i) => parseStep(s, i));
  if (
    r.cv_optimal_index < 0 ||
    r.cv_optimal_index >= steps.length ||
    !steps[r.cv_optimal_index].is_cv_optimal
  ) {
    throw new Error(
      `pi bundle: cv_optimal_index ${r.cv_optimal_index} does not reference an is_cv_optimal step`
    );
  }
  return Object.freeze({
    iso3: r.iso3,
    shuffled: r.shuffled,
    cv_optimal_index: r.cv_optimal_index,
    steps: Object.freeze(steps)
  });
}

function parseStep(raw: unknown, i: number): PiStep {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`pi bundle step ${i}: not an object`);
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.alpha !== 'number') throw new Error(`pi bundle step ${i}: alpha must be number`);
  if (typeof r.step_label !== 'string') throw new Error(`step ${i}: step_label must be string`);
  if (typeof r.is_cv_optimal !== 'boolean') {
    throw new Error(`step ${i}: is_cv_optimal must be boolean`);
  }
  if (r.point !== null && typeof r.point !== 'number') {
    throw new Error(`step ${i}: point must be number|null`);
  }
  if (!Array.isArray(r.ci) || r.ci.length !== 2) {
    throw new Error(`step ${i}: ci must be a 2-tuple`);
  }
  const ci = r.ci.map((v) => {
    if (v !== null && typeof v !== 'number') {
      throw new Error(`step ${i}: ci entry must be number|null`);
    }
    return v as number | null;
  }) as unknown as readonly [number | null, number | null];
  if (!Array.isArray(r.terms)) throw new Error(`step ${i}: terms must be an array`);
  const terms = r.terms.map((t, j) => parseTerm(t, i, j));
  return Object.freeze({
    alpha: r.alpha,
    step_label: r.step_label,
    is_cv_optimal: r.is_cv_optimal,
    point: r.point as number | null,
    ci,
    terms: Object.freeze(terms)
  });
}

function parseTerm(raw: unknown, i: number, j: number): PiTerm {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`pi bundle step ${i} term ${j}: not an object`);
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.feature_id !== 'string' || r.feature_id.length === 0) {
    throw new Error(`step ${i} term ${j}: feature_id must be non-empty string`);
  }
  if (typeof r.weight !== 'number' || r.weight < 0) {
    throw new Error(`step ${i} term ${j}: weight must be non-negative number`);
  }
  if (typeof r.abbrev !== 'string' || r.abbrev.length === 0) {
    throw new Error(`step ${i} term ${j}: abbrev must be non-empty string`);
  }
  const role = r.role_at_build;
  if (
    role !== 'causal' &&
    role !== 'spurious' &&
    role !== 'incidental' &&
    role !== 'authored' &&
    role !== 'unlabeled'
  ) {
    throw new Error(
      `step ${i} term ${j}: role_at_build must be a Role token; got ${String(role)}`
    );
  }
  return Object.freeze({
    feature_id: r.feature_id,
    weight: r.weight,
    abbrev: r.abbrev,
    role_at_build: role
  });
}

/**
 * Format a CI bracket as the display string line 1 of the PI cell:
 *   `[$78,400, $94,900]` (DESIGN.md line 633)
 * Empty state (α=∞): returns the literal empty string so line 1 is
 * blank without occupying space.
 */
export function formatCiBracket(ci: readonly [number | null, number | null]): string {
  const [lo, hi] = ci;
  if (lo === null || hi === null) return '';
  return `[${formatDollars(lo)}, ${formatDollars(hi)}]`;
}

function formatDollars(n: number): string {
  const rounded = Math.round(n);
  const withCommas = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${rounded < 0 ? '-' : ''}$${withCommas}`;
}

/** Test-only reset. */
export function resetPiStoreForTest(): void {
  cache.clear();
}
