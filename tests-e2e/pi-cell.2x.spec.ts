/*
 * pi-cell.2x.spec.ts — <PiCellComposition> snapshots at
 * deviceScaleFactor=2.
 *
 * DESIGN.md §Stage 2 handoff line 932:
 *   "<PiCellComposition> at 1× / 2× / mobile (200px) — the site's
 *    tightest typographic composition. ... If the two-layer cell can't
 *    render legibly at 60px desktop, the chapter design is re-opened
 *    with the DA, not bandaged."
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=ch3-picellcomposition';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('pi-cell-composition')).toBeVisible();
}

test.describe('<PiCellComposition> — desktop 2x', () => {
  test('60px envelope holds at 2x pixel-density', async ({ page }) => {
    await openStory(page, 'default');
    const bodyHeight = await page
      .locator('[data-testid="pi-cell--real"] .pi-cell__body')
      .evaluate((el) => el.getBoundingClientRect().height);
    // CSS pixels, not device pixels — 60px is the CSS-level envelope.
    expect(Math.round(bodyHeight)).toBe(60);
  });

  test('visual snapshot @2x: default', async ({ page }) => {
    await openStory(page, 'default');
    await expect(page).toHaveScreenshot('default@2x.png', { fullPage: false });
  });

  test('visual snapshot @2x: reader-tagged (the frame most readers see)', async ({
    page
  }) => {
    await openStory(page, 'two-x-endpoint');
    await expect(page).toHaveScreenshot('reader-tagged@2x.png', { fullPage: false });
  });

  test('visual snapshot @2x: extreme-min (tightest legibility test)', async ({ page }) => {
    await openStory(page, 'extreme-min');
    await expect(page).toHaveScreenshot('extreme-min@2x.png', { fullPage: false });
  });
});
