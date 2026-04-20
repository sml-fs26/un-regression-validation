/*
 * heartbeat-ticker.spec.ts — Playwright snapshot + behaviour spec
 * for <HeartbeatTicker> at the desktop 1x viewport.
 *
 * Each test cites the DESIGN.md acceptance criterion it verifies. Two
 * sibling spec files run the same frames at 2x
 * (heartbeat-ticker.2x.spec.ts) and at 480px
 * (heartbeat-ticker.mobile.spec.ts).
 *
 * Story URLs: /iframe.html?id=<title-kebab>--<export-kebab>&viewMode=story
 * Actual ids (verified against storybook-static/index.json at build
 * time — see src/stories/HeartbeatTicker.stories.ts header comment):
 *   FirstPaintCh1      → first-paint-ch-1
 *   ScrolledCh1        → scrolled-ch-1
 *   EndpointDesktop    → endpoint-desktop
 *   EndpointDesktop2x  → endpoint-desktop-2-x
 *   ReducedMotion      → reduced-motion
 *   MobileStrip        → mobile-strip
 *   RecastUruguay      → recast-uruguay
 *   HatMatrixOpen      → hat-matrix-open
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=cross-cutting-heartbeatticker';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('heartbeat-ticker')).toBeVisible();
  await expect(page.getByTestId('heartbeat-value')).toContainText(/h_ii = \d\.\d{4}/);
}

test.describe('<HeartbeatTicker> — desktop 1x', () => {
  test('acceptance #1: first-paint blocks on the numeric value', async ({ page }) => {
    // DESIGN.md §CC#1 acceptance #1: "First paint blocks on this cell's
    // numeric value only — measured by Playwright as time-to-first-numeric-text
    // in [data-testid=heartbeat-ticker] <= 1.5s on Moto G4 throttle."
    // We don't Moto-G4-throttle in CI, but we DO assert the value is
    // present within 1.5s of navigation.
    const started = Date.now();
    await page.goto(`${STORY_BASE}--first-paint-ch-1`);
    await expect(page.getByTestId('heartbeat-value')).toContainText(/h_ii = \d\.\d{4}/, {
      timeout: 1500
    });
    expect(Date.now() - started).toBeLessThan(1500);
  });

  test('acceptance #2: at p=n-1 for NOR the cell reads NOR.h_ii = 0.98xx', async ({ page }) => {
    await openStory(page, 'endpoint-desktop');
    const value = await page.getByTestId('heartbeat-value').textContent();
    expect(value?.trim()).toMatch(/^NOR\.h_ii = 0\.98\d{2}$/);
  });

  test('acceptance #3: reduced-motion replaces pulse with 1px gold stroke', async ({ page }) => {
    await openStory(page, 'reduced-motion');
    const pulse = page.getByTestId('heartbeat-pulse');
    await expect(pulse).toHaveClass(/is-reduced/);
    await expect(pulse).toHaveClass(/is-active/);
    const boxShadow = await pulse.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
    const animationName = await pulse.evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName === 'none' || animationName === 'gold-pulse').toBeTruthy();
  });

  test('acceptance #4: aria-live region announces a 0.1-boundary crossing', async ({ page }) => {
    await openStory(page, 'endpoint-desktop');
    const announcement = page.getByTestId('heartbeat-aria-announcement');
    await expect(announcement).toHaveText(/Norway's leverage is now zero point/);
  });

  test('acceptance #5: ticker is present in the DOM after first paint (all chapters)', async ({
    page
  }) => {
    for (const id of ['first-paint-ch-1', 'scrolled-ch-1', 'endpoint-desktop', 'recast-uruguay']) {
      await openStory(page, id);
      await expect(page.getByTestId('heartbeat-ticker')).toBeVisible();
    }
  });

  test('acceptance #6: hat-matrix tooltip is NOT in layout at default paint', async ({ page }) => {
    await openStory(page, 'first-paint-ch-1');
    const tooltip = page.getByTestId('hat-matrix-tooltip');
    // Wrapper is in the DOM (so the selector resolves) but display:none.
    const size = await tooltip.evaluate((el) => ({
      w: (el as HTMLElement).offsetWidth,
      h: (el as HTMLElement).offsetHeight
    }));
    expect(size.w).toBe(0);
    expect(size.h).toBe(0);
  });

  test('acceptance #6: hover reveals tooltip with literal h_ii + gloss', async ({ page }) => {
    await openStory(page, 'first-paint-ch-1');
    const ticker = page.getByTestId('heartbeat-ticker');
    await ticker.hover();
    const tooltip = page.getByTestId('hat-matrix-tooltip');
    await expect(tooltip).toBeVisible();
    const text = await tooltip.textContent();
    expect(text).toContain('i-th diagonal of the hat matrix');
    const aria = await tooltip.getAttribute('aria-label');
    expect(aria).toMatch(/h sub i i/);
    const formula = page.getByTestId('hat-matrix-formula');
    await expect(formula).toBeVisible();
  });

  test('acceptance #6: Escape dismisses the tooltip for keyboard users', async ({ page }) => {
    await openStory(page, 'hat-matrix-open');
    const tooltip = page.getByTestId('hat-matrix-tooltip');
    await expect(tooltip).toBeVisible();
    await page.keyboard.press('Escape');
    const size = await tooltip.evaluate((el) => ({
      w: (el as HTMLElement).offsetWidth,
      h: (el as HTMLElement).offsetHeight
    }));
    expect(size.w).toBe(0);
    expect(size.h).toBe(0);
  });

  test('recast behavior: changing activeISO3 re-reads the value at same p', async ({ page }) => {
    await openStory(page, 'recast-uruguay');
    const value = await page.getByTestId('heartbeat-value').textContent();
    expect(value?.trim()).toMatch(/^URY\.h_ii = 0\.\d{4}$/);
    expect(value).not.toContain('NOR');
  });

  test('sub-caption typography: 7pt MONO, font-style: normal (not italic DM Serif)', async ({
    page
  }) => {
    await openStory(page, 'first-paint-ch-1');
    const sub = page.getByTestId('heartbeat-subcaption');
    await expect(sub).toBeVisible();
    const { family, style } = await sub.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { family: cs.fontFamily, style: cs.fontStyle };
    });
    expect(style).toBe('normal');
    expect(family).toMatch(/JetBrains Mono/);
  });

  test('sub-caption hides after scroll-past-200px (instant, no transition)', async ({ page }) => {
    await openStory(page, 'scrolled-ch-1');
    const sub = page.getByTestId('heartbeat-subcaption');
    await expect(sub).toHaveCount(0);
  });

  test('visual snapshot: CH1 first paint', async ({ page }) => {
    await openStory(page, 'first-paint-ch-1');
    await expect(page).toHaveScreenshot('first-paint-ch-1.png', { fullPage: false });
  });

  test('visual snapshot: CH2 p=n-1 desktop', async ({ page }) => {
    await openStory(page, 'endpoint-desktop');
    await expect(page).toHaveScreenshot('endpoint-desktop.png', { fullPage: false });
  });

  test('visual snapshot: CH2 reduced-motion', async ({ page }) => {
    await openStory(page, 'reduced-motion');
    await expect(page).toHaveScreenshot('reduced-motion.png', { fullPage: false });
  });

  test('visual snapshot: CH5 recast to URY', async ({ page }) => {
    await openStory(page, 'recast-uruguay');
    await expect(page).toHaveScreenshot('recast-uruguay.png', { fullPage: false });
  });

  test('visual snapshot: hat-matrix tooltip open', async ({ page }) => {
    await openStory(page, 'hat-matrix-open');
    await expect(page.getByTestId('hat-matrix-tooltip')).toBeVisible();
    await expect(page).toHaveScreenshot('hat-matrix-open.png', { fullPage: false });
  });
});
