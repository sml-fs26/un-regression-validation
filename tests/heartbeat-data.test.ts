/*
 * heartbeat-data.test.ts — unit tests for the h_ii trajectory loader.
 *
 * DESIGN.md §Cross-cutting signature #1 Invariants:
 *   1. During a CH2 scrub, the displayed value is monotonic non-decreasing
 *      as p increases.
 *   2. At p=n-1 for NOR, value reads >= 0.98.
 *
 * These invariants live in src/lib/stores/data.ts as a parser that
 * throws on violation. These tests exercise both sides: real fixture
 * loads correctly, contrived violations throw.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  loadHiiTrajectory,
  readHiiAt,
  resetDataStoreForTest,
  type HiiTrajectoryRow
} from '../src/lib/stores/data';

const REPO_ROOT = resolve(process.cwd());

// Build a fake fetch that reads from /static/data/ on disk. The data
// store calls fetch('/data/<iso3>/h_ii_trajectory.json').
function makeFetch(): typeof fetch {
  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const m = /^\/data\/([a-z]+)\/h_ii_trajectory\.json$/.exec(url);
    if (!m) {
      return new Response('not found', { status: 404 });
    }
    const iso3 = m[1];
    const path = resolve(REPO_ROOT, 'static', 'data', iso3, 'h_ii_trajectory.json');
    try {
      const body = readFileSync(path, 'utf8');
      return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
    } catch {
      return new Response('not found', { status: 404 });
    }
  }) as typeof fetch;
}

describe('loadHiiTrajectory — NOR fixture', () => {
  it('loads and validates the NOR trajectory', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('NOR', makeFetch());
    expect(traj.iso3).toBe('NOR');
    expect(traj.n).toBe(212); // rows are [10..212]; 203 rows
    expect(traj.rows.length).toBe(203);
  });

  it('trajectory is monotonic non-decreasing', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('NOR', makeFetch());
    let last = -Infinity;
    for (const r of traj.rows) {
      expect(r.h_ii).toBeGreaterThanOrEqual(last);
      last = r.h_ii;
    }
  });

  it('at p=n-1 for NOR the value reads >= 0.98', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('NOR', makeFetch());
    const last = traj.rows[traj.rows.length - 1];
    expect(last.h_ii).toBeGreaterThanOrEqual(0.98);
  });

  it('first row p=10 (DESIGN.md: trajectory domain [10, n])', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('NOR', makeFetch());
    expect(traj.rows[0].p).toBe(10);
  });

  it('readHiiAt clamps p to [10, n] per recast-behavior contract', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('NOR', makeFetch());
    expect(readHiiAt(traj, 0).p).toBe(10);
    expect(readHiiAt(traj, 9999).p).toBe(traj.n);
    expect(readHiiAt(traj, 50).p).toBe(50);
  });
});

describe('loadHiiTrajectory — URY recast fixture', () => {
  it('loads and validates the URY trajectory', async () => {
    resetDataStoreForTest();
    const traj = await loadHiiTrajectory('URY', makeFetch());
    expect(traj.iso3).toBe('URY');
    expect(traj.rows[0].p).toBe(10);
    // URY fixture's last row < 0.98 by design (smaller country; not
    // every country reaches NOR's extremity).
    expect(traj.rows[traj.rows.length - 1].h_ii).toBeLessThan(0.98);
  });
});

describe('parser rejects malformed payloads', () => {
  function fetchReturning(payload: unknown): typeof fetch {
    return (async (): Promise<Response> =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })) as typeof fetch;
  }

  it('throws on non-array payload', async () => {
    resetDataStoreForTest();
    await expect(loadHiiTrajectory('ZZZ', fetchReturning({ bogus: true }))).rejects.toThrow();
  });

  it('throws when first row p != 10', async () => {
    resetDataStoreForTest();
    const rows: HiiTrajectoryRow[] = [
      { p: 11, h_ii: 0.04 },
      { p: 12, h_ii: 0.05 }
    ];
    await expect(loadHiiTrajectory('ZZZ', fetchReturning(rows))).rejects.toThrow(/first p/);
  });

  it('throws when monotonicity fails', async () => {
    resetDataStoreForTest();
    const rows: HiiTrajectoryRow[] = [
      { p: 10, h_ii: 0.5 },
      { p: 11, h_ii: 0.3 }
    ];
    await expect(loadHiiTrajectory('ZZZ', fetchReturning(rows))).rejects.toThrow(/monotonic/);
  });

  it('throws when NOR p=n-1 < 0.98', async () => {
    resetDataStoreForTest();
    const rows: HiiTrajectoryRow[] = [
      { p: 10, h_ii: 0.04 },
      { p: 11, h_ii: 0.5 }
    ];
    await expect(loadHiiTrajectory('NOR', fetchReturning(rows))).rejects.toThrow(/>= 0\.98/);
  });
});
