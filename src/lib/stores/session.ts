/*
 * sessionStore — read/written state that lives for the session only.
 *
 * DESIGN.md §Global architecture, line 59:
 *   "Browser storage: sessionStorage only. No localStorage, no IndexedDB,
 *    no cookies. DA #9 (irrevocability within session) is enforced by
 *    absence."
 *
 * DESIGN.md §Cross-cutting signature #1 names three fields the
 * <HeartbeatTicker> reads:
 *   - sessionStore.currentChapter
 *   - sessionStore.activeISO3
 *   - sessionStore.scrubP (CH2 only)
 *
 * Later steps (3, 9, 10) add: roleAssignments, objectionQueue, recast
 * bookkeeping. Those fields are not declared here yet — each build
 * step adds the fields it owns, never more.
 */

import { writable, type Writable } from 'svelte/store';

export type Chapter = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5';

/** ISO 3166-1 alpha-3. Default protagonist NOR; CH5 recast swaps it. */
export type ISO3 = string;

export interface SessionState {
  /** Active chapter route. Drives which persistent DOM chrome is visible. */
  currentChapter: Chapter;
  /** Protagonist country code. Default 'NOR'; CH5 recast writes e.g. 'URY'. */
  activeISO3: ISO3;
  /**
   * The CH2 p-scrub position. null outside CH2 (the ticker reads the
   * country's n-1 value). During CH2 scrub, the integer p ∈ [10, n-1].
   */
  scrubP: number | null;
  /**
   * Set true when the reader has scrolled past 200px of the CH1 page
   * (<HeartbeatTicker> sub-caption dismissal trigger per DESIGN.md
   * §Cross-cutting signature #1 Render contract).
   */
  scrolledPastSubCaptionThreshold: boolean;
}

const initialState: SessionState = {
  currentChapter: 'ch1',
  activeISO3: 'NOR',
  scrubP: null,
  scrolledPastSubCaptionThreshold: false
};

export const sessionStore: Writable<SessionState> = writable(initialState);

/** Test-only reset. Must NOT be called in production code paths. */
export function resetSessionStoreForTest(): void {
  sessionStore.set({ ...initialState });
}
