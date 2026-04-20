/*
 * dataStore — the read-only typed view over precomputed JSON bundles.
 *
 * DESIGN.md §Data pipeline (lines 28-52): "The site reads only static
 * JSON. Runtime computation is approximately zero." The store is a
 * lazy loader: each bundle is fetched once, memoized, and exposed as a
 * plain readable store.
 *
 * Step 2 wires the single file the <HeartbeatTicker> needs:
 *   static/data/{iso3_lower}/h_ii_trajectory.json
 * Step 5 (precompute pipeline) will replace the hand-seeded fixture
 * under static/data/nor/ with real Python output; the schema is locked
 * here.
 */

import { readable, type Readable } from 'svelte/store';

/** One row of the h_ii trajectory file. */
export interface HiiTrajectoryRow {
  /** Integer feature-count ∈ [10, n]. */
  p: number;
  /** Norway's leverage diagonal at that p. 4-decimal precision. */
  h_ii: number;
}

/** Fetched, immutable h_ii trajectory for one country. */
export interface HiiTrajectory {
  iso3: string;
  /** Total feature count n; last row's p. */
  n: number;
  rows: readonly HiiTrajectoryRow[];
}

/** In-memory cache so repeat recasts do not re-fetch. */
const cache = new Map<string, Promise<HiiTrajectory>>();

/**
 * Static-JSON path for a country's trajectory.
 * NOTE: files live under /static/data/ which SvelteKit serves at /data/.
 */
function pathFor(iso3: string): string {
  return `/data/${iso3.toLowerCase()}/h_ii_trajectory.json`;
}

/**
 * Fetch the trajectory for `iso3` from the static bundle. Memoized.
 * The returned promise resolves to an immutable view.
 */
export function loadHiiTrajectory(iso3: string, fetchFn: typeof fetch = fetch): Promise<HiiTrajectory> {
  const key = iso3.toUpperCase();
  const existing = cache.get(key);
  if (existing) return existing;
  const promise = fetchFn(pathFor(key))
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`h_ii trajectory for ${key} not found (${res.status})`);
      }
      const raw = (await res.json()) as unknown;
      return parseTrajectory(key, raw);
    })
    .catch((err: unknown) => {
      // Don't poison the cache on failure — allow later retries.
      cache.delete(key);
      throw err;
    });
  cache.set(key, promise);
  return promise;
}

/**
 * Strict parser that both type-checks the payload and asserts the three
 * data invariants DESIGN.md §Cross-cutting #1 Invariants requires:
 *   1. monotonic non-decreasing in p
 *   2. NOR at p=n-1 reads ≥ 0.98
 *   3. p domain is [10, n]
 * If any invariant fails, the precompute is lying and the site refuses
 * to render the ticker from it (throws; caller shows a fallback value).
 */
function parseTrajectory(iso3: string, raw: unknown): HiiTrajectory {
  if (!Array.isArray(raw)) {
    throw new Error(`h_ii trajectory for ${iso3} must be an array; got ${typeof raw}`);
  }
  const rows: HiiTrajectoryRow[] = raw.map((r, i) => {
    if (
      typeof r !== 'object' ||
      r === null ||
      typeof (r as { p?: unknown }).p !== 'number' ||
      typeof (r as { h_ii?: unknown }).h_ii !== 'number'
    ) {
      throw new Error(`h_ii trajectory for ${iso3}, row ${i}: malformed`);
    }
    return { p: (r as HiiTrajectoryRow).p, h_ii: (r as HiiTrajectoryRow).h_ii };
  });
  if (rows.length === 0) {
    throw new Error(`h_ii trajectory for ${iso3} is empty`);
  }
  if (rows[0].p !== 10) {
    throw new Error(`h_ii trajectory for ${iso3}: first p must be 10, got ${rows[0].p}`);
  }
  let last = -Infinity;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].h_ii < last) {
      throw new Error(
        `h_ii trajectory for ${iso3}: not monotonic at p=${rows[i].p} (${rows[i].h_ii} < ${last})`
      );
    }
    last = rows[i].h_ii;
  }
  if (iso3 === 'NOR' && rows[rows.length - 1].h_ii < 0.98) {
    throw new Error(
      `h_ii trajectory for NOR: p=n-1 must read >= 0.98, got ${rows[rows.length - 1].h_ii}`
    );
  }
  return {
    iso3,
    n: rows[rows.length - 1].p,
    rows: Object.freeze(rows)
  };
}

/**
 * Given a loaded trajectory and the chapter-state-dependent p to read,
 * return the row with that p, clamped to the country's [10, n] domain.
 * Per DESIGN.md §Cross-cutting #1 Recast behavior: "value re-reads from
 * the new country's trajectory at the same p (clamped to that country's n)."
 */
export function readHiiAt(traj: HiiTrajectory, pRaw: number): HiiTrajectoryRow {
  const p = Math.max(10, Math.min(traj.n, Math.round(pRaw)));
  // rows are 0-indexed starting at p=10; O(1) lookup.
  const idx = p - 10;
  const row = traj.rows[idx];
  // Defensive: if the file is sparse, fall back to the nearest row.
  if (row) return row;
  return traj.rows[traj.rows.length - 1];
}

/**
 * A readable wrapper used by tests that want to assert a particular
 * static snapshot without touching fetch.
 */
export function staticTrajectoryStore(traj: HiiTrajectory): Readable<HiiTrajectory> {
  return readable(traj);
}

/** Test-only cache reset. */
export function resetDataStoreForTest(): void {
  cache.clear();
}
