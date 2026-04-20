<!--
  PiCellCompositionHarness.svelte — Storybook mount for <PiCellComposition>.

  Stage 2 step 4 ships this prototype in isolation — no chapter route,
  no <RoleColumn>, no α-scrub. DESIGN.md §Stage 2 handoff line 932
  requires "prototyped before any other chapter content"; steps 8+
  will assemble the chapter around this cell.

  The harness loads the three required fixtures via fetch:
    - /data/features.json (for feature ids + <RoleColumn>'s 356 rows)
    - /data/nor/pi_decomposition.json
    - /data/nor/pi_shuffled.json

  Scenarios:
    - 'default' — no reader tags; the line-2 underlines inherit their
                  color from `role_at_build` (4 spurious + 1 authored
                  per BRAINSTORM CH3 wow #1, so 4 red + 1 green).
    - 'reader-tagged' — the reader has tagged the four absurd features
                  as `spurious` and `rule_of_law` as `causal`, so both
                  the role_at_build fallback path and the reader's own
                  path render the same colors. (Two paths, one frame.)
    - 'reader-overrides' — the reader disagrees with build: tags
                  `name_numerology_score` as `causal` instead of
                  `spurious`, proving the reader's tag wins over
                  role_at_build (DESIGN.md line 619).
    - 'extreme-min' — α near 0, line 2 has 12 terms instead of 5.
                  Exercises the overflow-ellipsis behaviour at 60px
                  desktop.
    - 'extreme-max' — α at ∞; both cells empty (line 1 + line 2 blank).
                  Verifies the cell's 60px envelope survives the empty
                  state (DESIGN.md state machine line 635).
    - 'reduced-motion' — uiStore.reducedMotion = true. Per BRAINSTORM
                  CH3 wow #1 the only CH3 motion is the 120ms
                  strikethrough (not shipped until step 8); the PI cell
                  itself has zero animation. The snapshot proves the
                  claim.
    - 'recast' — active ISO3 flips to URY; the fixture path the harness
                  uses would normally change, but in step 4 we only have
                  NOR fixtures. The scenario simply re-mounts the cell
                  after a session swap to prove the composition doesn't
                  assume NOR-specific identity.
-->
<script lang="ts" context="module">
  export type PiCellHarnessScenario =
    | 'default'
    | 'reader-tagged'
    | 'reader-overrides'
    | 'extreme-min'
    | 'extreme-max'
    | 'reduced-motion'
    | 'recast';
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import PiCellComposition from '$lib/components/ch3/PiCellComposition.svelte';
  import {
    loadPiBundle,
    resetPiStoreForTest,
    type PiBundle
  } from '$lib/stores/pi';
  import {
    loadFeatures,
    resetFeaturesStoreForTest,
    type FeaturesBundle
  } from '$lib/stores/features';
  import {
    initFromFeatures,
    resetRolesStoreForTest,
    _unsafeSetForTest
  } from '$lib/stores/roles';
  import { sessionStore, resetSessionStoreForTest } from '$lib/stores/session';
  import { uiStore, resetUIStoreForTest } from '$lib/stores/ui';

  export let scenario: PiCellHarnessScenario = 'default';

  let real: PiBundle | null = null;
  let shuffled: PiBundle | null = null;
  let features: FeaturesBundle | null = null;
  let stepIndex: number | null = null;
  let errorMsg = '';

  /** Derive step index from the scenario. */
  function pickStepIndex(bundle: PiBundle, s: PiCellHarnessScenario): number {
    if (s === 'extreme-min') return 0;
    if (s === 'extreme-max') return bundle.steps.length - 1;
    return bundle.cv_optimal_index;
  }

  function seedScenario(s: PiCellHarnessScenario): void {
    switch (s) {
      case 'reader-tagged': {
        // The 5 cv-optimal feature_ids are stable from the fixture generator.
        // Reader agrees with role_at_build: 4 spurious + 1 causal on
        // `rule_of_law` (authored, so _unsafeSetForTest puts it in the
        // map without throwing; but <PiCellLine2Underline> uses its
        // role_at_build fallback for authored cells anyway).
        _unsafeSetForTest('absurd_02', 'spurious'); // num
        _unsafeSetForTest('absurd_11', 'spurious'); // mcd
        _unsafeSetForTest('absurd_03', 'spurious'); // scr
        _unsafeSetForTest('absurd_25', 'spurious'); // bw
        break;
      }
      case 'reader-overrides': {
        // Reader DISAGREES with build on one term. The build marks
        // `name_numerology_score` as spurious (red); the reader tags
        // it as causal (green). The underline should follow the
        // reader, not the build. DESIGN.md line 619.
        _unsafeSetForTest('absurd_02', 'causal');
        _unsafeSetForTest('absurd_11', 'spurious');
        _unsafeSetForTest('absurd_03', 'incidental');
        _unsafeSetForTest('absurd_25', 'spurious');
        break;
      }
      default:
        break;
    }
  }

  async function loadScenario(s: PiCellHarnessScenario): Promise<void> {
    resetSessionStoreForTest();
    resetUIStoreForTest();
    resetRolesStoreForTest();
    resetFeaturesStoreForTest();
    resetPiStoreForTest();

    if (s === 'reduced-motion') {
      uiStore.update((st) => ({ ...st, reducedMotion: true }));
    }
    if (s === 'recast') {
      sessionStore.update((st) => ({
        ...st,
        currentChapter: 'ch5',
        activeISO3: 'URY'
      }));
    }

    try {
      // Features bundle first so the rolesStore's `tag()` guards pass.
      const [fBundle, rBundle, sBundle] = await Promise.all([
        loadFeatures(),
        loadPiBundle('/data/nor/pi_decomposition.json'),
        loadPiBundle('/data/nor/pi_shuffled.json')
      ]);
      initFromFeatures(fBundle.rows);
      seedScenario(s);
      features = fBundle;
      real = rBundle;
      shuffled = sBundle;
      stepIndex = pickStepIndex(rBundle, s);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    }
  }

  onMount(() => {
    void loadScenario(scenario);
  });
</script>

<div class="harness-root" data-testid="pi-harness-root">
  <header class="harness-header">
    <span class="filename type-model" data-testid="pi-harness-filename">
      # five_deaths_of_norway.ipynb
    </span>
    <span class="note type-annot">
      <!-- 9pt mono context line so the snapshot reviewer can immediately
           see which state the frame is showing. Not a chapter feature;
           only a harness affordance. -->
      pi-cell composition prototype · scenario: {scenario}
    </span>
  </header>

  {#if errorMsg}
    <p class="err type-annot" data-testid="pi-harness-error">
      fixture load failed: {errorMsg}
    </p>
  {/if}

  {#if real && shuffled && features}
    <main class="harness-stage">
      <PiCellComposition {real} {shuffled} {stepIndex} />
    </main>
  {/if}
</div>

<style>
  .harness-root {
    width: 100vw;
    min-height: 100vh;
    background: var(--bg-cream);
    padding: 0;
    margin: 0;
  }
  .harness-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--rule-hair);
  }
  .note {
    color: rgba(0, 0, 0, 0.55);
  }
  .err {
    color: var(--dashed-red);
    padding: 8px 16px;
  }
  .harness-stage {
    /* Center the twin composition so the snapshot baseline is not
       right-edge-sensitive. */
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 48px 24px;
  }
  @media (max-width: 480px) {
    .harness-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }
    .harness-stage {
      padding: 24px 16px;
    }
  }
</style>
