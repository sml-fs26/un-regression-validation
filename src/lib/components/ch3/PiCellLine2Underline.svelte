<!--
  PiCellLine2Underline.svelte — the single permitted exception to the
  stroke-only palette, cross-cutting signature #5 (CH3 only).

  DESIGN.md §Color & palette line 209:
    "Any rule with background-color or color set to a --role-* value,
     outside <PiCellLine2Underline>, fails the custom Stylelint rule
     role-color-stroke-only. The CH3 exception is component-gated:
     only the file src/lib/components/ch3/PiCellLine2Underline.svelte
     is permitted to use border-bottom-color: var(--role-spurious) etc."

  DESIGN.md §Cross-cutting signature #5 line 295:
    "<PiCellLine2Underline> (CH3 only) renders
     border-bottom: 1px solid var(--role-X) as the fill below text.
     The Stylelint plugin role-color-stroke-only exempts only this
     file path."

  This file's style block literally writes
     border-bottom: 1px solid var(--role-causal);
     border-bottom: 1px solid var(--role-spurious);
     border-bottom: 1px solid var(--role-incidental);
  so the "exception" is not vestigial — the file would fail the
  custom Stylelint rule if the allowlist in
  tools/stylelint/role-color-stroke-only.js were changed.

  DESIGN.md §CH3 Reactive dependency line 619:
    "every <PiCellLine2Underline> derives its border-bottom-color from
     the corresponding <RoleCell>'s assignment via the Svelte store."

  The component renders ONE term of the line-2 equation:
    `{weight}·{abbrev}`
  with a 1px role-colored underline under the `{abbrev}` text. The
  underline color comes from the reader's `rolesStore`; if the reader
  has not tagged the feature, the fallback is the term's `role_at_build`
  from the fixture (so the prototype snapshot renders a visible stroke
  even without reader input). BRAINSTORM CH3 wow #1 mandates "Four red
  underlines. One green." at cv-optimal — the "one green" is the
  authored `rule_of_law`, which renders with the `causal` green stroke
  per DESIGN.md §CC#3 Render contract (authored cells are the pre-
  populated analog of causal).

  DESIGN.md §CH3 acceptance #10(e) (line 670):
    "<PiCellLine2Underline>'s border-bottom-color for each abbreviation
     is the same --role-* value the corresponding <RoleCell> carries
     (binding verified by editing a tag during at-cv-optimal and
     asserting both elements update within 300ms — DA #3)."

  The component subscribes to rolesStore via `$rolesStore` so the <300ms
  latency budget (DA #3) is met structurally — no polling, no timers.
  Step 3's `role-subscription-latency.test.ts` already proves the raw
  store latency; step 4's Playwright tests prove the DOM link.
-->
<script lang="ts">
  import type { PiTerm } from '$lib/stores/pi';
  import { rolesStore, getRole, type Role } from '$lib/stores/roles';

  /** The decomposition term this underline represents. */
  export let term: PiTerm;
  /**
   * When true (first term of the equation), the leading ` + ` operator
   * prefix is suppressed.
   */
  export let leading: boolean = false;

  /**
   * The reader's tag wins over `role_at_build` if they disagree
   * (DESIGN.md line 619: "the reader's red labels are the equation").
   *
   * Resolution order:
   *   1. reader tagged causal/spurious/incidental  → that
   *   2. feature is [authored]                     → role_at_build
   *   3. feature unlabeled (reader untouched)      → role_at_build
   */
  $: readerRole = getRole($rolesStore, term.feature_id);
  $: effectiveRole = resolveRole(readerRole, term.role_at_build);
  /**
   * Derived "display color bucket" — distinct from effectiveRole so the
   * authored fallback maps to the `causal` green stroke (BRAINSTORM
   * CH3 wow #1 "one green" refers to the authored `rule_of_law`).
   * This is what drives the CSS selector `[data-stroke-color="..."]`.
   */
  $: strokeColor = resolveStrokeColor(effectiveRole);

  function resolveRole(reader: Role, fallback: Role): Role {
    if (reader === 'causal' || reader === 'spurious' || reader === 'incidental') {
      return reader;
    }
    return fallback;
  }

  function resolveStrokeColor(r: Role): 'causal' | 'spurious' | 'incidental' | 'none' {
    if (r === 'causal' || r === 'spurious' || r === 'incidental') return r;
    if (r === 'authored') return 'causal'; // BRAINSTORM CH3 wow #1 "one green"
    return 'none'; // unlabeled
  }

  /** `0.34`, `0.28`, ... — two decimals, preserves the mono rhythm. */
  $: weightText = term.weight.toFixed(2);
</script>

<span
  class="pi-term"
  data-feature-id={term.feature_id}
  data-testid="pi-cell-line2-term"
  data-role={effectiveRole}
  data-stroke-color={strokeColor}
>
  {#if !leading}<span class="pi-term__op" aria-hidden="true"> + </span>{/if}<span
    class="pi-term__weight"
    >{weightText}</span
  ><span class="pi-term__dot" aria-hidden="true">·</span><span
    class="pi-term__abbrev"
    data-testid="pi-cell-abbrev"
  >{term.abbrev}</span>
</span>

<style>
  .pi-term {
    display: inline-block;
    font: var(--type-subannot); /* 7pt JetBrains Mono */
    white-space: nowrap;
    /* No transitions. No animations. DA #1. */
  }

  .pi-term__op,
  .pi-term__weight,
  .pi-term__dot {
    color: rgba(0, 0, 0, 0.8);
  }

  .pi-term__weight {
    font-weight: 500;
  }

  /* ------------------------------------------------------------------
   * The one permitted stroke-as-fill exception in the entire site.
   * DESIGN.md §Cross-cutting signature #5 line 295:
   *   "<PiCellLine2Underline> (CH3 only) renders
   *    border-bottom: 1px solid var(--role-X) as the fill below text.
   *    The Stylelint plugin role-color-stroke-only exempts only this
   *    file path."
   *
   * The three rules below are exactly what the DESIGN.md line
   * authorises. Identical written in CSS; the var(--role-*) token
   * reaches the paint layer through NO indirection. If the Stylelint
   * allowlist in tools/stylelint/role-color-stroke-only.js were
   * changed, this file (and only this file) would fail lint.
   * ------------------------------------------------------------------ */

  .pi-term__abbrev {
    /* Default (stroke-color=none → unlabeled). Transparent underline
       keeps the glyph's baseline position stable; when a role is
       assigned, the border-bottom-color is overridden by the selectors
       below. */
    border-bottom: var(--pi-cell-stroke-weight) solid transparent;
    padding-bottom: 0.5px;
    color: rgba(0, 0, 0, 0.92);
  }

  .pi-term[data-stroke-color='causal'] .pi-term__abbrev {
    border-bottom: 1px solid var(--role-causal);
  }

  .pi-term[data-stroke-color='spurious'] .pi-term__abbrev {
    border-bottom: 1px solid var(--role-spurious);
  }

  .pi-term[data-stroke-color='incidental'] .pi-term__abbrev {
    border-bottom: 1px solid var(--role-incidental);
  }
</style>
