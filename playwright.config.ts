/*
 * Playwright test configuration.
 *
 * Runs visual regression + behavioural spec against the built
 * Storybook in storybook-static/. The webServer spec below runs a
 * tiny Node static-file server (scripts/serve-storybook.mjs) so we
 * don't introduce yet another dev dependency.
 *
 * DESIGN.md §Test discipline line 106:
 *   "Visual regression: Playwright snapshots at 1×, 2×, and 480px for
 *    every adopted signature frame."
 *
 * Three projects, one per viewport, so a single `npm run test:e2e`
 * produces the full snapshot set.
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = 6106;

export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  expect: {
    // Snapshot tolerance: small enough to catch regressions, large
    // enough to absorb font-rasterization differences between CI and
    // local dev. Adjustable per-test via
    // toHaveScreenshot({ maxDiffPixelRatio: ... }).
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: 'disabled'
    }
  },
  // Single worker for deterministic screenshot ordering.
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'desktop-1x',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1
      },
      // Exclude the 2x and mobile suffixes from this project.
      // Desktop 1x runs the base spec files (no viewport-suffix).
      testMatch: /(?:heartbeat-ticker|role-column|pi-cell)\.spec\.ts$/
    },
    {
      name: 'desktop-2x',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 2
      },
      testMatch: /(?:heartbeat-ticker|role-column|pi-cell)\.2x\.spec\.ts$/
    },
    {
      name: 'mobile-480',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 480, height: 720 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      },
      testMatch: /(?:heartbeat-ticker|role-column|pi-cell)\.mobile\.spec\.ts$/
    }
  ],
  webServer: {
    command: `node scripts/serve-storybook.mjs ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
