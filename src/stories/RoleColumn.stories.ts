/*
 * RoleColumn.stories.ts — Storybook stories for Stage 2 Step 3.
 *
 * Each story maps to one Playwright snapshot in tests-e2e/role-column*.spec.ts.
 * Story ids (auto-kebab) for the specs to target:
 *
 *   export name            → storybook id (cross-cutting-rolecolumn--<x>)
 *   -----------            ------------------------------------------------
 *   Default                → default
 *   SingleTagged           → single-tagged
 *   ThreeColors            → three-colors
 *   DenseTagged            → dense-tagged
 *   ReducedMotion          → reduced-motion
 *   Recast                 → recast
 *   MobileStrip            → mobile-strip
 *   TwoXEndpoint           → two-x-endpoint
 *
 * If you rename an export, rename the corresponding spec id too —
 * snapshot baselines are keyed on it.
 */

import type { Meta, StoryObj } from '@storybook/svelte';
import RoleColumnHarness from './RoleColumnHarness.svelte';

const meta = {
  title: 'Cross-cutting/RoleColumn',
  component: RoleColumnHarness,
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    scenario: {
      control: 'select',
      options: [
        'default',
        'single-tagged',
        'three-colors',
        'dense-tagged',
        'reduced-motion',
        'recast'
      ]
    }
  }
} satisfies Meta<RoleColumnHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

// Default: 326 unlabeled + 30 [authored]. Counter reads 0 / 356.
export const Default: Story = {
  name: 'Default · unlabeled + authored (desktop 1x)',
  args: { scenario: 'default' }
};

// One spurious tag — exercises the red --role-spurious stroke.
export const SingleTagged: Story = {
  name: 'Single spurious tag (desktop 1x)',
  args: { scenario: 'single-tagged' }
};

// Three tags, one per role — all three strokes in the same frame.
export const ThreeColors: Story = {
  name: 'Three colors · causal / spurious / incidental (desktop 1x)',
  args: { scenario: 'three-colors' }
};

// Counter reads labeled_by_you: 15 / 356.
export const DenseTagged: Story = {
  name: 'Dense tagging · 15 / 356 (desktop 1x)',
  args: { scenario: 'dense-tagged' }
};

// Reduced-motion variant. Acceptance #3: "Reduced-motion has no effect."
export const ReducedMotion: Story = {
  name: 'Reduced-motion · three colors unchanged',
  args: { scenario: 'reduced-motion' }
};

// Recast: the role column persists across ISO3 swap.
export const Recast: Story = {
  name: 'Recast to URY · tags persist',
  args: { scenario: 'recast' }
};

// Mobile 480px strip — pinned-left column within a horizontally scrollable CSV.
export const MobileStrip: Story = {
  name: 'Mobile (480px) · pinned-left within scroll',
  args: { scenario: 'three-colors' }
};

// 2x pixel-density frame at the dense-tagged endpoint.
export const TwoXEndpoint: Story = {
  name: 'Desktop 2x · dense-tagged',
  args: { scenario: 'dense-tagged' }
};
