# DESIGN.md — `un-regression-validation` · Stage 1 Design Convergence

## How to read this document

Stage 1 produced this from Stage 0's `BRAINSTORM.md`. Stage 2 (Implementation) treats this as the build spec — one adopted signature moment per chapter with its full design, the cross-cutting signatures specified to implementation precision, and the DA binding constraints translated into concrete technical requirements. Any deviation during Stage 2 requires explicit re-approval; a deviation that contradicts a DA binding constraint requires re-opening Stage 0.

The site has one architectural commitment: **a typeset spreadsheet `# five_deaths_of_norway.ipynb` whose every chapter is a transformation of cells the reader owns or authored.** This document specifies that artifact, not a family of alternatives.

---

## Global architecture

### Tech stack commitments

| Layer | Choice | Justification (one sentence) |
|---|---|---|
| Framework | **SvelteKit 2.x** with `adapter-static` | Reactive stores match the `role` column's <300ms cross-chapter subscription requirement (DA #3); compile-time output keeps initial JS under the 80KB ceiling that lets the heartbeat ticker first-paint within 1.2s. |
| Language | TypeScript 5.x, `strict: true` | Cell schemas (β̂ row, PI decomposition, Dissolution cloud) are the site's primary contract; runtime drift between precompute and render is the single highest-cost bug class. |
| Motion | **Plain CSS transitions only.** No GSAP, no Framer, no Motion One. | DA #1: emit-don't-perform. Importing a motion library is itself a violation. |
| Math typesetting | **KaTeX 0.16.x**, server-side rendered at build time | Used only for the hat-matrix definition `H = X(X'X)⁻¹X'` revealed on hover in CH1. KaTeX runtime is excluded from the client bundle. |
| Fonts | DM Serif Display, Inter (fallback only), JetBrains Mono — **self-hosted, woff2, subset to Latin + math glyphs** | CDN would inject FOIT against the first-paint budget on the heartbeat cell; subset trims ~120KB. |
| Build tool | Vite 5.x (bundled with SvelteKit) | — |
| Deploy target | Static export | Site has no server runtime; precompute is offline. |
| Hosting | Cloudflare Pages or Netlify (interchangeable) | Static-only deploy; HTTP/2; `Brotli` enabled; long cache TTL on `/data/*.json`. |

**Forbidden libraries** (enforced via `package.json` ESLint rule): `framer-motion`, `gsap`, `motion`, `lottie-web`, `popmotion`, `react-spring`, `auto-animate`, `aos`, anything matching `/animat/i` in dependency name.

### Data pipeline

All quantitative content is precomputed by an offline Python pipeline (`/precompute/`, separate from the site repo). The site reads only static JSON. Runtime computation is approximately zero.

**Precomputed data files** (under `/static/data/`):

| File | Schema | Size budget (gzipped) | Consumed by |
|---|---|---|---|
| `audition.json` | `{iso3, h_ii_starkness}[]` (254 rows) | ≤ 8 KB | CH1 gutter line, `/audition` notebook link |
| `nor/h_ii_trajectory.json` | `{p: int, h_ii: float}[]` for p ∈ [10, n] | ≤ 6 KB | Heartbeat ticker, CH2 |
| `nor/beta_path.json` | `{p: int, beta: float[]}[]` (one row per integer p) | ≤ 180 KB | CH2 buckle |
| `nor/diagnostic_path.json` | `{p, log_lambda_min, test_r2, scrollbar_progress}[]` | ≤ 12 KB | CH2 scrollbar overlay |
| `nor/lasso_alpha_path.json` | `{alpha: float, kept_features: int[], beta: float[]}[]` over α-sweep | ≤ 90 KB | CH3 scrub, strikethrough |
| `nor/pi_decomposition.json` | `{alpha, point: float, ci: [float, float], terms: {feature_id, weight, role_at_build}[]}` for each α step | ≤ 60 KB | CH3 PI cell |
| `nor/pi_shuffled.json` | same schema, median over 50 shuffled-Y perms | ≤ 60 KB | CH3 peer cell |
| `nor/objection_queue.json` | `[{step: 0..8, struck_features, replacement_feature, beta, ci, stability_frac, contribution_usd, refused?: bool}]` | ≤ 14 KB | CH4 objection mechanism |
| `nor/rf_top20.json` | `{feature_id, importance, pdp_shape}[]` | ≤ 12 KB | CH4 JOIN result |
| `nor/dissolution_cloud.json` | `{predicted_gdp: float, h_ii: float}[]` (200 rows) + nested-CV ridgeline samples | ≤ 14 KB | CH5 Dissolution |
| `nor/bootstrap_ci.json` | `{feature_id, beta, ci: [float, float], stability}[]` (200 resamples summarized) | ≤ 10 KB | CH5 final confession |
| `nor/ecdf_null.json` | `{abs_r: float[]}` for full 356-feature null + permutation band | ≤ 14 KB | CH1 ECDF reveal |
| `features.json` | `{id, short_name, full_name, citation, default_role, absurdity_flag}[]` (356 rows; 30 with `default_role` set; ~30 with `absurdity_flag: true` per `/precompute/absurd_seed.py`) | ≤ 30 KB | Role column, hover citations, CH1 autocomplete ghost seeding |
| `data_norway.csv` (typeset source) | The 254-row CSV the site renders as page chrome | ≤ 90 KB | Page background |
| `recast/{ISO3}.json` (×254) | Same schema as the per-country bundle above, lazy-loaded on recast | ≤ 200 KB each (≤ 40 MB gzipped total, served from `/data/recast/`) | CH5 recast bar |

**Build-time computation:** every number in the spec — `0.04 → 0.98` heartbeat trajectory, `186/356` cleared-null count, `92%` red decomposition, `15-of-18` scorecard tally, `79th percentile`, `$51,800` optimism gap, `194/200` stability, the 8-step objection queue, all 254 countries' five acts. All real Python output. No site code generates these.

**Runtime computation (the only exceptions):**
- DOM measurement of the horizontal scrollbar position to drive CH2's gold/dashed-gray scrollbar overlay (browser-API only; not numerical).
- Linear interpolation between adjacent precomputed `p` integers during CH2 scrub for visual smoothness within a single cell-width (not for the β̂ values themselves, which display the precomputed integer-p value).
- The reactive `role` column tag → role-stroke class swap on every subscribing element.

**Browser storage:** `sessionStorage` only. No `localStorage`, no IndexedDB, no cookies. DA #9 (irrevocability within session) is enforced by absence: there is no persistence layer to revise from.

### Performance budgets (CI-enforced)

| Metric | Budget | Verification |
|---|---|---|
| First Contentful Paint (CH1, Moto G4 throttle) | ≤ 1.2 s | Lighthouse CI on every PR |
| Heartbeat ticker first numeric value visible | ≤ 1.5 s | Custom Playwright `expect(ticker).toHaveText('NOR.h_ii = 0.04')` with timing |
| Time to interactive (first scrub) | ≤ 2.5 s | Lighthouse CI |
| Initial JS bundle | ≤ 80 KB gzipped | `vite-bundle-visualizer` + CI assertion in `bundle-budget.test.ts` |
| Initial CSS bundle | ≤ 30 KB gzipped | Same |
| Per-chapter lazy chunk | ≤ 60 KB gzipped | Same, per route |
| Per-country recast payload | ≤ 200 KB gzipped | Asserted at precompute time; CI fails the precompute step otherwise |
| `data_norway.csv` typeset to first cell rendered | ≤ 800 ms | Playwright |
| CH5 recast input → re-rendered viewport | ≤ 700 ms (per BRAINSTORM CH5 wow #3) | Playwright; failure budget: 5% of recasts |

### Accessibility & fallbacks

**Keyboard equivalents** (every gesture has a named binding; documented in `/about/keyboard`):

| Gesture | Mouse/touch | Keyboard |
|---|---|---|
| CH1 query type | typing in query bar | typing in query bar (no diff) |
| CH1 double-click commit | double-click cell A or B | Tab to cell, `Enter` once to highlight, `Enter` twice (within 600ms) to commit |
| CH1 role tag | three-way toggle click | Tab to cell, `1`=causal, `2`=spurious, `3`=incidental |
| CH2 `p` scrub | click + drag horizontal on `p` cell | Focus `p` cell, `←`/`→` (=±1), `Shift+←/→` (=±10), `PageUp/PageDown` (=±50) |
| CH3 `α` scrub | click + drag on `α` cell | Focus `α` cell, `←`/`→` (=one tick of α-sweep array, ~32 steps) |
| CH4 `[×]` objection | click `[×]` on row | Focus row, `Backspace` or `Delete` |
| CH4 drag-to-JOIN | drag row onto RF sheet | Focus row, `J` then arrow keys to target row, `Enter` to commit JOIN |
| CH5 click-to-sort | click column header in dissolution paragraph | Focus paragraph, `s` cycles sort modes (asc / desc / by-deviation / chronological) |
| CH5 recast | type in `recast:` input | type in `recast:` input |

**Reduced-motion** (`@media (prefers-reduced-motion: reduce)`): every one of the three permitted sub-200ms motions has an explicit static alternative.
- CH2 `h_ii` gold pulse at 0.95 → ticker cell adopts a 1px gold stroke that persists from p=0.95 onward (no pulse).
- CH3 strikethrough draw (120ms per column) → strikethroughs appear instantly on α-state-change; no draw transition.
- CH4 on-hover role-stroke reveal → role-strokes render at 100% opacity by default (collapsing CH4 and CH5's role-stroke states).

**Mobile (≤ 480px)** alternative layouts are specified per chapter below — not scaled-down desktop.

**Screen reader contract:**
- Every cell has an `aria-label` formed as `{column_name} {value} for {row_name}`.
- Every state change emits a deduplicated `aria-live="polite"` announcement (e.g., `"p is now 187 of 213; Norway's predicted GDP is positive infinity"`).
- The heartbeat ticker is `aria-live="polite"` and `role="status"`; updates throttle to one announcement per 800 ms during scrub.
- The recast bar is `role="search"`, `aria-label="recast biography for ISO-3 country code"`.

### Test discipline

- **Visual regression**: Playwright + Percy snapshots at 1×, 2×, and 480px for every adopted signature frame. Snapshots commit to a separate `/visual-baselines/` branch; PRs render diff with byte-budget threshold.
- **Empirical-claim tests**: a `precompute/verify.py` script asserts every empirical claim in the spec (e.g., `assert lasso_at_cv_optimal_alpha[NOR].pi_red_share >= 0.92`). If a claim fails, the precompute pipeline writes the actual value and the chapter's copy regenerates from a template that pulls from the JSON — never from a hard-coded string.

---

## Typography system

Codified from cross-cutting signature #6. The CSS variables below are the **complete** set of font roles in the site. Any element using a font-family declaration outside this set fails the lint rule `no-raw-font-family` (custom Stylelint plugin).

```css
:root {
  /* Families */
  --font-mono:  'JetBrains Mono', ui-monospace, monospace;
  --font-serif: 'DM Serif Display', Georgia, serif;
  --font-sans:  'Inter', system-ui, sans-serif; /* fallback ONLY; no role uses it directly */

  /* Roles — every cell on the site picks exactly one */
  --type-model:      500 11px/1.35 var(--font-mono);    /* β̂ row, "model's voice" */
  --type-data:       400 11px/1.35 var(--font-mono);    /* CSV cell values */
  --type-annot:      400 9px/1.3   var(--font-mono);    /* annotations, brackets, comments */
  --type-subannot:   400 7px/1.25  var(--font-mono);    /* CH3 PI-cell line-2 (mono) */
  --type-subcaption: 400 7px/1.25  var(--font-mono);    /* CH1 sub-caption beneath ticker — 7pt MONO per BRAINSTORM CH1 wow #1 */
  --type-head:       400 14px/1.2  var(--font-serif);   /* CSV column headers, small-caps */
  --type-voice32:    400 italic 32px/1.15 var(--font-serif); /* chapter interjections — CH3 + CH5 */
  --type-voice48:    400 italic 48px/1.1  var(--font-serif); /* closing aphorism — used exactly once */
  --type-voice14:    400 italic 14px/1.3  var(--font-serif); /* CH2 sole italic line — exception sized down */

  /* Header treatment */
  --head-transform: small-caps;
  --head-tracking:  0.04em;
}
```

**`.assert-serif-budget` dev-mode check** (lives in `/src/lib/dev/serifAudit.ts`):

```ts
// On every route mount in DEV mode, after first idle:
//   - Count DOM elements computed-style font-family containing 'DM Serif Display' AND font-style=italic.
//   - Count must equal the table below for the active chapter.
//   - Across the full scroll (CH1 → CH5), total DM Serif italic occurrences = exactly 4:
//       3 chapter-italic lines (CH2 sized-down at 14pt; CH3 interjection at 32pt; CH5 interjection at 32pt) + 1 closing aphorism at 48pt.
//       CH1 contributes zero (its sub-caption is 7pt MONO per BRAINSTORM CH1 wow #1, not italic DM Serif).
//       CH4 contributes zero (voiceless by design — DA #7).
//   - The single cross-chapter invariant the CI enforces is: cumulative italic-DM-Serif DOM count over a full scroll == 4.
//   - Plus 14pt small-caps (non-italic) headers for every visible CSV column header (counted separately via font-style=normal; unrationed).
//   - Violation: console.error + dev overlay + CI build fail in --check mode.
```

| Chapter | Permitted DM Serif italic occurrences | Size / family | Source |
|---|---|---|---|
| CH1 | **0** | Sub-caption is **7pt MONO** via `--type-subcaption` (`var(--font-mono)`, `font-style: normal`) — BRAINSTORM CH1 wow #1 specifies "7pt mono" verbatim; cross-cutting #1 specifies "9pt JetBrains Mono ... 7pt line" — the typeface for the sub-caption is mono, not serif italic. The italic markdown in BRAINSTORM is editorial emphasis, not a typeface directive. | Sub-caption *a country's share of her own prediction.* beneath ticker, first paint only — rendered in JetBrains Mono 7pt at `font-style: normal`. |
| CH2 | 1 | **14px** italic (sized-down exception via `--type-voice14`, per BRAINSTORM CH2 wow #1) | "you are looking at the screenshot every analyst has taken and deleted." |
| CH3 | 1 | 32px italic (standard `--type-voice32`) | "the model has saved Norway by believing she is a Scrabble score." |
| CH4 | **0** | — | DA #7: voiceless by design |
| CH5 | 2 | 32px (interjection `--type-voice32`) + 48px (closing aphorism `--type-voice48`) | "every country in this dataset has five deaths..." (32pt) + the 48pt closing aphorism (text committed in code as architect's choice within the BRAINSTORM-bounded slot — see CH5 acceptance #11) |
| **Total** | **4** (= 0+1+1+0+2) | | 3 chapter italic lines (CH1 + CH4 contribute zero) + 1 closing aphorism = 4. This is the single target `.assert-serif-budget` enforces. |

DM Serif Display 14pt small-caps for CSV column headers is unrationed (every visible header, all `font-style: normal`, excluded from the italic count above).

**Reconciliation note (DA-driven, revised):** BRAINSTORM cross-cutting #6 reads "5 chapter interjections (32pt, one per chapter except CH4) + one 48pt closing aphorism." This is internally inconsistent: "one per chapter except CH4" across 5 chapters yields 4, not 5. BRAINSTORM CH1 wow #1 and cross-cutting #1 both specify the CH1 sub-caption as **7pt mono** (the typeface is unambiguous; the italic markdown around the quoted phrase is editorial emphasis), so CH1's italic count is **zero** and the sub-caption is rendered via `--type-subcaption` (JetBrains Mono 7pt, `font-style: normal`). With CH1 = 0 italic, CH2 = 1 (14pt), CH3 = 1 (32pt), CH4 = 0 (voiceless), CH5 = 2 (32pt + 48pt), total = **4 italic DM Serif occurrences site-wide**. The reconciliation lives in the budget arithmetic, not in any chapter's font-family — CH1's mono spec is preserved verbatim. The `.assert-serif-budget` CI target is **exactly 4**.

> **Counter-argument to DA objection that an earlier draft of this spec converted CH1's sub-caption from 7pt mono to 7pt DM Serif italic via an invented `--type-voice7` token:** the DA's veto is adopted in full. The `--type-voice7` token has been deleted from the CSS variable set. CH1's sub-caption is now rendered exclusively via `--type-subcaption` (JetBrains Mono 7pt, `font-style: normal`), and the `<HeartbeatTicker>` render contract, the mobile invariant, and CH1 acceptance #2 have all been updated to assert mono — not serif italic — at the DOM. The site-wide italic DM Serif total is now **4**, not 5; the budget arithmetic was reopened to absorb the off-by-one in BRAINSTORM cross-cutting #6 rather than re-typeface CH1. No chapter's font-family decision is now invented to make the budget resolve.

**Forbidden sizes** (lint-enforced): no `font-size: 180px` anywhere; no `font-size: 240px` anywhere; no `font-size: 48px` outside `--type-voice48`; no `font-size > 32px` italic outside `--type-voice48`. (DA #10.)

---

## Color & palette

Codified from cross-cutting signature #5 and DA #2.

```css
:root {
  /* Surface */
  --bg-cream:    #F5F1E8;
  --bg-indigo:   #1A1A2E;  /* CSV gutter, off-screen scroll margins */
  --rule-hair:   rgba(0,0,0,0.08);

  /* Heartbeat & symptom */
  --gold:        #C9A961;
  --gold-pulse:  #E6C77A;
  --dashed-gray: #6E6E6E;  /* mechanism (eigenvalue, null bands) */
  --dashed-red:  #B23A3A;  /* breached cell boundaries (CH2) */

  /* Reader-authored role palette — STROKE-ONLY */
  --role-causal:    #3F7A4E;  /* green */
  --role-spurious:  #B23A3A;  /* red */
  --role-incidental:#7A7A7A;  /* gray */
  --role-unlabeled: transparent; /* no stroke */

  /* The single allowed exception */
  --pi-cell-stroke-weight: 1px; /* CH3 PI-cell line-2 underlines, the one place role-color appears below text without being a chart-stroke */
}
```

**Stroke-only utility classes** (the only way role-color enters the DOM):

```css
.role-stroke              { border-bottom: 1px solid var(--stroke); }
.role-stroke--country-dot { outline: 1px solid var(--stroke); outline-offset: 1px; }
.role-stroke--bracket     { color: var(--stroke); /* used only for the hairline brackets in CH4/CH5 */ }
```

Any rule with `background-color` or `color` set to a `--role-*` value, outside `<PiCellLine2Underline>`, fails the custom Stylelint rule `role-color-stroke-only`. The CH3 exception is component-gated: only the file `src/lib/components/ch3/PiCellLine2Underline.svelte` is permitted to use `border-bottom-color: var(--role-spurious)` etc.

---

## Cross-cutting signatures — adopted spec

The 10 signatures from BRAINSTORM.md, each as an implementation-ready component contract.

### 1. `<HeartbeatTicker>` — the `h_ii` heartbeat

- **State read:** `sessionStore.currentChapter`, `sessionStore.activeISO3`, `dataStore.h_ii_trajectory[iso3][p]`, `sessionStore.scrubP` (CH2 only), `uiStore.hatMatrixTooltipOpen`.
- **State written:** `uiStore.hatMatrixTooltipOpen` (toggled by hover/focus on the ticker; never persisted).
- **DOM placement:** `position: fixed; top: 16px; right: 16px; z-index: 100;` in viewport chrome. Renders above document flow; never inside the scrolled CSV. The hat-matrix tooltip, when open, anchors immediately below the ticker (`top: 56px; right: 16px;`), `z-index: 101`.
- **Render contract:** Two-line cell. Line 1: `{ISO3}.h_ii = {value, 4-decimal}` (`--type-annot`). Line 2: when CH1 + first-paint-not-yet-scrolled, sub-caption `a country's share of her own prediction.` rendered via `--type-subcaption` — **JetBrains Mono 7pt, `font-style: normal`, NOT DM Serif italic** (per BRAINSTORM CH1 wow #1: "Beneath it, flush, 7pt mono"; cross-cutting #1 reinforces "captioned once in CH1 with a 7pt line"; the italic markdown around the quoted phrase in BRAINSTORM is editorial emphasis, not a typeface directive). Sub-caption has `opacity: 1` until the first scroll event past 200px, then `opacity: 0` (instant — no transition). The line-1 cell never fades. The sub-caption contributes **zero** to the site's DM Serif italic budget.
- **Hat-matrix definition (per BRAINSTORM CH1 wow #1 implementation prereq — "available on hover but never surfaced by default"):** On hover (pointer) or focus (keyboard), the ticker reveals a KaTeX-rendered block containing the literal formula `h_ii = [X(X^TX)^{-1}X^T]_{ii}` with a one-line 9pt mono gloss: `# the i-th diagonal of the hat matrix; a country's pull on her own fit.` The block is pre-rendered at build time (static SVG from KaTeX server-side render) so no runtime KaTeX code loads. Default state: `display: none`. Never rendered at any route's default paint. Dismissed on `mouseleave` (pointer) or `blur`/`Escape` (keyboard). Never re-opened automatically.
- **Interaction / keyboard / aria contract for the hat-matrix reveal:**

  | Gesture | Trigger | Keyboard | Aria | Reduced-motion |
  |---|---|---|---|---|
  | Reveal hat-matrix block | `mouseenter` on ticker | `Tab` to ticker, then `Space` or `Enter` to toggle | `aria-describedby` points to the tooltip's id; tooltip announces `"h sub i i equals the i-th diagonal of X times X-transpose X inverse times X-transpose. A country's pull on her own fit."` | No transition to suppress; block appears/disappears instantly |
  | Dismiss | `mouseleave` or click outside | `Escape` or `Tab` away | aria-live clears | — |

- **Recast behavior:** when `activeISO3` changes (CH5 recast), the value re-reads from the new country's trajectory at the same `p` (clamped to that country's `n`). The ISO3 string changes; the cell does not animate the swap. The hat-matrix tooltip, if open at recast, closes (its content is country-independent, but re-opening is a fresh gesture).
- **Invariants:**
  - During a CH2 scrub, the displayed value is monotonic non-decreasing as `p` increases (verified against precomputed trajectory; if monotonicity fails on the data, precompute fails).
  - At `p = n - 1` for NOR, value reads ≥ `0.98`.
  - Never occluded by horizontal scrollbar, modals, or any chapter content.
  - Mobile: collapses to a 14px-tall persistent top-strip, full-width, flush against the viewport top edge; sub-caption stays as JetBrains Mono 7pt via `--type-subcaption` (positioned beside line 1, not below; remains `font-style: normal`). Hat-matrix tooltip, when triggered on mobile, renders as a bottom-sheet modal full-width, 40vh tall.
  - The hat-matrix block is **never** in the DOM at a route's default paint — verified by Playwright asserting `display: none` until an interaction fires.
- **Acceptance criteria:**
  1. First paint blocks on this cell's numeric value only — measured by Playwright as time-to-first-numeric-text in `[data-testid="heartbeat-ticker"]` ≤ 1.5 s on Moto G4 throttle.
  2. At p=n−1 for NOR the cell reads `NOR.h_ii = 0.98xx` (last two digits any).
  3. Reduced-motion: at the p where value crosses 0.95, the cell adopts a 1px gold stroke; no pulse animation.
  4. The aria-live region announces `"Norway's leverage is now zero point ninety-eight"` once when the value crosses each 0.1 boundary during scrub (throttled).
  5. Across all 5 chapters, the cell is present in the DOM at all times after first paint.
  6. **Hat-matrix tooltip contract:** at default paint on any route, `document.querySelector('[data-testid="hat-matrix-tooltip"]')` reports `offsetWidth === 0` and `offsetHeight === 0` (Playwright assertion). Hover or keyboard-focus on the ticker toggles the tooltip's visibility. The tooltip's DOM text contains the literal fragment `h_ii` and the one-line gloss. Keyboard-only readers can reach and dismiss the tooltip via `Tab`/`Space`/`Escape` per the interaction table above. The KaTeX SVG bundle loaded at runtime is 0 bytes (server-rendered at build time).

> **Counter-argument to DA objection that the hat-matrix prereq is missing from `<HeartbeatTicker>`:** the BRAINSTORM CH1 wow #1 prereq — "available on hover but never surfaced by default" — is specified in five locations within this component's contract, not zero: (1) the **Render contract** bullet explicitly forbids the block from rendering at any route's default paint and names the KaTeX-rendered formula `h_ii = [X(X^TX)^{-1}X^T]_{ii}` plus its 9pt mono gloss; (2) a dedicated **Hat-matrix definition** bullet names the BRAINSTORM prereq verbatim, specifies the build-time SVG render (so no runtime KaTeX), and names every dismissal vector; (3) the **Interaction / keyboard / aria contract for the hat-matrix reveal** is its own table with trigger/keyboard/aria/reduced-motion columns for both the reveal and dismiss gestures (hover, `Tab`+`Space`/`Enter`, `Escape`, `mouseleave`, blur); (4) the **Invariants** bullet asserts the block is "**never** in the DOM at a route's default paint" with a Playwright verification clause; (5) **Acceptance criterion #6** binds this to a concrete Playwright assertion (`offsetWidth === 0 && offsetHeight === 0` at default paint, hover/focus reveals the literal `h_ii` fragment, keyboard reach and dismiss via `Tab`/`Space`/`Escape`, runtime KaTeX bundle = 0 bytes). CH1 acceptance #9 cross-references this to bind the chapter route as well. The KaTeX line in the global tech-stack table is the build-time tooling commitment, not the interaction spec; the interaction spec lives here. The committee judged this sufficient.

### 2. `<FilenameTitle>` — filename-as-title

- **State read:** `sessionStore.activeISO3`, `dataStore.activeChapter`.
- **DOM placement:** Top-left of the typeset CSV, `position: sticky; top: 0;` within the document flow. Not viewport-fixed (it scrolls past once the reader leaves the first viewport).
- **Render contract:** `# five_deaths_of_{country_lower}.ipynb` in `--type-model` (11pt JetBrains Mono Medium). Default `country_lower = norway`. Recast writes `country_lower = uruguay` etc.
- **Invariants:** No DM Serif. No 240pt. No two-page title spread. The string is the title.
- **Acceptance criteria:**
  1. At first paint, the literal text `# five_deaths_of_norway.ipynb` is the first DOM-flow text node in the document body.
  2. After a recast to URY, the text reads `# five_deaths_of_uruguay.ipynb` within 700 ms of input commit.
  3. The element has `aria-level="1"` and `role="heading"` so screen readers announce it as the H1 (no separate `<h1>`).

### 3. `<RoleColumn>` + `<RoleCell>` + `<RoleLabeledCounter>` — the editable role column

- **State read:** `sessionStore.roleAssignments: Map<feature_id, 'causal'|'spurious'|'incidental'|'unlabeled'|'authored'>`.
- **State written:** `sessionStore.roleAssignments` on every commit.
- **DOM placement:** `<RoleColumn>` is CSV column index 0, pinned-left via `position: sticky; left: 0;`. One `<RoleCell>` per feature row. `<RoleLabeledCounter>` floats top-left of the document body, beside `<FilenameTitle>`, reading `labeled_by_you: {N} / 356` (`--type-annot`).
- **Render contract:**
  - `[authored]` cells (30 features): render the bracketed text in `--type-annot`. Hover reveals the citation in a `--type-subannot` floating block (no transition; opacity 0 → 1 instant on hover, 1 → 0 instant on blur).
  - `unlabeled` cells (326 features): render the literal token `unlabeled` in `--type-annot` at 60% opacity.
  - User-tagged cells: render `causal` / `spurious` / `incidental` in `--type-annot`, full opacity, with the corresponding `--role-*` color as `border-bottom: 1px solid`.
- **Reactive subscription:** every chart element with `data-feature-id="{id}"` re-paints its role-stroke class within 300ms of a role assignment commit (DA #3). Implemented via Svelte store subscription, not polling.
- **Invariants:**
  - 326 + 30 = 356 cells exactly. Verified at mount.
  - `[authored]` cells cannot be overwritten by user tags (the cell is read-only; the user can hover to read the citation but cannot toggle).
  - No undo, no remove. Once tagged, the cell carries that role for the session (DA #9).
- **Acceptance criteria:**
  1. Tagging a cell as `spurious` updates every chart's role-stroke for that feature within 300ms (Playwright timer).
  2. Counter updates synchronously on every commit.
  3. Reduced-motion has no effect — there are no transitions to suppress.
  4. Reload erases all tags (no localStorage; sessionStorage only).
  5. The editable cells respond to keyboard `1`/`2`/`3` per the keyboard table; the `[authored]` cells do not.

### 4. `<AuditionGutter>` — protagonist cast by audition

- **State read:** `dataStore.audition`, `sessionStore.activeISO3`.
- **DOM placement:** A single hairline mono line in the CSV gutter (left margin, between `--bg-indigo` and the role column), first paint, never repeated.
- **Render contract:** Literal text `# cast: NOR (h_ii_starkness = 0.91). runners-up at /audition.` (`--type-annot`). The string `/audition` is an `<a>` to the public notebook (rendered by Jupyter's `nbviewer` or hosted at the same domain). On recast, the line updates to `# recast: URY (h_ii_starkness = 0.74). original cast: NOR. all roles at /audition.`
- **Invariants:** No 3-second dissolve. No intermission. No animation of the line. The `/audition` link works both online and as a downloadable `.ipynb` file in `/static/audition.ipynb`.
- **Acceptance criteria:**
  1. Line is present at first paint; verified in Playwright as a DOM-flow text node within 100ms of FCP.
  2. The `audition.json` data file is loadable independently and lists 254 rows.
  3. `/audition` URL returns HTTP 200 with the executable notebook.

### 5. Reader-authored stroke-only palette utility

- **Implementation:** CSS classes `.role-stroke`, `.role-stroke--country-dot`, `.role-stroke--bracket` with `--stroke` set per element. Subscribed via `<RoleColumn>`'s store.
- **DOM placement:** N/A (utility classes applied to chart elements site-wide).
- **The single permitted exception:** `<PiCellLine2Underline>` (CH3 only) renders `border-bottom: 1px solid var(--role-X)` as the **fill below text**. The Stylelint plugin `role-color-stroke-only` exempts only this file path.
- **Invariants:** No fills. No backgrounds tinted with role color. Outlines and underlines only.
- **Acceptance criteria:**
  1. `role-color-stroke-only` Stylelint rule passes the codebase except for the explicitly listed CH3 component.
  2. Visual snapshot: the difference between a tagged and untagged dot is the presence of a 1px outline, never a fill.

### 6. Typography system — see "Typography system" section above

This is a CSS-variable rationing system, not a runtime component. The `.assert-serif-budget` dev check is the runtime enforcement. Total DM Serif italic occurrences across the full scroll = **exactly 4** (3 chapter italic lines — CH2 14pt sized-down, CH3 32pt interjection, CH5 32pt interjection; CH1 contributes zero because its sub-caption is **7pt mono** per BRAINSTORM CH1 wow #1, rendered via `--type-subcaption`; CH4 contributes zero per DA #7 — plus 1 closing 48pt aphorism). The single target CI enforces is `4`.

### 7. `<CellEditScrub>`, `<DoubleClickCommit>`, `<ObjectionAffordance>`, `<DragToJoin>`, `<ClickToSort>`, `<RecastInput>` — every interaction is a cell edit

Six discrete gestures, no sliders, no knobs. Each lives in a named component. Spec for each:

| Component | Trigger | Keyboard equivalent | Reduced-motion | aria contract |
|---|---|---|---|---|
| `<CellEditScrub>` | Click + horizontal drag on a numeric cell | Focus + arrow keys (see keyboard table) | No transition needed (state changes are instant) | `role="slider"`, `aria-valuemin/max/now` |
| `<DoubleClickCommit>` | Double-click within 600ms | `Enter Enter` | None | `role="button"`, announcement on commit |
| `<ObjectionAffordance>` | Click `[×]` glyph | `Backspace` on focused row | Strike appears instantly | `role="button"`, `aria-label="strike feature {name}"` |
| `<DragToJoin>` | Drag row onto target sheet | `J` then arrow + `Enter` | Drag preview is a static line, not animated | `role="application"`, instructions in screen-reader-only text |
| `<ClickToSort>` | Click column header | `s` cycles modes | None | `aria-sort` per WAI-ARIA |
| `<RecastInput>` | Type in input | Type in input | None (the 700ms re-render is content swap, not animation) | `role="search"`, `aria-label="recast biography"` |

**Forbidden in any of these:** sliders (`<input type="range">`), dials, knobs, painted maps, brass affordances. Lint rule `no-input-range` fails the build on `<input type="range">`.

### 8. Emit-don't-perform — enforcement of DA #1

This is not a component; it is a constraint. Enforcement:

- **Custom ESLint rule `no-css-animation-over-200ms`**: scans CSS files (`.css`, `.svelte` `<style>` blocks) for `transition`, `transition-duration`, `animation`, `animation-duration` and fails on any value > 200ms. Whitelist: by `data-permitted-motion="ch2-pulse|ch3-strike|ch4-rolestroke-hover"` attribute on the parent rule, declared at the top of the file with a code comment citing the BRAINSTORM line that permits it.
- **Custom Stylelint rule `no-keyframes`**: bans `@keyframes` entirely except in three named files (`/src/lib/components/ch2/HeartbeatPulse.svelte`, `/src/lib/components/ch3/StrikethroughDraw.svelte`, `/src/lib/components/ch4/RoleStrokeHover.svelte`).
- **Dev-mode runtime check**: `MutationObserver` on `document.body` watches for any element gaining a `style` attribute with `transition` or `animation`; logs `console.error` and surfaces a dev overlay. Inert in production.

### 9. `<NorwayRow>` — sticky-gold biography row

- **State read:** `sessionStore.activeISO3`, `sessionStore.currentChapter`, derived diagnostic cells.
- **DOM placement:** Always pinned in the visible viewport via `position: sticky; top: 32px;` (just below the heartbeat ticker chrome). The row holds five diagnostic cells: `gdp_actual | gdp_predicted | pi_95% | h_ii | mae_across_splits`. ISO-3 in the gutter.
- **Render contract:** Cells render the chapter's current state. CH1: predicted/PI/MAE all empty (model not fit). CH2: explodes per p-scrub. CH3: stabilizes at CV-α values. CH4: same as CH3 but β̂ row is now flat-emitted below. CH5: cells render bracketed (CIs).
- **Recast:** ISO-3 swap; cells re-render with the recast country's values; the row's gold-stroke styling persists.
- **Invariants:** Always visible (sticky). Always five cells. ISO-3 always in gutter. The gold styling is a 1px stroke on the row's left edge (`border-left: 1px solid var(--gold)`); no fill.
- **Acceptance criteria:**
  1. At any chapter scroll position, taking a screenshot of the viewport captures the row's five diagnostic cells in legible form (CH2's buckle is the deliberate exception per CH2 wow #2).
  2. On recast, the row's data changes within 700ms; gold stroke persists.
  3. Mobile: row stays sticky as a horizontally-scrollable strip below the heartbeat ticker.

### 10. `<ScrollGate>` — scroll → recast-bar handoff (DA #5)

- **State read:** route + scroll history (sessionStorage flag `tutorialCompleted: boolean`).
- **State written:** `tutorialCompleted = true` only after the reader has scrolled through CH1–CH5 in order (each chapter's bottom sentinel must enter viewport).
- **DOM placement:** Renders as the **only** content of `/v-one-draw` if `tutorialCompleted !== true`; otherwise renders `<ChapterFive>`.
- **Render contract:** Literal cell `# the recast bar requires the tutorial. scroll from the top.` in `--type-annot` against `--bg-indigo`. No styling. No tooltip. No "skip anyway" button. A single `<a href="/">return to top</a>` in `--type-annot` underneath.
- **Invariants:** This is a refusal, not a redirect. The reader sees the message and must navigate manually. The flag is sessionStorage-only — closing the tab resets it.
- **Acceptance criteria:**
  1. Direct navigation to `/v-one-draw` in a clean session shows the refusal cell only.
  2. After scrolling top-to-bottom (CH1 → CH5 sentinel entering viewport), reloading `/v-one-draw` shows the recast bar.
  3. The refusal cell is not rendered as a modal — it replaces the route content entirely.

---

## Chapter-by-chapter adopted design

### CH1 — *Norway is indistinguishable from McDonald's*

**Adopted signature:** #1 from BRAINSTORM.md's CH1 section: *The heartbeat cell, captioned*.

**Adoption rationale:** The committee converged on the heartbeat as the site's unifying scalar (cross-cutting #1). CH1's signature must be the moment the reader first sees this cell with its sole caption — the only sentence in the site that explains what `h_ii` *is*. Wow-moment #2 (ECDF reveal) and #3 (role-tagging commit) are both narrative engines for the chapter, but neither is the *frame* a reader would screenshot to remember CH1.

**Dispositions of #2 and #3:**
- **#2 (reader-drawn ECDF):** **Absorbed as secondary layer**. Implemented as the chapter's interaction climax. Six queries → 2-second full-viewport ECDF strip → 350-tick rain → caption *"you built this in thirty seconds. 186 of 356 features would have fit inside it."* The ECDF is the chapter's gesture; the heartbeat is the chapter's frame.
- **#3 (role-tagging commit + bracketed whisper):** **Absorbed as the chapter's mechanism throughout.** The A/B forced choice is the trigger for the first β̂-whisper, and the role tags populate the cross-cutting `<RoleColumn>`. Without #3, cross-cutting #3 (editable role column) has no entry point.

#### Component tree

```
<Ch1Route>
├── <FilenameTitle/>                      // cross-cutting #2
├── <AuditionGutter/>                     // cross-cutting #4
├── <RoleLabeledCounter/>                 // cross-cutting #3
├── <HeartbeatTicker showCaption={true}/> // cross-cutting #1, CH1-only sub-caption visible
├── <CsvViewport>
│   ├── <RoleColumn>                      // cross-cutting #3
│   │   └── <RoleCell ×356/>
│   ├── <NorwayRow/>                      // cross-cutting #9
│   └── <DataCells/>
├── <Ch1QueryBar/>                        // CH1-specific; spec below
├── <Ch1EcdfRevealOverlay/>               // CH1-specific, triggers on 6th query
├── <Ch1AbForcedChoice>                   // CH1-specific
│   └── <DoubleClickCommit ×2/>
└── <Ch1FirstBetaWhisper/>                // emits one bracketed coefficient line
```

#### `<Ch1QueryBar>` — component spec (per BRAINSTORM CH1 wow #2 implementation prereq)

- **State read:** `sessionStore.queryCount: int`, `sessionStore.queryHistory: string[]`, `dataStore.features` (356 rows with `id`, `short_name`, `full_name`, `absurdity_flag: bool`), `dataStore.ecdf_null`.
- **State written:** `sessionStore.queryCount` (incremented on commit), `sessionStore.queryHistory` (appended), `sessionStore.roleAssignments` (unchanged here — the role tag is a separate interaction).
- **DOM placement:** Inline within CH1 route, below the first viewport's CSV fold. `role="combobox"`, `aria-autocomplete="list"`, `aria-controls` pointing to the autocomplete list's id.
- **Autocomplete seeding (binding, per BRAINSTORM CH1 wow #2 prereq — "Autocomplete must seed absurd features alongside serious ones (first-hint ghost suggestion after query 2)"):**
  - The autocomplete suggestion list is drawn from `features.json`, which is precomputed with an `absurdity_flag: boolean` on every row. Approximately 30 features carry `absurdity_flag: true` (seeded by the author list committed in `/precompute/absurd_seed.py`: `iso3_alphabetical_rank`, `un_member_letters`, `name_numerology_score`, `scrabble_letter_value`, `capital_vowel_count`, etc. — the same queue CH3/CH4 will draw from).
  - **Queries 1 and 2:** autocomplete list ranks suggestions by the reader's typed prefix against feature `short_name`; no absurd features are surfaced unless the reader explicitly types an absurd prefix.
  - **After query 2 (i.e., for queries 3 through 6):** the autocomplete list **MUST** interleave at least one `absurdity_flag: true` feature among the top 5 suggestions on every keystroke, AND **MUST** render a **first-hint ghost suggestion** — a single `absurdity_flag: true` feature — as greyed-out inline-completion text (`--type-annot` at 50% opacity) following the reader's caret position. The ghost suggestion uses the `text-decoration: none; color: rgba(0,0,0,0.35);` styling and is pre-selected: `Tab` accepts it; any other keystroke dismisses it instantly (no transition).
  - **Absurd-feature rotation:** the ghost suggestion cycles through the absurd pool pseudo-randomly (seeded by `sessionStore.queryCount`) so repeat readers see the same sequence; the cycle never repeats a suggestion the reader has already committed.
  - **Reduced-motion:** ghost suggestion renders identically (no transition involved); screen-reader announcement: `"suggestion: {feature_name}, flagged absurd. Tab to accept."`
- **Interaction contract:**

  | Gesture | Trigger | Keyboard | Aria | Reduced-motion |
  |---|---|---|---|---|
  | Type character | keystroke | — | list role updates | n/a |
  | Accept ghost | `Tab` | `Tab` | "Accepted suggestion {feature}." | n/a |
  | Dismiss ghost | any keypress other than `Tab`/`Enter` | same | — | n/a |
  | Commit query | `Enter` | `Enter` | "Query {n}: {feature}, \|r\| equals {value}." | n/a |
  | Cycle autocomplete list | `↓`/`↑` | same | list navigation | n/a |

- **Invariants:**
  - The ghost suggestion surfaces for the first time on the **third** query's keystroke (not earlier) and on every subsequent query keystroke up to and including query 6.
  - Between query 3 and query 6, the top 5 autocomplete items **always** contain ≥ 1 absurd feature (verified by the test `ch1-querybar-absurd-seeding.spec.ts`).
  - If the reader commits fewer than 6 queries before scrolling past, the ghost-suggestion contract still held for the queries they did type.
- **Acceptance criteria:**
  1. On keystroke 1 of query 3, `[data-testid="autocomplete-ghost"]` renders non-empty text whose feature id carries `absurdity_flag: true` in `features.json`.
  2. Across queries 3–6, every snapshot of the open autocomplete list contains ≥ 1 `absurdity_flag: true` row in positions 1–5.
  3. The ghost suggestion is **never** rendered on queries 1 or 2.
  4. `Tab` accepts the ghost; any other keystroke dismisses it; these are the only two terminations.
  5. The absurd-feature pool is loaded from `/precompute/absurd_seed.py`'s output — not hard-coded in the component.

> **Counter-argument to DA objection that the autocomplete-seeding prereq was elided:** the BRAINSTORM CH1 wow #2 prerequisite — "Autocomplete must seed absurd features alongside serious ones (first-hint ghost suggestion after query 2)" — is specified in four locations in this spec, not zero: (1) the `<Ch1QueryBar>` "Autocomplete seeding" bullet immediately above (the binding clause naming `absurdity_flag`, the queries-3-through-6 surfacing rule, the ghost-suggestion DOM contract, the `Tab`-to-accept termination, the `--type-annot` 50%-opacity styling, and the rotation seeded by `queryCount`); (2) the CH1 state machine's `querying-early` and `querying-seeded` rows, which name the absent-then-present ghost transition at the 2nd→3rd query boundary; (3) the CH1 interactions table rows for "Autocomplete ghost reveal," "Accept ghost," and "Dismiss ghost," each with trigger/keyboard/aria/reduced-motion columns filled; (4) CH1 acceptance criterion #8, which names the Playwright spec `ch1-querybar-absurd-seeding.spec.ts` and the `[data-testid="autocomplete-ghost"]` selector that asserts the ghost's `textContent` resolves to an `absurdity_flag: true` feature on every keystroke of queries 3–6 and is absent on queries 1–2. Stage 2 cannot ship a generic autocomplete and pass the spec because the test selector + `absurdity_flag` data binding + queries-3-through-6 invariant collectively make a generic implementation fail CI. The committee judged this sufficient.

#### State machine

| State | Enter on | Exit on | Visible elements |
|---|---|---|---|
| `idle` | first paint | first query typed | Filename, AuditionGutter, Counter, Ticker (with caption), CSV, RoleColumn |
| `querying-early` (queries 1–2) | first query commit | 2nd query commit | Above + tick on horizontal `|r|` strip; autocomplete list shows serious features only; **no ghost suggestion** |
| `querying-seeded` (queries 3–6) | 2nd query commit | 6th query commit | Above + ghost suggestion visible on every keystroke; autocomplete top-5 interleaves absurd features (per `<Ch1QueryBar>` spec) |
| `ecdf-revealing` | 6th query commit | 1.2s after rain settles | Full-viewport ECDF strip with 6 user ticks + 350 raining ticks |
| `ecdf-settled` | rain settles | first scroll past strip | ECDF caption visible: `you built this in thirty seconds. 186 of 356 features would have fit inside it.` |
| `ab-forced` | scroll past ECDF | double-click on A or B | Two-column display of `column_A[NOR]=9.4 vs column_B[NOR]=14.0`, both r=0.78 |
| `ab-committed` | DoubleClickCommit fires | scroll to CH2 | Pin (`✓` or `✗`) on chosen column header; β̂ whisper line emits in one frame |
| `tagging` | concurrent with `ab-committed` | scroll to CH2 | Role-tag toggles available on every column |

Sub-caption opacity transitions to 0 on first scroll past 200px (instant, no animation).

#### Data requirements

- `features.json` (full — including `absurdity_flag` field for every row)
- `nor/ecdf_null.json` (the `186 / 356` count and the per-feature |r| values for the rain)
- `nor/beta_path.json` filtered to `p=1` for the first β̂ whisper (one coefficient: the pinned column's `coef` and CI)
- `nor/h_ii_trajectory.json` (heartbeat ticker reads `[10]` → `0.04`)
- `/precompute/absurd_seed.py` output (~30 feature ids with `absurdity_flag: true`) is merged into `features.json` at build time; no separate runtime file

#### Interactions

| Gesture | Trigger | Keyboard | Aria announcement | Reduced-motion |
|---|---|---|---|---|
| Type query | typing in query bar | same | none (screen reader reads input) | n/a |
| Autocomplete ghost reveal | 1st keystroke of query 3 (and every subsequent keystroke through query 6) | same | "Suggestion: {feature_name}, flagged absurd. Tab to accept." | Ghost suggestion renders at final opacity instantly — no fade |
| Accept ghost | `Tab` while ghost visible | `Tab` | "Accepted suggestion {feature}. Ready to commit with Enter." | n/a |
| Dismiss ghost | any keypress other than `Tab`/`Enter` | same | silent dismiss | n/a |
| Commit query | `Enter` or click "drop" | `Enter` | "Query {n}: {feature}, |r| equals {value}" | n/a |
| ECDF reveal | 6th commit fires automatically | same | "Six queries complete. 350 features now revealed; 186 of 356 fit within the null band." | Full ECDF appears in one frame, no rain |
| A/B commit | double-click cell A or B | `Tab` to cell, `Enter Enter` within 600ms | "Committed. Pin attached to {column_name}. Whisper emitting." | Pin appears instantly (already instant) |
| Role tag | three-way toggle click | `1`/`2`/`3` keys | "Feature {name} tagged {role}. {N} of 356 labeled." | n/a |
| Hat-matrix reveal on ticker | hover/focus on `<HeartbeatTicker>` | `Tab` to ticker, `Space`/`Enter` to toggle, `Escape` to dismiss | "h sub i i equals the i-th diagonal of X X-transpose X inverse X-transpose. A country's pull on her own fit." | n/a (no transition involved) |

If fewer than 6 queries are entered before the reader scrolls past, the ECDF reveal fires at scroll time with **honest copy**: `"you built this in {N} seconds — and {fewer-fit} of 356 features would have fit. the others were never tested."` (Per BRAINSTORM CH1 wow #2 implementation note.)

#### Mobile (≤ 480px) layout

- Heartbeat ticker → 14pt persistent top-strip (per cross-cutting #1).
- Filename below ticker, full-width.
- Query bar fixed-bottom for thumb reach.
- ECDF reveal renders horizontal-only (no full-viewport expansion at portrait — the strip stays in flow at 100% width, 80vh tall when triggered).
- A/B forced choice stacks vertically (cell A above cell B, both 100% width).
- Role tag toggle expands to full-width radio group.
- RoleColumn: pinned-left within a horizontally-scrollable CSV; the counter remains visible above.

#### Acceptance criteria

1. First paint shows the heartbeat ticker with caption, the filename, the audition gutter line, and the first viewport of the CSV — within the 1.2s FCP budget.
2. The sub-caption `a country's share of her own prediction.` renders in **JetBrains Mono 7pt at `font-style: normal`** via `--type-subcaption` (per BRAINSTORM CH1 wow #1's verbatim "7pt mono") only on first paint and only at CH1; it disappears (instant) on first scroll past 200px and never reappears. Playwright asserts `getComputedStyle(subCaption).fontFamily` contains `JetBrains Mono` and `getComputedStyle(subCaption).fontStyle === 'normal'`; if either assertion shows DM Serif or italic, the test fails. The sub-caption contributes 0 to `.assert-serif-budget`'s italic count.
3. After 6 queries the ECDF reveal fires within 100ms of the 6th commit; the rain settles within 1.2s.
4. The A/B columns truly match in shape at display size (verified in real data; assertion in `precompute/verify.py`).
5. On A/B commit, the bracketed whisper emits in one frame (no transition); the pinned column's header carries `✓` or `✗` for the rest of the session.
6. Role assignments persist (within session) and propagate to every subscribing chart in <300ms.
7. The `186 / 356` count is loaded from `ecdf_null.json`, not hard-coded.
8. **Autocomplete absurd-feature seeding (BRAINSTORM CH1 wow #2 prereq):** from the first keystroke of the reader's third query onward, `[data-testid="autocomplete-ghost"]` renders a non-empty feature name whose `absurdity_flag === true`. The ghost is absent for queries 1 and 2. Verified by Playwright spec `ch1-querybar-absurd-seeding.spec.ts`, which types 6 staged queries and asserts the ghost's `textContent` resolves to an `absurdity_flag: true` feature at each keystroke of queries 3–6. The ghost is acceptable via `Tab` and dismissible by any other key.
9. **Hat-matrix tooltip on ticker (BRAINSTORM CH1 wow #1 prereq):** at CH1 default paint, the hat-matrix block is not in layout (`offsetHeight === 0`). Hover or keyboard-focus on `[data-testid="heartbeat-ticker"]` renders the KaTeX block with literal fragment `h_ii`; dismissible by mouseleave, blur, `Tab` away, or `Escape`. Verified by the `<HeartbeatTicker>` acceptance criterion #6 above — cross-referenced here.

#### Out of scope for Stage 2

- Card catalog, dendrogram, radial catalog (rejected, BRAINSTORM CH1).
- Cemetery/graveyard motif (rejected).
- 355-bar chart of Pearson r (rejected).
- Title spread, 240pt DM Serif gold (rejected).
- Audition intermission dissolve (rejected; cross-cutting #4 supplies the gutter line instead).

---

### CH2 — *Norway's prediction explodes*

**Adopted signature:** #1 from BRAINSTORM.md's CH2 section: *The CSV buckles under its own width*.

**Adoption rationale:** This is the only candidate that satisfies DA #2 (the dataset IS the material) at the rendering level — the *interface itself* fails as the pedagogy. #2 (heartbeat climbs) is fully encoded by cross-cutting #1 and runs continuously through this chapter as a layer on top of the buckle. #3 (scrollbar IS the hockey stick) is structurally elegant but cross-browser custom-scrollbar styling is a known fragility (Safari + mobile both push back); promoting it to chapter-frame would risk shipping a chapter whose signature only renders on Chromium.

**Dispositions of #2 and #3:**
- **#2 (heartbeat climbs to 0.98):** **Absorbed as the chapter's persistent layer.** The `<HeartbeatTicker>` (cross-cutting #1) already renders this; its gold pulse at 0.95 is one of the three permitted sub-200ms motions. The `at p = n−1, Norway is 98% of her own prediction. everything else in this viewport stopped being honest thirty seconds ago.` line below the ruin is the chapter's resolution copy.
- **#3 (scrollbar IS the hockey stick):** **Absorbed as a secondary layer with degraded fallback.** Implement the gold + dashed-gray scrollbar overlay where browser support allows; on browsers that refuse custom-scrollbar styling (Safari WebKit ≥ 17 partial, mobile Safari), render a thin 1px gold + dashed-gray rail flush with the bottom of the viewport (not the scrollbar), with the same labels. Caption is unchanged.

#### Component tree

```
<Ch2Route>
├── <HeartbeatTicker/>                    // value scrubs live, gold-pulses at 0.95
├── <FilenameTitle/>
├── <RoleColumn/>                         // cross-cutting #3 — pinned-left throughout the buckle (see "Role column in CH2" below)
│   └── <RoleLabeledCounter/>             // remains visible top-left
├── <NorwayRow/>                          // last data row to fail, per spec (but pinned ROLE cell for NOR does NOT fail — it is in <RoleColumn>)
├── <Ch2BuckleSheet>                      // renders the typeset CSV (right of <RoleColumn>) with overflow grammar
│   ├── <BetaRow/>                        // emits scientific-notation tail off-screen
│   ├── <BoundaryBreachRules/>            // dashed-red hairlines on breached cell borders
│   └── <PinnedDiagnosticCell/>           // log(λ_min(XᵀX)) cell
├── <Ch2PScrubCell/>                      // the one editable numeric cell
├── <Ch2InfinityIntervalCell/>            // [-Infinity, +Infinity] in NorwayRow's pi_95% slot
├── <Ch2ScrollbarOverlay/>                // gold + dashed-gray, with fallback rail
└── <Ch2ItalicLine/>                      // 14pt DM Serif italic, the chapter's sole serif
```

##### Role column in CH2 (spec for cross-cutting #3's presence in the buckle chapter)

The role column is not a CH1-only feature. Per cross-cutting signature #3 ("The editable `role` column — pinned at CSV position 0 ... always visible"), the column persists across all five chapters. CH2's buckle does **not** consume it. Specifically:

- **Pinned-left behavior:** `<RoleColumn>` uses `position: sticky; left: 0; z-index: 2;` anchored to the viewport's left edge. The typeset CSV's horizontal overflow — the buckle's whole mechanism — occurs to the **right** of the role column. The role column never enters the overflow.
- **Visual survival during the buckle:** at `p = n−1` (the state where every data cell has become illegible via `Infinity`/`NaN`/collision), every `<RoleCell>` in `<RoleColumn>` still renders its assigned token (`causal` / `spurious` / `incidental` / `[authored]` / `unlabeled`) in `--type-annot` at full opacity. The role-stroke underlines on tagged cells stay at 100% opacity throughout the chapter.
- **The pristine survivors at p=n−1 are therefore three, not two:** (a) `<HeartbeatTicker>` in viewport chrome (per cross-cutting #1), (b) `<FilenameTitle>` in the sticky document header, and (c) `<RoleColumn>` pinned-left in the CSV. BRAINSTORM CH2 wow #2's "one cell that stays pristine is the ticker" is preserved at the single-cell level — the role column is a *column* of cells (each cell is pristine; the column-as-structure is the third persistent typographic structure).
- **`<NorwayRow>` last-to-fail claim is scoped to the data cells** (`gdp_actual | gdp_predicted | pi_95% | h_ii | mae_across_splits` + any further data-row cells in the right-overflowing CSV) — **not** the role cell for NOR. Norway's role cell is rendered inside `<RoleColumn>` and is in the pinned-left region; it survives the buckle along with every other role cell.
- **On mobile:** `<RoleColumn>` stays pinned-left in the horizontally-scrollable CSV viewport; the buckle's overflow occurs in the scrollable right region.
- **No disappearance.** There is no CH2 state in which `<RoleColumn>` is removed, hidden, or faded.

> **Counter-argument to DA objection that CH2 quietly drops the editable role column:** cross-cutting #3's CH2 presence is specified in three locations within this chapter, not zero: (1) the CH2 **component tree** explicitly lists `<RoleColumn/>` (with the cross-cutting #3 reference and a "pinned-left throughout the buckle" inline note) and `<RoleLabeledCounter/>` immediately below it; (2) the entire **"Role column in CH2"** subsection above this counter-argument specifies pinned-left behavior (`position: sticky; left: 0; z-index: 2`), visual survival during the buckle (every `<RoleCell>` renders its assigned token at full opacity at `p = n−1`, including role-stroke underlines), the scope of the `<NorwayRow>` last-to-fail claim (data cells only — NOR's role cell lives in `<RoleColumn>` and survives), the mobile behavior, and a no-disappearance invariant; (3) **CH2 acceptance criterion #8** binds these to Playwright assertions at `p = n − 1` for `position === 'sticky'`, `left === '0px'`, non-zero `offsetWidth` per `<RoleCell>`, opacity 1 on the assigned token, and overflow non-translation, plus the `<RoleLabeledCounter>` visibility check. The role column is the **third** persistent typographic structure at the buckle apex (alongside the ticker and filename), explicitly named as such in the subsection. The committee judged this sufficient.

#### State machine

| State | Enter on | Exit on | β̂ row state |
|---|---|---|---|
| `pre-scrub` | scroll into CH2 | first scrub edit | `p=10` baseline; β̂ values render normally; ticker = 0.04 |
| `scrubbing` | `p` cell edit | scroll past CH2 | values march per `beta_path.json`; cells overflow at p > ~120; dashed-red boundary rules appear |
| `at-overflow` | `p` reaches `n-3` | scroll past CH2 | β̂ row contains `[Infinity, NaN, -Infinity, 1.2e18, undefined, NaN, …]`; ticker = 0.98 (with gold-pulse trigger) |
| `post-buckle` | scroll past `Ch2ItalicLine` sentinel | scroll into CH3 | scene is "frozen" at p=n-1; reader has the screenshot |

#### Data requirements

- `nor/beta_path.json` (precomputed β̂ at every integer `p` from 10 to 213; 213 ≈ NOR's row count for the dataset).
- `nor/h_ii_trajectory.json` (drives the ticker).
- `nor/diagnostic_path.json` (provides `log_lambda_min`, `test_r2`, `scrollbar_progress`).

#### Interactions

| Gesture | Trigger | Keyboard | Aria | Reduced-motion |
|---|---|---|---|---|
| `p` scrub | click + drag horizontal on `p` cell | Focus + arrow keys (per keyboard table) | "p is now {N} of {n}" (throttled) | No transition (already instant). The ticker's gold-pulse → 1px gold stroke (per cross-cutting #1). Static fallback frames at `p=50, n, 356`. |

#### Mobile (≤ 480px) layout

- The buckle relies on horizontal overflow — on mobile, the CSV scrolls horizontally within a constrained viewport, and the buckle's overflow visually trails into the mobile-side margin (which is `--bg-indigo`, same as desktop).
- The `p` scrub-cell becomes a tap-and-hold-then-swipe gesture on the cell; arrow keys remain the keyboard alternative.
- Italic line collapses to 11pt (DM Serif italic; rationed exception holds at 11pt on mobile per the type ramp).

#### Acceptance criteria

1. β̂ row renders all four named overflow values exactly: `Infinity`, `NaN`, `+3.7e18` (or close), `-Infinity`. The string `[object Object]` does **not** appear unless explicitly composed (BRAINSTORM CH2 wow #1 high-risk note); default disposition is to **omit** it.
2. The ticker reaches `0.98xx` at `p = n − 1` for NOR, with the gold pulse firing once when the value crosses `0.95` (single 200ms transition; no repeats).
3. `<NorwayRow>`'s **data cells** are the last typographic structure among the right-overflowing (non-pinned) CSV cells to fail (verified via `precompute/verify.py` checking that NOR has the highest leverage trajectory among visible-row countries). The role-cell for NOR is in `<RoleColumn>` (pinned-left) and is not part of this claim.
4. `log(λ_min(XᵀX)) = -34.7` (or close) renders in the corner pinned cell.
5. Italic line *"you are looking at the screenshot every analyst has taken and deleted."* appears exactly once, exactly at 14pt (sized down from the 32pt ration, via `--type-voice14`), exactly in DM Serif italic.
6. Reduced-motion: three pinned snapshots at `p=50, p=n, p=356`; the gold pulse becomes a 1px gold stroke from p=0.95 onward.
7. The scrollbar overlay (gold + dashed-gray) renders in Chrome ≥ 90, Firefox ≥ 90; the rail-flush fallback renders in Safari and mobile.
8. **`<RoleColumn>` survives the buckle:** at `p = n − 1`, Playwright asserts (a) `<RoleColumn>`'s computed `position === 'sticky'` and `left === '0px'`, (b) every `<RoleCell>` within it has non-zero `offsetWidth` and renders the reader's assigned token in `--type-annot` at `opacity: 1`, (c) the horizontal overflow (scrollLeft > 0) does not translate the role column. This is verified in the same visual-snapshot run that captures the buckle. The `<RoleLabeledCounter>` also remains visible at full opacity.

#### Out of scope for Stage 2

- Coefficient Storm / Piano-Key Storm / Pin Detachment (rejected).
- Hockey Stick / Twin Trails / Bias² + Variance (rejected; replaced by scrollbar-as-chart).
- Seismograph / Earthquake / Ledger (rejected).
- Rose Window / Painted Fold Map (rejected, leaked from CH5 candidates).

---

### CH3 — *Norway is saved, wrongly*

**Adopted signature:** #1 from BRAINSTORM.md's CH3 section: *The PI cell that contains its own refutation*.

**Adoption rationale:** This is the site's tightest typographic composition (BRAINSTORM CH3 wow #1 implementation note). The two-layer cell at 60px is the sole place role-color appears as a fill-below-text — explicitly earned as the one allowed exception to the stroke-only palette. Both alternative wow-moments depend on this cell anyway: #2 (shuffled-null peer cell) is rendered in *the same grammar*, and #3 (strikethrough + ticker contraction) is the chapter's interaction layer. The PI cell is the chapter, full stop.

**Dispositions of #2 and #3:**
- **#2 (shuffled-null as peer cell):** **Absorbed as adjacent twin.** Renders in the identical two-layer grammar immediately to the right of the real PI cell, with `pi_95%_shuffled` header (45° dashed-gray stripe in the gutter). Same `<PiCell>` component instance with `prop:shuffled={true}`.
- **#3 (strikethrough + ticker contraction):** **Absorbed as the chapter's interaction layer.** The α-scrub cell (`<CellEditScrub>`) drives both the PI cell's α-state and the strikethrough animation across 336 column headers. The ticker contraction from 0.98 to 0.31 is a layer on cross-cutting #1's heartbeat. The `your labels vs Lasso's picks: agree on 14 | disagree on 7` counter is a derived render from `<RoleColumn>`'s state crossed with `lasso_alpha_path.json`.

#### Component tree

```
<Ch3Route>
├── <HeartbeatTicker/>                    // contracts from 0.98 → 0.31
├── <FilenameTitle/>
├── <RoleLabeledCounter/>                 // cross-cutting #3 — labeled_by_you: N / 356, top-left, always visible
├── <NorwayRow/>                          // pi_95% slot is the focal cell
├── <Ch3AlphaScrubCell/>                  // gold inside 1-SE range; indigo outside
├── <CsvViewport>
│   ├── <RoleColumn>                      // cross-cutting #3 — pinned-left CSV col 0, full opacity throughout α-scrub
│   │   └── <RoleCell ×356/>              // each tagged cell drives PiCellLine2Underline color via reactive store
│   └── <DataCells/>
├── <PiCellComposition>
│   ├── <PiCell shuffled={false}/>        // Norway's real PI
│   └── <PiCell shuffled={true}/>         // peer cell, identical grammar
├── <PiCellLine2Underline ×N/>            // EXCEPTION: stroke-fills below text — colors subscribe to <RoleColumn>
├── <Ch3StrikethroughLayer/>              // 336 column headers, 120ms strike per column; strike color subscribes to <RoleColumn>
├── <Ch3PinPersistencePulse/>             // soft pulse on reader's CH1 pinned column when it survives
├── <Ch3AgreementCounter/>                // your labels vs Lasso's picks (derived from <RoleColumn> ∩ lasso_alpha_path.json)
└── <Ch3ItalicLine/>                      // 32pt DM Serif italic, sole interjection
```

##### Role column in CH3 (spec for cross-cutting #3's presence in the PI-cell chapter)

Per cross-cutting signature #3, `<RoleColumn>` is **pinned at CSV position 0 across every chapter**, not only CH1 and CH2. CH3 not only displays the column — it **consumes it** as the source of truth for three derived renders (the PI-cell line-2 underline colors, the strikethrough recoloring, and the agreement counter), and the column itself remains visible throughout:

- **Pinned-left behavior:** `<RoleColumn>` renders with `position: sticky; left: 0; z-index: 2;` anchored to the viewport's left edge. The PI cell composition (`<PiCell shuffled={false}>` and `<PiCell shuffled={true}>`) renders in the document's main flow to the right of `<RoleColumn>`. Horizontal scroll within the CSV viewport never translates the role column.
- **Visual survival during α-scrub:** at every α value across the sweep — including `α=0` (356-term pandemonium) and `α=∞` (empty PI cell) — every `<RoleCell>` in `<RoleColumn>` continues to render its assigned token (`causal` / `spurious` / `incidental` / `[authored]` / `unlabeled`) in `--type-annot` at full opacity. The role-stroke underlines on tagged cells stay at 100% opacity throughout the chapter.
- **Reactive dependency:** every `<PiCellLine2Underline>` (the chapter's one stroke-only-palette exception) derives its `border-bottom-color` from the corresponding `<RoleCell>`'s assignment via the Svelte store. The chapter's pedagogy — *the reader's red labels are the equation that "saved" the protagonist* — only lands if the column is visible while the cell is read; both render in the same viewport.
- **`<Ch3StrikethroughLayer>` recoloring:** strikethroughs across 336 column headers inherit color from `<RoleColumn>` per BRAINSTORM CH3 wow #3 — green strikes for `causal`-tagged columns Lasso zeros out; red persistence-boxes for `spurious`-tagged columns Lasso keeps. The strike-color binding is a reactive subscription, not a precomputed render.
- **`<RoleLabeledCounter>` visibility:** the `labeled_by_you: N / 356` counter remains visible at full opacity, top-left, throughout the chapter. It does not collapse, fade, or move when the PI cell is in focus.
- **Mobile:** `<RoleColumn>` stays pinned-left in the horizontally-scrollable CSV viewport; the PI cell composition lives in the right-scrollable region. `<RoleLabeledCounter>` remains top-left.
- **No disappearance.** There is no CH3 state in which `<RoleColumn>` or `<RoleLabeledCounter>` is removed, hidden, or faded.

> **Counter-argument to DA objection that CH3 elided `<RoleColumn>` and `<RoleLabeledCounter>`:** the DA's veto is adopted in full. The CH3 component tree now lists `<RoleColumn>` (with its `<RoleCell ×356/>` children) and `<RoleLabeledCounter>` explicitly, the "Role column in CH3" subsection above this counter-argument specifies pinned-left behavior, full-opacity survival across α-scrub, the reactive dependencies that drive `<PiCellLine2Underline>` and `<Ch3StrikethroughLayer>` recoloring, the counter visibility, mobile behavior, and a no-disappearance invariant, the state machine notes role-cell visibility at every α-state, and a new acceptance criterion #10 below binds these to Playwright assertions identical to CH2 acceptance #8. The committee judged this sufficient.

#### State machine

| State | Enter on | Exit on | PI cell shows | Role column |
|---|---|---|---|---|
| `pre-scrub` | scroll into CH3 | first α scrub edit | α=∞ default; cell empty; line 2 empty | `<RoleColumn>` pinned-left, full opacity; `<RoleLabeledCounter>` reads current N / 356 |
| `scrubbing-α` | `α` cell edit | scroll past CH3 | live: `[low, high]` line 1; equation line 2 with role-stroke underlines from `<RoleColumn>` | unchanged — pinned-left, full opacity; `<PiCellLine2Underline>` colors driven from store |
| `at-cv-optimal` | α reaches the cell-internal flag `cv_optimal` | manual scrub away | line 1: `[$78,400, $94,900]`; line 2: `0.34·num + 0.28·mcd + 0.19·scr + 0.11·bw + 0.08·rule`; ticker contracts to 0.31; strikethrough state stable; pin pulses if survives | unchanged — every `<RoleCell>` at full opacity; `<Ch3AgreementCounter>` reads `roleAssignments ∩ lasso_alpha_path.json` |
| `extreme-α=0` | α reaches min | scrub away | `[−∞, +∞]` line 1; 356-term pandemonium line 2 | unchanged — pinned-left, full opacity (all 356 underlines on line 2 colored from store) |
| `extreme-α=∞` | α reaches max | scrub away | empty line 1; empty line 2 | unchanged — pinned-left, full opacity |

#### Data requirements

- `nor/lasso_alpha_path.json` (α-sweep, ~32 steps, kept-feature mask + β at each step).
- `nor/pi_decomposition.json` (PI cell line 1 + line 2 contributions per α step).
- `nor/pi_shuffled.json` (shuffled-Y median PI decomposition, same schema).
- `sessionStore.roleAssignments` (drives line-2 underline colors, plus strikethrough recoloring).
- `nor/h_ii_trajectory.json` at the chapter's α (precomputed `h_ii` post-Lasso ≈ 0.31).

#### Interactions

| Gesture | Trigger | Keyboard | Aria | Reduced-motion |
|---|---|---|---|---|
| α scrub | click + drag on `α` cell | Focus + `←`/`→` (one tick of α-sweep array) | "α is now {value}; PI cell reads {bracket}; {N} columns kept" (throttled) | Strikethroughs apply instantly; no 120ms draw |
| Hover on line-2 abbreviation | mouse hover or focus | Tab + Space | "{abbreviation} expands to {full feature name}; tagged {role}" | n/a |
| Pin survival pulse | automatic on α crossing | n/a | "Your pinned column from chapter one survives at this α." | 1px gold stroke on the pin instead of pulse |

#### Mobile (≤ 480px) layout

- The 60px PI cell is the binding constraint. On mobile, the cell expands to 200px width to preserve line-2 legibility; the peer cell stacks **below** rather than beside, with the 45° dashed-gray stripe rotated to a horizontal divider rule.
- α scrub is tap-and-drag horizontally on a 80px-wide cell; arrow keys via on-screen `← →` chips.
- Strikethrough layer renders only the survivors (20) with annotation `336 of 356 columns struck — see desktop for the full grid`.

#### Acceptance criteria

1. The PI cell renders two typographic layers within a single 60px-tall cell at 1× and 2× resolutions; mobile uses the 200px alternative spec.
2. Line 1 reads `[$78,400, $94,900]` at CV-optimal α (or whatever the real precomputed value is — copy regenerates from JSON).
3. Line 2's underlines color via the reader's `roleAssignments`; if the reader tagged sparsely, the cell still renders with 9pt mono disclaimer: `# {N} of 5 features in this composition were tagged by you.`
4. The peer cell (shuffled) renders 78%-red-or-greater composition; if real Lasso doesn't produce embarrassing-on-noise behavior, **the chapter cuts to two screens** per BRAINSTORM CH3 wow #2 fallback (precompute step writes a flag; the route renders the alternate copy).
5. Strikethrough animation: 120ms per column, no batching; reduced-motion = instant.
6. The ticker contracts from 0.98 to 0.31 (read from `h_ii_trajectory.json` at the chapter's α-state).
7. Italic line *"the model has saved Norway by believing she is a Scrabble score."* appears exactly once at 32pt DM Serif italic.
8. Brass museum label allowance: **zero** (BRAINSTORM CH3 wow #1, sealed R10).
9. The single permitted exception to stroke-only palette is contained within `<PiCellLine2Underline>`; Stylelint passes.
10. **`<RoleColumn>` and `<RoleLabeledCounter>` survive α-scrub:** at every α value across the sweep — including `α=0`, `α=cv_optimal`, and `α=∞` — Playwright asserts (a) `getComputedStyle(roleColumn).position === 'sticky'` and `getComputedStyle(roleColumn).left === '0px'`, (b) every `<RoleCell>` within `<RoleColumn>` has non-zero `offsetWidth` and renders the reader's assigned token in `--type-annot` at `opacity: 1`, (c) horizontal scroll within the CSV viewport (any `scrollLeft > 0`) does not translate `<RoleColumn>`, (d) `<RoleLabeledCounter>` remains visible at full opacity throughout the chapter, and (e) `<PiCellLine2Underline>`'s `border-bottom-color` for each abbreviation is the same `--role-*` value the corresponding `<RoleCell>` carries (binding verified by editing a tag during `at-cv-optimal` and asserting both elements update within 300ms — DA #3).

#### Out of scope for Stage 2

- Brass weighing scale / tuning fork / guillotine / triptych (rejected).
- Lasso as bouncer / volume knob / sweet-spot magnet (rejected).
- Erosion profile with strata (rejected).
- Coefficient path as racetrack (rejected).
- Brass museum label beneath Norway's row (rejected).

---

### CH4 — *Norway is a Scrabble score*

**Adopted signature:** #1 from BRAINSTORM.md's CH4 section: *The β̂ row emits flat and uniform; the site refuses to score it*.

**Adoption rationale:** DA #7 binds CH4 to be voiceless. #1 is the only candidate whose entire pedagogy is the absence of authorial voice — the other two would require a serif interjection or ornament to land. Adopting #1 honors DA #1 (emit, don't perform) and DA #7 (voiceless) simultaneously.

**Dispositions of #2 and #3:**
- **#2 (objection queue runs dry at 8):** **Absorbed as the chapter's primary interaction.** The flat β̂ row carries `[×]` affordances per line; clicking executes the precomputed substitution cascade. This is the chapter's only interactive surface besides the JOIN.
- **#3 (drag-to-JOIN delivering CH1 pin as `NaN`):** **Absorbed as the chapter's secondary interaction, below the β̂ row.** Renders the `pd.merge` line and executes on drop. The `null` in the JOIN result is the chapter's redemption — replacing the rejected closing italic line.

#### Component tree

```
<Ch4Route>
├── <HeartbeatTicker/>                    // unchanged from CH3 state (or scrubs to current α)
├── <FilenameTitle/>
├── <RoleLabeledCounter/>                 // cross-cutting #3 — labeled_by_you: N / 356, top-left, always visible
├── <NorwayRow/>                          // CV-α post-Lasso state
├── <CsvViewport>
│   ├── <RoleColumn>                      // cross-cutting #3 — pinned-left CSV col 0, full opacity throughout the chapter
│   │   └── <RoleCell ×356/>              // each tagged cell drives <Ch4BetaLine> role-stroke and <Ch4JoinedTable> role column
│   └── <DataCells/>
├── <Ch4BetaRow>                          // 18 lines, uniform 11pt JBM Medium, FOUR fixed-width columns
│   └── <Ch4BetaLine ×18/>                // each: coef × name [CI] N/200 +$contribution; role-stroke underline driven from <RoleColumn>
├── <Ch4ObjectionQueue/>                  // 9px [×] affordances per line; drives substitution cascade
├── <Ch4MarginComment/>                   // 9pt mono in cream margin: # print(model.coef_). compare the underlines to the brackets. ch5 will keep score.
├── <Ch4JoinSheet>                        // below β̂ row
│   ├── <Ch4MergeLine/>                   // result = pd.merge(...)
│   ├── <Ch4DragToJoinSurface/>           // <DragToJoin> instance
│   └── <Ch4JoinedTable/>                 // 6 columns: feature | lasso_β [CI] | rf_importance | pdp_shape_agrees | role (read from <RoleColumn>) | norway_contribution_usd
└── // INTENTIONALLY ABSENT: any <Ch4ItalicLine>, any DM Serif italic occurrence, any closing aphorism
```

##### Role column in CH4 (spec for cross-cutting #3's presence in the voiceless chapter)

Per cross-cutting signature #3, `<RoleColumn>` is **pinned at CSV position 0 across every chapter, including the voiceless one**. CH4 not only displays the column — it **consumes it** as the source of truth for the β̂-row role-stroke underlines (which are at 40% opacity by default and reach 100% on hover, per BRAINSTORM CH4 wow #1) and for the `role` column inside `<Ch4JoinedTable>` (per BRAINSTORM CH4 wow #3 — "the `role` column is populated by the reader's CH1 tags"):

- **Pinned-left behavior:** `<RoleColumn>` renders with `position: sticky; left: 0; z-index: 2;` anchored to the viewport's left edge. The β̂-row block, the JOIN sheet, and the margin comment all render in the document's main flow to the right of `<RoleColumn>`. The β̂-row block's horizontal scroll within its constrained card never translates `<RoleColumn>`.
- **Visual survival across the chapter:** in every CH4 state (`pre-emit`, `emitted`, every `objection-N`, `queue-empty`, `joined`), every `<RoleCell>` in `<RoleColumn>` continues to render its assigned token in `--type-annot` at full opacity. Tagging or re-tagging is permitted in CH4 (the role column is editable through CH5; only the β̂ row's flat emission is the chapter's discipline of voicelessness, not the role column's interactivity).
- **Reactive dependency:** every `<Ch4BetaLine>` derives the `border-bottom-color` of its feature-name span from the corresponding `<RoleCell>`'s assignment via the Svelte store; the underline opacity defaults to 40% and reaches 100% on hover (per BRAINSTORM CH4 wow #1's "Role-stroke underlines beneath each feature name are the reader's own CH1 tags, rendered at 40% opacity by default; on hover, they strengthen to 100%"). `<Ch4JoinedTable>`'s `role` column reads each row's role directly from `<RoleColumn>`'s store (per BRAINSTORM CH4 wow #3's "the `role` column is populated by the reader's CH1 tags").
- **`<RoleLabeledCounter>` visibility:** the `labeled_by_you: N / 356` counter remains visible at full opacity, top-left, throughout the chapter — including during the flat β̂ emission, every objection, and the JOIN execution. The counter is part of the document chrome, not part of any chapter's removable layer.
- **Voicelessness scope:** DA #7's voiceless-by-design constraint is about **DM Serif italic** absence and the absence of an authorial sentence; it is **not** an instruction to remove the role column or its counter. The role column is not authorial voice — it is the reader's voice, which is exactly what cross-cutting #3 binds to be visible in every chapter.
- **Mobile:** `<RoleColumn>` stays pinned-left in the horizontally-scrollable CSV viewport. The β̂ row's constrained-card horizontal scroll happens to the right of the role column. `<RoleLabeledCounter>` remains top-left.
- **No disappearance.** There is no CH4 state in which `<RoleColumn>` or `<RoleLabeledCounter>` is removed, hidden, or faded.

> **Counter-argument to DA objection that CH4 elided `<RoleColumn>` and `<RoleLabeledCounter>`:** the DA's veto is adopted in full. The CH4 component tree now lists `<RoleColumn>` (with its `<RoleCell ×356/>` children) and `<RoleLabeledCounter>` explicitly, the "Role column in CH4" subsection above this counter-argument specifies pinned-left behavior, full-opacity survival across every CH4 state, the reactive dependencies that drive `<Ch4BetaLine>` underlines and `<Ch4JoinedTable>`'s role column, the counter visibility, the explicit clarification that DA #7's voicelessness is about DM Serif italic absence (not role-column suppression), mobile behavior, and a no-disappearance invariant. The state machine's new "Role column" column tracks the column at every state, and a new acceptance criterion #9 binds these to Playwright assertions identical to CH2 acceptance #8 and CH3 acceptance #10. The committee judged this sufficient.

#### State machine

| State | Enter on | Exit on | β̂ row contents | Role column |
|---|---|---|---|---|
| `pre-emit` | scroll into CH4 | scroll past first sentinel | β̂ row not yet rendered (one frame before the sentinel hits) | `<RoleColumn>` pinned-left, full opacity; `<RoleLabeledCounter>` reads current N / 356 |
| `emitted` | scroll past first sentinel | objection or scroll past CH4 | All 18 lines rendered in one frame; uniform; underline colors driven from store at 40% opacity | unchanged — pinned-left, full opacity; underline-binding live |
| `objection-N` | `[×]` click | next objection or scroll past CH4 | Struck line gets gold rule; substituted line appended at bottom; substituted line's underline color reads from `<RoleColumn>` for the new feature | unchanged — pinned-left, full opacity |
| `queue-empty` | 8th objection committed | scroll past CH4 | One additional comment appears above the β̂ row: `# objection 8 refused. there are no more features that produce this fit.` | unchanged — pinned-left, full opacity |
| `joined` | `<DragToJoin>` drop or keyboard `J Enter` | scroll past CH4 | `<Ch4JoinedTable>` populates within 400ms; the table's `role` column reads each row from `<RoleColumn>` | unchanged — pinned-left, full opacity; the JOIN's `role` column is a derived view of the same store |

#### Data requirements

- `nor/beta_path.json` filtered to the 18 surviving Lasso coefficients at CV-optimal α, with bootstrap CIs.
- `nor/objection_queue.json` (9 entries: original 18 + 9 sequential substitutions; entry 8 carries `refused: true` if the precomputed 9th replacement is not sensible — see CH4 acceptance #6).
- `nor/rf_top20.json` (Random Forest top-20 features for the JOIN).
- `sessionStore.roleAssignments` (drives the 40%-opacity role-stroke underlines).
- `sessionStore.ch1Pin` (the column the reader pinned in CH1, for the JOIN's `null` redemption row).

#### Interactions

| Gesture | Trigger | Keyboard | Aria | Reduced-motion |
|---|---|---|---|---|
| Hover on β̂ line | mouse hover or focus | Tab | "Coefficient {value}, feature {name}, role {role}, contribution {USD}" | Role-stroke underlines render at 100% by default (no hover gate) |
| `[×]` objection | click `[×]` | `Backspace` on focused row | "Struck {feature}. Replacement: {next feature}." or "Objection {N} refused. Queue empty." | Gold strike rule appears instantly (no 120ms draw) |
| Drag-to-JOIN | drag β̂ row onto RF sheet | `J` then arrow keys to row, `Enter` to commit | "JOIN executed. Result has {N} rows." | Drag preview is a static 1px gold line, not animated |

#### Mobile (≤ 480px) layout

- β̂ row's four-column fixed-width layout is wider than 480px; the β̂ block becomes **horizontally scrollable within a constrained card** (NOT page-level scroll). One row at a time visible if necessary, with horizontal scroll affordance.
- `[×]` affordance enlarges to 16×16 tap target.
- Drag-to-JOIN: long-press (500ms) + drag, with snap-to-target on RF sheet rows.
- JOIN result table scrolls horizontally; the `null` cell is sized 1.5× to remain visible.

#### Acceptance criteria

1. **β̂ row appears in one frame.** No `transition` or `@keyframes` on any line. Lint rule `no-css-animation-over-200ms` passes for `/src/lib/components/ch4/`.
2. All 18 lines render in uniform `--type-model` (11pt JBM Medium). No font-size variation. No fill colors. Role-stroke underlines render at 40% opacity by default; full opacity on hover.
3. **CH4 contains zero DM Serif italic occurrences.** Verified by `.assert-serif-budget`.
4. The mono margin comment appears exactly once, exactly: `# print(model.coef_). compare the underlines to the brackets. ch5 will keep score.`
5. Objection queue substitutes through 8 steps; the 9th is refused with the `queue empty` comment **only if** the precomputed 9th replacement is genuinely absurd. If the precompute pipeline finds the 9th substitution sensible (e.g., `foreign_direct_investment_pct`), the chapter renders honest copy: `# the 9th replacement was {feature}, which is defensible — the queue is finite but not empty.` (DA #11 / BRAINSTORM CH4 wow #2 fallback.)
6. JOIN executes in ≤ 400 ms after drop.
7. The CH1 pin renders in the JOIN result with `rf_importance: NaN` (verified against real RF data; if the pin is in RF top-20, copy adapts: `your CH1 pin: present in both — rf_rank {N}.`).
8. The chapter has no closing line, no aphorism, no italic. The reader scrolls into CH5 from the bottom of the JOIN sheet directly.
9. **`<RoleColumn>` and `<RoleLabeledCounter>` survive CH4's flat emission and JOIN:** in every CH4 state, Playwright asserts (a) `getComputedStyle(roleColumn).position === 'sticky'` and `getComputedStyle(roleColumn).left === '0px'`, (b) every `<RoleCell>` within `<RoleColumn>` has non-zero `offsetWidth` and renders the reader's assigned token in `--type-annot` at `opacity: 1`, (c) the β̂-row block's horizontal scroll within its constrained card does not translate `<RoleColumn>`, (d) `<RoleLabeledCounter>` remains visible at full opacity throughout the chapter — including during `emitted`, every `objection-N`, `queue-empty`, and `joined` states. Additionally: each `<Ch4BetaLine>`'s feature-name span carries a `border-bottom-color` matching its `<RoleCell>`'s assignment in `<RoleColumn>` (verified by editing a tag in the `emitted` state and asserting both elements update within 300ms — DA #3); the underline opacity is 40% by default and 100% on hover or focus. `<Ch4JoinedTable>`'s `role` column for each row reads the same value as the corresponding `<RoleCell>` in `<RoleColumn>` (Playwright cross-asserts the two text contents per row).

#### Out of scope for Stage 2

- The Confession staged with 48pt DM Serif / 1.4s pacing / brass ticks / typewriter cursor / black viewport (rejected).
- Type-size proportional to |β̂| (rejected; even as hover-revealed ornament — too risky in a chapter whose discipline is uniformity).
- Gallery / Runway / Catwalk / Museum Label of absurd features (rejected).
- "You knew better in 8 seconds" serif italic redemption line (rejected).

---

### CH5 — *Norway was one draw*

**Adopted signature:** #1 from BRAINSTORM.md's CH5 section: *The Dissolution of `h_ii × β` into 200 Norways*.

**Adoption rationale:** The Dissolution converts the site's unifying scalar (the heartbeat) into the distribution it was always drawn from — the cell-becomes-paragraph grammar is the only candidate that closes the typographic arc started in CH1. #2 (bracketed confession + scorecard) is the chapter's *verdict*; #3 (recast bar) is the chapter's *handoff*. All three are required, but the Dissolution is the chapter's frame.

**Dispositions of #2 and #3:**
- **#2 (bracketed confession + "the math does not care"):** **Absorbed as the chapter's mid-section.** Renders the CH4 β̂ row a final time with bootstrap CIs and full-opacity role-strokes. The scorecard line is the chapter's mono aphorism (per DA #12).
- **#3 (recast search bar):** **Absorbed as the chapter's closing handoff.** Per DA #8, ships *only if* all 254 country bundles ship. Fallback is a `/recast` footer link with the closing aphorism plate standing alone (DA #8 explicitly forbids the hybrid).

#### Component tree

```
<Ch5Route>
├── <HeartbeatTicker/>                    // value remains at NOR.h_ii = 0.31 from CH3, then dissolves into [0.18, 0.89] interval
├── <FilenameTitle/>
├── <RoleLabeledCounter/>                 // cross-cutting #3 — labeled_by_you: N / 356, top-left, always visible
├── <NorwayRow/>                          // cells now render with bracketed CIs
├── <CsvViewport>
│   ├── <RoleColumn>                      // cross-cutting #3 — pinned-left CSV col 0, full opacity throughout the chapter
│   │   └── <RoleCell ×356/>              // each tagged cell drives <Ch5BracketedConfession>'s 100%-opacity role-strokes and <Ch5Scorecard>'s tally
│   └── <DataCells/>
├── <Ch5DissolutionParagraph>             // mono cell → tuple → wrapped paragraph of 200 (predicted_gdp, h_ii) pairs
│   └── <Ch5SortAffordance/>              // <ClickToSort> on the paragraph
├── <Ch5Ridgelines>                       // twin: single-split + nested-CV, gold hairline annotates gap
├── <Ch5BracketedConfession>              // β̂ row final emission with bootstrap CIs, role-strokes default-ON 100% — colors driven from <RoleColumn>
├── <Ch5Scorecard/>                       // right-aligned 9pt mono: your labels agreed with brackets {N} of 18 — derived from <RoleColumn> ∩ bootstrap_ci.json
├── <Ch5InterjectionItalic/>              // 32pt DM Serif italic: every country in this dataset has five deaths. we only told you about one.
├── <Ch5RuleHairline/>
├── <Ch5RecastBar/>                       // <RecastInput> — ships ONLY if all 254 bundles ship
│   └── <Ch5RecastFallback/>              // alternative: aphorism plate + footer link, if recast cannot ship
└── <Ch5ClosingAphorism/>                 // 48pt DM Serif italic, the site's ONLY 48pt occurrence
```

##### Role column in CH5 (spec for cross-cutting #3's presence in the dissolution chapter)

Per cross-cutting signature #3, `<RoleColumn>` is **pinned at CSV position 0 across every chapter**. CH5 is the chapter where the column is most consequential: `<Ch5BracketedConfession>`'s default-ON 100%-opacity role-strokes (BRAINSTORM CH5 wow #2 — "the reader's CH1 role-strokes are visible by default at 100% opacity for the first time in the site") subscribe directly to it, and `<Ch5Scorecard>`'s `your labels agreed with the brackets {N} of {M} times` tally is computed from `<RoleColumn>` ∩ `bootstrap_ci.json`. Without the column visible, the scorecard is asserted-not-shown.

- **Pinned-left behavior:** `<RoleColumn>` renders with `position: sticky; left: 0; z-index: 2;` anchored to the viewport's left edge. The Dissolution paragraph, the ridgelines, the bracketed confession, the scorecard, the italic interjection, the recast bar, and the closing aphorism all render in the document's main flow to the right of `<RoleColumn>`.
- **Visual survival across the chapter:** in every CH5 state (`dissolution-start`, `dissolution-grow`, `dissolution-settled`, `dissolution-sorted`, `ridgelines`, `bracketed-confession`, `scorecard`, `recast-handoff`, `recasting`, `closing-aphorism`), every `<RoleCell>` in `<RoleColumn>` continues to render its assigned token in `--type-annot` at full opacity.
- **Reactive dependency:** every coefficient line in `<Ch5BracketedConfession>` derives the `border-bottom-color` of its feature-name span from the corresponding `<RoleCell>` in `<RoleColumn>` via the Svelte store, with opacity at **100%** by default (the only chapter where the underline opacity is full by default). `<Ch5Scorecard>`'s `{N}` (labels-agreed-with-CIs) and `{K}` (model-was-loud) counters are derived from `<RoleColumn>`'s assignments crossed with `bootstrap_ci.json`'s zero-crossing flags; if the reader tagged sparsely, the scorecard line reads `N of {actual_tagged}` and the additional sentence `the {untagged} untagged are the test you didn't sit.` appends — verbatim per BRAINSTORM CH5 wow #2.
- **Across recast:** when `activeISO3` changes, `<RoleColumn>` does **not** reset — the reader's session tags persist (DA #9 commitments are irrevocable within the session). The recast country's `<Ch5BracketedConfession>` consumes the same `<RoleColumn>` store; the scorecard recomputes against the recast country's `bootstrap_ci` data.
- **`<RoleLabeledCounter>` visibility:** the `labeled_by_you: N / 356` counter remains visible at full opacity, top-left, throughout the chapter — including during the closing aphorism state, which is the site's final cell.
- **Mobile:** `<RoleColumn>` stays pinned-left in the horizontally-scrollable CSV viewport; the Dissolution paragraph wraps naturally in the right region. `<RoleLabeledCounter>` remains top-left.
- **No disappearance.** There is no CH5 state in which `<RoleColumn>` or `<RoleLabeledCounter>` is removed, hidden, or faded.

> **Counter-argument to DA objection that CH5 elided `<RoleColumn>` and `<RoleLabeledCounter>`:** the DA's veto is adopted in full. The CH5 component tree now lists `<RoleColumn>` (with its `<RoleCell ×356/>` children) and `<RoleLabeledCounter>` explicitly, the "Role column in CH5" subsection above this counter-argument specifies pinned-left behavior, full-opacity survival across every CH5 state (including `recasting` and `closing-aphorism`), the reactive dependencies that drive the bracketed confession's 100%-opacity role-strokes and the scorecard tally, recast persistence per DA #9, the counter visibility, mobile behavior, and a no-disappearance invariant. The state machine's new "Role column" column tracks the column at every state, and a new acceptance criterion #13 binds these to Playwright assertions identical to CH2 acceptance #8, CH3 acceptance #10, and CH4 acceptance #9. The committee judged this sufficient.

#### State machine

| State | Enter on | Exit on | Visible content | Role column |
|---|---|---|---|---|
| `dissolution-start` | scroll into CH5 | first scroll past 100px in CH5 | One mono cell: `Norway.predicted_gdp = $89,220 | h_ii = 0.31` | `<RoleColumn>` pinned-left, full opacity; `<RoleLabeledCounter>` reads N / 356 |
| `dissolution-grow` | scroll | scroll past dissolution sentinel | Tuple grows on scroll: 1 → 2 → 4 → ... → 200 pairs (computed from scroll position) | unchanged — pinned-left, full opacity |
| `dissolution-settled` | 200 pairs filled | sort or scroll past | Full mono paragraph; gold-tint on the headline value (79th percentile) | unchanged |
| `dissolution-sorted` | sort gesture | re-sort or scroll past | Paragraph reorders; sort mode label updates | unchanged |
| `ridgelines` | scroll past dissolution | scroll past ridgelines | Twin ridgelines, gold hairline gap annotation | unchanged |
| `bracketed-confession` | scroll past ridgelines | scroll past confession | β̂ row, bootstrap CIs, role-strokes 100% opacity (binding to `<RoleColumn>`) | unchanged — feeds `<Ch5BracketedConfession>` underline colors |
| `scorecard` | scroll past confession | scroll past scorecard | 9pt mono line, right-aligned | unchanged — `{N}` and `{K}` counters derived from `<RoleColumn>` ∩ `bootstrap_ci.json` |
| `recast-handoff` | scroll past scorecard | recast input or end | 32pt italic line; rule; recast input or fallback | unchanged |
| `recasting` | recast input commit | re-render complete (≤ 700ms) | Filename swaps; ticker swaps; full chapter scroll resets to top of CH1 with new ISO3 | **persists** (DA #9) — `<RoleColumn>` is not reset on recast; the recast country reuses the reader's tag set |
| `closing-aphorism` | scroll past recast bar | end | 48pt DM Serif italic; the site's final cell | unchanged — pinned-left, full opacity, including under the closing cell |

#### Data requirements

- `nor/dissolution_cloud.json` (200 (predicted_gdp, h_ii) pairs + nested-CV ridgeline samples + the 79th-percentile flag).
- `nor/bootstrap_ci.json` (200 resamples summarized to per-coef CI).
- `nor/h_ii_trajectory.json` (ticker dissolves into `[0.18, 0.89]` interval display).
- `recast/{ISO3}.json` × 254 (lazy-loaded on recast).
- All CH2/CH3/CH4/CH5 muted-arc copy strings (per DA #8, committed verbatim — see below).

#### Interactions

| Gesture | Trigger | Keyboard | Aria | Reduced-motion |
|---|---|---|---|---|
| Scroll-driven dissolution growth | scroll | scroll keys | "Dissolution paragraph now showing {N} of 200 draws." | The full 200-pair paragraph + ridgelines render as 3 static frames immediately on entering CH5 (no scroll-driven growth). |
| Click-to-sort on paragraph | click on column-header chip | `s` cycles modes | "Sorted by {mode}." | n/a (static) |
| Hover on β̂ line in confession | mouse or focus | Tab | "Coefficient, CI, role, agreement-with-CI." | n/a (role-strokes already 100% opacity in CH5) |
| Recast input | type in input + `Enter` | type + `Enter` | "Recasting biography for {ISO3}." | n/a (the 700ms re-render is content swap) |

#### Mobile (≤ 480px) layout

- Dissolution paragraph wraps naturally; growth on scroll preserved.
- Ridgelines stack vertically, full-width, instead of side-by-side.
- Bracketed confession scrolls horizontally in a constrained card (same as CH4 β̂ row).
- Scorecard line wraps to two lines.
- Recast input is full-width, fixed-bottom keyboard-aware.
- Closing aphorism: 32pt instead of 48pt at mobile (the only relaxation of the type ramp).

#### Acceptance criteria

1. The Dissolution opens at 11pt JetBrains Mono. **No 180pt DM Serif anywhere** (DA #10).
2. The paragraph contains exactly 200 (predicted_gdp, h_ii) pairs.
3. The 79th-percentile claim is verified against the real `dissolution_cloud.json`; if the headline value is the median, copy reads: `our draw was the 47th percentile — we got neither lucky nor unlucky.` (BRAINSTORM CH5 wow #1 fallback.)
4. Ridgelines: twin (single-split top, nested-CV bottom) on shared axes; gold hairline annotates the optimism gap.
5. Bracketed confession's role-strokes appear at 100% opacity by default (the only chapter where this is true; CH4 kept them gated). The scorecard line reads `your labels agreed with the brackets {N} of {M} times. the model was loud {K} of {M} times. the math does not care which of you was right.` — `N`, `M`, `K` derived from `roleAssignments` ∩ `bootstrap_ci.json`.
6. The 32pt italic interjection appears exactly: *"every country in this dataset has five deaths. we only told you about one."*
7. The recast input renders **only if** all 254 country bundles are present in `/data/recast/`. The build pipeline asserts file count; failing assertion replaces `<Ch5RecastBar>` with `<Ch5RecastFallback>` (per DA #8).
8. On recast, the site re-renders within 700ms. The new ISO3 appears in the filename, the heartbeat, the audition gutter, the β̂ row, the PI cell, the Dissolution cloud, and the TOC.
9. **Verbatim muted-arc copy** for ~180 stable-prediction countries (per DA #8) is committed in code at `/src/lib/data/mutedArcCopy.ts`:
   - CH2: `"{country}'s leverage at p=n-1 was {value}. The model did not lose her. Five deaths require a country the matrix was willing to ruin."`
   - CH3: `"{country}'s narrowed PI was honestly composed. Lasso saved her for coherent reasons. The trap was not set."`
   - CH4: `"{country}'s confession admits substitution. The model had more plausible features to reach for. The queue did not run dry."`
   - CH5: `"{country} was a stable draw. The model found her consistently. Most countries do not have five deaths; we told you about one that did."`
10. The closing 48pt DM Serif italic aphorism is the site's exactly-one 48pt occurrence; **total DM Serif italic across the site = 4** (3 chapter italic lines — CH2 14pt sized-down line, CH3 32pt interjection, CH5 32pt interjection; CH1 contributes zero because its sub-caption is 7pt mono per BRAINSTORM CH1 wow #1 — and CH4 correctly contributes zero — plus this 48pt closing aphorism). This is the single integer `.assert-serif-budget` enforces, identical to the typography rationing table's Total row. The BRAINSTORM cross-cutting #6 phrasing "5 chapter interjections + 1 closing aphorism" was internally inconsistent with its own "one per chapter except CH4" qualifier; the resolution lives in the budget arithmetic (4 total), not in any chapter's font-family.
11. **The closing 48pt aphorism's text is committed in code, not left for Stage 2 to invent. Provenance: architect's choice within the BRAINSTORM-bounded slot.** BRAINSTORM cross-cutting #6 commits the *existence* of "one 48pt closing aphorism" but does **not** commit its *text*. The 32pt CH5 interjection text *every country in this dataset has five deaths. we only told you about one.* IS committed verbatim in BRAINSTORM CH5 wow #3; the 48pt closing aphorism is a separate, text-unspecified slot. Stage 1 fills this slot with the literal string `this was one draw.` (lowercase, terminal period included) — chosen as the architect's decision within the BRAINSTORM-bounded affordance, not derived from any BRAINSTORM line. Justification: the chosen string compresses CH5's chapter-aphorism `the math does not care which of us was right` (DA #12) and the chapter title *Norway was one draw* into a four-syllable phrase legible at 48pt, and re-uses the word "draw" the chapter has been instrumenting since the Dissolution opens. Stage 2 may not change the string; the orchestrator may overrule the architect's choice in a future revision, but Stage 2 ships it verbatim. Implementation: exported from `/src/lib/data/closingAphorism.ts` as `export const CLOSING_APHORISM = "this was one draw." as const;` with the file-header comment `// Architect's choice (Stage 1, DESIGN.md CH5 acceptance #11). Not derived from BRAINSTORM. Do not edit without re-opening Stage 1.` `<Ch5ClosingAphorism>` renders exclusively from the constant. Playwright asserts `[data-testid="closing-aphorism"].textContent === "this was one draw."` exactly. The constant is referenced from the typography rationing table (`--type-voice48`'s sole consumer), `<Ch5ClosingAphorism>`, and the `<Ch5RecastFallback>` plate (see #12). No second 48pt occurrence anywhere; lint enforces.
12. **`<Ch5RecastFallback>` aphorism plate text is committed in code.** When the build's 254-bundle assertion fails, `<Ch5RecastFallback>` renders (a) the same `CLOSING_APHORISM` constant from #11 above (`this was one draw.`, the architect's-choice string sourced from `/src/lib/data/closingAphorism.ts`) at 48pt DM Serif italic via `--type-voice48` — i.e., the plate **carries the exact aphorism**, not a substitute — followed by (b) a single mono line `# 254 biographies were not ready. read the others at /recast.` (`--type-annot`) and (c) a `<a href="/recast">/recast</a>` link in `--type-annot`. The plate's 48pt occurrence still counts as the site's single 48pt occurrence: in the fallback path `<Ch5ClosingAphorism>` is suppressed (the same constant is consumed by `<Ch5RecastFallback>` instead), preserving the "exactly one 48pt occurrence" invariant. Playwright covers both paths: in the bundles-present path, `<Ch5ClosingAphorism>` is the sole 48pt cell; in the fallback path, the plate inside `<Ch5RecastFallback>` is the sole 48pt cell. The total italic count remains exactly 4 in both paths.
13. **`<RoleColumn>` and `<RoleLabeledCounter>` survive the Dissolution, the bracketed confession, the recast, and the closing aphorism:** in every CH5 state — including `dissolution-start`, `dissolution-grow`, `dissolution-settled`, `dissolution-sorted`, `ridgelines`, `bracketed-confession`, `scorecard`, `recast-handoff`, `recasting`, and `closing-aphorism` — Playwright asserts (a) `getComputedStyle(roleColumn).position === 'sticky'` and `getComputedStyle(roleColumn).left === '0px'`, (b) every `<RoleCell>` within `<RoleColumn>` has non-zero `offsetWidth` and renders the reader's assigned token in `--type-annot` at `opacity: 1`, (c) horizontal scroll within the CSV viewport does not translate `<RoleColumn>`, (d) `<RoleLabeledCounter>` remains visible at full opacity throughout the chapter, including the `closing-aphorism` state where it sits alongside the site's final 48pt cell. Additionally: each `<Ch5BracketedConfession>` line's feature-name span carries a `border-bottom-color` matching its `<RoleCell>`'s assignment in `<RoleColumn>` at **100% opacity** by default (verified across the chapter's full β̂ row); `<Ch5Scorecard>`'s `{N}` and `{K}` counters equal the deterministic computation `<RoleColumn>` ∩ `bootstrap_ci.json` (Playwright cross-asserts the rendered tally against the precomputed expectation). On `recasting`, `<RoleColumn>`'s store does **not** clear (DA #9 — irrevocability persists across recast); the recast country's bracketed confession reuses the reader's tag set.

#### Out of scope for Stage 2

- Rose Window of Folds / Gothic cathedral painted-map (rejected).
- Boxplot with annotated dot (rejected).
- 180pt DM Serif gold cinematic numeral (rejected; DA #10).
- Lessons as flippable cards / closing postcard PNG (rejected).
- Fold Painter / Shuffle the Deck / Split Wheel / K-fold carousel (rejected).
- Humility postcard / Atlas end-plate / "now you know what to doubt" (rejected).
- **Hybrid recast (top-30 precompute)** — explicitly forbidden by DA #8.

---

## DA binding-constraint translation

| # | Constraint | Technical requirement in Stage 2 | Verification |
|---|---|---|---|
| 1 | Emit, do not perform | Custom ESLint rule `no-css-animation-over-200ms` flags any `transition-duration` or `animation-duration` > 200ms in `.css`/`.svelte`. Custom Stylelint rule `no-keyframes` bans `@keyframes` outside three named files (`HeartbeatPulse.svelte`, `StrikethroughDraw.svelte`, `RoleStrokeHover.svelte`). Forbidden-library list in `package.json` blocks `framer-motion` etc. | CI fails on violation; dev-mode `MutationObserver` warns on inline-style additions. |
| 2 | The dataset IS the material | Stylelint rule `palette-allowlist`: only `--gold`, `--gold-pulse`, `--dashed-gray`, `--dashed-red`, `--bg-cream`, `--bg-indigo`, `--rule-hair`, and `--role-*` (stroke-only) are permitted. Brass museum label allowance enforced at one per chapter via `<MuseumLabel>` component instance count audit; CH3 + CH5-final allowance is zero (precommit grep). | CI palette grep + component instance count test. |
| 3 | Role-color is the reader's column | `<RoleColumn>` writes to a Svelte store; every chart consumer subscribes via `$:` reactive binding. CI test: simulate a tag commit, assert all `[data-feature-id]` elements re-render their role-stroke within 300ms. Fallback: if the reactive subscription latency test fails, degrade automatically to `[authored]` badges + export-diff footer (BRAINSTORM #3). | Playwright timing assertion; degradation has a feature flag. |
| 4 | Two scrubbable cells maximum | Lint rule `no-input-range` bans `<input type="range">`. Codebase-wide grep audit asserts the only two `<CellEditScrub>` instances are `Ch2PScrubCell` and `Ch3AlphaScrubCell`. | CI grep. |
| 5 | Scrollytelling defended by handoff | `<ScrollGate>` route guard on `/v-one-draw`; sessionStorage flag `tutorialCompleted` set only after CH1–CH5 sentinels each enter viewport in order. CI test: cold-session direct-nav to `/v-one-draw` returns the refusal cell. | Playwright. |
| 6 | Protagonist cast by audition | `<AuditionGutter>` renders `audition.json[0]` (the winner) as a hairline mono line at first paint; `/audition` route serves the executable notebook. CI test: line is present in DOM within 100ms of FCP; `/audition` returns 200. | Playwright + integration test. |
| 7 | CH4 is voiceless by design | `.assert-serif-budget` for `/ch4` route asserts DM Serif italic count = 0. Custom ESLint rule `no-serif-in-ch4`: any `--font-serif` usage in `/src/lib/components/ch4/**` fails the build (column headers excepted via filename allowlist). | CI lint + dev-mode runtime assert. |
| 8 | Recast bar ships 254 or cuts cleanly | Build pipeline asserts `ls /static/data/recast/*.json | wc -l == 254`. If true, `<Ch5RecastBar>` renders. If false, `<Ch5RecastFallback>` renders (aphorism plate + `/recast` footer link). No hybrid mode. | Build-time assertion; runtime feature flag is determined at build time, not toggleable. |
| 9 | Every commitment is irrevocable in session | No `localStorage`, no IndexedDB, no cookies. No "undo" button anywhere. ESLint rule `no-storage-persistence` bans `localStorage.` and `indexedDB` references. The `<RoleColumn>` store has no `revoke()` method. | CI lint; code review. |
| 10 | No 180pt cinematic numeral | Stylelint rule `no-large-cinematic-type`: bans `font-size > 48px` site-wide and `font-size > 32px` italic outside `--type-voice48` (which is exactly the closing aphorism). | CI lint. |
| 11 | Intellectual honesty outranks narrative cleanliness | Every empirical claim is loaded from JSON, not hard-coded. `precompute/verify.py` asserts each claim and writes the actual value to JSON; copy templates pull from JSON via `{value}` placeholders. The phrase `this figure is illustrative` and `for clarity` are banned via `forbidden-phrases` Stylelint rule applied to `.svelte` text content. CI grep. | Build-time verify + grep. |
| 12 | Five aphorisms are the site's output | Five `<ScrollMarginAphorism>` components, one at the bottom-margin of each chapter, render the five exact strings: CH1 *"I built an ECDF in thirty seconds"*, CH2 *"98% of her own prediction"*, CH3 *"the narrow interval was 92% absurd"*, CH4 *"the queue ran dry"*, CH5 *"the math does not care which of us was right."* CI test: each route renders the exact string in `[data-aphorism]`. | Playwright string assertion. |

---

## Stage 2 handoff

### Build order

The following order is binding. Each step blocks the next.

1. **Typography system + color palette** (`/src/lib/styles/`). All CSS variables, lint rules, `.assert-serif-budget` dev check. No chapter content yet.
2. **`<HeartbeatTicker>`** as a standalone story (Storybook + Playwright snapshot). Validates first-paint budget + reduced-motion + mobile collapse + recast.
3. **`<RoleColumn>` + `<RoleCell>` + `<RoleLabeledCounter>`** with reactive store. Validates the <300ms subscription latency requirement (DA #3). Without this passing, nothing else ships.
4. **`<PiCellComposition>`** at 1× / 2× / mobile (200px) — the site's tightest typographic composition. Per BRAINSTORM CH3 wow #1 prereq, this is prototyped *before* any other chapter content. If the two-layer cell can't render legibly at 60px desktop, the chapter design is re-opened with the DA, not bandaged.
5. **Precompute pipeline** (`/precompute/`) producing every `nor/*.json` file plus `audition.json` and `features.json`. CI integration: pipeline runs on schedule + `precompute/verify.py` asserts every empirical claim.
6. **CH1 chapter** (heartbeat already built; ECDF + A/B + role-tagging assemble around it).
7. **CH2 chapter** (buckle + scrollbar overlay with Safari fallback).
8. **CH3 chapter** (PI cell already prototyped; α-scrub + strikethrough + ticker contraction).
9. **CH4 chapter** (β̂ row + objection queue + JOIN). Code review enforces voicelessness with the lint rules.
10. **CH5 chapter excluding recast** (Dissolution + ridgelines + bracketed confession + scorecard + closing aphorism).
11. **Recast precompute pipeline** (the 254-country bundle; ~20–40 hours one-time on one machine per BRAINSTORM CH5 wow #3). Generates `recast/{ISO3}.json` × 254.
12. **CH5 recast bar** OR **CH5 recast fallback** (decided at build time by file-count assertion).
13. **`<ScrollGate>`** (added last; tested with Playwright in cold sessions).
14. **Visual regression baseline** captured; Lighthouse CI green; bundle budgets green; serif budget green.

### Explicit non-goals for Stage 2

- Server-side rendering (the site is a static export).
- User accounts, authentication, sessions across devices.
- Persistence across browser sessions (commitment irreversibility — DA #9).
- Any "undo" or "revise" affordance for any commitment gesture (DA #9).
- A summary screen, a closing postcard, a flippable-cards lessons page (rejected; DA #12 makes the five aphorisms the deliverable).
- Internationalization beyond English. The site's voice is in one register; muted-arc copy ships in English only.
- A blog, an author bio, a "share" button, social-media meta tags beyond a single OG image (which is a snapshot of the heartbeat ticker at `NOR.h_ii = 0.98`).
- Telemetry that captures user role-tags or commitments (privacy + the irrevocability is for the reader, not for the authors). The only telemetry permitted is anonymized page-view counters.
- Any second metaphor (no cemetery, no rose window, no cathedral, no loom, no brass instrument, no museum label outside the strict per-chapter allowance — BRAINSTORM rejected lists are binding).
- Type-size proportional to |β̂| in CH4, even as hover ornament.
- Hybrid recast (top-30 precompute + hope) — DA #8.
- Any sub-200ms motion outside the three permitted: CH2 gold pulse, CH3 strikethrough draw, CH4 role-stroke hover.

### Open technical questions

Each question names the owner. Stage 2 must close these before the relevant build step.

| # | Question | Owner | Blocks |
|---|---|---|---|
| Q1 | Custom-scrollbar styling under Safari ≥ 17: confirm `::-webkit-scrollbar-thumb` color overrides hold. If not, the rail-flush fallback is the default everywhere. | Stage 2 frontend lead | CH2 build (step 7) |
| Q2 | At Norway's actual `n` (≈213 features available?), does `precompute/verify.py` confirm the `0.04 → 0.98` heartbeat trajectory is monotonic at every integer p? | Data engineer | Heartbeat build (step 2) |
| Q3 | Does Lasso at CV-optimal α genuinely produce a ≥ 92% red decomposition for Norway's PI cell, AND a comparable ≥ 78% red decomposition under shuffled-Y? If not, CH3 cuts to two screens (BRAINSTORM CH3 wow #2 fallback) and the chapter copy regenerates. | Data engineer | CH3 build (step 8) |
| Q4 | Is the 9th objection-queue substitution genuinely absurd (so the `queue empty` refusal is honest), or is it a defensible feature (in which case CH4 copy degrades to the "not empty" message)? | Data engineer | CH4 build (step 9) |
| Q5 | Can the recast precompute pipeline complete all 254 countries within a ≤ 40 MB total gzipped budget? If **any** country's bundle exceeds 200 KB gzipped, the precompute fails and the build switches to `<Ch5RecastFallback>`. There is no partial-ship threshold: per DA #8 and CH5 acceptance #7, the bar ships **only if all 254 bundles are present**, otherwise it cuts cleanly. (DA-driven revision: a `≥ 250 of 254` partial-ship rule was previously listed here; it was the "top-30 precomputed and hope" pattern in different costume and would have given Stage 2 two incompatible ship-thresholds. Removed.) | Data engineer | CH5 recast (step 11–12) |
| ~~Q6~~ | **Closed in this document.** Mobile drag-to-JOIN is **long-press + drag** (500 ms long-press to grab, then drag to target row), per BRAINSTORM CH4 wow #3 implementation prereq verbatim ("touch: long-press + drag"). The two-tap alternative was a Stage-1-architect proposal that would have re-opened a Stage 0 commitment; the DA's veto is adopted. Specified in CH4 mobile section (`<Ch4DragToJoinSurface>`); the keyboard alternative remains `J` then arrow + `Enter` per the global keyboard table (CH4 interactions row "Drag-to-JOIN"). No further decision is required from Stage 2; deviating from long-press + drag would require re-opening Stage 0. | — (closed) | — |
| Q7 | The 14pt CH2 italic line is a sized-down exception to the 32pt interjection ration. Confirm the type ramp accounts for it in both the spec and `.assert-serif-budget`. (Pre-answered above; flagged for reviewer sanity check.) | Stage 1 architect (this document) | Typography build (step 1) |

Every other decision is pre-answered in this document.

---

## Provenance

Every adopted signature and every DA constraint cites its origin in BRAINSTORM.md. Stage 2 may trace any decision back to a specific brainstorm round without re-reading the transcript.

### Adopted signature provenance

| Adopted in | Signature | Originated | Refining rounds | BRAINSTORM line |
|---|---|---|---|---|
| Cross-cutting #1 | Heartbeat ticker | Info Designer R6 | R7/R8 DA AMPLIFY → R9 all four → R10 sealed | "originated R6 Info Designer; promoted to heartbeat in R7/R8 Devil's Advocate; sealed R9/R10 all four agents" |
| Cross-cutting #2 | Filename-as-title | Info Designer + Pedagogue R4 | R7 DA KILL of title spread → R8 all four | "originated R4 Info Designer + R4 Pedagogue; forced by R7 Devil's Advocate KILL of Aesthete's title spread" |
| Cross-cutting #3 | Editable role column | DA R6 ESCALATE | R7–R9 all four agents | "originated R6 Devil's Advocate ESCALATE; committed R7–R9 across all four agents" |
| Cross-cutting #4 | Cast-by-audition | DA R4 AMPLIFY | R7 AMPLIFY → R8 KILL intermission | "originated R4 Devil's Advocate AMPLIFY; sealed by R7 AMPLIFY + R8 KILL of intermission dissolve" |
| Cross-cutting #5 | Stroke-only role palette | Aesthete R1+R2 | R6/R7 reader-authored | "originated R1 Aesthete + R2 Aesthete 'outline, never fill'; promoted to reader-authored in R6–R7" |
| Cross-cutting #6 | Rationed typography | Aesthete R1 | R8–R10 DA KILLs | "originated R1 Aesthete; sealed R8–R10 by Devil's Advocate KILLs of every staged artifact" |
| Cross-cutting #7 | Every interaction is a cell edit | Interaction Designer R4 | R5–R10 sealed | "originated R4 Interaction Designer 'every interaction is a cell edit'; sealed R9/R10" |
| Cross-cutting #8 | Emit-don't-perform | DA R5 KILL | R6–R9 all agents | "originated R5 Devil's Advocate KILL of cinematic confession staging; sealed R6–R9" |
| Cross-cutting #9 | Norway's row sticky-gold | Interaction + Aesthete R1 | R4 DA AMPLIFY → R5+ committed | "originated R1 Interaction Designer + R1 Aesthete country-dot motif; promoted to structural biography in R4 Devil's Advocate AMPLIFY; committed R5+" |
| Cross-cutting #10 | Scroll → recast handoff | DA R5 ESCALATE | R7 Info Designer; sealed R9 | "originated R5 Devil's Advocate ESCALATE; answered R7 Info Designer; sealed R9" |
| CH1 (this doc) | Heartbeat cell, captioned | DA R9 AMPLIFY (committee) | R10 all four agents accepted | BRAINSTORM CH1 wow #1 |
| CH2 (this doc) | CSV buckles under its own width | Interaction Designer R4 | R5 DA AMPLIFY; R10 sealed | BRAINSTORM CH2 wow #1 |
| CH3 (this doc) | PI cell with own refutation | DA R6 KILL (demand) → all four R8 | R10 sealed | BRAINSTORM CH3 wow #1 |
| CH4 (this doc) | β̂ row flat-emit; site refuses to score | DA R5 KILL | R6–R10, sealed CH4 voiceless | BRAINSTORM CH4 wow #1 |
| CH5 (this doc) | Dissolution of `h_ii × β` | Info Designer + Aesthete + Interaction R3/R4 | R8 DA AMPLIFY; R10 retired 180pt | BRAINSTORM CH5 wow #1 |

### DA binding constraint provenance

| # | Constraint | Originated | Reinforced |
|---|---|---|---|
| 1 | Emit, don't perform | DA R5 KILL | R6–R10; R10 against Aesthete's 180pt holdout |
| 2 | Dataset IS the material | DA R3 ESCALATE | R4, R6 |
| 3 | Role-color is the reader's column | DA R6/R7 ESCALATE | R7–R9 committed |
| 4 | Two scrubbable cells max | DA R3 ESCALATE | R9/R10 sealed |
| 5 | Scrollytelling = scroll-to-recast handoff | DA R5 ESCALATE | R9 in composite |
| 6 | Protagonist cast by audition | DA R4/R6/R7 AMPLIFY | R8/R9 KILLs of intermission |
| 7 | CH4 is voiceless | DA R5 KILL | R8–R10 sealed |
| 8 | Recast bar 254-or-cut | DA R9 ESCALATE | R10 verbatim copy committed |
| 9 | Commitment is irrevocable | Pedagogue R7 (DA-aligned) | R10 sealed |
| 10 | No 180pt cinematic numeral | DA R5/R10 KILL | R10 retired Aesthete's holdout |
| 11 | Honesty outranks cleanliness | Standing committee principle | All DA rounds |
| 12 | Five aphorisms = output | Pedagogue R9 + DA R9 AMPLIFY | (final brainstorm round) |

Every cell of every chapter section in this document descends from one of these origins. There is no design decision in `DESIGN.md` whose source is "the architect's own preference."
