/*
 * HeartbeatTicker.stories.ts — Storybook stories for the Stage 2 step 2
 * deliverable.
 *
 * Each story maps to one of the five acceptance-criteria scenarios in
 * DESIGN.md §Cross-cutting signature #1 (lines 238-244) + the mobile
 * invariant (line 236) + the recast behavior (line 231). The Playwright
 * snapshot spec in tests-e2e/heartbeat-ticker.spec.ts walks this exact
 * set of stories.
 *
 * Story export names are chosen so Storybook's auto-kebab produces
 * stable ids without digit-adjacency surprises. The id table is:
 *
 *   export name            → storybook id (cross-cutting-heartbeatticker--<x>)
 *   -----------            --------------------------------------------------
 *   FirstPaintCh1          → first-paint-ch-1
 *   ScrolledCh1            → scrolled-ch-1
 *   EndpointDesktop        → endpoint-desktop
 *   EndpointDesktop2x      → endpoint-desktop-2-x
 *   ReducedMotion          → reduced-motion
 *   MobileStrip            → mobile-strip
 *   RecastUruguay          → recast-uruguay
 *   HatMatrixOpen          → hat-matrix-open
 *
 * The tests use these ids directly. If you rename an export, rename
 * the corresponding spec id too — snapshot baselines are keyed on it.
 */

import type { Meta, StoryObj } from '@storybook/svelte';
import HeartbeatTickerHarness from './HeartbeatTickerHarness.svelte';

const meta = {
  title: 'Cross-cutting/HeartbeatTicker',
  component: HeartbeatTickerHarness,
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    scenario: {
      control: 'select',
      options: [
        'ch1-first-paint',
        'ch1-scrolled',
        'ch2-pn-1-desktop',
        'ch2-reduced-motion',
        'ch2-mobile',
        'ch5-recast-to-ury'
      ]
    },
    openTooltip: { control: 'boolean' }
  }
} satisfies Meta<HeartbeatTickerHarness>;

export default meta;

type Story = StoryObj<typeof meta>;

// CH1 first paint — sub-caption visible, full-fit value.
export const FirstPaintCh1: Story = {
  name: 'CH1 · first paint (desktop 1x)',
  args: { scenario: 'ch1-first-paint', openTooltip: false }
};

// CH1 post-scroll — sub-caption dismissed instantly (no transition).
export const ScrolledCh1: Story = {
  name: 'CH1 · scrolled past 200px (desktop 1x)',
  args: { scenario: 'ch1-scrolled', openTooltip: false }
};

// CH2 scrub at p=n-1; pulse active. Acceptance #2.
export const EndpointDesktop: Story = {
  name: 'CH2 · p = n−1 (desktop 1x)',
  args: { scenario: 'ch2-pn-1-desktop', openTooltip: false }
};

// CH2 scrub at p=n-1; 2x pixel-density (dpr=2 via Playwright project).
export const EndpointDesktop2x: Story = {
  name: 'CH2 · p = n−1 (desktop 2x)',
  args: { scenario: 'ch2-pn-1-desktop', openTooltip: false }
};

// Reduced-motion variant. Acceptance #3.
export const ReducedMotion: Story = {
  name: 'CH2 · reduced-motion gold stroke',
  args: { scenario: 'ch2-reduced-motion', openTooltip: false }
};

// Mobile 480px collapse. DESIGN.md §CC#1 Invariants (mobile).
export const MobileStrip: Story = {
  name: 'Mobile (480px) · 14px top-strip',
  args: { scenario: 'ch2-mobile', openTooltip: false }
};

// CH5 recast. Acceptance covers recast-behavior clause.
export const RecastUruguay: Story = {
  name: 'CH5 · recast to URY',
  args: { scenario: 'ch5-recast-to-ury', openTooltip: false }
};

// Hat-matrix tooltip revealed. Acceptance #6.
export const HatMatrixOpen: Story = {
  name: 'Hat-matrix tooltip · open on focus',
  args: { scenario: 'ch1-first-paint', openTooltip: true }
};
