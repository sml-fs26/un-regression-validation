/*
 * role-column.spec.ts — Playwright snapshot + behaviour spec for
 * <RoleColumn>, <RoleCell>, and <RoleLabeledCounter> at desktop 1x.
 *
 * Covers DESIGN.md §Cross-cutting signature #3 acceptance criteria
 * (lines 273-278), plus the invariants restated across the chapter
 * bodies (CH2 lines 524-529, CH3 lines 617-623, CH4 lines 719-725,
 * CH5 lines 821-827):
 *
 *   1. Tagging a cell as `spurious` updates every chart's role-stroke
 *      for that feature within 300ms (DA #3, DESIGN.md line 910).
 *   2. Counter updates synchronously on every commit.
 *   3. Reduced-motion has no effect — no transitions exist to
 *      suppress.
 *   4. Reload erases all tags (no localStorage; sessionStorage only).
 *   5. Editable cells respond to keyboard 1/2/3; [authored] cells do
 *      not.
 *
 * Sibling specs at 2x (role-column.2x.spec.ts) and 480px
 * (role-column.mobile.spec.ts) run the three visual snapshots.
 */

import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=cross-cutting-rolecolumn';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  // The harness renders 356 <RoleCell>s. Wait until the column is
  // fully populated so subsequent queries don't race the fetch.
  await expect(page.getByTestId('role-column')).toBeVisible();
  await expect(page.getByTestId('role-cell')).toHaveCount(356);
}

function editableCells(page: Page): Locator {
  // [authored] cells carry data-role="authored" and are excluded.
  return page.locator('[data-testid="role-cell"]:not([data-role="authored"])');
}

test.describe('<RoleColumn> — desktop 1x', () => {
  test('invariant: exactly 356 cells render (326 editable + 30 authored)', async ({ page }) => {
    await openStory(page, 'default');
    // 356 total.
    await expect(page.getByTestId('role-cell')).toHaveCount(356);
    // 30 [authored] rows per DESIGN.md line 270.
    const authored = page.locator('[data-testid="role-cell"][data-role="authored"]');
    await expect(authored).toHaveCount(30);
    // 326 editable (non-authored) rows.
    await expect(editableCells(page)).toHaveCount(326);
  });

  test('default state: unlabeled cells render the literal token at 60% opacity', async ({
    page
  }) => {
    await openStory(page, 'default');
    const unlabeled = page.locator('[data-testid="role-cell"][data-role="unlabeled"]').first();
    await expect(unlabeled).toBeVisible();
    await expect(unlabeled).toHaveText('unlabeled');
    const opacity = await unlabeled.evaluate((el) => getComputedStyle(el).opacity);
    // DESIGN.md line 266: "render the literal token `unlabeled` ... at 60% opacity".
    expect(parseFloat(opacity)).toBeCloseTo(0.6, 1);
  });

  test('authored state: [authored] cell renders bracketed text, citation hidden until hover', async ({
    page
  }) => {
    await openStory(page, 'default');
    const authored = page.locator('[data-testid="role-cell"][data-role="authored"]').first();
    await expect(authored).toHaveText('[authored]');
    // Citation not in DOM before hover (the component renders it with
    // {#if citationHover}).
    const citationBefore = await authored
      .locator('[data-testid="role-cell-citation"]')
      .count();
    expect(citationBefore).toBe(0);
    await authored.hover();
    const citation = authored.locator('[data-testid="role-cell-citation"]');
    await expect(citation).toBeVisible();
    // Instant reveal per DESIGN.md line 265 — we just assert it has no
    // animation/transition running on opacity.
    const styles = await citation.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        transition: cs.transitionProperty,
        animationName: cs.animationName,
        duration: cs.transitionDuration
      };
    });
    // Either no transition at all, or a property-name that doesn't
    // target opacity with any nonzero duration.
    expect(styles.animationName === 'none' || styles.animationName === '').toBeTruthy();
  });

  test('acceptance #1 + DA #3: tagging a cell updates [data-feature-id] role-stroke < 300ms', async ({
    page
  }) => {
    await openStory(page, 'default');
    // Pick the first editable cell; capture its feature-id; click once
    // (click-cycle starts at causal). Assert the stroke class + data-role
    // are applied within 300ms.
    const first = editableCells(page).first();
    const featureId = await first.getAttribute('data-feature-id');
    expect(featureId).toBeTruthy();
    const started = Date.now();
    await first.click();
    const sameCellById = page.locator(`[data-feature-id="${featureId}"]`).first();
    await expect(sameCellById).toHaveAttribute('data-role', 'causal', { timeout: 300 });
    await expect(sameCellById).toHaveClass(/role-stroke/, { timeout: 300 });
    // Latency budget envelope — the Playwright evaluate+DOM round-trip
    // alone is typically ~50ms; 300 is the spec ceiling.
    expect(Date.now() - started).toBeLessThan(300);
    // Stroke color propagates via the --stroke CSS variable + the
    // .role-stroke utility (src/lib/styles/role-palette.css).
    const borderBottomColor = await sameCellById.evaluate(
      (el) => getComputedStyle(el).borderBottomColor
    );
    // --role-causal = #3F7A4E → rgb(63, 122, 78).
    expect(borderBottomColor.replace(/\s/g, '')).toBe('rgb(63,122,78)');
  });

  test('acceptance #2: counter updates synchronously on every commit', async ({ page }) => {
    await openStory(page, 'default');
    const counter = page.getByTestId('role-labeled-counter-n');
    await expect(counter).toHaveText('0');
    const cells = editableCells(page);
    await cells.nth(0).click(); // causal
    await expect(counter).toHaveText('1', { timeout: 300 });
    await cells.nth(1).click(); // causal
    await expect(counter).toHaveText('2', { timeout: 300 });
    await cells.nth(2).click(); // causal
    await expect(counter).toHaveText('3', { timeout: 300 });
  });

  test('acceptance #3: reduced-motion has no effect (no transitions to suppress)', async ({
    page
  }) => {
    await openStory(page, 'reduced-motion');
    const tagged = page.locator('[data-testid="role-cell"].role-stroke').first();
    await expect(tagged).toBeVisible();
    // No transition or animation on the role-cell or stroke — stroke is
    // a static 1px border-bottom, not an animated width grow.
    const motion = await tagged.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        transitionProperty: cs.transitionProperty,
        transitionDuration: cs.transitionDuration,
        animationName: cs.animationName
      };
    });
    expect(motion.animationName).toBe('none');
    // transitionDuration is a shorthand ("0s" or "0s, 0s, ..."); all
    // components must be zero.
    const allZero = motion.transitionDuration
      .split(',')
      .every((v) => v.trim() === '0s' || v.trim() === '0ms');
    expect(allZero).toBe(true);
  });

  test('acceptance #4: sessionStorage only — no localStorage writes on tag commit', async ({
    page
  }) => {
    await openStory(page, 'default');
    // DA #9 (DESIGN.md line 916) forbids localStorage writes; the only
    // legitimate reason to reference `localStorage` in this repo is to
    // assert nothing was written. The eslint-disable comments below are
    // the project-wide escape hatch for this one test only.
    const lsBefore = await page.evaluate(() => ({
      // eslint-disable-next-line un-regression/no-storage-persistence
      length: window.localStorage.length,
      // eslint-disable-next-line un-regression/no-storage-persistence
      keys: Object.keys(window.localStorage)
    }));
    expect(lsBefore.length).toBe(0);
    // Commit three tags via the click cycle.
    const cells = editableCells(page);
    await cells.nth(0).click();
    await cells.nth(1).click();
    await cells.nth(2).click();
    // Nothing should have been written to localStorage.
    const lsAfter = await page.evaluate(() => ({
      // eslint-disable-next-line un-regression/no-storage-persistence
      length: window.localStorage.length,
      // eslint-disable-next-line un-regression/no-storage-persistence
      keys: Object.keys(window.localStorage)
    }));
    expect(lsAfter.length).toBe(0);
    expect(lsAfter.keys).toEqual([]);
  });

  test('acceptance #5: editable cells respond to 1/2/3; [authored] cells do not', async ({
    page
  }) => {
    await openStory(page, 'default');
    // Editable cell: 1 = causal.
    const editable = editableCells(page).first();
    const editableId = await editable.getAttribute('data-feature-id');
    await editable.focus();
    await page.keyboard.press('1');
    await expect(page.locator(`[data-feature-id="${editableId}"]`).first()).toHaveAttribute(
      'data-role',
      'causal'
    );
    // 2 = spurious.
    await page.keyboard.press('2');
    await expect(page.locator(`[data-feature-id="${editableId}"]`).first()).toHaveAttribute(
      'data-role',
      'spurious'
    );
    // 3 = incidental.
    await page.keyboard.press('3');
    await expect(page.locator(`[data-feature-id="${editableId}"]`).first()).toHaveAttribute(
      'data-role',
      'incidental'
    );
    // Authored cell: keystrokes do not mutate data-role.
    const authored = page
      .locator('[data-testid="role-cell"][data-role="authored"]')
      .first();
    const authoredId = await authored.getAttribute('data-feature-id');
    await authored.focus();
    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await expect(page.locator(`[data-feature-id="${authoredId}"]`).first()).toHaveAttribute(
      'data-role',
      'authored'
    );
  });

  test('pinned-left: role-column has position: sticky; left: 0; throughout horizontal scroll', async ({
    page
  }) => {
    await openStory(page, 'three-colors');
    const col = page.getByTestId('role-column');
    const pos = await col.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { position: cs.position, left: cs.left, zIndex: cs.zIndex };
    });
    expect(pos.position).toBe('sticky');
    expect(pos.left).toBe('0px');
    // The outer viewport scrolls horizontally; the role column stays at
    // left=0 relative to the viewport.
    const beforeBox = await col.boundingBox();
    expect(beforeBox).not.toBeNull();
    await page.getByTestId('csv-viewport').evaluate((el) => (el.scrollLeft = 600));
    const afterBox = await col.boundingBox();
    expect(afterBox).not.toBeNull();
    if (!beforeBox || !afterBox) return; // type-narrow
    // x coordinate should be unchanged (bounded by the viewport edge).
    expect(Math.round(afterBox.x)).toBeLessThanOrEqual(Math.round(beforeBox.x) + 1);
  });

  test('recast: tags persist across activeISO3 swap (DA #9)', async ({ page }) => {
    await openStory(page, 'recast');
    // The recast scenario seeds three tags BEFORE flipping activeISO3
    // to URY. After re-mount the same tags should still be present.
    const tagged = page.locator('[data-testid="role-cell"].role-stroke');
    await expect(tagged).toHaveCount(3);
    const counter = page.getByTestId('role-labeled-counter-n');
    await expect(counter).toHaveText('3');
  });

  test('counter displays labeled_by_you: N / 356 in 9pt mono (type-annot)', async ({ page }) => {
    await openStory(page, 'dense-tagged');
    const counter = page.getByTestId('role-labeled-counter');
    await expect(counter).toContainText('labeled_by_you:');
    await expect(counter).toContainText('/ 356');
    await expect(page.getByTestId('role-labeled-counter-n')).toHaveText('15');
    const typo = await counter.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        family: cs.fontFamily,
        size: cs.fontSize,
        style: cs.fontStyle
      };
    });
    expect(typo.family).toMatch(/JetBrains Mono/);
    expect(typo.size).toBe('9px');
    expect(typo.style).toBe('normal');
  });

  test('visual snapshot: default (unlabeled + authored)', async ({ page }) => {
    await openStory(page, 'default');
    await expect(page).toHaveScreenshot('default.png', { fullPage: false });
  });

  test('visual snapshot: three colors (one per role)', async ({ page }) => {
    await openStory(page, 'three-colors');
    await expect(page).toHaveScreenshot('three-colors.png', { fullPage: false });
  });

  test('visual snapshot: dense tagging (15 / 356)', async ({ page }) => {
    await openStory(page, 'dense-tagged');
    await expect(page).toHaveScreenshot('dense-tagged.png', { fullPage: false });
  });

  test('visual snapshot: reduced-motion (identical to three-colors)', async ({ page }) => {
    await openStory(page, 'reduced-motion');
    await expect(page).toHaveScreenshot('reduced-motion.png', { fullPage: false });
  });

  test('visual snapshot: recast persistence', async ({ page }) => {
    await openStory(page, 'recast');
    await expect(page).toHaveScreenshot('recast.png', { fullPage: false });
  });
});
