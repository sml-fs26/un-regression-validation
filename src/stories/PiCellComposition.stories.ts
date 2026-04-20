/*
 * PiCellComposition.stories.ts — Storybook stories for Stage 2 Step 4.
 *
 * DESIGN.md §Stage 2 handoff line 932:
 *   "<PiCellComposition> at 1× / 2× / mobile (200px) — the site's
 *    tightest typographic composition. Per BRAINSTORM CH3 wow #1
 *    prereq, this is prototyped before any other chapter content."
 *
 * Each story maps to a Playwright snapshot in
 * tests-e2e/pi-cell*.spec.ts. Story ids (auto-kebab) for the specs to
 * target:
 *
 *   export name         → storybook id (ch3-picellcomposition--<x>)
 *   -----------         -----------------------------------------------
 *   Default             → default
 *   ReaderTagged        → reader-tagged
 *   ReaderOverrides     → reader-overrides
 *   ExtremeMin          → extreme-min
 *   ExtremeMax          → extreme-max
 *   ReducedMotion       → reduced-motion
 *   Recast              → recast
 *   MobileStrip         → mobile-strip
 *   TwoXEndpoint        → two-x-endpoint
 */

import type { Meta, StoryObj } from '@storybook/svelte';
import PiCellCompositionHarness from './PiCellCompositionHarness.svelte';

const meta = {
  title: 'CH3/PiCellComposition',
  component: PiCellCompositionHarness,
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    scenario: {
      control: 'select',
      options: [
        'default',
        'reader-tagged',
        'reader-overrides',
        'extreme-min',
        'extreme-max',
        'reduced-motion',
        'recast'
      ]
    }
  }
} satisfies Meta<PiCellCompositionHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No reader tags; line-2 underlines inherit `role_at_build`. */
export const Default: Story = {
  name: 'Default · role_at_build fallback (desktop 1x)',
  args: { scenario: 'default' }
};

/** Reader agrees with build. Both stores drive the same colors. */
export const ReaderTagged: Story = {
  name: 'Reader tags match build (desktop 1x)',
  args: { scenario: 'reader-tagged' }
};

/**
 * Reader disagrees with build. `absurd_02` was built as `spurious`
 * but the reader tagged it `causal` — the underline is green. DESIGN.md
 * line 619: "every <PiCellLine2Underline> derives its border-bottom-color
 * from the corresponding <RoleCell>'s assignment via the Svelte store."
 */
export const ReaderOverrides: Story = {
  name: 'Reader overrides build (desktop 1x)',
  args: { scenario: 'reader-overrides' }
};

/** α near 0; 12 terms in the line-2 equation (prototype stand-in for
 *  the 356-term pandemonium referenced in DESIGN.md state machine line 634). */
export const ExtremeMin: Story = {
  name: 'Extreme α ≈ 0 · 12-term line 2 (desktop 1x)',
  args: { scenario: 'extreme-min' }
};

/** α = ∞; empty state per state machine line 635. */
export const ExtremeMax: Story = {
  name: 'Extreme α = ∞ · empty cells (desktop 1x)',
  args: { scenario: 'extreme-max' }
};

/** Reduced-motion. Because the PI cell has zero animation, the frame
 *  is visually identical to Default. The snapshot proves the claim. */
export const ReducedMotion: Story = {
  name: 'Reduced-motion · no transitions to suppress',
  args: { scenario: 'reduced-motion' }
};

/** Recast to URY; the cell renders identically. */
export const Recast: Story = {
  name: 'Recast · ISO3 swap, identity preserved',
  args: { scenario: 'recast' }
};

/** Mobile 480px. Peer cell stacks below; stripe rotates. */
export const MobileStrip: Story = {
  name: 'Mobile (480px) · peer stacks below',
  args: { scenario: 'reader-tagged' }
};

/** 2x pixel-density frame — the binding-constraint claim at 60px 2x. */
export const TwoXEndpoint: Story = {
  name: 'Desktop 2x · reader-tagged',
  args: { scenario: 'reader-tagged' }
};
