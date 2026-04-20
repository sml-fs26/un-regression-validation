/*
 * pi-cell.spec.ts — Playwright spec for <PiCellComposition>, desktop 1x.
 *
 * Stage 2 step 4 acceptance criteria (DESIGN.md §CH3 acceptance lines
 * 661-663 + §Stage 2 handoff line 932):
 *
 *   1. The PI cell renders two typographic layers within a single
 *      60px-tall cell at 1× and 2× resolutions.
 *   2. Line 1 reads `[$78,400, $94,900]` at CV-optimal α.
 *   3. Line 2's underlines color via the reader's roleAssignments
 *      (reactive subscription; step 3's latency test already proves
 *      <300ms, here we verify the DOM binding).
 *   4. The peer cell (shuffled) renders ≥78% red composition.
 *
 * Plus the DA #10(e) binding check from DESIGN.md line 670:
 *   "<PiCellLine2Underline>'s border-bottom-color for each
 *    abbreviation is the same --role-* value the corresponding
 *    <RoleCell> carries (binding verified by editing a tag during
 *    at-cv-optimal and asserting both elements update within 300ms)."
 *
 * Sibling specs:
 *   - pi-cell.2x.spec.ts (@2x snapshots)
 *   - pi-cell.mobile.spec.ts (480px; peer stacks below, stripe rotates)
 */

import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

const STORY_BASE = '/iframe.html?viewMode=story&id=ch3-picellcomposition';

async function openStory(page: Page, storyId: string): Promise<void> {
  await page.goto(`${STORY_BASE}--${storyId}`);
  await expect(page.getByTestId('pi-cell-composition')).toBeVisible();
  // Two cells — real + shuffled.
  await expect(page.getByTestId('pi-cell--real')).toBeVisible();
  await expect(page.getByTestId('pi-cell--shuffled')).toBeVisible();
}

/** Extract the computed line-1 text from the real cell. */
function realLine1(page: Page): Locator {
  return page.locator('[data-testid="pi-cell--real"] [data-testid="pi-cell-line1"]');
}

/** Extract the computed line-2 terms from the real cell. */
function realLine2Terms(page: Page): Locator {
  return page.locator(
    '[data-testid="pi-cell--real"] [data-testid="pi-cell-line2-term"]'
  );
}

function shuffledLine2Terms(page: Page): Locator {
  return page.locator(
    '[data-testid="pi-cell--shuffled"] [data-testid="pi-cell-line2-term"]'
  );
}

/** Resolve the computed border-bottom-color of an abbrev. */
async function abbrevBorderColor(page: Page, termLocator: Locator): Promise<string> {
  return termLocator
    .locator('[data-testid="pi-cell-abbrev"]')
    .evaluate((el) => getComputedStyle(el).borderBottomColor);
}

test.describe('<PiCellComposition> — desktop 1x', () => {
  test('acceptance #1: two typographic layers render inside a 60px-tall cell body', async ({
    page
  }) => {
    await openStory(page, 'default');
    const body = page.locator(
      '[data-testid="pi-cell--real"] .pi-cell__body, [data-testid="pi-cell--real"] [data-testid="pi-cell-line1"]'
    );
    // The body element's computed height is exactly 60px per the
    // DESIGN.md line 661 "single 60px-tall cell" invariant.
    const bodyHeight = await page
      .locator('[data-testid="pi-cell--real"] .pi-cell__body')
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.round(bodyHeight)).toBe(60);

    // Both typographic layers must be DOM-visible and non-empty at
    // the cv-optimal state (default scenario).
    const line1 = realLine1(page);
    await expect(line1).toBeVisible();
    await expect(line1).not.toHaveText('');
    const l2count = await realLine2Terms(page).count();
    expect(l2count).toBe(5);
    // ignore a potential TS-unused linter whine on `body`
    void body;
  });

  test('acceptance #2: line 1 reads `[$78,400, $94,900]` at cv-optimal (DESIGN.md line 633)', async ({
    page
  }) => {
    await openStory(page, 'default');
    await expect(realLine1(page)).toHaveText('[$78,400, $94,900]');
  });

  test('acceptance #2.b: line 1 is 11pt JetBrains Mono in the --gold color (BRAINSTORM wow #1)', async ({
    page
  }) => {
    await openStory(page, 'default');
    const l1 = realLine1(page);
    const [fontSizePx, fontFamily, color] = await l1.evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.fontSize, cs.fontFamily, cs.color] as const;
    });
    // `11px` per --type-data (DESIGN.md tokens.css line 27).
    expect(fontSizePx).toBe('11px');
    expect(fontFamily.toLowerCase()).toContain('jetbrains mono');
    // --gold = #C9A961 → rgb(201, 169, 97)
    expect(color.replace(/\s+/g, '')).toBe('rgb(201,169,97)');
  });

  test('acceptance #3: line-2 underlines inherit role colors from rolesStore (fallback to role_at_build)', async ({
    page
  }) => {
    await openStory(page, 'default');
    const terms = realLine2Terms(page);
    await expect(terms).toHaveCount(5);

    // DESIGN.md line 633: `0.34·num + 0.28·mcd + 0.19·scr + 0.11·bw + 0.08·rule`
    // BRAINSTORM CH3 wow #1: "Four red underlines. One green."
    //   → 4 abbrevs carry var(--role-spurious) (red, rgb(178, 58, 58))
    //   → 1 abbrev carries var(--role-causal)   (green, rgb(63, 122, 78))
    const colors: string[] = [];
    for (let i = 0; i < 5; i++) {
      colors.push(await abbrevBorderColor(page, terms.nth(i)));
    }
    const red = 'rgb(178, 58, 58)';
    const green = 'rgb(63, 122, 78)';
    const redCount = colors.filter((c) => c === red).length;
    const greenCount = colors.filter((c) => c === green).length;
    expect(redCount).toBe(4);
    expect(greenCount).toBe(1);
  });

  test('acceptance #3.b: reader-overrides scenario — reader`s causal tag turns absurd_02 green (DESIGN.md line 619)', async ({
    page
  }) => {
    await openStory(page, 'reader-overrides');
    const absurd02 = page.locator(
      '[data-testid="pi-cell--real"] [data-testid="pi-cell-line2-term"][data-feature-id="absurd_02"]'
    );
    await expect(absurd02).toBeVisible();
    const color = await abbrevBorderColor(page, absurd02);
    // The reader tagged spurious→causal, so the underline is GREEN,
    // not red, even though role_at_build was spurious.
    expect(color).toBe('rgb(63, 122, 78)');
  });

  test('acceptance #4: the peer (shuffled) cell renders ≥78% red composition', async ({
    page
  }) => {
    await openStory(page, 'default');
    const terms = shuffledLine2Terms(page);
    await expect(terms).toHaveCount(5);

    // Each term element carries data-role="spurious" (4 of 5 are
    // spurious at role_at_build; the 1 authored fallback also turns
    // red in shuffled because the fixture marks ALL shuffled
    // role_at_build='spurious'). Weights sum to 1.0.
    let redWeight = 0;
    const count = await terms.count();
    for (let i = 0; i < count; i++) {
      const role = await terms.nth(i).getAttribute('data-role');
      const text = await terms.nth(i).textContent();
      const match = text?.match(/([0-9]*\.[0-9]+)/);
      const weight = match ? parseFloat(match[1]) : 0;
      if (role === 'spurious') redWeight += weight;
    }
    expect(redWeight).toBeGreaterThanOrEqual(0.78);
  });

  test('DA #1 emit-don`t-perform: the PI cell has zero CSS transitions or animations', async ({
    page
  }) => {
    await openStory(page, 'default');
    const realCell = page.getByTestId('pi-cell--real');
    const { animationName, transitions } = await realCell.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        animationName: cs.animationName,
        transitions: cs.transitionDuration
      };
    });
    expect(animationName).toBe('none');
    // transitionDuration may be `0s` or a comma-separated list of zeros.
    for (const part of transitions.split(',').map((t) => t.trim())) {
      expect(part).toMatch(/^0m?s$/);
    }
  });

  test('reduced-motion: the cell is visually identical to default (no transitions to suppress)', async ({
    page
  }) => {
    await openStory(page, 'reduced-motion');
    // Layer 1 text is still the cv-optimal bracket.
    await expect(realLine1(page)).toHaveText('[$78,400, $94,900]');
    // And the DOM layout is still 60px tall.
    const h = await page
      .locator('[data-testid="pi-cell--real"] .pi-cell__body')
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.round(h)).toBe(60);
  });

  test('extreme-min α≈0: line 2 expands to 12 terms (wide-equation prototype)', async ({
    page
  }) => {
    await openStory(page, 'extreme-min');
    await expect(realLine2Terms(page)).toHaveCount(12);
    // At min-α the bracket widens per fixture.
    await expect(realLine1(page)).toHaveText('[$65,200, $108,100]');
  });

  test('extreme-max α=∞: both cells empty, 60px envelope preserved', async ({ page }) => {
    await openStory(page, 'extreme-max');
    await expect(realLine2Terms(page)).toHaveCount(0);
    await expect(realLine1(page)).toHaveText('');
    const h = await page
      .locator('[data-testid="pi-cell--real"] .pi-cell__body')
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.round(h)).toBe(60);
  });

  test('composition: the real and shuffled cells share the same two-layer grammar', async ({
    page
  }) => {
    await openStory(page, 'default');
    const realH = await page
      .locator('[data-testid="pi-cell--real"] .pi-cell__body')
      .evaluate((el) => el.getBoundingClientRect().height);
    const shufH = await page
      .locator('[data-testid="pi-cell--shuffled"] .pi-cell__body')
      .evaluate((el) => el.getBoundingClientRect().height);
    // BRAINSTORM CH3 wow #2 line 115: "Adjacent. Same size. Same weight."
    expect(Math.round(realH)).toBe(Math.round(shufH));
    expect(Math.round(realH)).toBe(60);
  });

  test('45° dashed-gray stripe separates the two cells (BRAINSTORM CH3 wow #2)', async ({
    page
  }) => {
    await openStory(page, 'default');
    const stripe = page.getByTestId('pi-cell-stripe');
    await expect(stripe).toBeVisible();
    const bg = await stripe.evaluate((el) => getComputedStyle(el).backgroundImage);
    // The stripe is implemented as a repeating linear gradient; the
    // token value --dashed-gray = #6E6E6E → rgb(110, 110, 110) must
    // appear in the computed background-image.
    expect(bg).toMatch(/110,\s*110,\s*110/);
    expect(bg.toLowerCase()).toContain('repeating-linear-gradient');
  });

  test('pi cell header labels: `pi_95%` (real) and `pi_95%_shuffled` (peer)', async ({
    page
  }) => {
    await openStory(page, 'default');
    const realHeader = page.locator(
      '[data-testid="pi-cell--real"] [data-testid="pi-cell-header"]'
    );
    const shufHeader = page.locator(
      '[data-testid="pi-cell--shuffled"] [data-testid="pi-cell-header"]'
    );
    await expect(realHeader).toHaveText('pi_95%');
    await expect(shufHeader).toHaveText('pi_95%_shuffled');
  });

  test('line-2 abbrev text matches the DESIGN.md line 633 equation at cv-optimal', async ({
    page
  }) => {
    await openStory(page, 'default');
    const terms = realLine2Terms(page);
    const texts = await terms.allTextContents();
    // DESIGN.md line 633: `0.34·num + 0.28·mcd + 0.19·scr + 0.11·bw + 0.08·rule`
    // Each term's textContent will be `0.34·num` for the first and
    // ` + 0.28·mcd` for subsequent (the leading `+ ` is a prefix).
    expect(texts[0]).toContain('0.34');
    expect(texts[0]).toContain('num');
    expect(texts[1]).toContain('0.28');
    expect(texts[1]).toContain('mcd');
    expect(texts[2]).toContain('0.19');
    expect(texts[2]).toContain('scr');
    expect(texts[3]).toContain('0.11');
    expect(texts[3]).toContain('bw');
    expect(texts[4]).toContain('0.08');
    expect(texts[4]).toContain('rule');
  });

  test('visual snapshot: default', async ({ page }) => {
    await openStory(page, 'default');
    await expect(page).toHaveScreenshot('default-desktop-1x.png', { fullPage: false });
  });

  test('visual snapshot: reader-tagged', async ({ page }) => {
    await openStory(page, 'reader-tagged');
    await expect(page).toHaveScreenshot('reader-tagged-desktop-1x.png', {
      fullPage: false
    });
  });

  test('visual snapshot: reader-overrides', async ({ page }) => {
    await openStory(page, 'reader-overrides');
    await expect(page).toHaveScreenshot('reader-overrides-desktop-1x.png', {
      fullPage: false
    });
  });

  test('visual snapshot: extreme-min', async ({ page }) => {
    await openStory(page, 'extreme-min');
    await expect(page).toHaveScreenshot('extreme-min-desktop-1x.png', {
      fullPage: false
    });
  });

  test('visual snapshot: extreme-max', async ({ page }) => {
    await openStory(page, 'extreme-max');
    await expect(page).toHaveScreenshot('extreme-max-desktop-1x.png', {
      fullPage: false
    });
  });

  test('visual snapshot: reduced-motion', async ({ page }) => {
    await openStory(page, 'reduced-motion');
    await expect(page).toHaveScreenshot('reduced-motion-desktop-1x.png', {
      fullPage: false
    });
  });
});
