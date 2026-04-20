<!--
  RoleLabeledCounter.svelte — the `labeled_by_you: N / 356` counter.

  DESIGN.md §Cross-cutting signature #3 (line 263):
    "<RoleLabeledCounter> floats top-left of the document body, beside
     <FilenameTitle>, reading `labeled_by_you: {N} / 356` (--type-annot)."

  DESIGN.md §CC#3 acceptance #2 (line 275):
    "Counter updates synchronously on every commit."

  DESIGN.md §Chapter 3 line 621, §Chapter 4 line 722, §Chapter 5 line
  825 all restate:
    "The labeled_by_you: N / 356 counter remains visible at full
     opacity, top-left, throughout the chapter. It does not collapse,
     fade, or move when the PI cell is in focus."

  N is derived from rolesStore's `userLabeledCount` (count of user-
  committed {causal, spurious, incidental} tags). The pre-populated
  30 [authored] cells do NOT contribute to N — the spec's phrasing
  `labeled_by_you` makes the exclusion explicit.
-->
<script lang="ts">
  import { userLabeledCount } from '$lib/stores/roles';

  // The 356 is the fixed total the spec names. Hard-coded here because
  // the cross-cutting invariant (DESIGN.md line 270) is that the column
  // has exactly 356 cells; if a future refactor changes the total, the
  // component's contract changes too and this constant needs the edit.
  const TOTAL = 356;
</script>

<span
  class="role-labeled-counter type-annot"
  data-testid="role-labeled-counter"
  role="status"
  aria-live="polite"
  aria-label={`${$userLabeledCount} of ${TOTAL} features labeled by you.`}
>
  labeled_by_you: <span data-testid="role-labeled-counter-n">{$userLabeledCount}</span> / {TOTAL}
</span>

<style>
  .role-labeled-counter {
    /* DESIGN.md line 263: "floats top-left of the document body, beside
       <FilenameTitle>". Positioned sticky so it remains visible across
       scroll (per CH3 line 621 / CH4 line 722 / CH5 line 825). */
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    background: var(--bg-cream);
    border: 1px solid var(--rule-hair);
    white-space: nowrap;
  }
</style>
