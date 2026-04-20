<!--
  HeartbeatPulse.svelte — the CH2 gold pulse at h_ii = 0.95.

  DESIGN.md §Stage 2 handoff → Build order, item 2 acceptance:
    "Validates first-paint budget + reduced-motion + mobile collapse + recast."
  DESIGN.md §Cross-cutting signature #1 Acceptance criterion #3:
    "Reduced-motion: at the p where value crosses 0.95, the cell adopts a
     1px gold stroke; no pulse animation."
  DESIGN.md §Chapter 2 (line 505):
    "<HeartbeatTicker/> value scrubs live, gold-pulses at 0.95"
    and the pulse is one of the three permitted sub-200ms motions
    (DA #1, reinforced at line 957).

  This file is one of the three files Stylelint's `no-keyframes` rule
  allows `@keyframes` in (DESIGN.md line 325). It declares a single
  `@keyframes gold-pulse` whose total duration is 180ms — below the
  200ms ceiling enforced by `no-css-animation-over-200ms` (DESIGN.md
  line 324). Reduced-motion suppresses the keyframes entirely and
  replaces the effect with a persistent 1px gold stroke (criterion #3).

  The component takes one boolean prop: `active`. When true, the inner
  span animates; when false, it renders at the idle (no-stroke) state.
  The emitting component (HeartbeatTicker) flips `active` from false to
  true once the h_ii value crosses 0.95 during scrub or first paint.

  data-permitted-motion="ch2-pulse" marks this file for the ESLint
  `no-css-animation-over-200ms` rule's allowlist path.
-->
<script lang="ts">
  /** Whether the pulse should be active (CH2 value has crossed 0.95). */
  export let active: boolean = false;
  /** Whether the visitor's OS requests reduced motion. */
  export let reducedMotion: boolean = false;
</script>

<span
  class="heartbeat-pulse"
  class:is-active={active}
  class:is-reduced={reducedMotion}
  data-testid="heartbeat-pulse"
  data-permitted-motion="ch2-pulse"
  aria-hidden="true"
>
  <slot />
</span>

<style>
  /* data-permitted-motion="ch2-pulse" — BRAINSTORM CH2 allowed pulse.
     Total duration 180ms, under the 200ms ceiling of DA #1. */
  @keyframes gold-pulse {
    0%   { box-shadow: inset 0 0 0 0 var(--gold-pulse); }
    50%  { box-shadow: inset 0 0 0 1px var(--gold-pulse); }
    100% { box-shadow: inset 0 0 0 0 var(--gold-pulse); }
  }

  .heartbeat-pulse {
    display: inline-block;
    /* Default idle state: no stroke, no animation. */
  }

  .heartbeat-pulse.is-active:not(.is-reduced) {
    animation: gold-pulse 180ms ease-out 1;
  }

  /* Reduced-motion static alternative: 1px gold stroke that persists.
     DESIGN.md §CC#1 acceptance #3: "the cell adopts a 1px gold stroke;
     no pulse animation." */
  .heartbeat-pulse.is-active.is-reduced {
    box-shadow: inset 0 0 0 1px var(--gold);
  }

  /* Matching OS-level preference as a second defense — if a user
     enables reduced-motion at the OS level between prop reads, we
     still honour it via the media query. */
  @media (prefers-reduced-motion: reduce) {
    .heartbeat-pulse.is-active {
      animation: none;
      box-shadow: inset 0 0 0 1px var(--gold);
    }
  }
</style>
