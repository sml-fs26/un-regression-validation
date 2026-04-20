#!/usr/bin/env node
/*
 * gen-heartbeat-fixture.mjs — generates the hand-seeded h_ii trajectory
 * fixture used by the <HeartbeatTicker> Storybook stories and
 * Playwright snapshots in Stage 2 step 2.
 *
 * Stage 2 step 5 (precompute pipeline) REPLACES these files with real
 * Python output from /precompute/pipeline.py. The schema, invariants,
 * and acceptance criteria are the same; only the source changes.
 *
 * DESIGN.md §Data pipeline, line 37:
 *   "nor/h_ii_trajectory.json | {p: int, h_ii: float}[] for p ∈ [10, n]
 *    | ≤ 6 KB | Heartbeat ticker, CH2"
 *
 * Invariants the generated fixture respects (DESIGN.md §Cross-cutting #1):
 *   - monotonic non-decreasing in p
 *   - first row p=10 (BRAINSTORM CH1 wow #1 says the ticker first paints at
 *     h_ii ≈ 0.04; we place that at p=10)
 *   - for NOR: last row p=n-1 with h_ii ≥ 0.98
 *
 * The fixture's n matches BRAINSTORM CH2 wow #2 ("n = 213 for NOR").
 *
 * Usage:
 *   node scripts/gen-heartbeat-fixture.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Build a monotonic sequence from 0.04 (p=10) to endHii (p=n-1) that
 * passes through 0.95 a handful of steps before the end (so the CH2
 * gold-pulse trigger has steps to fire on).
 *
 * Shape: a monotonic bezier-ish curve implemented by power easing on
 * normalized p. Tuned so the derivative is larger near the right edge
 * (the "heartbeat accelerating as features are added" effect the
 * ticker visually telegraphs).
 */
function buildTrajectory(n, startHii, endHii, exponent = 2.2) {
  const rows = [];
  const pStart = 10;
  const pEnd = n - 1;
  for (let p = pStart; p <= pEnd; p++) {
    const t = (p - pStart) / (pEnd - pStart); // 0..1
    // Power easing; monotonic on [0,1].
    const eased = Math.pow(t, exponent);
    const h = startHii + (endHii - startHii) * eased;
    rows.push({ p, h_ii: Number(h.toFixed(4)) });
  }
  // Clamp any rounding artifacts so strict monotonicity holds.
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].h_ii < rows[i - 1].h_ii) {
      rows[i] = { p: rows[i].p, h_ii: rows[i - 1].h_ii };
    }
  }
  return rows;
}

function writeFixture(countryPath, rows) {
  mkdirSync(dirname(countryPath), { recursive: true });
  writeFileSync(countryPath, JSON.stringify(rows) + '\n');
  console.log(
    `wrote ${rows.length} rows to ${countryPath} (first ${rows[0].h_ii}, last ${rows[rows.length - 1].h_ii})`
  );
}

// NOR: n=213 per BRAINSTORM CH2 wow #2; endpoint at p=n-1=212 reads 0.9812.
const norRows = buildTrajectory(213, 0.04, 0.9812, 2.2);
writeFixture(resolve(ROOT, 'static/data/nor/h_ii_trajectory.json'), norRows);

// URY: n=189 (hand-picked for the recast story — not the real value);
// endpoint 0.73 so the recast demo shows a country whose leverage
// does NOT reach NOR's extremity.
const uryRows = buildTrajectory(189, 0.035, 0.73, 1.9);
writeFixture(resolve(ROOT, 'static/data/ury/h_ii_trajectory.json'), uryRows);

// Sanity-check invariants the runtime parser enforces (defense-in-depth).
function assertInvariants(rows, iso3, minEnd) {
  if (rows[0].p !== 10) throw new Error(`${iso3}: first p !== 10`);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].h_ii < rows[i - 1].h_ii) {
      throw new Error(`${iso3}: not monotonic at p=${rows[i].p}`);
    }
  }
  if (minEnd !== null && rows[rows.length - 1].h_ii < minEnd) {
    throw new Error(`${iso3}: last h_ii ${rows[rows.length - 1].h_ii} < ${minEnd}`);
  }
}
assertInvariants(norRows, 'NOR', 0.98);
assertInvariants(uryRows, 'URY', null);

console.log('gen-heartbeat-fixture: invariants hold.');
