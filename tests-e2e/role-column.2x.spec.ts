/*
 * role-column.2x.spec.ts — <RoleColumn> snapshots at deviceScaleFactor=2.
 *
 * DESIGN.md §Test discipline line 106: Playwright snapshots at 1x, 2x,
 * and 480px. This file handles the 2x project.
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=cross-cutting-rolecolumn';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('role-column')).toBeVisible();
  await expect(page.getByTestId('role-cell')).toHaveCount(356);
}

test.describe('<RoleColumn> — desktop 2x', () => {
  test('visual snapshot @2x: default', async ({ page }) => {
    await openStory(page, 'default');
    await expect(page).toHaveScreenshot('default@2x.png', { fullPage: false });
  });

  test('visual snapshot @2x: three colors', async ({ page }) => {
    await openStory(page, 'three-colors');
    await expect(page).toHaveScreenshot('three-colors@2x.png', { fullPage: false });
  });

  test('visual snapshot @2x: dense-tagged (endpoint)', async ({ page }) => {
    await openStory(page, 'two-x-endpoint');
    await expect(page).toHaveScreenshot('dense-tagged@2x.png', { fullPage: false });
  });
});
