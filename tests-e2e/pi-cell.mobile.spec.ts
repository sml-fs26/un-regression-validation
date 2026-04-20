/*
 * pi-cell.mobile.spec.ts — 480px viewport spec for <PiCellComposition>.
 *
 * DESIGN.md §CH3 Mobile (line 655):
 *   "The 60px PI cell is the binding constraint. On mobile, the cell
 *    expands to 200px width to preserve line-2 legibility; the peer
 *    cell stacks below rather than beside, with the 45° dashed-gray
 *    stripe rotated to a horizontal divider rule."
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=ch3-picellcomposition';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('pi-cell-composition')).toBeVisible();
}

test.describe('<PiCellComposition> — mobile 480px', () => {
  test('cell width expands to 200px on mobile (DESIGN.md line 655)', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    const w = await page
      .locator('[data-testid="pi-cell--real"]')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.round(w)).toBe(200);
  });

  test('peer cell stacks BELOW the real cell (not beside)', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    const realBox = await page
      .locator('[data-testid="pi-cell--real"]')
      .evaluate((el) => el.getBoundingClientRect());
    const shufBox = await page
      .locator('[data-testid="pi-cell--shuffled"]')
      .evaluate((el) => el.getBoundingClientRect());
    // shuffled top > real top → stacked below.
    expect(shufBox.top).toBeGreaterThan(realBox.top);
    // And their horizontal centers are close (both near the same column).
    const realCx = realBox.left + realBox.width / 2;
    const shufCx = shufBox.left + shufBox.width / 2;
    expect(Math.abs(realCx - shufCx)).toBeLessThan(12);
  });

  test('45° stripe rotates to horizontal divider rule on mobile', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    const stripeBox = await page
      .locator('[data-testid="pi-cell-stripe"]')
      .evaluate((el) => el.getBoundingClientRect());
    // Horizontal rule: wider than tall.
    expect(stripeBox.width).toBeGreaterThan(stripeBox.height);
    expect(Math.round(stripeBox.width)).toBe(200);
    expect(stripeBox.height).toBeLessThan(16);
  });

  test('line 1 (cv-optimal bracket) remains legible at 11pt on mobile', async ({
    page
  }) => {
    await openStory(page, 'mobile-strip');
    const l1 = page.locator(
      '[data-testid="pi-cell--real"] [data-testid="pi-cell-line1"]'
    );
    const fontSize = await l1.evaluate((el) => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('11px');
    await expect(l1).toHaveText('[$78,400, $94,900]');
  });

  test('visual snapshot mobile: reader-tagged (peer stacks below)', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    await expect(page).toHaveScreenshot('mobile-reader-tagged.png', { fullPage: false });
  });

  test('visual snapshot mobile: default', async ({ page }) => {
    await openStory(page, 'default');
    await expect(page).toHaveScreenshot('mobile-default.png', { fullPage: false });
  });
});
