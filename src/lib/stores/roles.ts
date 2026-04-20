/*
 * roles.ts — the reader's role assignments. Cross-cutting signature #3.
 *
 * DESIGN.md §Cross-cutting signature #3 (lines 259-278) specifies the
 * shape as `sessionStore.roleAssignments: Map<feature_id, Role>`. We
 * implement it as a dedicated writable store (this module) so every
 * subscriber — <PiCellLine2Underline>, <Ch3StrikethroughLayer>,
 * <Ch3AgreementCounter>, <Ch4BetaLine>, <Ch4JoinedTable>,
 * <Ch5BracketedConfession>, <Ch5Scorecard>, <RoleLabeledCounter>, and
 * every chart element with `[data-feature-id]` — can subscribe with
 * <300ms latency per DA #3 (line 910). Keeping it out of the wider
 * sessionStore avoids re-rendering chrome (the heartbeat ticker, the
 * audition gutter) on every tag commit.
 *
 * The store's API is intentionally narrow to encode DESIGN.md §CC#3
 * Invariants (lines 270-272):
 *   1. Exactly 356 cells exist (326 editable + 30 [authored]).
 *   2. [authored] cells cannot be overwritten by user tags.
 *   3. No undo, no remove. Once tagged, the cell carries that role for
 *      the session (DA #9, line 916).
 *
 * And DA #9:
 *   "No localStorage, no IndexedDB, no cookies. No 'undo' button
 *    anywhere. The <RoleColumn> store has no revoke() method."
 *
 * Accordingly this file exports NO `revoke`, NO `undo`, NO `remove`.
 * It exports `tag` (write-once-per-editable-cell; subsequent writes
 * overwrite because the BRAINSTORM spec allows re-tagging between
 * causal/spurious/incidental — see the CH4 note line 720, "Tagging or
 * re-tagging is permitted in CH4"). There is no path to revert a cell
 * to `unlabeled` once tagged.
 *
 * The storage discipline (sessionStorage only) is enforced structurally
 * by the absence of any `window.localStorage` / `indexedDB` reference
 * in this file — and by the ESLint rule `no-storage-persistence` that
 * fails the build on any such reference project-wide.
 */

import { writable, derived, get, type Readable, type Writable } from 'svelte/store';
import type { FeatureRow, Role } from './features';

export type { Role } from './features';

/** Plain-object snapshot exposed to subscribers. */
export interface RolesState {
  /** featureId -> role. Authored features are pre-populated at init. */
  readonly assignments: ReadonlyMap<string, Role>;
  /**
   * Every id present in the authored set — used by the editable-cell
   * guard. Frozen at init, never mutated.
   */
  readonly authoredIds: ReadonlySet<string>;
  /** All feature ids in the order the column renders them. */
  readonly allIds: readonly string[];
}

const EMPTY_STATE: RolesState = Object.freeze({
  assignments: new Map<string, Role>(),
  authoredIds: new Set<string>(),
  allIds: [] as readonly string[]
});

const store: Writable<RolesState> = writable(EMPTY_STATE);

export const rolesStore: Readable<RolesState> = {
  subscribe: store.subscribe
};

/**
 * Initialise the store from a loaded FeaturesBundle. Idempotent on the
 * same input: if the store already holds the same `allIds` in the same
 * order AND the same authoredIds set, the call is a no-op and any
 * reader-committed tags survive. This is what lets <RoleColumn>'s
 * `$: if (features) initFromFeatures(features.rows)` reactive block
 * re-fire on prop changes without wiping the reader's session
 * assignments (which would otherwise violate DA #9, DESIGN.md line 916).
 *
 * Must be called before <RoleColumn> mounts so the 356-row invariant
 * holds.
 */
export function initFromFeatures(rows: readonly FeatureRow[]): void {
  if (rows.length !== 356) {
    throw new Error(
      `rolesStore.initFromFeatures: expected 356 rows (DESIGN.md §CC#3 line 270), got ${rows.length}`
    );
  }
  const authored = new Set<string>();
  const allIds: string[] = [];
  for (const r of rows) {
    allIds.push(r.id);
    if (r.default_role === 'authored') {
      authored.add(r.id);
    }
  }
  if (authored.size !== 30) {
    throw new Error(
      `rolesStore.initFromFeatures: expected 30 authored rows (DESIGN.md line 270); got ${authored.size}`
    );
  }
  // Idempotency guard: same ids + same authored set → do not touch
  // the existing assignments Map. Without this guard the harness's
  // reactive prop bindings + the <RoleColumn>'s `$:` block would
  // compound and clobber reader tags (DA #9 forbids revocation).
  const current = get(store);
  if (sameAllIds(current.allIds, allIds) && sameAuthored(current.authoredIds, authored)) {
    return;
  }
  const assignments = new Map<string, Role>();
  for (const id of authored) {
    assignments.set(id, 'authored');
  }
  store.set({
    assignments,
    authoredIds: authored,
    allIds
  });
}

function sameAllIds(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function sameAuthored(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

/**
 * Assign (or re-assign) a role to a feature. Guards:
 *   - authored features are READ-ONLY; `tag` on an authored id throws.
 *     DESIGN.md §CC#3 Invariants line 271.
 *   - role must be one of the user-writable tokens (causal, spurious,
 *     incidental). 'authored' and 'unlabeled' are rejected:
 *       * 'authored' is the pre-populated state, never user-assigned.
 *       * 'unlabeled' is the DEFAULT for any cell not present in the
 *         assignments map; re-setting to 'unlabeled' would be an undo
 *         (DA #9 forbids it).
 *   - the id must be one the store knows about (i.e. loaded from
 *     features.json); an unknown id throws so stale UI cannot silently
 *     create phantom cells.
 */
export function tag(featureId: string, role: Role): void {
  store.update((s) => {
    if (!s.allIds.includes(featureId)) {
      throw new Error(
        `rolesStore.tag: feature id "${featureId}" is not in the loaded 356-row set`
      );
    }
    if (s.authoredIds.has(featureId)) {
      throw new Error(
        `rolesStore.tag: "${featureId}" is [authored] and cannot be overwritten (DESIGN.md line 271)`
      );
    }
    if (role !== 'causal' && role !== 'spurious' && role !== 'incidental') {
      throw new Error(
        `rolesStore.tag: user-writable role must be causal|spurious|incidental; got "${role}" (DA #9 line 916)`
      );
    }
    const next = new Map(s.assignments);
    next.set(featureId, role);
    return { ...s, assignments: next };
  });
}

/**
 * Read a feature's current role. Returns 'unlabeled' for any cell not
 * yet tagged (so the <RoleCell> has a concrete render path without
 * checking map membership).
 */
export function getRole(state: RolesState, featureId: string): Role {
  if (state.authoredIds.has(featureId)) return 'authored';
  const r = state.assignments.get(featureId);
  return r ?? 'unlabeled';
}

/** User-committed tags only (excludes [authored]). Drives <RoleLabeledCounter>. */
export const userLabeledCount: Readable<number> = derived(store, ($s) => {
  let n = 0;
  for (const [id, role] of $s.assignments) {
    if ($s.authoredIds.has(id)) continue; // don't count the pre-populated authored set
    if (role === 'causal' || role === 'spurious' || role === 'incidental') n += 1;
  }
  return n;
});

/** Test-only reset. */
export function resetRolesStoreForTest(): void {
  store.set(EMPTY_STATE);
}

/**
 * Test-only: write a role bypassing the usual guards. Useful for
 * Storybook pre-tagged variants and for the 300ms-latency Vitest test
 * that flips a cell programmatically and measures subscriber catch-up.
 * NOT exported for production callers — Svelte's tree shaking removes
 * unused bits at build time, but reviewers can grep for the name and
 * confirm only test/story code imports it.
 */
export function _unsafeSetForTest(featureId: string, role: Role): void {
  store.update((s) => {
    const next = new Map(s.assignments);
    if (role === 'unlabeled') {
      next.delete(featureId);
    } else {
      next.set(featureId, role);
    }
    return { ...s, assignments: next };
  });
}
