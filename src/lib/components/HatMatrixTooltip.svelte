<!--
  HatMatrixTooltip.svelte — the on-hover/focus hat-matrix reveal.

  DESIGN.md §Cross-cutting signature #1, "Hat-matrix definition":
    "On hover (pointer) or focus (keyboard), the ticker reveals a
     KaTeX-rendered block containing the literal formula
     h_ii = [X(X^TX)^{-1}X^T]_{ii} with a one-line 9pt mono gloss ...
     Default state: display: none. Never rendered at any route's
     default paint."

  Acceptance criterion #6 (DESIGN.md §CC#1):
    "at default paint on any route,
     document.querySelector('[data-testid=hat-matrix-tooltip]') reports
     offsetWidth === 0 and offsetHeight === 0 (Playwright assertion)."

  To satisfy criterion #6 literally, the wrapper element is always in
  the DOM (so the selector resolves), but its computed display is `none`
  when `open === false`, making offsetWidth === 0 && offsetHeight === 0.
  When `open === true`, the block is rendered inline with the
  pre-rendered MathML formula (no runtime KaTeX).

  Dismiss vectors (DESIGN.md §CC#1 Interaction table):
    mouseleave (pointer) · Escape (keyboard) · blur · Tab-away

  Mobile: DESIGN.md §CC#1 Invariants: "renders as a bottom-sheet modal
  full-width, 40vh tall." A CSS media query below handles this.
-->
<script lang="ts">
  import {
    HAT_MATRIX_MATHML,
    HAT_MATRIX_GLOSS,
    HAT_MATRIX_ARIA
  } from '$lib/generated/hatMatrixFormula';
  import { createEventDispatcher } from 'svelte';

  /** Parent controls visibility via the `uiStore.hatMatrixTooltipOpen` flag. */
  export let open: boolean = false;
  /** Id used by the trigger's aria-describedby. */
  export let id: string = 'hat-matrix-tooltip';

  const dispatch = createEventDispatcher<{ dismiss: void }>();

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      dispatch('dismiss');
    }
  }
</script>

<svelte:window on:keydown={open ? onKeydown : undefined} />

<div
  {id}
  class="hat-matrix-tooltip"
  class:is-open={open}
  data-testid="hat-matrix-tooltip"
  role="tooltip"
  aria-live="polite"
  aria-label={HAT_MATRIX_ARIA}
  on:mouseleave={() => dispatch('dismiss')}
>
  {#if open}
    <!-- MathML is a trusted build-time string; no user input reaches this path. -->
    {@html HAT_MATRIX_MATHML}
    <p class="gloss type-subannot">{HAT_MATRIX_GLOSS}</p>
  {/if}
</div>

<style>
  .hat-matrix-tooltip {
    /* Default state: not in layout. DESIGN.md §CC#1 Invariants:
       "The hat-matrix block is never in the DOM at a route's default
       paint — verified by Playwright asserting display: none until an
       interaction fires." The wrapper is in the DOM so the selector
       resolves; its content is gated by {#if open} above. */
    display: none;
    position: fixed;
    top: 56px;
    right: 16px;
    z-index: 101;
    background: var(--bg-cream);
    border: 1px solid var(--rule-hair);
    padding: 12px 14px;
    max-width: 380px;
    box-sizing: border-box;
    /* No transition — the reveal is instant per DESIGN.md §CC#1
       Interaction table "Reduced-motion: No transition to suppress". */
  }
  .hat-matrix-tooltip.is-open {
    display: block;
  }
  .gloss {
    margin: 8px 0 0;
    color: #333;
  }
  /* MathML rendering defaults to serif glyphs; inherit font from host
     so the browser picks its math font. Do NOT set a font-family here
     (would trip the `no-raw-font-family` rule). */

  @media (max-width: 480px) {
    .hat-matrix-tooltip {
      /* Bottom-sheet modal per DESIGN.md §CC#1 Invariants (mobile). */
      top: auto;
      right: 0;
      bottom: 0;
      left: 0;
      max-width: 100%;
      height: 40vh;
      overflow: auto;
      border-top: 1px solid var(--rule-hair);
      border-left: 0;
      border-right: 0;
      border-bottom: 0;
    }
  }
</style>
