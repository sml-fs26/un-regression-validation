/*
 * Storybook configuration — entrypoint.
 *
 * DESIGN.md §Stage 2 handoff → Build order item 2:
 *   "<HeartbeatTicker> as a standalone story (Storybook + Playwright snapshot)."
 *
 * The Playwright snapshot tests in tests-e2e/heartbeat-ticker.spec.ts
 * read the *built* Storybook under storybook-static/, navigating to
 * each story's iframe URL and asserting a pixel-level snapshot at the
 * three viewports. This file tells Storybook where the stories live.
 */

import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  // `.stories.svelte` files colocated with the component surface.
  // Step 2 ships HeartbeatTicker.stories.svelte; steps 3 and 4 add
  // RoleColumn + PiCellComposition stories here.
  stories: ['../src/stories/**/*.stories.@(ts|svelte)'],
  addons: [
    // Essentials bundles controls + actions + viewport + backgrounds +
    // docs; the viewport addon is what lets us inject the 1x / 2x / 480px
    // viewport sizes the spec requires.
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/sveltekit',
    options: {}
  },
  core: {
    disableTelemetry: true
  },
  // Expose /static/ at the root of the served Storybook so fetch('/data/...')
  // resolves to the same fixtures SvelteKit serves in production.
  staticDirs: ['../static'],
  // The spec forbids runtime motion libraries. The build must not pull
  // any transitively. Vite's dep-optimization + the
  // `forbidden-libraries-check.js` auditor cover this; Storybook
  // inherits the project's Vite config so no extra config is needed.
  docs: {
    autodocs: false
  }
};

export default config;
