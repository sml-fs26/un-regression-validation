<!--
  PiCellComposition.svelte — the twin-cell arrangement from
  BRAINSTORM CH3 wow #2.

  DESIGN.md §CH3 component tree (lines 603-606):
    ├── <PiCellComposition>
    │   ├── <PiCell shuffled={false}/>        // Norway's real PI
    │   └── <PiCell shuffled={true}/>         // peer cell, identical grammar
    ├── <PiCellLine2Underline ×N/>            // EXCEPTION: stroke-fills below text
                                                 // colors subscribe to <RoleColumn>

  DESIGN.md §CH3 rejected alternatives disposition (line 587):
    "#2 (shuffled-null as peer cell): Absorbed as adjacent twin.
     Renders in the identical two-layer grammar immediately to the
     right of the real PI cell, with pi_95%_shuffled header
     (45° dashed-gray stripe in the gutter)."

  DESIGN.md §CH3 mobile (line 655):
    "the peer cell stacks below rather than beside, with the 45°
     dashed-gray stripe rotated to a horizontal divider rule."

  This component is a prototype surface: its only job is to arrange
  the two <PiCell> instances and render the 45° dashed-gray divider
  stripe between them. No interaction state, no α-scrub, no
  RoleColumn linkage — all of that arrives in step 8 when the CH3
  route assembles around this prototype.

  DESIGN.md §Stage 2 handoff line 932:
    "<PiCellComposition> at 1× / 2× / mobile (200px) — the site's
     tightest typographic composition. Per BRAINSTORM CH3 wow #1
     prereq, this is prototyped before any other chapter content.
     If the two-layer cell can't render legibly at 60px desktop, the
     chapter design is re-opened with the DA, not bandaged."

  The 200px mobile claim is enforced by <PiCell>'s @media query; the
  composition's stacking (horizontal → vertical) + stripe rotation
  is this file's responsibility.
-->
<script lang="ts">
  import type { PiBundle, PiStep } from '$lib/stores/pi';
  import PiCell from './PiCell.svelte';

  /**
   * The real (non-shuffled) bundle for the active country — loaded
   * via loadPiBundle('/data/nor/pi_decomposition.json') in the parent.
   */
  export let real: PiBundle;
  /**
   * The shuffled-Y peer bundle — loadPiBundle('/data/nor/pi_shuffled.json').
   */
  export let shuffled: PiBundle;
  /**
   * Index into `steps` selecting which α-state to render. Defaults to
   * the real bundle's cv_optimal_index. Step 8 will bind this to the
   * α-scrub state.
   */
  export let stepIndex: number | null = null;

  // Sanity guards — the bundles must agree on iso3 and have the same
  // number of steps so scrubbing aligns.
  $: if (real.iso3 !== shuffled.iso3) {
    throw new Error(
      `PiCellComposition: real iso3=${real.iso3} does not match shuffled=${shuffled.iso3}`
    );
  }
  $: if (real.steps.length !== shuffled.steps.length) {
    throw new Error(
      `PiCellComposition: real has ${real.steps.length} steps; shuffled has ${shuffled.steps.length}`
    );
  }
  $: if (!real.shuffled && shuffled.shuffled) {
    /* ok: expected shape */
  } else {
    // Silently accepted — the bundles' `shuffled` fields are a
    // self-descriptive hint; the parent is responsible for passing
    // the right files.
  }

  $: activeIndex =
    stepIndex !== null && stepIndex >= 0 && stepIndex < real.steps.length
      ? stepIndex
      : real.cv_optimal_index;

  $: realStep = real.steps[activeIndex] as PiStep;
  $: shuffledStep = shuffled.steps[activeIndex] as PiStep;
</script>

<section
  class="pi-composition"
  data-testid="pi-cell-composition"
  data-step-label={realStep.step_label}
  aria-label="Norway's PI cell with its shuffled peer"
>
  <PiCell shuffled={false} step={realStep} />

  <!-- The 45° dashed-gray divider stripe. BRAINSTORM CH3 wow #2 +
       DESIGN.md §CH3 #2-disposition line 587 + DESIGN.md line 655.
       Desktop: vertical stripe between real and peer cells. Mobile:
       rotated to a horizontal divider rule. Implemented as a
       background-image on the element so we don't introduce a
       rasterised asset. --dashed-gray is the canonical token (tokens.css
       line 52). -->
  <div
    class="pi-composition__stripe"
    data-testid="pi-cell-stripe"
    aria-hidden="true"
  ></div>

  <PiCell shuffled={true} step={shuffledStep} />
</section>

<style>
  .pi-composition {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0;
    /* The prototype lives inside the CSV viewport in the production
       route; step 8 places <RoleColumn> to the left and the data
       cells around it. Here we center the composition in its
       Storybook harness. */
  }

  .pi-composition__stripe {
    /* 45°-dashed-gray stripe: 1px dashes at 45° angle, --dashed-gray
       token. Rendered as a repeating linear gradient so no rasterised
       asset is required. */
    width: 12px;
    align-self: stretch;
    background-image: repeating-linear-gradient(
      45deg,
      var(--dashed-gray) 0,
      var(--dashed-gray) 1px,
      transparent 1px,
      transparent 6px
    );
    /* No transitions. No animations. DA #1. */
  }

  /* Mobile ≤ 480px: peer cell stacks BELOW the real cell, with the
     45° stripe rotated to a horizontal divider rule. DESIGN.md
     line 655 is verbatim. */
  @media (max-width: 480px) {
    .pi-composition {
      flex-direction: column;
    }
    .pi-composition__stripe {
      width: 200px; /* matches the <PiCell> mobile width at line 655 */
      height: 12px;
      align-self: stretch;
      /* Horizontal divider rule: rotate the stripe pattern 90° so the
         same dashed-gray diagonal runs across the page instead of down
         it. "stripe rotated to a horizontal divider rule" (line 655). */
      background-image: repeating-linear-gradient(
        -45deg,
        var(--dashed-gray) 0,
        var(--dashed-gray) 1px,
        transparent 1px,
        transparent 6px
      );
    }
  }
</style>
