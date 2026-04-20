/*
 * uiStore — transient UI flags. Never persisted.
 *
 * DESIGN.md §Cross-cutting signature #1:
 *   "State written: uiStore.hatMatrixTooltipOpen (toggled by hover/focus
 *    on the ticker; never persisted)."
 */

import { writable, type Writable } from 'svelte/store';

export interface UIState {
  /** Whether the hat-matrix tooltip is currently revealed. */
  hatMatrixTooltipOpen: boolean;
  /**
   * Whether the reader's OS prefers-reduced-motion is active. Read from
   * matchMedia in the component's onMount; exposed as a store so stories
   * and tests can force it true without touching the OS setting.
   */
  reducedMotion: boolean;
}

const initialState: UIState = {
  hatMatrixTooltipOpen: false,
  reducedMotion: false
};

export const uiStore: Writable<UIState> = writable(initialState);

export function resetUIStoreForTest(): void {
  uiStore.set({ ...initialState });
}
