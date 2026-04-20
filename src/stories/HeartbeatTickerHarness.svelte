<!--
  HeartbeatTickerHarness.svelte — the test-only wrapper the Storybook
  stories use to drive the HeartbeatTicker through its five
  interesting states:

    1. CH1 first paint (sub-caption visible, value ~= 0.04)
    2. CH2 scrub at p=n-1 (value >= 0.98, pulse firing)
    3. CH2 scrub at p=n-1 under reduced-motion (gold stroke, no pulse)
    4. Mobile 480px collapse (14px top-strip)
    5. CH5 recast to URY (ISO3 swap, p=n-1 of the new country)

  The harness does NOT manipulate the live session store — stories are
  isolated per-instance. It replaces the stores with a reset snapshot
  on mount and loads the trajectory fixture via fetch (Storybook
  serves /static/ at /).
-->
<script lang="ts" context="module">
  export type HarnessScenario =
    | 'ch1-first-paint'
    | 'ch1-scrolled'
    | 'ch2-pn-1-desktop'
    | 'ch2-reduced-motion'
    | 'ch2-mobile'
    | 'ch5-recast-to-ury';
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import HeartbeatTicker from '$lib/components/HeartbeatTicker.svelte';
  import { sessionStore, resetSessionStoreForTest } from '$lib/stores/session';
  import { uiStore, resetUIStoreForTest } from '$lib/stores/ui';
  import {
    loadHiiTrajectory,
    resetDataStoreForTest,
    type HiiTrajectory
  } from '$lib/stores/data';

  export let scenario: HarnessScenario = 'ch1-first-paint';
  /** Optional hover trigger for the hat-matrix tooltip at story load. */
  export let openTooltip: boolean = false;

  let trajectory: HiiTrajectory | null = null;
  let errorMsg: string = '';

  async function loadScenario(s: HarnessScenario): Promise<void> {
    resetSessionStoreForTest();
    resetUIStoreForTest();
    resetDataStoreForTest();

    let iso3: string = 'NOR';
    switch (s) {
      case 'ch1-first-paint':
        sessionStore.update((st) => ({
          ...st,
          currentChapter: 'ch1',
          scrolledPastSubCaptionThreshold: false
        }));
        break;
      case 'ch1-scrolled':
        sessionStore.update((st) => ({
          ...st,
          currentChapter: 'ch1',
          scrolledPastSubCaptionThreshold: true
        }));
        break;
      case 'ch2-pn-1-desktop':
        sessionStore.update((st) => ({
          ...st,
          currentChapter: 'ch2',
          scrubP: 212
        }));
        break;
      case 'ch2-reduced-motion':
        sessionStore.update((st) => ({
          ...st,
          currentChapter: 'ch2',
          scrubP: 212
        }));
        uiStore.update((st) => ({ ...st, reducedMotion: true }));
        break;
      case 'ch2-mobile':
        sessionStore.update((st) => ({
          ...st,
          currentChapter: 'ch2',
          scrubP: 212
        }));
        break;
      case 'ch5-recast-to-ury':
        iso3 = 'URY';
        sessionStore.update((st) => ({
          ...st,
          currentChapter: 'ch5',
          activeISO3: 'URY'
        }));
        break;
    }

    try {
      trajectory = await loadHiiTrajectory(iso3);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    }

    if (openTooltip) {
      uiStore.update((st) => ({ ...st, hatMatrixTooltipOpen: true }));
    }
  }

  onMount(() => {
    void loadScenario(scenario);
  });

  $: void loadScenario(scenario);
</script>

<div class="harness-root" data-testid="harness-root">
  <!-- Spacer so visual snapshots see the cream page surface. -->
  {#if errorMsg}
    <p class="err type-annot" data-testid="harness-error">fixture load failed: {errorMsg}</p>
  {/if}
  <HeartbeatTicker {trajectory} />
</div>

<style>
  .harness-root {
    position: relative;
    height: 100vh;
    width: 100vw;
    background: var(--bg-cream);
  }
  .err {
    color: var(--dashed-red);
    padding: 8px;
  }
</style>
