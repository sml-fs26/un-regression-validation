<!--
  RoleCell.svelte — one row inside <RoleColumn>, cross-cutting #3.

  DESIGN.md §Cross-cutting signature #3 Render contract (lines 264-267):
    - `[authored]` cells (30): render the bracketed text in --type-annot.
      Hover reveals the citation in a --type-subannot floating block (no
      transition; opacity 0 → 1 instant on hover, 1 → 0 instant on blur).
    - `unlabeled` cells (326): render the literal token `unlabeled` in
      --type-annot at 60% opacity.
    - User-tagged cells: render `causal` / `spurious` / `incidental` in
      --type-annot, full opacity, with the corresponding --role-* color
      as `border-bottom: 1px solid`.

  Acceptance criteria (DESIGN.md lines 273-278):
    1. Tagging a cell as `spurious` updates every chart's role-stroke
       for that feature within 300ms (verified in the latency Vitest
       test; the cell itself sets data-feature-id + class, the
       palette-utility CSS selector + the Svelte reactive subscription
       cover the rest).
    2. Counter updates synchronously on every commit (RoleLabeledCounter
       subscribes to the derived userLabeledCount store).
    3. Reduced-motion has no effect — there are no transitions to
       suppress. (The hover citation reveal is INSTANT per spec.)
    4. Reload erases all tags (no localStorage; sessionStorage only).
    5. The editable cells respond to keyboard `1`/`2`/`3` per the
       keyboard table; the `[authored]` cells do not.

  `[data-feature-id]` carries the feature id so downstream chart
  elements in later steps can lookup via the same attribute and have
  their role-stroke class recomputed when the rolesStore emits a new
  snapshot (DA #3 latency target).
-->
<script lang="ts">
  import type { FeatureRow } from '$lib/stores/features';
  import type { Role } from '$lib/stores/roles';
  import { rolesStore, tag, getRole } from '$lib/stores/roles';

  export let feature: FeatureRow;

  /** Click-cycle for three-way toggle. Committed on each click. */
  const CYCLE: ReadonlyArray<Role> = ['causal', 'spurious', 'incidental'] as const;

  $: role = getRole($rolesStore, feature.id);
  $: isAuthored = feature.default_role === 'authored';
  $: isUnlabeled = role === 'unlabeled';
  $: strokeVar =
    role === 'causal'
      ? 'var(--role-causal)'
      : role === 'spurious'
      ? 'var(--role-spurious)'
      : role === 'incidental'
      ? 'var(--role-incidental)'
      : 'var(--role-unlabeled)';
  /**
   * Visible text per DESIGN.md line 264-267:
   *   [authored] -> the bracketed literal
   *   unlabeled  -> the word `unlabeled`
   *   causal     -> `causal`
   *   spurious   -> `spurious`
   *   incidental -> `incidental`
   */
  $: displayText = isAuthored
    ? '[authored]'
    : role === 'unlabeled'
    ? 'unlabeled'
    : role;

  // Hover state for the citation reveal. Per DESIGN.md line 265:
  // "opacity 0 → 1 instant on hover, 1 → 0 instant on blur". No transition.
  let citationHover = false;

  function nextRole(current: Role): Role {
    const idx = CYCLE.indexOf(current);
    if (idx < 0) return CYCLE[0];
    return CYCLE[(idx + 1) % CYCLE.length];
  }

  function commit(target: Role): void {
    if (isAuthored) return; // read-only per invariant
    tag(feature.id, target);
  }

  function handleClick(): void {
    if (isAuthored) return;
    commit(nextRole(role));
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (isAuthored) return;
    // Per DESIGN.md line 454: `1`/`2`/`3` keys map to the three roles.
    // The BRAINSTORM ordering is causal (1), spurious (2), incidental (3).
    if (e.key === '1') {
      e.preventDefault();
      commit('causal');
    } else if (e.key === '2') {
      e.preventDefault();
      commit('spurious');
    } else if (e.key === '3') {
      e.preventDefault();
      commit('incidental');
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }
</script>

<div
  class="role-cell type-annot"
  class:is-authored={isAuthored}
  class:is-unlabeled={isUnlabeled}
  class:role-stroke={!isUnlabeled && !isAuthored}
  data-feature-id={feature.id}
  data-role={role}
  data-testid="role-cell"
  role="button"
  aria-disabled={isAuthored}
  tabindex="0"
  aria-label={isAuthored
    ? `authored feature ${feature.short_name}; citation available on hover or focus.`
    : `feature ${feature.short_name} tagged ${role}; press 1 for causal, 2 for spurious, 3 for incidental.`}
  on:click={handleClick}
  on:keydown={handleKeydown}
  on:mouseenter={() => (citationHover = isAuthored ? true : false)}
  on:mouseleave={() => (citationHover = false)}
  on:focus={() => (citationHover = isAuthored ? true : false)}
  on:blur={() => (citationHover = false)}
  style="--stroke: {strokeVar};"
>
  <span class="role-cell__text">{displayText}</span>

  {#if isAuthored && citationHover && feature.citation}
    <!-- Instant opacity 0 → 1 on hover, no transition (DESIGN.md line 265). -->
    <span class="citation type-subannot" data-testid="role-cell-citation">
      {feature.citation}
    </span>
  {/if}
</div>

<style>
  .role-cell {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 16px;
    padding: 1px 6px;
    white-space: nowrap;
    cursor: default;
    outline: none;
    /* The stroke-only contract: .role-stroke utility class draws the
       1px border-bottom when the cell is tagged. Untagged / unlabeled
       / authored cells have no bottom stroke. */
  }

  .role-cell.is-authored {
    cursor: help;
  }
  .role-cell.is-unlabeled {
    opacity: 0.6; /* DESIGN.md line 266: "at 60% opacity" */
  }
  .role-cell:not(.is-authored):not(.is-unlabeled) {
    cursor: pointer;
  }

  .role-cell:focus-visible {
    /* Dashed-gray 1px focus ring, stroke-only, no animation. */
    outline: 1px dashed var(--dashed-gray);
    outline-offset: 1px;
  }

  .role-cell__text {
    pointer-events: none;
  }

  /* The citation reveal block is a floating sibling that appears flush
     to the right of the authored cell. Instant, no transition. */
  .citation {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 3;
    background: var(--bg-cream);
    border: 1px solid var(--rule-hair);
    padding: 2px 6px;
    white-space: normal;
    min-width: 140px;
    max-width: 260px;
  }
</style>
