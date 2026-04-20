<!--
  RoleColumn.svelte — cross-cutting signature #3, pinned-left column.

  DESIGN.md §Cross-cutting signature #3 (lines 259-278) and the
  chapter-specific "Role column in CH{2,3,4,5}" subsections all
  restate the same contract:

    "<RoleColumn> is CSV column index 0, pinned-left via
     position: sticky; left: 0;. One <RoleCell> per feature row."

    "position: sticky; left: 0; z-index: 2; anchored to the viewport's
     left edge. Horizontal overflow occurs to the right of the role
     column. The role column never enters the overflow."

  DESIGN.md §CC#3 Invariants (line 270): "326 + 30 = 356 cells exactly.
  Verified at mount." — this component throws during initialisation if
  the features bundle is not 356.

  The component is a pure render of the loaded FeaturesBundle; the
  rolesStore handles writes. Every <RoleCell> inside receives the same
  reactive subscription so DA #3's <300ms latency target is met
  structurally (no manual propagation).
-->
<script lang="ts">
  import type { FeaturesBundle } from '$lib/stores/features';
  import { initFromFeatures } from '$lib/stores/roles';
  import RoleCell from './RoleCell.svelte';

  /**
   * The loaded features. The caller (chapter route or Storybook
   * harness) is responsible for fetching it via loadFeatures() and
   * awaiting the promise before mounting this component.
   *
   * Passed explicitly (not subscribed via a global store) so the
   * component is deterministic for Playwright snapshots.
   */
  export let features: FeaturesBundle;

  // Initialise the rolesStore on mount / when the bundle reference
  // changes. Idempotent on the same bundle — the store's init function
  // rebuilds authoredIds + allIds from the same inputs and throws if
  // the 356-row invariant is broken, surfacing the failure at mount
  // time rather than at first chart render in a later chapter.
  $: if (features) initFromFeatures(features.rows);
</script>

<div
  class="role-column"
  data-testid="role-column"
  role="list"
  aria-label="editable role column"
>
  {#each features.rows as feature (feature.id)}
    <div role="listitem" class="role-column__row">
      <RoleCell {feature} />
    </div>
  {/each}
</div>

<style>
  .role-column {
    position: sticky;
    left: 0;
    top: 0;
    z-index: 2;
    background: var(--bg-cream);
    /* A hair-rule at the right edge separates the pinned column from
       the right-overflowing data cells. DESIGN.md line 524 names the
       buckle as right-of-column; the column itself is demarcated by a
       single 1px rule — no fill, no shadow. */
    border-right: 1px solid var(--rule-hair);
    min-width: 120px;
    max-width: 160px;
    display: flex;
    flex-direction: column;
    /* No transitions. No animations. */
  }

  .role-column__row {
    display: block;
    border-bottom: 1px solid var(--rule-hair);
  }

  /* Mobile: the column stays pinned-left within the horizontally-
     scrollable CSV viewport (DESIGN.md line 528 / 622 / 724 / 826). No
     behavioural change; only a narrower width so the data-cell region
     has room on a 480px screen. */
  @media (max-width: 480px) {
    .role-column {
      min-width: 96px;
      max-width: 120px;
    }
  }
</style>
