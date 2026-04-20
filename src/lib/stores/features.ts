/*
 * features.ts — typed loader for /static/data/features.json.
 *
 * DESIGN.md §Data pipeline, line 48:
 *   "features.json | {id, short_name, full_name, citation, default_role,
 *    absurdity_flag}[] (356 rows; 30 with default_role set; ~30 with
 *    absurdity_flag: true)"
 *
 * Step 3 (this step) uses three fields: id, short_name, default_role —
 * the <RoleColumn> mounts 356 <RoleCell> rows, one per feature, and the
 * `[authored]` state is picked up from default_role === 'authored'. CH1
 * (step 6) is the first consumer that also reads `absurdity_flag` and
 * `full_name`/`citation`.
 *
 * The invariants enforced at parse time mirror DESIGN.md §CC#3 line 270:
 *   "326 + 30 = 356 cells exactly. Verified at mount."
 *
 * A file that violates any invariant is not loaded — the store throws
 * rather than rendering a silently-wrong column.
 */

/** The single fixed set of roles a RoleCell can carry. */
export type Role = 'causal' | 'spurious' | 'incidental' | 'unlabeled' | 'authored';

export interface FeatureRow {
  /** Stable id used as Map key in the roles store. */
  readonly id: string;
  /** snake_case identifier the CSV columns read. */
  readonly short_name: string;
  /** Human phrase shown in hover tooltips (not rendered in step 3). */
  readonly full_name: string;
  /** Citation string for [authored] rows; null otherwise. */
  readonly citation: string | null;
  /**
   * 'authored' iff this feature's role is fixed (read-only, bracketed);
   * null for the 326 reader-editable features.
   */
  readonly default_role: 'authored' | null;
  /** Seeded by /precompute/absurd_seed.py. Read by CH1 autocomplete. */
  readonly absurdity_flag: boolean;
}

/** Immutable loaded-and-verified features bundle. */
export interface FeaturesBundle {
  readonly rows: readonly FeatureRow[];
  readonly total: number;
  readonly authoredCount: number;
  readonly absurdCount: number;
}

/** In-memory cache keyed on the source URL. */
const cache = new Map<string, Promise<FeaturesBundle>>();

const DEFAULT_URL = '/data/features.json';

export function loadFeatures(
  url: string = DEFAULT_URL,
  fetchFn: typeof fetch = fetch
): Promise<FeaturesBundle> {
  const existing = cache.get(url);
  if (existing) return existing;
  const promise = fetchFn(url)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`features.json not found (${res.status}) at ${url}`);
      }
      const raw = (await res.json()) as unknown;
      return parseFeatures(raw);
    })
    .catch((err: unknown) => {
      cache.delete(url);
      throw err;
    });
  cache.set(url, promise);
  return promise;
}

/**
 * Strict parser. Asserts the DESIGN.md invariants: 356 rows exactly; 30
 * `default_role === 'authored'`; the absurd count is also validated
 * (spec says ~30, we enforce >= 20 so a reviewer who cuts it a bit
 * under the ~30 target still passes — the ~ is the spec's hedge).
 */
export function parseFeatures(raw: unknown): FeaturesBundle {
  if (!Array.isArray(raw)) {
    throw new Error(`features.json must be an array; got ${typeof raw}`);
  }
  const rows: FeatureRow[] = raw.map((r, i) => parseRow(r, i));
  if (rows.length !== 356) {
    throw new Error(`features.json must have 356 rows (DESIGN.md §CC#3); got ${rows.length}`);
  }
  // 30 authored exactly.
  const authoredCount = rows.filter((r) => r.default_role === 'authored').length;
  if (authoredCount !== 30) {
    throw new Error(
      `features.json must have 30 default_role='authored' rows (DESIGN.md line 270); got ${authoredCount}`
    );
  }
  // ~30 absurd (>= 20 as a lower bound; ≤ 60 as an upper bound).
  const absurdCount = rows.filter((r) => r.absurdity_flag).length;
  if (absurdCount < 20 || absurdCount > 60) {
    throw new Error(
      `features.json must have ~30 absurd rows (DESIGN.md line 48); got ${absurdCount}`
    );
  }
  // Unique ids.
  const ids = new Set<string>();
  for (const r of rows) {
    if (ids.has(r.id)) throw new Error(`features.json: duplicate id ${r.id}`);
    ids.add(r.id);
  }
  return Object.freeze({
    rows: Object.freeze(rows),
    total: rows.length,
    authoredCount,
    absurdCount
  });
}

function parseRow(r: unknown, i: number): FeatureRow {
  if (typeof r !== 'object' || r === null) {
    throw new Error(`features.json row ${i}: not an object`);
  }
  const rec = r as Record<string, unknown>;
  if (typeof rec.id !== 'string' || rec.id.length === 0) {
    throw new Error(`features.json row ${i}: id must be a non-empty string`);
  }
  if (typeof rec.short_name !== 'string') {
    throw new Error(`features.json row ${i}: short_name must be a string`);
  }
  if (typeof rec.full_name !== 'string') {
    throw new Error(`features.json row ${i}: full_name must be a string`);
  }
  if (rec.citation !== null && typeof rec.citation !== 'string') {
    throw new Error(`features.json row ${i}: citation must be string|null`);
  }
  if (rec.default_role !== null && rec.default_role !== 'authored') {
    throw new Error(
      `features.json row ${i}: default_role must be null or 'authored'; got ${String(
        rec.default_role
      )}`
    );
  }
  if (typeof rec.absurdity_flag !== 'boolean') {
    throw new Error(`features.json row ${i}: absurdity_flag must be boolean`);
  }
  return {
    id: rec.id,
    short_name: rec.short_name,
    full_name: rec.full_name,
    citation: rec.citation as string | null,
    default_role: rec.default_role as 'authored' | null,
    absurdity_flag: rec.absurdity_flag
  };
}

/** Test-only cache reset. */
export function resetFeaturesStoreForTest(): void {
  cache.clear();
}
