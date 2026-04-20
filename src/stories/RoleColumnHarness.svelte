<!--
  RoleColumnHarness.svelte — test-only wrapper that mounts <RoleColumn>
  + <RoleLabeledCounter> alongside a simulated right-of-column content
  area, for Storybook + Playwright snapshots of cross-cutting #3.

  The harness loads the features fixture via fetch (Storybook exposes
  /static/data/features.json at /data/features.json via staticDirs), then
  mounts the column. Optional scenario-seeding lets a story start with a
  set of pre-tagged cells (used by the "tagged" + "dense-tagged" + "mobile"
  snapshots so reviewers see the stroke-only palette actively rendered).

  Scenarios:
    - 'default'           — no reader tags; all 326 editable cells read
                            `unlabeled` at 60% opacity.
    - 'single-tagged'     — one cell tagged spurious (exercises the
                            stroke-only --role-spurious color).
    - 'three-colors'      — one causal, one spurious, one incidental
                            (all three strokes visible in one frame).
    - 'dense-tagged'      — 15 tags spread across the three roles
                            (makes counter read `labeled_by_you: 15 / 356`
                            so the snapshot is readable).
    - 'reduced-motion'    — same as 'three-colors' but with
                            uiStore.reducedMotion = true. DESIGN.md
                            acceptance #3: "Reduced-motion has no
                            effect — there are no transitions to
                            suppress." The snapshot proves the claim.
    - 'recast'            — re-mounts after activeISO3 flips to URY.
                            Per DESIGN.md line 824, roleAssignments
                            do NOT reset on recast; the same tags
                            persist through the swap.
-->
<script lang="ts" context="module">
  export type RoleColumnHarnessScenario =
    | 'default'
    | 'single-tagged'
    | 'three-colors'
    | 'dense-tagged'
    | 'reduced-motion'
    | 'recast';
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import RoleColumn from '$lib/components/RoleColumn.svelte';
  import RoleLabeledCounter from '$lib/components/RoleLabeledCounter.svelte';
  import { sessionStore, resetSessionStoreForTest } from '$lib/stores/session';
  import { uiStore, resetUIStoreForTest } from '$lib/stores/ui';
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

  export let scenario: RoleColumnHarnessScenario = 'default';

  let features: FeaturesBundle | null = null;
  let errorMsg: string = '';

  function seedScenario(bundle: FeaturesBundle, s: RoleColumnHarnessScenario): void {
    // Walk the rows to pick editable (non-authored) ids for deterministic
    // seeding — the Playwright snapshots depend on which cells carry a
    // stroke. We take the first N non-authored ids in source order.
    const editable = bundle.rows.filter((r) => r.default_role !== 'authored');
    const pick = (i: number): string => editable[i].id;
    switch (s) {
      case 'default':
        break;
      case 'single-tagged':
        _unsafeSetForTest(pick(2), 'spurious');
        break;
      case 'three-colors':
      case 'reduced-motion':
        _unsafeSetForTest(pick(1), 'causal');
        _unsafeSetForTest(pick(3), 'spurious');
        _unsafeSetForTest(pick(5), 'incidental');
        break;
      case 'dense-tagged':
        for (let i = 0; i < 15; i++) {
          const roles = ['causal', 'spurious', 'incidental'] as const;
          _unsafeSetForTest(pick(i * 2), roles[i % roles.length]);
        }
        break;
      case 'recast':
        // Seed BEFORE recast so the post-recast frame shows the same tags.
        _unsafeSetForTest(pick(0), 'causal');
        _unsafeSetForTest(pick(2), 'spurious');
        _unsafeSetForTest(pick(4), 'incidental');
        break;
    }
  }

  async function loadScenario(s: RoleColumnHarnessScenario): Promise<void> {
    resetSessionStoreForTest();
    resetUIStoreForTest();
    resetRolesStoreForTest();
    resetFeaturesStoreForTest();

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
      const bundle = await loadFeatures();
      // Initialise the store with the 30 [authored] rows, then seed the
      // scenario-specific tags. _unsafeSetForTest bypasses guards because
      // the seeding happens at mount time before the user has interacted.
      initFromFeatures(bundle.rows);
      seedScenario(bundle, s);
      features = bundle;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    }
  }

  // Single load path: Storybook re-mounts the harness when `args` change,
  // so onMount is sufficient. A prior version also wired a reactive `$:`
  // call, which raced with onMount and sometimes wiped seeded tags on
  // the second completion — dropped intentionally.
  onMount(() => {
    void loadScenario(scenario);
  });
</script>

<div class="harness-root" data-testid="harness-root">
  <!-- Top-left chrome: the counter sits beside (where <FilenameTitle>
       would sit in the production layout). -->
  <header class="harness-header">
    <span class="filename type-model" data-testid="harness-filename">
      # five_deaths_of_norway.ipynb
    </span>
    <RoleLabeledCounter />
  </header>

  {#if errorMsg}
    <p class="err type-annot" data-testid="harness-error">fixture load failed: {errorMsg}</p>
  {/if}

  <!-- The CSV viewport surrogate: horizontal scroll happens in
       .csv-viewport__scroll; <RoleColumn> is pinned-left via its own
       sticky positioning. -->
  {#if features}
    <section class="csv-viewport" data-testid="csv-viewport">
      <div class="csv-viewport__scroll">
        <RoleColumn {features} />
        <!-- Simulated right-of-column data cells so the pinned sticky
             behavior has something to NOT translate over. A
             Playwright assertion at 480px checks that the role column
             stays at left:0 after a horizontal scroll. -->
        <div class="csv-data" aria-hidden="true">
          {#each Array.from({ length: 6 }, (_, j) => j) as j (j)}
            <div class="csv-column">
              <div class="csv-head type-head">col_{j + 1}</div>
              {#each Array.from({ length: 24 }, (_, i) => i) as i (i)}
                <div class="csv-cell type-data" data-row-index={i}>—</div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  .harness-root {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    background: var(--bg-cream);
  }
  .harness-header {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: var(--bg-cream);
    border-bottom: 1px solid var(--rule-hair);
  }
  .err {
    color: var(--dashed-red);
    padding: 8px;
  }
  .csv-viewport {
    width: 100%;
    overflow-x: auto;
  }
  .csv-viewport__scroll {
    display: flex;
    /* Simulated wide CSV so the pinned-left behaviour is visible. */
    min-width: 1400px;
  }
  .csv-data {
    display: flex;
    flex: 1 1 auto;
  }
  .csv-column {
    flex: 0 0 auto;
    width: 120px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--rule-hair);
  }
  .csv-head {
    padding: 4px 6px;
    background: var(--bg-cream);
    border-bottom: 1px solid var(--rule-hair);
  }
  .csv-cell {
    padding: 1px 6px;
    border-bottom: 1px solid var(--rule-hair);
    min-height: 16px;
    color: rgba(0, 0, 0, 0.4);
  }
  @media (max-width: 480px) {
    .harness-header {
      flex-direction: column;
      align-items: flex-start;
    }
    .csv-viewport__scroll {
      min-width: 900px;
    }
    .csv-column {
      width: 96px;
    }
  }
</style>
