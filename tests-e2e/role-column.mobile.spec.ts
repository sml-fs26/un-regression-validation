/*
 * role-column.mobile.spec.ts — 480px viewport spec for <RoleColumn>.
 *
 * DESIGN.md §CC#3 mobile (lines 528, 622, 724, 826):
 *   "On mobile: <RoleColumn> stays pinned-left in the horizontally-
 *    scrollable CSV viewport; ... <RoleLabeledCounter> remains top-left."
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=cross-cutting-rolecolumn';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('role-column')).toBeVisible();
  await expect(page.getByTestId('role-cell')).toHaveCount(356);
}

test.describe('<RoleColumn> — mobile 480px', () => {
  test('pinned-left: the role column sits at left=0 at 480px', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    const col = page.getByTestId('role-column');
    const box = await col.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return; // type-narrowing
    expect(Math.round(box.x)).toBe(0);
  });

  test('counter visibility: role-labeled-counter is present and top-left', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    const counter = page.getByTestId('role-labeled-counter');
    await expect(counter).toBeVisible();
    const box = await counter.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;
    // Top-left region: x small-ish, y below the very top (header has
    // padding); concrete bounds are lenient so the check is about
    // "pinned near the top-left" rather than pixel equality.
    expect(box.x).toBeLessThan(240);
    expect(box.y).toBeLessThan(120);
  });

  test('visual snapshot mobile: three-colors strip', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    await expect(page).toHaveScreenshot('mobile-strip.png', { fullPage: false });
  });

  test('visual snapshot mobile: default (unlabeled + authored)', async ({ page }) => {
    await openStory(page, 'default');
    await expect(page).toHaveScreenshot('mobile-default.png', { fullPage: false });
  });
});
