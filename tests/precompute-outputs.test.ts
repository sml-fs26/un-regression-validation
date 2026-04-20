/*
 * precompute-outputs.test.ts — Vitest-side cross-check that the Python
 * pipeline's JSON outputs in /static/data/ conform to the schemas the
 * site's TypeScript data stores require.
 *
 * Stage 2 step 5 ships /precompute/ — a Python pipeline — and
 * /precompute/verify.py runs every empirical-claim assertion in
 * Python. This test does the JS-side complement: it loads each
 * pipeline-produced JSON through the actual runtime parsers in
 * src/lib/stores/ and asserts the parsers do not throw. If a future
 * pipeline edit introduces a schema drift, this test catches it at
 * `npm run test`, not at a downstream Playwright snapshot.
 *
 * DESIGN.md §Stage 2 handoff line 933:
 *   "Precompute pipeline (/precompute/) producing every nor/*.json
 *    file plus audition.json and features.json."
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  loadHiiTrajectory,
  readHiiAt,
  resetDataStoreForTest
} from '../src/lib/stores/data';
import { parsePiBundle, resetPiStoreForTest } from '../src/lib/stores/pi';

const REPO_ROOT = resolve(process.cwd());
const STATIC_DATA = resolve(REPO_ROOT, 'static', 'data');

function readJson(relPath: string): unknown {
  const path = resolve(STATIC_DATA, relPath);
  if (!existsSync(path)) {
    throw new Error(`missing /static/data/${relPath}; run 'make -C precompute build'`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function fetchFromDisk(): typeof fetch {
  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const m = /^\/data\/(.+)$/.exec(url);
    if (!m) return new Response('not found', { status: 404 });
    const path = resolve(STATIC_DATA, m[1]);
    if (!existsSync(path)) return new Response('not found', { status: 404 });
    return new Response(readFileSync(path, 'utf8'), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;
}

describe('precompute outputs — schema / parser cross-check', () => {
  it('features.json has 356 rows, 30 authored, 30 absurd (DESIGN §Data pipeline line 48)', () => {
    const rows = readJson('features.json') as Array<{
      id: string;
      short_name: string;
      default_role: string | null;
      absurdity_flag: boolean;
    }>;
    expect(rows).toHaveLength(356);
    const authored = rows.filter((r) => r.default_role === 'authored');
    expect(authored).toHaveLength(30);
    const absurd = rows.filter((r) => r.absurdity_flag === true);
    expect(absurd).toHaveLength(30);
    // Authored and absurd are disjoint.
    const authoredIds = new Set(authored.map((r) => r.id));
    for (const a of absurd) expect(authoredIds.has(a.id)).toBe(false);
    // Every id is unique.
    expect(new Set(rows.map((r) => r.id)).size).toBe(356);
  });

  it('audition.json has 254 rows, NOR is the winner (DESIGN §CC#4 line 284)', () => {
    const rows = readJson('audition.json') as Array<{
      iso3: string;
      h_ii_starkness: number;
    }>;
    expect(rows).toHaveLength(254);
    expect(rows[0].iso3).toBe('NOR');
    // Descending-sort invariant.
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].h_ii_starkness).toBeLessThanOrEqual(rows[i - 1].h_ii_starkness);
    }
  });

  it('NOR h_ii_trajectory parses through src/lib/stores/data.ts (DESIGN §CC#1)', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('NOR', fetchFromDisk());
    expect(traj.iso3).toBe('NOR');
    expect(traj.rows[0].p).toBe(10);
    expect(traj.rows[0].h_ii).toBeCloseTo(0.04, 2);
    expect(traj.rows[traj.rows.length - 1].h_ii).toBeGreaterThanOrEqual(0.98);
    // Monotonic non-decreasing.
    for (let i = 1; i < traj.rows.length; i++) {
      expect(traj.rows[i].h_ii).toBeGreaterThanOrEqual(traj.rows[i - 1].h_ii);
    }
    // readHiiAt clamps.
    expect(readHiiAt(traj, 0).p).toBe(10);
    expect(readHiiAt(traj, 9999).p).toBe(traj.n);
  });

  it('URY recast fixture parses + has last h_ii < 0.98', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('URY', fetchFromDisk());
    expect(traj.rows[0].p).toBe(10);
    expect(traj.rows[traj.rows.length - 1].h_ii).toBeLessThan(0.98);
  });

  it('pi_decomposition.json parses + cv-optimal has 5 terms + committed weights (DESIGN §CH3 line 633)', () => {
    resetPiStoreForTest();
    const raw = readJson('nor/pi_decomposition.json');
    const bundle = parsePiBundle(raw);
    expect(bundle.iso3).toBe('NOR');
    expect(bundle.shuffled).toBe(false);
    const cv = bundle.steps[bundle.cv_optimal_index];
    expect(cv.is_cv_optimal).toBe(true);
    expect(cv.terms).toHaveLength(5);
    expect(cv.ci).toEqual([78400, 94900]);
    const sum = cv.terms.reduce((a, t) => a + t.weight, 0);
    expect(sum).toBeCloseTo(1.0, 3);
    const red = cv.terms.filter((t) => t.role_at_build === 'spurious').reduce((a, t) => a + t.weight, 0);
    expect(red).toBeGreaterThanOrEqual(0.92 - 1e-6);
    // Weights in committed order.
    expect(cv.terms.map((t) => t.weight)).toEqual([0.34, 0.28, 0.19, 0.11, 0.08]);
    // Abbrevs in committed order (BRAINSTORM CH3 wow #1: num mcd scr bw rule).
    expect(cv.terms.map((t) => t.abbrev)).toEqual(['num', 'mcd', 'scr', 'bw', 'rule']);
  });

  it('pi_shuffled.json parses + has ≥ 78% red at cv-optimal (DESIGN §CH3 #4)', () => {
    resetPiStoreForTest();
    const raw = readJson('nor/pi_shuffled.json');
    const bundle = parsePiBundle(raw);
    expect(bundle.shuffled).toBe(true);
    const cv = bundle.steps[bundle.cv_optimal_index];
    const red = cv.terms.filter((t) => t.role_at_build === 'spurious').reduce((a, t) => a + t.weight, 0);
    expect(red).toBeGreaterThanOrEqual(0.78 - 1e-6);
  });

  it('beta_path.json covers CH2 buckle (p∈[10, ≥200], β length = p) (DESIGN line 38)', () => {
    const rows = readJson('nor/beta_path.json') as Array<{ p: number; beta: number[] }>;
    expect(rows[0].p).toBe(10);
    const last = rows[rows.length - 1];
    expect(last.p).toBeGreaterThanOrEqual(200);
    for (const r of rows) {
      expect(r.beta).toHaveLength(r.p);
    }
  });

  it('diagnostic_path.json: log λ_min goes strongly negative at p=n-1 (DESIGN §CH2 #4)', () => {
    const rows = readJson('nor/diagnostic_path.json') as Array<{
      p: number;
      log_lambda_min: number;
      test_r2: number;
      scrollbar_progress: number;
    }>;
    expect(rows[0].p).toBe(10);
    expect(rows[rows.length - 1].log_lambda_min).toBeLessThanOrEqual(-5);
    for (const r of rows) {
      expect(r.scrollbar_progress).toBeGreaterThanOrEqual(0);
      expect(r.scrollbar_progress).toBeLessThanOrEqual(1);
    }
  });

  it('lasso_alpha_path.json: 32 α steps (DESIGN line 639)', () => {
    const rows = readJson('nor/lasso_alpha_path.json') as Array<{
      alpha: number;
      kept_features: number[];
      beta: number[];
    }>;
    expect(rows).toHaveLength(32);
    // Alphas ascending.
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].alpha).toBeGreaterThanOrEqual(rows[i - 1].alpha);
    }
  });

  it('objection_queue.json: ≤ 9 entries, final carries refused flag (DESIGN §CH4 #5)', () => {
    const q = readJson('nor/objection_queue.json') as Array<{
      step: number;
      struck_features: string[];
      replacement_feature: string | null;
      refused: boolean;
    }>;
    expect(q.length).toBeGreaterThanOrEqual(1);
    expect(q.length).toBeLessThanOrEqual(9);
    for (let i = 0; i < q.length; i++) expect(q[i].step).toBe(i);
    expect(typeof q[q.length - 1].refused).toBe('boolean');
  });

  it('rf_top20.json: exactly 20 features, sorted descending by importance (DESIGN line 44)', () => {
    const rows = readJson('nor/rf_top20.json') as Array<{
      feature_id: string;
      importance: number;
      pdp_shape: number[];
    }>;
    expect(rows).toHaveLength(20);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].importance).toBeLessThanOrEqual(rows[i - 1].importance);
    }
    for (const r of rows) expect(r.pdp_shape).toHaveLength(6);
  });

  it('dissolution_cloud.json: exactly 200 pairs + ridgeline samples (DESIGN §CH5 #2)', () => {
    const payload = readJson('nor/dissolution_cloud.json') as {
      pairs: Array<{ predicted_gdp: number; h_ii: number }>;
      realized_percentile: number;
      ridgeline_samples: { single_split: number[]; nested_cv: number[] };
    };
    expect(payload.pairs).toHaveLength(200);
    expect(payload.ridgeline_samples.single_split).toHaveLength(200);
    expect(payload.ridgeline_samples.nested_cv).toHaveLength(200);
    expect(payload.realized_percentile).toBeGreaterThanOrEqual(0);
    expect(payload.realized_percentile).toBeLessThanOrEqual(100);
  });

  it('bootstrap_ci.json: every row has {feature_id, beta, ci, stability} (DESIGN line 46)', () => {
    const rows = readJson('nor/bootstrap_ci.json') as Array<{
      feature_id: string;
      beta: number;
      ci: [number, number];
      stability: number;
    }>;
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.feature_id).toBeTypeOf('string');
      expect(r.ci).toHaveLength(2);
      expect(r.stability).toBeGreaterThanOrEqual(0);
      expect(r.stability).toBeLessThanOrEqual(1);
    }
  });

  it('ecdf_null.json: 356 abs_r values, ascending, fits_inside_null is int in [1, 355] (DESIGN line 47)', () => {
    const p = readJson('nor/ecdf_null.json') as {
      abs_r: number[];
      fits_inside_null: number;
      null_band_95: number;
      n_features: number;
    };
    expect(p.abs_r).toHaveLength(356);
    expect(p.n_features).toBe(356);
    for (let i = 1; i < p.abs_r.length; i++) {
      expect(p.abs_r[i]).toBeGreaterThanOrEqual(p.abs_r[i - 1]);
    }
    expect(Number.isInteger(p.fits_inside_null)).toBe(true);
    expect(p.fits_inside_null).toBeGreaterThanOrEqual(1);
    expect(p.fits_inside_null).toBeLessThan(356);
    expect(p.null_band_95).toBeGreaterThan(0);
    expect(p.null_band_95).toBeLessThan(1);
  });
});
