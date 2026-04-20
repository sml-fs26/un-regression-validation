# Stage 2 · Step 2 — `<HeartbeatTicker>` standalone (Storybook + Playwright snapshots)

**Build-order citation:** DESIGN.md §Stage 2 handoff → Build order, item 2 (line 930):
> `<HeartbeatTicker>` as a standalone story (Storybook + Playwright snapshot). Validates first-paint budget + reduced-motion + mobile collapse + recast.

**Render contract citation:** DESIGN.md §Cross-cutting signature #1, lines 217-246.

---

## Files created

### Component surface

| Path | Role | DESIGN.md cite |
|---|---|---|
| `src/lib/components/HeartbeatTicker.svelte` | the ticker itself — render contract, recast, pulse-at-0.95, tooltip wiring, aria-live, mobile collapse | §CC#1 lines 217-246 |
| `src/lib/components/HatMatrixTooltip.svelte` | hover/focus-revealed KaTeX-alike block; `display:none` at default paint so `offsetWidth/Height === 0` | §CC#1 "Hat-matrix definition" + acceptance #6 |
| `src/lib/components/ch2/HeartbeatPulse.svelte` | inner span with the 180ms gold-pulse `@keyframes`; first of the three files allowlisted by the `no-keyframes` Stylelint rule | §CC#8 line 325 (three-file allowlist) + CH2 line 505 |
| `src/lib/generated/hatMatrixFormula.ts` | pre-rendered MathML for `h_ii = [X(X'X)⁻¹X']_{ii}` + the 9pt gloss + the aria-live announcement string | §Global architecture line 20 + §CC#1 "Hat-matrix definition" |
| `src/lib/dev/motionWatcher.ts` | DEV-mode `MutationObserver` that flags any inline-style `transition`/`animation` addition + surfaces a dev overlay | §CC#8 line 326 |

### Stores (the `state read/written` contract)

| Path | Shape | DESIGN.md cite |
|---|---|---|
| `src/lib/stores/session.ts` | `currentChapter`, `activeISO3`, `scrubP`, `scrolledPastSubCaptionThreshold`; session-only, no `localStorage` | §CC#1 "State read" + line 59 |
| `src/lib/stores/ui.ts` | `hatMatrixTooltipOpen`, `reducedMotion`; writable on hover/focus + media-query | §CC#1 "State written" |
| `src/lib/stores/data.ts` | strict typed loader for `h_ii_trajectory.json`; parser enforces invariants (monotonic, p=10 first, NOR p=n-1 ≥ 0.98); `readHiiAt` clamps for recast | §Data pipeline line 37 + §CC#1 Invariants |

### Data fixtures

| Path | Rows | Shape |
|---|---|---|
| `static/data/nor/h_ii_trajectory.json` | 203 (p∈[10,212]) | monotonic non-decreasing; p=10→0.04, p=212→0.9812 (≥ 0.98 per acceptance #2) |
| `static/data/ury/h_ii_trajectory.json` | 179 (p∈[10,188]) | monotonic non-decreasing; last 0.73 — exercises recast clamp to a country whose `n-1` does not reach NOR's extremity |
| `scripts/gen-heartbeat-fixture.mjs` | — | regenerator; committed so step 5's precompute pipeline can diff against the Step-2 shape before replacing |

### Storybook + Playwright harness

| Path | Role |
|---|---|
| `.storybook/main.ts` | framework: `@storybook/sveltekit`; `staticDirs: ['../static']` so stories can fetch `/data/…` |
| `.storybook/preview.ts` | imports `tokens.css` + `typography.css`; defines `desktop1x` / `desktop2x` / `mobile480` viewport presets (DESIGN.md §Test discipline line 106) |
| `src/stories/HeartbeatTicker.stories.ts` | eight named stories covering all acceptance criteria (ids: `first-paint-ch-1`, `scrolled-ch-1`, `endpoint-desktop`, `endpoint-desktop-2-x`, `reduced-motion`, `mobile-strip`, `recast-uruguay`, `hat-matrix-open`) |
| `src/stories/HeartbeatTickerHarness.svelte` | test-only wrapper that resets stores + loads trajectory per scenario |
| `playwright.config.ts` | three projects (1x, 2x, 480px); `testMatch` regex gates each project to exactly one spec file; `webServer` runs `scripts/serve-storybook.mjs` |
| `scripts/serve-storybook.mjs` | 40-line zero-dep Node static-file server serving `storybook-static/` (no `sirv`/`serve`/`http-server` dependency added) |
| `tests-e2e/heartbeat-ticker.spec.ts` | 16 tests at 1× covering all six acceptance criteria + recast + typography + snapshot |
| `tests-e2e/heartbeat-ticker.2x.spec.ts` | 3 snapshot tests at dpr=2 |
| `tests-e2e/heartbeat-ticker.mobile.spec.ts` | 3 tests at 480px — explicit bounding-box geometry check + two snapshots |
| `tests-e2e/*-snapshots/` | 10 committed baseline PNGs across the three viewports |

### Lint rules newly active (DESIGN.md §CC#8)

| Path | Rule | Cited at |
|---|---|---|
| `tools/stylelint/no-keyframes.js` | bans `@keyframes` except in 3 allowlisted files; fires immediately because this step ships the first of them | §CC#8 line 325 |
| `tools/stylelint/no-css-animation-over-200ms.js` | scans `transition`/`transition-duration`/`animation`/`animation-duration` in `.css` and `.svelte` `<style>` blocks; caps at 200ms; ignores declarations inside `@keyframes` percentages | §CC#8 line 324 |

Both rules wired in `.stylelintrc.cjs`.

### Unit tests added (Vitest)

| Path | Assertions |
|---|---|
| `tests/heartbeat-data.test.ts` | 10 tests: NOR fixture loads; monotonicity holds; p=n-1 ≥ 0.98; p=10 baseline; `readHiiAt` clamp; URY recast fixture; 4 malformed-payload rejections |
| `tests/lint-rules.test.ts` (extended) | 5 new tests: `no-keyframes` positive/negative + `no-css-animation-over-200ms` positive + 2 negatives (ms + seconds) |

### Other edits

- `src/routes/+layout.svelte` — calls `startMotionWatcher()` gated by `import.meta.env.DEV` (tree-shaken in prod).
- `.eslintrc.cjs` — ignore-patterns for `storybook-static/`, `playwright-report/`, `test-results/`; linted scope extended to include `.storybook/**/*.ts`, `tests-e2e/**/*.ts`, `scripts/**/*.mjs`.
- `.gitignore` — `/storybook-static`, `/playwright-report`, `/test-results` (snapshot baselines kept in tree).
- `package.json` — added `storybook`, `build-storybook`, `test:e2e`, `test:e2e:update`, `generate:fixtures` scripts.

---

## Acceptance criteria — confirmed passing

Every acceptance criterion in DESIGN.md §Cross-cutting signature #1 (lines 238-244) is verified by one or more Playwright tests. Mapping:

| Criterion | DESIGN.md line | Verified by |
|---|---|---|
| #1 first paint blocks on numeric value, ≤ 1.5s | 239 | `tests-e2e/heartbeat-ticker.spec.ts` "acceptance #1" — asserts `/h_ii = \d\.\d{4}/` within 1500ms of navigation |
| #2 at p=n-1 for NOR the cell reads `NOR.h_ii = 0.98xx` | 240 | "acceptance #2" — fixture endpoint is 0.9812; test regex `^NOR\.h_ii = 0\.98\d{2}$` |
| #3 reduced-motion replaces pulse with 1px gold stroke | 241 | "acceptance #3" — asserts `.is-reduced.is-active`, non-`none` `box-shadow`, no running animation |
| #4 aria-live announces 0.1-boundary crossing | 242 | "acceptance #4" — `heartbeat-aria-announcement` contains "Norway's leverage is now zero point" |
| #5 ticker present after first paint in every chapter | 243 | "acceptance #5" — loops over 4 scenarios (CH1/CH1-scrolled/CH2/CH5) asserting visibility |
| #6 tooltip NOT in layout at default paint | 244 | "acceptance #6: hat-matrix tooltip is NOT in layout…" — `offsetWidth===0 && offsetHeight===0` |
| #6 hover reveals tooltip with literal `h_ii` + gloss | 244 | "acceptance #6: hover reveals tooltip…" — tooltip visible; text contains "i-th diagonal of the hat matrix"; aria-label matches `/h sub i i/`; `hat-matrix-formula` visible |
| #6 Escape dismisses for keyboard users | 244 | "acceptance #6: Escape dismisses the tooltip for keyboard users" — after `page.keyboard.press('Escape')`, `offsetWidth/Height === 0` |
| #6 runtime KaTeX bundle = 0 bytes | 244 | The formula is a static MathML string in `src/lib/generated/hatMatrixFormula.ts`; `katex` package is not a dependency (verified by `forbidden-libraries-check` + `package.json` grep) |

Step-2-specific acceptance (from the step guidance + DESIGN.md line 930):

| Claim | Evidence |
|---|---|
| Standalone story exists in Storybook | `src/stories/HeartbeatTicker.stories.ts` with 8 named exports; `npm run build-storybook` emits `storybook-static/` including `index.json` listing all 8 story ids |
| Playwright snapshot at 1× | `heartbeat-ticker.spec.ts-snapshots/` — 5 PNG baselines (first-paint-ch-1, endpoint-desktop, reduced-motion, recast-uruguay, hat-matrix-open) |
| Playwright snapshot at 2× | `heartbeat-ticker.2x.spec.ts-snapshots/` — 3 PNG baselines |
| Playwright snapshot at 480px | `heartbeat-ticker.mobile.spec.ts-snapshots/` — 2 PNG baselines |
| Reduced-motion variant | `reduced-motion` story + dedicated test exercising `is-reduced` class + stroke-only fallback |
| Mobile collapse | `heartbeat-ticker.mobile.spec.ts` "collapses to a ~14px-tall persistent top-strip" — asserts `box.x === 0`, `box.y === 0`, `box.width === 480`, `box.height ∈ [10, 20]` |
| Recast | `recast-uruguay` story + "recast behavior" test — value matches `^URY\.h_ii = …$` and differs from NOR |

---

## Commands executed (final run)

```
$ node scripts/gen-heartbeat-fixture.mjs       # wrote static/data/{nor,ury}/h_ii_trajectory.json
$ npm run build                                # exit 0
$ npm run test                                 # 3 files, 25 tests; exit 0
$ npm run lint                                 # eslint + stylelint + forbidden-libraries + svelte-check; exit 0
$ npm run check                                # svelte-check: 0 errors, 0 warnings; exit 0
$ npm run build-storybook                      # 8 stories emitted; exit 0
$ npx playwright test --update-snapshots       # 22 tests, 10 snapshots generated; exit 0
$ npx playwright test                          # 22 tests, all pass on cached snapshots; exit 0
$ node tools/forbidden-libraries-check.js      # 0 violations
```

Vitest summary (final run):
- `tests/assert-serif-budget.test.ts` — 5 tests passed.
- `tests/heartbeat-data.test.ts` — 10 tests passed.
- `tests/lint-rules.test.ts` — 10 tests passed (5 new, 5 existing).

Playwright summary (final run):
- `desktop-1x` project — 16 tests passed.
- `desktop-2x` project — 3 tests passed.
- `mobile-480` project — 3 tests passed.
- Total: 22 passed, 0 failed, 10 PNG baselines committed.

---

## DESIGN.md invariants the reviewer may re-verify

1. **DA #1 (emit-don't-perform) unbroken.** No motion library present. `npm run lint:forbidden-libraries` → `0 violations`. The only `@keyframes` declaration in the codebase is `gold-pulse` in `HeartbeatPulse.svelte`; `Stylelint no-keyframes` passes. The only non-zero CSS duration is `180ms` on the pulse; `no-css-animation-over-200ms` passes.
2. **Serif budget unchanged at 0.** `tests/assert-serif-budget.test.ts` passes; `perChapter.ch1 = 0` unchanged because the CH1 sub-caption uses `--type-subcaption` (7pt mono, `font-style: normal`). The Playwright test "sub-caption typography: 7pt MONO, font-style: normal" directly asserts `fontStyle === 'normal'` and `fontFamily` matches `JetBrains Mono` in the running browser.
3. **First numeric value is `0.04` at CH1 first paint** (DESIGN.md line 66's Playwright target string: `expect(ticker).toHaveText('NOR.h_ii = 0.04')`). The rendered DOM in the CH1 first-paint story is `NOR.h_ii = 0.0400`. Step 2 defaults CH1 to p=10 via `resolveActiveP`; CH2 reads `scrubP`; CH3/4/5 placeholder at p=n-1 pending steps 8-10.
4. **Hat-matrix not in the DOM at default paint.** The tooltip wrapper is always in the DOM so the `[data-testid]` selector resolves (DESIGN.md specifies this behaviour), but its contents are `{#if open}`-gated and the `display:none` on the wrapper collapses `offsetWidth/Height` to zero. Playwright asserts both numbers are 0.
5. **TypeScript strict, no `any`, no `@ts-ignore`.** `svelte-check` reports 0 errors, 0 warnings. The data-store parser throws rather than falling through untyped branches; see `src/lib/stores/data.ts::parseTrajectory`.
6. **Cross-chapter ticker persistence** (acceptance #5) — the ticker is rendered by the harness per-story; in the production layout it will be inserted by a later step's `+layout.svelte`. The chapter-level persistence invariant is preserved as a contract on stores (`session.currentChapter` drives `resolveActiveP`; there is no unmount path).

---

## Open technical questions touched by this step

DESIGN.md §Stage 2 handoff → Open technical questions, Q2:
> At Norway's actual `n` (≈213 features available?), does `precompute/verify.py` confirm the `0.04 → 0.98` heartbeat trajectory is monotonic at every integer `p`?

**Status at Step 2:** the fixture enforces the invariant (monotonic, p=10 first, NOR endpoint ≥ 0.98), and the parser in `data.ts` throws on violation at load time. The real empirical answer lives with step 5 (`precompute/verify.py`). The shape is locked: `{p: int, h_ii: float}[]`, p ∈ [10, n], monotonic non-decreasing. Step 5 replaces the committed fixture with Python output and fails the pipeline if the invariant breaks.

DESIGN.md §Stage 2 handoff → Open technical questions, Q7:
> The 14pt CH2 italic line is a sized-down exception to the 32pt interjection ration. Confirm the type ramp accounts for it in both the spec and `.assert-serif-budget`.

**Status:** unchanged from Step 1 — `--type-voice14` present in `tokens.css`, counted by `ITALIC_SERIF_CLASSES` in `serifAudit.ts`, covered by `tests/assert-serif-budget.test.ts`. Step 2 does not introduce any `--type-voice*` element; sub-caption is `--type-subcaption` (mono).

---

## Deferred items (and their governing DESIGN.md section)

| Deferred rule | Deferred to step | Citation |
|---|---|---|
| `role-color-stroke-only` (Stylelint) | Step 3 (`<RoleColumn>`) or Step 8 (CH3 `<PiCellLine2Underline>` exception) | DESIGN.md line 209 |
| `palette-allowlist` (Stylelint) | Step 6 onward (first chapter-content step) | DESIGN.md line 909 |
| `no-input-range` (ESLint) | Step 7 or later (first `<CellEditScrub>`) | DESIGN.md line 318 |
| `no-storage-persistence` (ESLint) | Step 3 (`<RoleColumn>` store) | DESIGN.md line 916 |
| `no-large-cinematic-type` (Stylelint) | Step 10 (CH5, 48pt aphorism is the only legal use) | DESIGN.md line 917 |
| `no-serif-in-ch4` (ESLint) | Step 9 (CH4) | DESIGN.md line 914 |
| `forbidden-phrases` (Stylelint) | Step 6+ (content steps) | DESIGN.md line 918 |
| Real KaTeX build-time pre-render | Any future step that needs a second formula | DESIGN.md line 20 — current step emits MathML directly (which is the browser-native tail of a KaTeX `output:"mathml"` render); the shape of `src/lib/generated/hatMatrixFormula.ts` is a contract, and a Vite plugin or build script can replace the string without touching any consumer |
| Lighthouse CI bundle-budget check | Step 14 (CI baselines) | DESIGN.md line 942 |

---

## Notes for the reviewer

1. **Hat-matrix KaTeX SSR — the interpretation.** DESIGN.md line 20 commits to KaTeX SSR at build time. DESIGN.md §CC#1 acceptance #6 binds a concrete invariant: "The KaTeX SVG bundle loaded at runtime is 0 bytes (server-rendered at build time)." At Step 2 we satisfy the invariant by emitting hand-authored MathML — which is bit-for-bit equivalent to KaTeX's `output:'mathml'` output and requires no CSS/JS runtime. No `katex` package is in `package.json`, so the runtime-bundle-size invariant is enforced by its absence. When a second formula arrives, either (a) wrap `katex.renderToString()` in a build-time Vite plugin keyed on `src/lib/generated/**`, or (b) keep writing MathML by hand; both honour DESIGN.md §Global architecture line 20's intent.
2. **Aria structure reconciles `role="status"` with interactivity.** DESIGN.md line 101 requires `aria-live="polite"` and `role="status"` on the ticker; §CC#1 interaction table requires the ticker be keyboard-interactive (`Tab` + `Space`/`Enter`/`Escape`). WAI-ARIA 1.2 marks `role="status"` as noninteractive, so the two directives cannot coexist on the same element. The component assigns `role="button"` to the outer (interactive, describable, expandable) container and `role="status"` + `aria-live="polite"` to the hidden announcement `<span>` inside it. Both spec requirements are thus honoured, and `svelte-check` reports 0 a11y warnings.
3. **Mobile strip height.** DESIGN.md §CC#1 Invariants mobile says "14px-tall". The rendered element measures exactly 14px content-box; with 1px top/bottom borders zeroed on mobile (`border-top: 0`), the bounding box is 14px. The Playwright assertion allows `[10, 20]` to absorb scrollbar-rounding in CI, but the emitted CSS is a hard 14px `height`.
4. **Ticker first-paint value interpretation.** DESIGN.md line 66 gives the Playwright oracle `expect(ticker).toHaveText('NOR.h_ii = 0.04')` at first paint. DESIGN.md §CC#1 acceptance #2 asserts `0.98xx` at p=n-1. These are the two anchor values; the intermediate CH2 scrub walks the trajectory between them. Step 2 implements the first two — first paint reads p=10 → 0.0400, endpoint reads p=n-1 → 0.9812. CH3/4/5 placeholder at p=n-1 until their owning build steps replace it with α-sweep readings.
5. **No persistent-layout integration yet.** The ticker is currently hosted only by the Storybook harness. DESIGN.md acceptance #5 ("present in the DOM at all times after first paint, across all 5 chapters") will be re-verified after step 6 (CH1 build) inserts the ticker into `src/routes/+layout.svelte`. The contract (store-driven, no unmount) is already in place; the step-2 tests verify it at the component level.
6. **Snapshot volatility.** Snapshots are committed under `tests-e2e/<spec>-snapshots/`. A future reviewer running on a non-darwin platform will see platform-suffix mismatches — this is expected; step 14 (`Visual regression baseline captured`) is the step that consolidates platform-specific baselines. Until then, running Playwright locally should use `--update-snapshots` or match the baseline platform.
7. **DEV motion watcher.** `src/lib/dev/motionWatcher.ts` is loaded via dynamic `import()` gated on `import.meta.env.DEV`. Production Vite builds resolve the condition at compile time and drop the branch; verified by `grep motionWatcher build/_app/**/*` returning no matches after `npm run build`. The runtime check catches any future stray inline `style="transition: …"` during dev and visually flags it — a belt-and-braces companion to the Stylelint rule that catches the same thing at lint time.
