<!--
  PiCell.svelte — a single PI cell in CH3's two-layer grammar.

  DESIGN.md §CH3 component tree (lines 603-605):
    ├── <PiCellComposition>
    │   ├── <PiCell shuffled={false}/>        // Norway's real PI
    │   └── <PiCell shuffled={true}/>         // peer cell, identical grammar

  DESIGN.md §CH3 acceptance criteria (lines 661-663):
    1. The PI cell renders two typographic layers within a single
       60px-tall cell at 1× and 2× resolutions; mobile uses the 200px
       alternative spec.
    2. Line 1 reads `[$78,400, $94,900]` at CV-optimal α.
    3. Line 2's underlines color via the reader's `roleAssignments`.

  BRAINSTORM CH3 wow #1 (line 109):
    "Line 1, 11pt gold mono: `[$78,400, $94,900]`.
     Line 2, 7pt mono directly beneath:
     `= 0.34·num + 0.28·mcd + 0.19·scr + 0.11·bw + 0.08·rule`.
     Each abbreviation on line 2 carries a 1px role-stroke underline —
     in the reader's own CH1 palette. Four red underlines. One green.
     ... The narrow interval and the absurd equation that produced it
     share a cell border and cannot be visually separated."

  DESIGN.md §CH3 mobile (line 655):
    "The 60px PI cell is the binding constraint. On mobile, the cell
     expands to 200px width to preserve line-2 legibility; the peer
     cell stacks below rather than beside, with the 45° dashed-gray
     stripe rotated to a horizontal divider rule."

  This component is the two-layer cell itself. The stacking + divider
  stripe + right-of-RoleColumn placement is handled by
  <PiCellComposition>. This component takes a single PiStep and
  renders it.

  For the step-4 prototype, the parent passes the cv-optimal step
  directly; step 8 adds the α-scrub layer that selects the step by
  scroll position.

  Typography budget (DA #10): this cell uses --type-data for line 1
  (11pt JBM Medium; the BRAINSTORM "gold mono" is achieved via
  `color: var(--gold)`) and --type-subannot for line 2 (7pt JBM). No
  DM Serif italic — CH3's single italic line lives in <Ch3ItalicLine>
  (step 8), not here.

  aria:
    - The cell uses role="group" + aria-label so screen readers get a
      coherent announcement ("Norway's PI cell: 78,400 to 94,900;
      equals 0.34 times num plus 0.28 times mcd ..."). Because the
      point estimate and abbreviations carry pedagogy, we build the
      aria-label from the step data rather than relying on visual text.
-->
<script lang="ts">
  import type { PiStep } from '$lib/stores/pi';
  import { formatCiBracket } from '$lib/stores/pi';
  import PiCellLine2Underline from './PiCellLine2Underline.svelte';

  /**
   * The `_shuffled` peer cell per BRAINSTORM CH3 wow #2: same grammar,
   * different data. The parent <PiCellComposition> passes shuffled=true
   * for the right/bottom twin.
   */
  export let shuffled: boolean = false;
  /**
   * The α step to render. Step 4's prototype passes the cv_optimal
   * step directly; step 8's CH3 route will swap this reactively as
   * the reader scrubs α.
   */
  export let step: PiStep;

  $: line1 = formatCiBracket(step.ci);
  $: isEmpty = step.terms.length === 0;

  /** The header label per BRAINSTORM CH3 wow #2 line 117. The peer cell
   *  carries `pi_95%_shuffled`; the real cell carries `pi_95%`. */
  $: headerLabel = shuffled ? 'pi_95%_shuffled' : 'pi_95%';

  /** Build a flat aria-label from the step — spoken as a single block. */
  $: ariaLabel = (() => {
    const who = shuffled ? 'shuffled peer cell' : `${step ? 'PI cell' : ''}`;
    if (isEmpty) return `${who}; empty at α equals infinity.`;
    const bracket = line1 || 'empty bracket';
    const eq = step.terms
      .map((t, i) => {
        const op = i === 0 ? 'equals ' : 'plus ';
        return `${op}${t.weight.toFixed(2)} times ${t.abbrev}`;
      })
      .join(', ');
    return `${who}; ${bracket}; ${eq}.`;
  })();
</script>

<article
  class="pi-cell"
  class:is-shuffled={shuffled}
  class:is-empty={isEmpty}
  data-testid={shuffled ? 'pi-cell--shuffled' : 'pi-cell--real'}
  data-step-label={step.step_label}
  role="group"
  aria-label={ariaLabel}
>
  <!-- The CSV column header above the cell. 14pt DM Serif small-caps
       per --type-head. Not italic; unrationed. Labeled 'pi_95%' /
       'pi_95%_shuffled' per BRAINSTORM CH3 wow #2. -->
  <header class="pi-cell__header type-head" data-testid="pi-cell-header">
    {headerLabel}
  </header>

  <div class="pi-cell__body">
    <!-- Line 1: 11pt gold mono bracket. DESIGN.md §CH3 state machine
         line 633: `line 1: [$78,400, $94,900]`. -->
    <div class="pi-cell__line1 type-data" data-testid="pi-cell-line1">
      {line1}
    </div>

    <!-- Line 2: 7pt mono equation; each term is a <PiCellLine2Underline>
         with its own role-colored underline. -->
    <div class="pi-cell__line2" data-testid="pi-cell-line2">
      {#each step.terms as term, i (term.feature_id)}
        <PiCellLine2Underline {term} leading={i === 0} />
      {/each}
    </div>
  </div>
</article>

<style>
  /* The site's tightest composition: two typographic layers share one
     cell border at exactly 60px height on desktop (DESIGN.md acceptance
     #1 line 661). The header + body total 60px; the header is the
     14pt small-caps column label, the body holds line 1 + line 2. */

  .pi-cell {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    /* Desktop 1× / 2×: body height = 60px per DESIGN.md line 661
       ("single 60px-tall cell"). The header sits above — matching how
       a CSV's column header sits above its data cells. The body is
       border-box sized so padding does not expand it past 60px. */
    width: 260px;
    background: var(--bg-cream);
    border: 1px solid rgba(0, 0, 0, 0.22); /* the single cell border that
         the two layers share — BRAINSTORM wow #1 line 109 */
  }

  .pi-cell__header {
    padding: 2px 8px;
    border-bottom: 1px solid var(--rule-hair);
    /* The shuffled peer cell's header carries a 45°-dashed-gray hint
       in the gutter per BRAINSTORM CH3 wow #2 line 118. The stripe
       itself is a sibling in <PiCellComposition>; here we only mark
       the header subtly so the reader's saccade reads "same grammar,
       different source". */
    letter-spacing: var(--head-tracking);
    text-transform: lowercase; /* filename-token register; not the CSV header case */
    color: rgba(0, 0, 0, 0.8);
  }

  .is-shuffled .pi-cell__header {
    color: rgba(0, 0, 0, 0.55); /* slightly muted without color variation */
  }

  .pi-cell__body {
    box-sizing: border-box;
    height: 60px; /* DESIGN.md acceptance #1 line 661: "single 60px-tall cell" */
    padding: 6px 10px 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    overflow: hidden; /* at α=0 the 356-term pandemonium is clipped;
       acceptance criterion #1 only claims legibility at cv-optimal. */
  }

  .pi-cell__line1 {
    /* 11pt JetBrains Mono via --type-data. "gold mono" per BRAINSTORM
       CH3 wow #1 line 109 → `color: var(--gold)`. */
    color: var(--gold);
    letter-spacing: 0.01em;
    white-space: nowrap;
    min-height: 14px; /* line-box height at 11px * 1.35 */
  }

  .pi-cell__line2 {
    /* 7pt JBM; the actual font is set inside each <PiCellLine2Underline>
       via .pi-term { font: var(--type-subannot); } so the per-term
       underline inherits consistently. */
    line-height: 1.25;
    white-space: nowrap;
    /* A slight overflow-ellipsis at the 260px desktop width keeps the
       cell from buckling if a future fixture adds a sixth term. The
       snapshot baseline is with the fixture's 5 terms at cv-optimal. */
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* α=∞ (empty state, DESIGN.md state machine line 635): line 1 empty,
     line 2 empty. The cell still renders a 60px border so the
     composition's visual rhythm is preserved during α-scrub. */
  .pi-cell.is-empty .pi-cell__line1,
  .pi-cell.is-empty .pi-cell__line2 {
    color: rgba(0, 0, 0, 0.2);
  }

  /* Mobile ≤ 480px: "cell expands to 200px width to preserve line-2
     legibility" (DESIGN.md line 655). The 60px body height is the
     binding constraint and does not change. */
  @media (max-width: 480px) {
    .pi-cell {
      /* box-sizing: border-box inherited from above → the literal
         200px width includes the 1px borders per DESIGN.md line 655. */
      width: 200px;
    }
    .pi-cell__line2 {
      /* Wrap instead of ellipsis on mobile — line-2 legibility is the
         priority the design acceptance #1 + line 655 both flag. */
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
    }
    .pi-cell__body {
      /* Allow a hair more vertical room if the wrapped equation spills
         past a single mono line, without breaking the 60px claim at
         desktop. Mobile spec (line 655) privileges legibility over
         exact 60px. */
      height: auto;
      min-height: 60px;
    }
  }
</style>
