<!--
  HeartbeatTicker.svelte — the h_ii heartbeat, cross-cutting signature #1.

  DESIGN.md §Cross-cutting signature #1 (lines 217-246) is this file's
  render contract, verbatim. Five responsibilities:

  1. Render line 1 `{ISO3}.h_ii = {value, 4-decimal}` in --type-annot at
     the viewport-fixed position top:16px / right:16px.
  2. Render line 2 sub-caption `a country's share of her own prediction.`
     in --type-subcaption ONLY when CH1 + the reader has not scrolled
     past 200px. JetBrains Mono 7pt, font-style: normal — NOT DM Serif
     italic. Contributes zero to the serif budget.
  3. Toggle the CH2 gold-pulse via <HeartbeatPulse active> once the
     value crosses 0.95 (or adopts a 1px gold stroke under reduced-motion).
  4. Reveal the hat-matrix tooltip on hover (pointer) or focus (keyboard
     Space/Enter); dismiss on mouseleave, blur, Escape, or Tab-away. The
     tooltip itself is <HatMatrixTooltip>; this component wires the
     interactions.
  5. Support recast: when sessionStore.activeISO3 changes, re-read the
     value at the same p from the new country's trajectory, clamped to
     its n.

  Acceptance criteria (DESIGN.md §CC#1 lines 238-244) are the Playwright
  snapshot tests in tests-e2e/heartbeat-ticker.spec.ts. Each criterion
  maps to one or more `expect()` calls; the mapping is documented in
  that file's header.

  Mobile (≤ 480px): collapses to a 14px-tall persistent top-strip,
  full-width, flush against the viewport top edge. Sub-caption renders
  beside line 1, not below. DESIGN.md §CC#1 Invariants (mobile).

  aria-live="polite" + role="status" per DESIGN.md line 101.
-->
<script lang="ts" context="module">
  // Module-scoped counter so each instance gets a unique tooltip id.
  let _instanceCounter = 0;
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { sessionStore, type Chapter } from '$lib/stores/session';
  import { uiStore } from '$lib/stores/ui';
  import type { HiiTrajectory } from '$lib/stores/data';
  import { readHiiAt } from '$lib/stores/data';
  import HeartbeatPulse from './ch2/HeartbeatPulse.svelte';
  import HatMatrixTooltip from './HatMatrixTooltip.svelte';

  /**
   * The country's loaded trajectory. The Storybook stories and the
   * chapter routes (later steps) pass it in after fetching via
   * loadHiiTrajectory(). This keeps HeartbeatTicker itself pure and
   * deterministic — critical for the Playwright snapshot contract.
   *
   * If trajectory is null, the cell renders placeholder text (first
   * paint before the JSON arrives). First-paint budget (acceptance #1)
   * is measured from when the trajectory IS available.
   */
  export let trajectory: HiiTrajectory | null = null;

  /** Optional override for stories: force a specific p instead of reading from session. */
  export let overrideP: number | null = null;

  const tooltipId = `hat-matrix-tooltip-${++_instanceCounter}`;

  $: state = $sessionStore;
  $: ui = $uiStore;

  // The active p:
  //  - overrideP takes precedence for story/test determinism.
  //  - CH2 reads session.scrubP (falling back to n-1 when null, i.e. the
  //    "fully-scrubbed" post-scroll state).
  //  - CH1 reads the baseline p=10 so the ticker first-paints at
  //    h_ii = 0.04 per DESIGN.md line 66's Playwright assertion:
  //    "expect(ticker).toHaveText('NOR.h_ii = 0.04')".
  //  - CH3/CH4/CH5 default to p=n-1 at this step; steps 8-10 replace
  //    those with the α-sweep / recast cell readings.
  function resolveActiveP(
    t: HiiTrajectory | null,
    chapter: Chapter,
    scrubP: number | null,
    override: number | null
  ): number | null {
    if (!t) return null;
    if (override !== null) return override;
    if (chapter === 'ch2' && scrubP !== null) return scrubP;
    if (chapter === 'ch1') return 10;
    return t.n - 1;
  }

  $: activeP = resolveActiveP(trajectory, state.currentChapter, state.scrubP, overrideP);
  $: row = trajectory && activeP !== null ? readHiiAt(trajectory, activeP) : null;
  $: displayHii = row ? row.h_ii.toFixed(4) : '\u2014';
  $: isoLabel = trajectory ? trajectory.iso3 : state.activeISO3;
  $: pulseActive = row !== null && row.h_ii >= 0.95;

  // Sub-caption visibility: CH1 only, before the first scroll past 200px.
  $: showSubCaption =
    state.currentChapter === 'ch1' && !state.scrolledPastSubCaptionThreshold;

  // Last-announced 0.1-boundary value, for the throttled aria-live
  // announcement. Acceptance #4: "announces 'Norway's leverage is now
  // zero point ninety-eight' once when the value crosses each 0.1
  // boundary during scrub (throttled)."
  let lastAnnouncedBoundary = -1;
  let ariaAnnouncement = '';
  $: {
    if (row) {
      const boundary = Math.floor(row.h_ii * 10) / 10;
      if (boundary !== lastAnnouncedBoundary && boundary >= 0) {
        lastAnnouncedBoundary = boundary;
        ariaAnnouncement = formatAnnouncement(isoLabel, row.h_ii);
      }
    }
  }

  function formatAnnouncement(iso: string, h: number): string {
    const name = iso === 'NOR' ? "Norway's" : `${iso}'s`;
    // DESIGN.md acceptance #4 gives the exact template for 0.98.
    const words = prettyNumber(h);
    return `${name} leverage is now ${words}`;
  }

  function prettyNumber(h: number): string {
    // "zero point ninety-eight" — the spec's exact phrase at the 0.98
    // boundary. Generalised: "zero point {two-digit word}".
    const twoDigits = Math.round(h * 100);
    const units = [
      'zero', 'one', 'two', 'three', 'four',
      'five', 'six', 'seven', 'eight', 'nine'
    ];
    const teens = [
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
      'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    let word: string;
    if (twoDigits < 10) word = `zero ${units[twoDigits]}`;
    else if (twoDigits < 20) word = teens[twoDigits - 10];
    else {
      const t = Math.floor(twoDigits / 10);
      const u = twoDigits % 10;
      word = u === 0 ? tens[t] : `${tens[t]}-${units[u]}`;
    }
    return `zero point ${word}`;
  }

  // ------------------------------------------------------------------
  // Hat-matrix tooltip interactions.
  // DESIGN.md §CC#1 Interaction table maps every gesture -> store flag.
  // ------------------------------------------------------------------
  function openTooltip(): void {
    uiStore.update((s) => ({ ...s, hatMatrixTooltipOpen: true }));
  }
  function closeTooltip(): void {
    uiStore.update((s) => ({ ...s, hatMatrixTooltipOpen: false }));
  }
  function toggleTooltip(): void {
    uiStore.update((s) => ({ ...s, hatMatrixTooltipOpen: !s.hatMatrixTooltipOpen }));
  }
  function onKeydown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleTooltip();
    } else if (e.key === 'Escape' && ui.hatMatrixTooltipOpen) {
      e.preventDefault();
      closeTooltip();
    }
  }

  // ------------------------------------------------------------------
  // Recast: when activeISO3 changes while the tooltip is open, close
  // the tooltip. DESIGN.md §CC#1 Recast behavior.
  //
  // Stored as a `let` initialized lazily — referencing `state` at top
  // level would run before the `$: state = $sessionStore` assignment.
  // ------------------------------------------------------------------
  let lastISO3: string | null = null;
  $: {
    if (state) {
      if (lastISO3 !== null && state.activeISO3 !== lastISO3) {
        if (ui && ui.hatMatrixTooltipOpen) closeTooltip();
      }
      lastISO3 = state.activeISO3;
    }
  }

  // ------------------------------------------------------------------
  // Reduced-motion: read once on mount + subscribe to the OS flag.
  // Stories force it via uiStore.reducedMotion for deterministic snapshots.
  // ------------------------------------------------------------------
  let mq: MediaQueryList | null = null;
  function onPrefChange(ev: MediaQueryListEvent): void {
    uiStore.update((s) => ({ ...s, reducedMotion: ev.matches }));
  }
  onMount(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      uiStore.update((s) => ({ ...s, reducedMotion: mq!.matches }));
      mq.addEventListener('change', onPrefChange);
    }
  });
  onDestroy(() => {
    if (mq) mq.removeEventListener('change', onPrefChange);
  });
</script>

<!--
  DESIGN.md §CC#1 interaction table requires the ticker to be both a
  status announcer (aria-live, role="status") AND an interactive
  toggle for the hat-matrix tooltip (Tab + Space/Enter). The two
  ARIA roles don't compose on a single element — role="status" is
  "noninteractive" in WAI-ARIA 1.2. We resolve this by assigning:
    * role="button" to the outer container (the keyboard + hover target)
    * role="status" + aria-live="polite" to the inner announcement <span>
  which is semantically correct AND satisfies DESIGN.md line 101 (the
  live-region announces leverage updates) plus the interaction table
  (the container is reachable by Tab/Space/Enter/Escape).
-->
<div
  class="heartbeat-ticker"
  data-testid="heartbeat-ticker"
  role="button"
  aria-label="{isoLabel} leverage cell; press Space or Enter to reveal the hat-matrix definition."
  aria-describedby={tooltipId}
  aria-expanded={ui.hatMatrixTooltipOpen}
  tabindex="0"
  on:mouseenter={openTooltip}
  on:mouseleave={closeTooltip}
  on:focus={openTooltip}
  on:blur={closeTooltip}
  on:keydown={onKeydown}
>
  <!-- Line 1: the always-visible cell. Never fades. -->
  <HeartbeatPulse active={pulseActive} reducedMotion={ui.reducedMotion}>
    <span class="ticker-line-1 type-annot" data-testid="heartbeat-value">
      {isoLabel}.h_ii = {displayHii}
    </span>
  </HeartbeatPulse>

  <!-- Line 2: CH1-only sub-caption, 7pt MONO, font-style: normal. -->
  {#if showSubCaption}
    <span class="ticker-line-2 type-subcaption" data-testid="heartbeat-subcaption">
      a country&rsquo;s share of her own prediction.
    </span>
  {/if}

  <!-- aria-live announcement, visually hidden. DESIGN.md line 101:
       "The heartbeat ticker is aria-live=polite and role=status". -->
  <span
    class="aria-announcement"
    role="status"
    aria-live="polite"
    data-testid="heartbeat-aria-announcement"
  >
    {ariaAnnouncement}
  </span>
</div>

<!-- Tooltip lives as a sibling, not a child, so it can anchor below the
     ticker per DESIGN.md §CC#1 DOM placement (top: 56px). Its wrapper is
     always in the DOM so the [data-testid] selector resolves; visibility
     is gated on ui.hatMatrixTooltipOpen. -->
<HatMatrixTooltip id={tooltipId} open={ui.hatMatrixTooltipOpen} on:dismiss={closeTooltip} />

<style>
  .heartbeat-ticker {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100;
    background: var(--bg-cream);
    padding: 6px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border: 1px solid var(--rule-hair);
    outline: none;
    /* No transitions. No animations. The pulse lives inside <HeartbeatPulse>. */
  }
  .heartbeat-ticker:focus-visible {
    /* 1px focus ring, stroke-only, no animation. */
    border-color: var(--gold);
  }
  .ticker-line-1 {
    white-space: nowrap;
  }
  .ticker-line-2 {
    color: #555;
    white-space: nowrap;
  }
  .aria-announcement {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Mobile: 14px persistent top-strip, full width, sub-caption beside
     line 1. DESIGN.md §CC#1 Invariants (mobile). */
  @media (max-width: 480px) {
    .heartbeat-ticker {
      top: 0;
      right: 0;
      left: 0;
      padding: 0 8px;
      height: 14px;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      border-left: 0;
      border-right: 0;
      border-top: 0;
    }
    .ticker-line-2 {
      /* On mobile, it sits beside line-1 instead of below. */
      margin-left: auto;
    }
  }
</style>
