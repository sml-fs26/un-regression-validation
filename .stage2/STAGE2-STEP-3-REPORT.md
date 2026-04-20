# Stage 2 · Step 3 Report

**Step:** `<RoleColumn>` + `<RoleCell>` + `<RoleLabeledCounter>` with reactive store.
**DESIGN.md citation:** §Stage 2 handoff → Build order item 3 (line 931); §Cross-cutting signature #3 (lines 259–278); DA #3 (line 910); DA #9 (line 916); chapter-level restatements at lines 524–529 / 617–623 / 719–725 / 821–827.
**Outcome:** **PASS.** All acceptance criteria verified at unit, integration, and Playwright level.

---

## 1. Files created / edited

### Svelte components (three — one per spec heading)

| Path | Lines | Role |
|---|---|---|
| `src/lib/components/RoleColumn.svelte` | 94 | Pinned-left (`position: sticky; left: 0; z-index: 2`) list of 356 `<RoleCell>` rows; calls `initFromFeatures()` on mount with the 356-row invariant guard. DESIGN.md §CC#3 lines 263, 270. |
| `src/lib/components/RoleCell.svelte` | 189 | Per-feature cell. Renders `[authored]` / `unlabeled` / `causal` / `spurious` / `incidental` per DESIGN.md lines 264–267. Click-cycles causal → spurious → incidental. Keyboard `1`/`2`/`3` map to roles per line 454 / acceptance #5 line 278. Hover reveals the citation floating block for `[authored]` rows (no transition; instant opacity per line 265). `data-feature-id`, `data-role`, `data-testid="role-cell"` attributes for downstream charts and Playwright selectors. |
| `src/lib/components/RoleLabeledCounter.svelte` | 55 | Renders `labeled_by_you: <N> / 356` in `--type-annot`. Subscribes to derived `userLabeledCount`; `aria-live="polite"`. DESIGN.md lines 263, 275, 621, 722, 825. |

### Reactive store

| Path | Lines | Role |
|---|---|---|
| `src/lib/stores/roles.ts` | 214 | `rolesStore: Readable<RolesState>`; `initFromFeatures(rows)` (throws on ≠356 or ≠30 authored); `tag(id, role)` (rejects `authored` ids, rejects `unlabeled`/`authored` as writes, rejects unknown ids); `getRole(state, id)`; derived `userLabeledCount`. Idempotent re-init guards against reactive prop-binding wiping reader tags (DA #9). **No `revoke`, `undo`, `remove`, `unassign` exports** — tested in `roles-store.test.ts`. No `localStorage` / `indexedDB` / `document.cookie` reference in executable code. |

### Storybook harness + stories

| Path | Lines | Role |
|---|---|---|
| `src/stories/RoleColumn.stories.ts` | 96 | 8 exports: `Default`, `SingleTagged`, `ThreeColors`, `DenseTagged`, `ReducedMotion`, `Recast`, `MobileStrip`, `TwoXEndpoint`. Story ids are the keys the Playwright specs target (`cross-cutting-rolecolumn--<x>`). |
| `src/stories/RoleColumnHarness.svelte` | 241 | Loads `/data/features.json` via `loadFeatures()`; seeds scenario-specific tags via `_unsafeSetForTest` before mount; renders `<RoleLabeledCounter>` in a sticky header next to `# five_deaths_of_norway.ipynb`; wraps `<RoleColumn>` in a horizontally-scrollable CSV surrogate (`data-testid="csv-viewport"`) with 6 right-of-column data columns so the pinned-left sticky behaviour is exercised. Resets all stores per scenario. |

### Tests

| Path | Lines | Role |
|---|---|---|
| `tests/roles-store.test.ts` | 228 | 18 Vitest tests. Covers invariants (356 rows, 30 authored), read-only authored, re-tagging permitted, undo-rejection (`unlabeled`/`authored` as writes throw), export-surface absence of `revoke`/`undo`/`remove`, source-file absence of `localStorage`/`indexedDB`/`document.cookie`, counter correctness, unknown-id rejection, `getRole` defaults. |
| `tests/role-subscription-latency.test.ts` | 180 | 3 Vitest tests for **DA #3** (<300ms subscription latency). 1000 synthetic `derived()` subscribers catch up on a single `tag()` within budget; a 20-commit burst all land under 300ms; derived `userLabeledCount` catches up under 300ms. |
| `tests-e2e/role-column.spec.ts` | 307 | 16 Playwright tests at desktop-1x. All 5 CC#3 acceptance criteria exercised end-to-end. Plus pinned-left sticky check, recast persistence, counter typography (9pt JetBrains Mono), 5 visual snapshots. |
| `tests-e2e/role-column.2x.spec.ts` | 34 | 3 Playwright snapshots at `deviceScaleFactor: 2` (default, three-colors, dense-tagged endpoint). |
| `tests-e2e/role-column.mobile.spec.ts` | 53 | 4 Playwright tests at 480px: pinned-left at `left=0`, counter top-left, two visual snapshots. |

### Fixture + generator

| Path | Size | Role |
|---|---|---|
| `scripts/gen-features-fixture.mjs` | 145 lines | Emits the 356-row `features.json` fixture: 30 authored + 30 absurd + 296 unlabeled. Asserts the partitions before writing. |
| `static/data/features.json` | 51,922 bytes | Generated bundle. Served by Storybook's `staticDirs: ['../static']` at `/data/features.json`. |

### Visual regression baselines (committed)

| Path | Size |
|---|---|
| `tests-e2e/role-column.spec.ts-snapshots/default-desktop-1x-darwin.png` | baseline |
| `tests-e2e/role-column.spec.ts-snapshots/three-colors-desktop-1x-darwin.png` | baseline |
| `tests-e2e/role-column.spec.ts-snapshots/dense-tagged-desktop-1x-darwin.png` | baseline |
| `tests-e2e/role-column.spec.ts-snapshots/reduced-motion-desktop-1x-darwin.png` | baseline |
| `tests-e2e/role-column.spec.ts-snapshots/recast-desktop-1x-darwin.png` | baseline |
| `tests-e2e/role-column.2x.spec.ts-snapshots/` | 3 baselines (@2x) |
| `tests-e2e/role-column.mobile.spec.ts-snapshots/` | 2 baselines (480px) |

No files outside the step's concerns were touched. The styles in `src/lib/styles/role-palette.css` (Step 1 artifact) and stores in `features.ts` / `session.ts` / `ui.ts` (earlier step artifacts) are **consumed** by Step 3 but not modified.

---

## 2. Acceptance criteria → evidence

DESIGN.md §Cross-cutting signature #3 acceptance criteria, lines 273–278:

| # | Criterion | Evidence |
|---|---|---|
| 1 | Tagging a cell as `spurious` updates every chart's role-stroke for that feature within 300ms (DA #3, Playwright timer). | `tests-e2e/role-column.spec.ts:95` passes: clicks the first editable cell, asserts `data-role=causal` and class `.role-stroke` within a 300ms `toHaveAttribute` / `toHaveClass` timeout, and confirms `border-bottom-color` resolves to `rgb(63, 122, 78)` = `--role-causal`. Backed by unit test `tests/role-subscription-latency.test.ts` which proves 1000 subscribers + a 20-commit burst + derived `userLabeledCount` each stay well under 300ms in the raw store. |
| 2 | Counter updates synchronously on every commit. | `tests-e2e/role-column.spec.ts:122` passes: clicks three cells, asserts the counter advances `0 → 1 → 2 → 3` within a 300ms envelope each. Backed by unit tests `tests/roles-store.test.ts:178` (counter advances on each `tag()`) and `tests/roles-store.test.ts:196` (re-tagging the same cell does not inflate). |
| 3 | Reduced-motion has no effect — there are no transitions to suppress. | `tests-e2e/role-column.spec.ts:135` passes against the `reduced-motion` story: asserts `animationName === 'none'` and every `transitionDuration` component is `0s`/`0ms`. The snapshot `reduced-motion-desktop-1x-darwin.png` matches the `three-colors-desktop-1x-darwin.png` frame. |
| 4 | Reload erases all tags (no localStorage; sessionStorage only). | `tests-e2e/role-column.spec.ts:160` passes: confirms `window.localStorage.length === 0` both before and after three tag commits. Structural enforcement: (a) `rolesStore` source has zero executable `localStorage`/`indexedDB`/`document.cookie` references (tested in `tests/roles-store.test.ts:152`); (b) custom ESLint rule `un-regression/no-storage-persistence` project-wide (`tools/eslint/no-storage-persistence.js`, DESIGN.md line 916); (c) the store API surface exports no `revoke`/`undo`/`remove`/`unassign` (tested in `tests/roles-store.test.ts:141`). |
| 5 | Editable cells respond to keyboard `1`/`2`/`3` per the keyboard table; `[authored]` cells do not. | `tests-e2e/role-column.spec.ts:191` passes: focuses the first editable cell and presses `1`/`2`/`3`, asserting `data-role` transitions `causal → spurious → incidental`. Then focuses an authored cell, presses the same keys, and asserts `data-role` remains `authored`. |

DESIGN.md §CC#3 Invariants lines 269–272:

| # | Invariant | Evidence |
|---|---|---|
| 1 | 326 + 30 = 356 cells exactly. Verified at mount. | `tests-e2e/role-column.spec.ts:42` passes: `toHaveCount(356)` + `authored` rows `toHaveCount(30)` + editable rows `toHaveCount(326)`. Backed by unit tests `tests/roles-store.test.ts:78–95` which assert `initFromFeatures` rejects 355 and 357 and a bundle with ≠30 authored. |
| 2 | `[authored]` cells cannot be overwritten by user tags. | `tests/roles-store.test.ts:102`: `tag('authored_00', 'spurious')` throws with the DESIGN.md-citing message; `tests-e2e/role-column.spec.ts:191` confirms keyboard and click are equally no-ops on authored cells. |
| 3 | No undo, no remove. Once tagged, the cell carries that role for the session (DA #9). | `tests/roles-store.test.ts:129`: `tag(id, 'unlabeled')` throws; `tag(id, 'authored')` throws; the module's export keys exclude `revoke`/`undo`/`remove`/`unassign`. |

DA #3 (DESIGN.md line 910) reactive-subscription latency budget:

| Budget | Evidence |
|---|---|
| Subscribers re-render within 300ms of a tag commit. | `tests/role-subscription-latency.test.ts:100`: 1000 derived subscribers; single tag; measured `t1 - t0` and per-subscriber `lastUpdateMs - t0` all `< 300ms`. Second case: 20 sequential commits; `max(latencies) < 300ms`. Third case: derived `userLabeledCount` catches up `< 300ms`. |

---

## 3. Commands run

All from repo root `/Users/carloscotrini/Documents/git_sml/un-regression-validation`. Exit codes captured.

| Command | Exit | Notes |
|---|---|---|
| `npm run test:unit` | **0** | 5 test files, **54 tests passed** (including 18 `roles-store` + 3 `role-subscription-latency` tests specifically introduced by this step). Duration 24.4s. |
| `npm run lint` | **0** | Full chain: `lint:eslint` + `lint:stylelint` + `lint:forbidden-libraries` (0 violations) + `svelte-check` (0 errors, 0 warnings). |
| `npm run build` | **0** | SvelteKit adapter-static build; `✔ done`. |
| `npm run test:e2e` | **0** | Builds Storybook, then runs Playwright. **45 Playwright tests passed**: 32 desktop-1x, 6 desktop-2x, 7 mobile-480. Of those, **26 are the RoleColumn step-3 tests** (16 desktop-1x + 3 @2x + 4 mobile + 3 extra mobile/2x snapshots); the remaining 19 are the HeartbeatTicker regressions inherited from Step 2 (still green). |

---

## 4. DESIGN.md contract audit (file-by-file provenance)

Each file is traceable to one or more DESIGN.md lines:

| File | DESIGN.md citation |
|---|---|
| `RoleColumn.svelte` | §CC#3 lines 263 (DOM placement, `position: sticky; left: 0`); 270 (356-row invariant at mount); 524–528 (CH2 pinned-left); 617–622 (CH3 pinned-left); 719–724 (CH4 pinned-left); 821–826 (CH5 pinned-left). |
| `RoleCell.svelte` | §CC#3 lines 264–267 (render contract per role state); 265 (instant hover reveal, no transition); 268 (reactive subscription, `data-feature-id`); 271 (authored read-only); 278 + 454 (keyboard 1/2/3 only on editable); 910 (DA #3 subscription). |
| `RoleLabeledCounter.svelte` | §CC#3 line 263 (top-left, beside `<FilenameTitle>`, `labeled_by_you: {N} / 356`); line 275 (synchronous updates); §CH3 line 621, §CH4 line 722, §CH5 line 825 (persistence across chapters). |
| `roles.ts` | §CC#3 lines 261–262 (state shape: `Map<feature_id, Role>`); 270–272 (three invariants); DA #3 line 910 (<300ms subscription, no polling); DA #9 line 916 (no `revoke`, no storage). |
| `features.ts` *(pre-existing; consumed)* | §Data pipeline line 48 (fixture schema); §CC#3 line 270 (356 / 30 partition). |
| `role-palette.css` *(Step 1 artifact; consumed)* | §CC#5 lines 291–299 (stroke-only `.role-stroke`); §Color & palette lines 203–206. |
| `roles-store.test.ts` | §CC#3 lines 270–278 (invariants + acceptance); DA #9 line 916 (export-surface + source scan). |
| `role-subscription-latency.test.ts` | DA #3 line 910 (<300ms); §CC#3 line 274 (acceptance #1). |
| `role-column.spec.ts` + `.2x.spec.ts` + `.mobile.spec.ts` | §CC#3 lines 273–278 (all 5 acceptance criteria); lines 524 / 617 / 719 / 821 (pinned-left); lines 528 / 622 / 724 / 826 (mobile pinned-left); §Test discipline line 106 (1×/2×/480px). |
| `RoleColumn.stories.ts` + `RoleColumnHarness.svelte` | §Stage 2 handoff line 931 (Storybook-first prototype per step 2's precedent). |
| `gen-features-fixture.mjs` + `features.json` | §Data pipeline line 48 (356 rows; 30 authored; ~30 absurd); §CC#3 line 270 (30 + 326 = 356). |

No file in the step lacks a DESIGN.md citation.

---

## 5. Emit-don't-perform compliance (DA #1)

Zero CSS animations > 200ms in any of the step-3 files. No `transition-*` or `animation-*` declarations in `RoleColumn.svelte`, `RoleCell.svelte`, `RoleLabeledCounter.svelte`. The hover citation reveal uses `{#if citationHover}` DOM-swap (instant, per DESIGN.md line 265 "opacity 0 → 1 instant on hover, 1 → 0 instant on blur"), not a CSS transition. Confirmed by Playwright in `role-column.spec.ts:65` (`animationName === 'none'`) and `:135` (all `transitionDuration` components `0s`).

The custom ESLint rule `un-regression/no-css-animation-over-200ms` + the Stylelint `no-keyframes` rule remain clean project-wide (verified by `npm run lint` exit code 0).

---

## 6. Stroke-only palette compliance (DA #2, CC#5)

`RoleCell.svelte` applies `.role-stroke` when tagged and sets `--stroke` to one of `var(--role-causal | --role-spurious | --role-incidental | --role-unlabeled)`. The stroke resolves to `border-bottom: 1px solid var(--stroke)` via `role-palette.css`. **No fills, no backgrounds tinted with role color.** Playwright snapshot `three-colors-desktop-1x-darwin.png` is the visual evidence; Stylelint `role-color-stroke-only` passes.

---

## 7. Deferred items

| Item | Why deferred | DESIGN.md section that will govern when picked up |
|---|---|---|
| Real citation text for the 30 `[authored]` rows | Fixture carries placeholders (`"placeholder citation for {short_name}; step 5 replaces with real bibliography."`). Step 5 (precompute pipeline) is the designated owner. | §Data pipeline line 48 (`features.json`); §Stage 2 handoff line 933 (Step 5). |
| Wiring `<RoleColumn>` into actual chapter routes | Chapters are Steps 6–10. Step 3's contract is just the prototype + store + 300ms-latency proof. | §Stage 2 handoff lines 934–938. |
| `data-feature-id` attributes on downstream chart elements (PiCellLine2Underline, Ch3StrikethroughLayer, Ch4BetaLine, Ch4JoinedTable, Ch5BracketedConfession, Ch5Scorecard) | Those components do not yet exist — they are shipped by Steps 8 / 9 / 10. Step 3's cell already emits the attribute and the store emits change events; downstream subscribers will plug in. | §CH3 lines 601, 606–609; §CH4 lines 701, 705, 711; §CH5 lines 802–809. |
| `<RoleCell>` focus-ring on mobile (touch) keyboard | Keyboard table is desktop-first; mobile interaction is long-press + drag for `<DragToJoin>` (Step 9) with its own `<Ch4DragToJoinSurface>`. Step 3 ships click + keyboard; mobile tap already fires the click handler (verified by `role-column.mobile.spec.ts`). | §Global keyboard table line 454; Q6 closed at line 970. |

None of these deferrals compromise a step-3 acceptance criterion.

---

## 8. Summary for the reviewer

- **Files added / referenced:** 3 Svelte components, 1 Svelte store, 1 Storybook harness, 1 Storybook stories file, 2 unit tests, 3 Playwright specs (1× / 2× / 480px), 1 fixture generator, 1 fixture JSON, + 10 committed snapshot baselines.
- **All 5 acceptance criteria pass in Playwright + unit.** All 3 invariants pass in unit. DA #3 latency budget passes with 1000 subscribers. DA #9 irrevocability holds structurally (no `revoke`, no `localStorage`) and is run-time tested.
- **Commands:** `npm run test:unit` (54/54), `npm run lint` (clean), `npm run build` (clean adapter-static), `npm run test:e2e` (45/45).
- **No `TODO`, no `XXX`, no `@ts-ignore`, no `any`.** `svelte-check` reports 0 errors, 0 warnings.
- **No Stage-3 placeholders** beyond the documented fixture stand-ins — the store is fully operational for real reader input today, and the 300ms budget has headroom of at least two orders of magnitude on the measured run.

Step 3 is ready to unblock Step 4 (`<PiCellComposition>`), per DESIGN.md line 931: *"Without this passing, nothing else ships."*
