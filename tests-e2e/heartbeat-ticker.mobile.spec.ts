/*
 * heartbeat-ticker.mobile.spec.ts — 480px viewport snapshot + behaviour.
 *
 * DESIGN.md §CC#1 Invariants (mobile):
 *   "Mobile: collapses to a 14px-tall persistent top-strip, full-width,
 *    flush against the viewport top edge; sub-caption stays as JetBrains
 *    Mono 7pt via --type-subcaption (positioned beside line 1, not below;
 *    remains font-style: normal)."
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=cross-cutting-heartbeatticker';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('heartbeat-ticker')).toBeVisible();
  await expect(page.getByTestId('heartbeat-value')).toContainText(/h_ii = \d\.\d{4}/);
}

test.describe('<HeartbeatTicker> — mobile 480px', () => {
  test('collapses to a ~14px-tall persistent top-strip, full-width, flush at top=0', async ({
    page
  }) => {
    await openStory(page, 'mobile-strip');
    const ticker = page.getByTestId('heartbeat-ticker');
    const box = await ticker.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return; // type-narrowing
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.y)).toBe(0);
    expect(Math.round(box.width)).toBe(480);
    // Height: 14px strip per DESIGN.md §CC#1 Invariants mobile. Allow a
    // small padding tolerance since border-box can vary by 1-2px.
    expect(Math.round(box.height)).toBeLessThanOrEqual(20);
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(10);
  });

  test('visual snapshot mobile: collapse', async ({ page }) => {
    await openStory(page, 'mobile-strip');
    await expect(page).toHaveScreenshot('mobile-strip.png', { fullPage: false });
  });

  test('visual snapshot mobile: CH1 first paint', async ({ page }) => {
    await openStory(page, 'first-paint-ch-1');
    await expect(page).toHaveScreenshot('mobile-first-paint-ch-1.png', { fullPage: false });
  });
});
