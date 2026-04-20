/*
 * roles-store.test.ts — unit tests for the rolesStore (Stage 2 step 3).
 *
 * DESIGN.md §Cross-cutting signature #3 Invariants (lines 269-272):
 *   1. 326 + 30 = 356 cells exactly. Verified at mount.
 *   2. `[authored]` cells cannot be overwritten by user tags.
 *   3. No undo, no remove. Once tagged, the cell carries that role for
 *      the session (DA #9).
 *
 * DESIGN.md §CC#3 acceptance (lines 273-278):
 *   1. Tagging a cell as `spurious` updates every chart's role-stroke
 *      for that feature within 300ms (DA #3, covered by the sibling
 *      tests/role-subscription-latency.test.ts).
 *   2. Counter updates synchronously on every commit.
 *   4. Reload erases all tags (no localStorage; sessionStorage only).
 *   5. Editable cells respond to 1/2/3; [authored] cells do not.
 *
 * DESIGN.md DA #9 (line 916):
 *   "No localStorage, no IndexedDB, no cookies. No 'undo' button
 *    anywhere. The <RoleColumn> store has no revoke() method."
 *
 * The ESLint rule `no-storage-persistence` catches code-level attempts
 * to use forbidden storage. This file is its run-time complement:
 * confirms the rolesStore API surface has no undo / revoke / remove
 * export, and that the module's code text contains no forbidden
 * storage references.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { get } from 'svelte/store';
import {
  rolesStore,
  userLabeledCount,
  initFromFeatures,
  tag,
  getRole,
  resetRolesStoreForTest,
  _unsafeSetForTest
} from '../src/lib/stores/roles';
import type { FeatureRow } from '../src/lib/stores/features';

const REPO_ROOT = resolve(process.cwd());

/** Build a synthetic 356-row features bundle for tests. */
function synthetic(overrides?: { authored?: number; absurd?: number }): FeatureRow[] {
  const authoredN = overrides?.authored ?? 30;
  const rows: FeatureRow[] = [];
  for (let i = 0; i < authoredN; i++) {
    rows.push({
      id: `authored_${String(i).padStart(2, '0')}`,
      short_name: `authored_feat_${i}`,
      full_name: `Authored ${i}`,
      citation: `Citation for authored ${i}`,
      default_role: 'authored',
      absurdity_flag: false
    });
  }
  for (let i = 0; i < 356 - authoredN; i++) {
    rows.push({
      id: `feat_${String(i).padStart(3, '0')}`,
      short_name: `feat_${i}`,
      full_name: `Feature ${i}`,
      citation: null,
      default_role: null,
      absurdity_flag: false
    });
  }
  return rows;
}

beforeEach(() => {
  resetRolesStoreForTest();
});

describe('rolesStore — invariant #1 (DESIGN.md line 270): 356 cells exactly', () => {
  it('accepts a 356-row bundle', () => {
    expect(() => initFromFeatures(synthetic())).not.toThrow();
    expect(get(rolesStore).allIds).toHaveLength(356);
  });

  it('rejects a 355-row bundle (too small)', () => {
    const bad = synthetic().slice(0, 355);
    expect(() => initFromFeatures(bad)).toThrow(/expected 356 rows/);
  });

  it('rejects a 357-row bundle (too large)', () => {
    const bad = [...synthetic(), synthetic()[0]];
    expect(() => initFromFeatures(bad)).toThrow(/expected 356 rows/);
  });

  it('rejects a bundle with != 30 authored rows', () => {
    const bad = synthetic({ authored: 29 });
    expect(() => initFromFeatures(bad)).toThrow(/expected 30 authored rows/);
  });
});

describe('rolesStore — invariant #2 (DESIGN.md line 271): [authored] cells read-only', () => {
  beforeEach(() => initFromFeatures(synthetic()));

  it('tag() on an authored id throws with a DESIGN.md citation', () => {
    expect(() => tag('authored_00', 'spurious')).toThrow(
      /is \[authored\] and cannot be overwritten/
    );
  });

  it('getRole() for an authored id returns "authored" regardless of subsequent attempts', () => {
    const state = get(rolesStore);
    expect(getRole(state, 'authored_00')).toBe('authored');
  });

  it('editable ids can be tagged repeatedly (re-tagging permitted per CH4 line 720)', () => {
    tag('feat_000', 'causal');
    let s = get(rolesStore);
    expect(getRole(s, 'feat_000')).toBe('causal');
    tag('feat_000', 'spurious');
    s = get(rolesStore);
    expect(getRole(s, 'feat_000')).toBe('spurious');
    tag('feat_000', 'incidental');
    s = get(rolesStore);
    expect(getRole(s, 'feat_000')).toBe('incidental');
  });
});

describe('rolesStore — invariant #3 (DA #9, line 916): no undo / no remove', () => {
  beforeEach(() => initFromFeatures(synthetic()));

  it('tag() rejects "unlabeled" as a user write (undo would break DA #9)', () => {
    expect(() => tag('feat_000', 'unlabeled')).toThrow(
      /user-writable role must be causal\|spurious\|incidental/
    );
  });

  it('tag() rejects "authored" as a user write', () => {
    expect(() => tag('feat_000', 'authored')).toThrow(
      /user-writable role must be causal\|spurious\|incidental/
    );
  });

  it('rolesStore module exports do not include revoke / undo / remove', async () => {
    const mod = await import('../src/lib/stores/roles');
    // The export surface is the contract: a future maintainer who adds
    // `revoke` would have to update this test, which is the point.
    const exports = Object.keys(mod).sort();
    expect(exports).not.toContain('revoke');
    expect(exports).not.toContain('undo');
    expect(exports).not.toContain('remove');
    expect(exports).not.toContain('unassign');
  });

  it('rolesStore source file contains no executable localStorage / indexedDB / document.cookie reference', () => {
    const src = readFileSync(
      resolve(REPO_ROOT, 'src/lib/stores/roles.ts'),
      'utf8'
    );
    // Strip block + line comments so the citation text in the file header
    // ("No localStorage, no IndexedDB, no cookies...") does not false-
    // positive. The ESLint rule `no-storage-persistence` is the
    // authoritative AST-level check; this regex is a cheap belt-and-
    // braces scan of the remaining code text.
    const stripped = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    expect(stripped).not.toMatch(/\blocalStorage\b/);
    expect(stripped).not.toMatch(/\bindexedDB\b/);
    expect(stripped).not.toMatch(/document\.cookie/);
  });
});

describe('rolesStore — acceptance #2 (DESIGN.md line 275): counter synchronous on commit', () => {
  beforeEach(() => initFromFeatures(synthetic()));

  it('userLabeledCount reads 0 at init (authored are not counted)', () => {
    expect(get(userLabeledCount)).toBe(0);
  });

  it('userLabeledCount advances synchronously after each tag()', () => {
    tag('feat_000', 'causal');
    expect(get(userLabeledCount)).toBe(1);
    tag('feat_001', 'spurious');
    expect(get(userLabeledCount)).toBe(2);
    tag('feat_002', 'incidental');
    expect(get(userLabeledCount)).toBe(3);
  });

  it('userLabeledCount does not count the 30 pre-populated authored rows', () => {
    // authored_00..29 are all in the map as `authored` at init time,
    // but the derived counter explicitly excludes them (DESIGN.md line
    // 263: "labeled_by_you: {N} / 356" — phrasing is reader-only).
    const state = get(rolesStore);
    expect(state.assignments.size).toBeGreaterThanOrEqual(30);
    expect(get(userLabeledCount)).toBe(0);
  });

  it('re-tagging the same cell does not inflate the counter', () => {
    tag('feat_000', 'causal');
    expect(get(userLabeledCount)).toBe(1);
    tag('feat_000', 'spurious');
    expect(get(userLabeledCount)).toBe(1);
    tag('feat_000', 'incidental');
    expect(get(userLabeledCount)).toBe(1);
  });
});

describe('rolesStore — tag() unknown id is rejected', () => {
  beforeEach(() => initFromFeatures(synthetic()));

  it('tag("not_a_real_id", "causal") throws with the DESIGN.md-anchored message', () => {
    expect(() => tag('not_a_real_id', 'causal')).toThrow(/is not in the loaded 356-row set/);
  });
});

describe('rolesStore — getRole default path (acceptance: DESIGN.md line 266)', () => {
  beforeEach(() => initFromFeatures(synthetic()));

  it('returns "unlabeled" for untagged editable ids', () => {
    const s = get(rolesStore);
    expect(getRole(s, 'feat_000')).toBe('unlabeled');
  });

  it('returns "authored" for authored ids without consulting assignments', () => {
    // Even if something bizarre has been injected, authored wins.
    _unsafeSetForTest('authored_00', 'causal');
    const s = get(rolesStore);
    expect(getRole(s, 'authored_00')).toBe('authored');
  });
});
