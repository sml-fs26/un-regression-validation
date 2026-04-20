/*
 * heartbeat-ticker.2x.spec.ts — same component, deviceScaleFactor=2.
 *
 * DESIGN.md §Test discipline line 106: Playwright snapshots at 1x, 2x,
 * and 480px. This file handles the 2x project (configured in
 * playwright.config.ts with deviceScaleFactor=2).
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=cross-cutting-heartbeatticker';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('heartbeat-ticker')).toBeVisible();
  await expect(page.getByTestId('heartbeat-value')).toContainText(/h_ii = \d\.\d{4}/);
}

test.describe('<HeartbeatTicker> — desktop 2x', () => {
  test('visual snapshot @2x: CH1 first paint', async ({ page }) => {
    await openStory(page, 'first-paint-ch-1');
    await expect(page).toHaveScreenshot('first-paint-ch-1@2x.png', { fullPage: false });
  });

  test('visual snapshot @2x: CH2 p=n-1 desktop', async ({ page }) => {
    await openStory(page, 'endpoint-desktop-2-x');
    await expect(page).toHaveScreenshot('endpoint-desktop@2x.png', { fullPage: false });
  });

  test('visual snapshot @2x: CH2 reduced-motion', async ({ page }) => {
    await openStory(page, 'reduced-motion');
    await expect(page).toHaveScreenshot('reduced-motion@2x.png', { fullPage: false });
  });
});
