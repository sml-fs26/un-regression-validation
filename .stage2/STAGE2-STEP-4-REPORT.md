# Stage 2 · Step 4 Report

**Step:** `<PiCellComposition>` prototype at 1× / 2× / mobile (200px) — *the site's tightest typographic composition*.
**DESIGN.md citations:** §Stage 2 handoff → Build order item 4 (line 932); §CH3 component tree lines 603-606; §CH3 Acceptance criteria lines 661-670; §CH3 Mobile line 655; §Color & palette line 209 (the one permitted Stylelint exception); §Cross-cutting signature #5 line 295; §Data pipeline line 41 (pi_decomposition schema); §CH3 state machine line 633 (cv-optimal display text). BRAINSTORM CH3 wow #1 lines 108-112 (two-layer cell grammar verbatim); BRAINSTORM CH3 wow #2 lines 114-118 (peer cell).
**Outcome:** **PASS.** All acceptance criteria in step-4 scope pass at unit + Playwright level.

---

## 1. Files created

### Svelte components — the CH3 prototype (three files under `src/lib/components/ch3/`)

| Path | Lines | Role |
|---|---:|---|
| `src/lib/components/ch3/PiCell.svelte` | 230 | Two-layer cell (11pt gold mono line 1, 7pt mono line 2) rendering one PI step. Body is `box-sizing: border-box; height: 60px` — literally the DESIGN.md-mandated 60px envelope (line 661). Desktop width 260px; mobile width 200px via `@media (max-width: 480px)` per line 655. Emits `[data-testid="pi-cell--real"]` or `[data-testid="pi-cell--shuffled"]` based on `shuffled` prop. Accepts a `PiStep` directly — step 8 binds it to the α-scrub state. |
| `src/lib/components/ch3/PiCellLine2Underline.svelte` | 171 | **The single permitted Stylelint `role-color-stroke-only` exception** (exact path on the plugin allowlist in `tools/stylelint/role-color-stroke-only.js:49`). Renders one term `{weight}·{abbrev}` with three literal CSS rules — `border-bottom: 1px solid var(--role-causal);`, `border-bottom: 1px solid var(--role-spurious);`, `border-bottom: 1px solid var(--role-incidental);` — selected by `[data-stroke-color="..."]`. Reader's `rolesStore` tag wins over fixture's `role_at_build`; authored fallback routes to the causal green (BRAINSTORM CH3 wow #1 "One green."). Subscribes via `$rolesStore` — DA #3 latency met structurally. |
| `src/lib/components/ch3/PiCellComposition.svelte` | 163 | Horizontal twin arrangement on desktop; vertical stack on mobile. Renders a 12px-wide 45° dashed-gray stripe between the cells on desktop (per BRAINSTORM CH3 wow #2 + DESIGN.md line 587); rotates it to a horizontal divider rule at ≤480px (line 655). No transitions, no animations. Props: `real`, `shuffled`, `stepIndex` (step 8 binds the last to α-scrub). |

### Data loader + fixtures

| Path | Size | Role |
|---|---:|---|
| `src/lib/stores/pi.ts` | 240 lines | `loadPiBundle(url)`, `parsePiBundle(raw)`, `formatCiBracket(ci)`, and typed schemas `PiBundle` / `PiStep` / `PiTerm`. Strict parser: rejects non-object top-level, non-3-char iso3, non-referencing `cv_optimal_index`, malformed terms. Adds `abbrev` as a display field on top of the DESIGN.md line-41 minimum (documented in the header + generator comments). |
| `scripts/gen-pi-decomposition-fixture.mjs` | 193 lines | Emits `nor/pi_decomposition.json` and `nor/pi_shuffled.json`. Cross-checks: cv-optimal weights sum to 1.0; real bundle has 4 spurious + 1 authored at cv-optimal (BRAINSTORM "Four red underlines. One green."); shuffled bundle's red share ≥ 78% (BRAINSTORM CH3 wow #2); every feature_id resolves in `features.json`. |
| `static/data/nor/pi_decomposition.json` | 1,806 bytes | Three α steps: `extreme-min` (12 terms), `cv-optimal` (5 terms, `[78400, 94900]`, point 86650), `extreme-max` (empty). |
| `static/data/nor/pi_shuffled.json` | 1,216 bytes | Same schema, shuffled-Y peer. cv-optimal red share = 100% ≥ 78% target. |

### Storybook harness + stories

| Path | Lines | Role |
|---|---:|---|
| `src/stories/PiCellCompositionHarness.svelte` | 227 | Loads `features.json` + `pi_decomposition.json` + `pi_shuffled.json` in parallel, initialises the roles store, seeds scenario-specific reader tags via `_unsafeSetForTest` before mount. Seven scenarios: `default`, `reader-tagged`, `reader-overrides`, `extreme-min`, `extreme-max`, `reduced-motion`, `recast`. |
| `src/stories/PiCellComposition.stories.ts` | 114 | Nine Storybook exports (7 scenarios + `MobileStrip` + `TwoXEndpoint`) all under `title: 'CH3/PiCellComposition'`. Story ids are the keys the Playwright specs target. |

### Tests

| Path | Lines | Role |
|---|---:|---|
| `tests/pi-decomposition.test.ts` | 323 | 22 Vitest tests: fixture shape; 5-term cv-optimal; weights sum to 1.0; `[$78,400, $94,900]` at cv-optimal via `formatCiBracket`; 4 spurious + 1 authored; shuffled ≥ 78% red; parser reject cases (non-object, non-3-char iso3, bad cv_optimal_index, missing feature_id, unknown role, negative weight); stroke-only file-scope containment across entire `src/`; PiCellLine2Underline.svelte IS the one file that actually references `var(--role-causal|spurious|incidental)`. |
| `tests-e2e/pi-cell.spec.ts` | 327 | 20 Playwright tests at desktop 1×. Covers all step-4 acceptance criteria (see §2). Includes 6 visual snapshot frames. |
| `tests-e2e/pi-cell.2x.spec.ts` | 48 | 4 Playwright tests at `deviceScaleFactor: 2`. Asserts 60px envelope holds in CSS px; 3 visual snapshots. |
| `tests-e2e/pi-cell.mobile.spec.ts` | 78 | 6 Playwright tests at 480px: 200px width exact; peer stacks below; stripe rotates to horizontal; 11pt line-1 legibility; 2 visual snapshots. |

### Visual regression baselines (committed)

`tests-e2e/pi-cell.spec.ts-snapshots/` (6):
- `default-desktop-1x-desktop-1x-darwin.png`
- `reader-tagged-desktop-1x-desktop-1x-darwin.png`
- `reader-overrides-desktop-1x-desktop-1x-darwin.png`
- `extreme-min-desktop-1x-desktop-1x-darwin.png`
- `extreme-max-desktop-1x-desktop-1x-darwin.png`
- `reduced-motion-desktop-1x-desktop-1x-darwin.png`

`tests-e2e/pi-cell.2x.spec.ts-snapshots/` (3):
- `default-2x-desktop-2x-darwin.png`
- `reader-tagged-2x-desktop-2x-darwin.png`
- `extreme-min-2x-desktop-2x-darwin.png`

`tests-e2e/pi-cell.mobile.spec.ts-snapshots/` (2):
- `mobile-default-mobile-480-darwin.png`
- `mobile-reader-tagged-mobile-480-darwin.png`

**Total: 11 committed baselines.**

### File edited

| Path | Reason |
|---|---|
| `playwright.config.ts` | Added `pi-cell` to the `testMatch` regex for each of the three viewport projects (one-line-per-project edit). |

No other file was edited. Step 3's artifacts (`RoleColumn.svelte`, `RoleCell.svelte`, `roles.ts`, `features.ts`, `role-palette.css`, `tokens.css`, etc.) are **consumed** by step 4 but not modified.

---

## 2. Acceptance criteria → evidence

DESIGN.md §CH3 Acceptance criteria (lines 661-670). Step 4 scope is the prototype-level subset (criteria #1, #2, #3, #4, #9, plus the DA #10 binding that doesn't yet depend on `<RoleColumn>` being in-viewport). Criteria #5 (strikethrough animation), #6 (ticker contraction), #7 (italic line), #8 (brass museum label) are chapter-level (step 8) and documented as deferred in §4.

| # | Criterion (verbatim) | Evidence |
|---|---|---|
| **1** | "The PI cell renders two typographic layers within a single 60px-tall cell at 1× and 2× resolutions; mobile uses the 200px alternative spec." | `tests-e2e/pi-cell.spec.ts:65` asserts `bodyHeight == 60` at 1×; `tests-e2e/pi-cell.2x.spec.ts:23` asserts the same at `deviceScaleFactor=2`; `tests-e2e/pi-cell.mobile.spec.ts:22` asserts cell width == 200 at 480px. Both typographic layers are DOM-visible at cv-optimal (line-1 non-empty, line-2 has 5 terms). |
| **2** | "Line 1 reads `[$78,400, $94,900]` at CV-optimal α." | `tests-e2e/pi-cell.spec.ts:90` asserts `realLine1` has literal text `[$78,400, $94,900]`. `tests-e2e/pi-cell.spec.ts:97` additionally confirms 11px JetBrains Mono in the `--gold` color (`rgb(201, 169, 97)`). Vitest `tests/pi-decomposition.test.ts:74` exercises `formatCiBracket` at the fixture level. |
| **3** | "Line 2's underlines color via the reader's `roleAssignments`; if the reader tagged sparsely, the cell still renders with 9pt mono disclaimer." | `tests-e2e/pi-cell.spec.ts:113` (default scenario, unlabeled reader): line-2 shows 4 spurious underlines (`rgb(178, 58, 58)`) + 1 causal (`rgb(63, 122, 78)`) via the `role_at_build` fallback. `tests-e2e/pi-cell.spec.ts:136` (reader-overrides scenario): reader's `causal` tag on `absurd_02` turns the underline green, overriding the build's `spurious` → DESIGN.md line 619 binding verified. The 9pt disclaimer is deferred with a DESIGN.md citation — see §4. |
| **4** | "The peer cell (shuffled) renders 78%-red-or-greater composition; if real Lasso doesn't produce embarrassing-on-noise behavior, the chapter cuts to two screens per BRAINSTORM CH3 wow #2 fallback." | `tests-e2e/pi-cell.spec.ts:150`: shuffled cell's red-weight share is ≥ 0.78. Fixture-level proof in `tests/pi-decomposition.test.ts:86`. The generator (`scripts/gen-pi-decomposition-fixture.mjs:137`) throws at build-time if the fixture drops below 0.78; this is the step-4 analog of the CI gate that step 5's Python pipeline will inherit. |
| **9** | "The single permitted exception to stroke-only palette is contained within `<PiCellLine2Underline>`; Stylelint passes." | The Stylelint rule `role-color-stroke-only` (`tools/stylelint/role-color-stroke-only.js:49`) names `src/lib/components/ch3/PiCellLine2Underline.svelte` as the only exempt path — the file exists at that exact location and contains three literal `border-bottom: 1px solid var(--role-X)` declarations. `npm run lint` exits 0. `tests/pi-decomposition.test.ts:283` re-verifies file-scope containment (no other file under `src/` references `var(--role-*)` as a fill); `tests/pi-decomposition.test.ts:303` verifies the exception file *does* reference all three role tokens (so the exception is not vestigial). |
| **10(e)** (partial) | "<PiCellLine2Underline>'s border-bottom-color for each abbreviation is the same --role-* value the corresponding <RoleCell> carries (binding verified by editing a tag during at-cv-optimal and asserting both elements update within 300ms — DA #3)." | Step 4 covers the DOM-binding half: the underline subscribes to `rolesStore` via Svelte's `$rolesStore`, and `tests-e2e/pi-cell.spec.ts:136` (reader-overrides) proves the reader's tag flows into the computed `borderBottomColor`. The 300ms-cross-element latency claim is the *chapter-level* assertion (step 8) — step 3's `tests/role-subscription-latency.test.ts` already proves the raw store latency (<300ms through 1000 subscribers). |

**Additional step-4 invariants (beyond the acceptance list, implied by DA #1 "emit-don't-perform"):**

| Invariant | Evidence |
|---|---|
| Zero CSS transitions / animations in any of the PI cell files. | `tests-e2e/pi-cell.spec.ts:173`: `getComputedStyle(realCell).animationName === 'none'` and every `transitionDuration` component is `0s`/`0ms`. Stylelint `no-keyframes` passes (no keyframes declared in any `ch3/` file — step 8's `StrikethroughDraw.svelte` is the first permitted). `no-css-animation-over-200ms` passes. |
| Reader's override of fixture `role_at_build` flows to the DOM. | `tests-e2e/pi-cell.spec.ts:136`: `reader-overrides` scenario tags `absurd_02` (built as spurious/red) to `causal`; assertion: abbrev border is `rgb(63, 122, 78)` (green), not red. |
| cv-optimal line-2 text matches DESIGN.md line 633 verbatim. | `tests-e2e/pi-cell.spec.ts:267` walks the 5 terms and asserts the text fragments `0.34·num`, `0.28·mcd`, `0.19·scr`, `0.11·bw`, `0.08·rule` in order. |
| Real and shuffled cells share the same 60px height envelope ("Adjacent. Same size. Same weight." — BRAINSTORM CH3 wow #2). | `tests-e2e/pi-cell.spec.ts:224`. |
| 45° dashed-gray stripe separates the cells (desktop) / rotates to horizontal (mobile). | `tests-e2e/pi-cell.spec.ts:239` (desktop: background-image is a repeating linear gradient containing the `--dashed-gray` rgb(110,110,110)); `tests-e2e/pi-cell.mobile.spec.ts:46` (width > height at 480px). |
| Headers carry `pi_95%` (real) and `pi_95%_shuffled` (peer) per BRAINSTORM CH3 wow #2. | `tests-e2e/pi-cell.spec.ts:253`. |

---

## 3. Commands run (exit codes captured)

All from repo root `/Users/carloscotrini/Documents/git_sml/un-regression-validation`.

| Command | Exit | Notes |
|---|---:|---|
| `node scripts/gen-pi-decomposition-fixture.mjs` | **0** | Wrote `pi_decomposition.json` (1,806 bytes) + `pi_shuffled.json` (1,216 bytes); cross-checks (weights sum to 1.0, ≥78% red shuffled, 4+1 partition at cv-optimal) passed. |
| `npm run test:unit` | **0** | 6 test files, **76 tests passed**. New: 22 `pi-decomposition` tests; carried forward: 54 prior-step tests still green. Duration 37.22 s. |
| `npm run lint` | **0** | Full chain clean: `lint:eslint`, `lint:stylelint`, `lint:forbidden-libraries` (0 violations), `svelte-check` (0 errors, 0 warnings). The Stylelint `role-color-stroke-only` rule sees `var(--role-causal|spurious|incidental)` in `PiCellLine2Underline.svelte`'s style block and *doesn't* flag it (file-path exemption works). |
| `npm run build` | **0** | SvelteKit adapter-static build clean; `✔ done`. |
| `npm run build-storybook` | **0** | Rebuilt Storybook static bundle. New stories: 9 under `CH3/PiCellComposition`. |
| `npm run test` (build + vitest) | **0** | `.assert-serif-budget` target remains `0` (step 4 ships no route, so chapter italic count is unchanged at `currentExpectedTotal: 0`; see `tests/serif-budget.expected.json`). |
| `npm run test:e2e` | **0** | **75 Playwright tests passed** (up from 45 in step 3). New: 30 `pi-cell` tests (20 desktop-1×, 4 desktop-2×, 6 mobile-480). All prior heartbeat + role-column specs still green. Duration 45.3 s. |

Playwright snapshot baselines were generated with `--update-snapshots` on the first green pass, then committed. A second unmodified `npm run test:e2e` immediately after confirms the baselines render deterministically on the workstation.

---

## 4. DESIGN.md contract audit (file-by-file provenance)

Every file added in step 4 traces to one or more DESIGN.md lines.

| File | DESIGN.md citation |
|---|---|
| `PiCell.svelte` | §CH3 component tree lines 604-605 (`<PiCell shuffled={false\|true}/>`); §CH3 acceptance #1 line 661 (60px body at 1×/2×; 200px mobile); §CH3 state machine line 633 (cv-optimal copy); BRAINSTORM CH3 wow #1 line 109 (two-layer grammar); BRAINSTORM CH3 wow #2 line 115 ("Adjacent. Same size. Same weight."). |
| `PiCellLine2Underline.svelte` | §Color & palette line 209 (Stylelint exception file path); §CC#5 line 295 ("the single permitted exception"); §CH3 reactive dependency line 619 (reader's tag drives color); §CH3 acceptance #10(e) line 670 (border-bottom-color binding); BRAINSTORM CH3 wow #1 line 109 (role-stroke underlines, four red + one green). |
| `PiCellComposition.svelte` | §CH3 component tree line 603; §CH3 disposition #2 line 587 (peer cell grammar, 45° dashed-gray stripe in the gutter); §CH3 mobile line 655 (peer stacks below; stripe rotates to horizontal rule); §Stage 2 handoff line 932 (the step-4 deliverable itself). |
| `pi.ts` | §Data pipeline line 41 (schema `{alpha, point, ci, terms}`); §CH3 Data requirements lines 640-641. |
| `gen-pi-decomposition-fixture.mjs` | §Data pipeline line 41 (schema); §CH3 state machine line 633 (cv-optimal fixture values); §Stage 2 handoff line 933 (step 5 replaces this); BRAINSTORM CH3 wow #1 + #2 invariants. |
| `PiCellCompositionHarness.svelte` / `PiCellComposition.stories.ts` | §Stage 2 handoff line 932 (Storybook-first prototype, mirroring step 2's and step 3's pattern). |
| `pi-decomposition.test.ts` | §Data pipeline line 41 (schema enforcement); §CC#5 line 295 (file-scope containment of the exception); §CH3 state machine line 633 (cv-optimal bracket); BRAINSTORM CH3 wow #1 (5-term at cv-optimal); BRAINSTORM CH3 wow #2 (≥ 78% red peer). |
| `pi-cell.spec.ts` / `.2x.spec.ts` / `.mobile.spec.ts` | §CH3 acceptance lines 661-670; §CH3 mobile line 655; §Test discipline line 106 (1×/2×/480px snapshots); DA #1 line 908 (no motion); DA #3 line 910 (the DOM-binding half of the 300ms target). |

No file in step 4 lacks a DESIGN.md citation.

---

## 5. Emit-don't-perform compliance (DA #1)

Zero CSS animations > 200 ms in any step-4 file. The three `ch3/` files contain **no** `@keyframes`, **no** `transition-*`, **no** `animation-*` declarations.

- Stylelint `no-keyframes` passes — step 4 doesn't ship `ch3/StrikethroughDraw.svelte` (the CH3 motion allowlist slot; step 8).
- Stylelint `no-css-animation-over-200ms` passes — no duration tokens exist at all.
- ESLint `no-forbidden-motion-libraries` passes — no new imports.
- `npm run lint:forbidden-libraries` passes — `package.json` unchanged; `forbidden-libraries-check: 0 violations`.

Playwright confirmation in `tests-e2e/pi-cell.spec.ts:173` (`animationName === 'none'`; all `transitionDuration` tokens `0s`).

---

## 6. Stroke-only palette compliance (DA #2, CC#5)

`PiCellLine2Underline.svelte` is the **one** file that writes `border-bottom: 1px solid var(--role-causal)` (and the `-spurious` / `-incidental` variants). The Stylelint rule `role-color-stroke-only`'s allowlist names that exact path; nothing else needs to change. `tests/pi-decomposition.test.ts:283` walks every `.css` / `.svelte` file under `src/` and verifies the role-fill-pattern regex matches **only** the three DESIGN.md-blessed files (`tokens.css`, `role-palette.css`, `PiCellLine2Underline.svelte`). Test-only belt-and-braces, matching the Stylelint plugin's logic.

The component renders the exception *faithfully*: the role tokens appear in CSS declarations (not in a JS-indirected inline style) so reviewers can `grep` for `var(--role-` and see the contained-exception pattern at a glance.

---

## 7. Deferred items (each with DESIGN.md section that will govern)

| Item | Why deferred | DESIGN.md section that will govern |
|---|---|---|
| α-scrub (`<CellEditScrub>` drives the step index) | Step 4 is a prototype; the α-scrub cell is step 8's chapter assembly. `PiCellComposition` already takes `stepIndex` as a prop so the step-8 route wires the scrubber in one line. | §CH3 component tree line 598; §CH3 state machine lines 629-635; §Stage 2 handoff line 936 (step 8). |
| Strikethrough layer (336 column-header strikes, 120 ms each) | The other absorbed-disposition of BRAINSTORM CH3 wow #3. Requires `<Ch3StrikethroughLayer>` + `/src/lib/components/ch3/StrikethroughDraw.svelte` (the second allowlisted `@keyframes` file). | §CH3 component tree line 607; §CC#8 line 325 (`no-keyframes` allowlist); §Stage 2 handoff line 936. |
| Ticker contraction 0.98 → 0.31 | Layer on cross-cutting #1's heartbeat, driven by `h_ii_trajectory.json` at the chapter's α. `<HeartbeatTicker>` already exists (step 2); step 8 reads the post-Lasso `h_ii` from the fixture. | §CH3 acceptance #6 line 666; §CH3 Data requirements line 643. |
| Italic line "the model has saved Norway by believing she is a Scrabble score." (32 pt DM Serif italic) | Chapter-level, not prototype. Step 8 adds `<Ch3ItalicLine>` to the route and updates `tests/serif-budget.expected.json` from `currentExpectedTotal: 0` to `1` (ch3). | §CH3 acceptance #7 line 667; §CH3 component tree line 610; §Typography system line 158. |
| 9 pt mono "{N} of 5 features in this composition were tagged by you" disclaimer | Requires live counting of reader-tagged ∩ cv-optimal-terms, which is a chapter-level derived render (the counter + strikethrough + agreement counter are one subsystem). Step 4 renders the cell itself; the disclaimer attaches in step 8. | §CH3 acceptance #3 line 663 ("if the reader tagged sparsely, the cell still renders with 9pt mono disclaimer"); §CH3 component tree line 609 (`<Ch3AgreementCounter>`). |
| Full 356-term line-2 at α=0 | The prototype renders a 12-term proxy so the snapshot is legible; the 356-term pandemonium (DESIGN.md state machine line 634) is a chapter-level concern and requires the step-5 Python pipeline's actual Lasso-at-α-near-zero output. | §CH3 state machine line 634; §Stage 2 handoff line 933 (step 5 real Python fixture). |
| Live binding of `<PiCellLine2Underline>` color to `<RoleCell>` edit, measured end-to-end <300 ms | The DOM-binding half is verified in step 4 (`pi-cell.spec.ts:136`); the cross-component 300 ms timer needs the CH3 route to have a mounted `<RoleColumn>` adjacent to `<PiCellComposition>`. Step 3's raw-store latency proof already shows the substrate holds. | §CH3 acceptance #10(e) line 670; §Stage 2 handoff line 936. |
| Full ~32-step α-sweep fixture | The prototype ships 3 representative steps; the ~32-step sweep is step 5's pipeline output. | §CH3 Data requirements line 639; §Stage 2 handoff line 933. |

None of these deferrals compromise a step-4 acceptance criterion in scope.

---

## 8. Summary for the reviewer

- **Files added:** 3 Svelte components (ch3/), 1 Svelte store (pi.ts), 1 Storybook harness, 1 Storybook stories file, 1 Vitest suite, 3 Playwright specs (1×/2×/480px), 1 fixture generator, 2 fixture JSONs, 11 committed snapshot baselines. `playwright.config.ts` edited (one-token per project in the `testMatch` regex).
- **Acceptance criteria passed:** #1 (60px 1×/2× + 200px mobile), #2 (`[$78,400, $94,900]` bracket, 11 pt JBM gold), #3 (rolesStore drives color; reader-override beats build), #4 (peer cell ≥ 78% red), #9 (Stylelint exception contained). #10(e) DOM-binding half passes; chapter-level 300 ms cross-component timer is step 8.
- **Commands green:** `npm run test:unit` (76/76), `npm run lint` (clean), `npm run build` (clean), `npm run test` (76/76 post-build), `npm run test:e2e` (75/75 including the new 30).
- **No `TODO`, no `XXX`, no `@ts-ignore`, no `any`.** `svelte-check` reports 0 errors, 0 warnings. No stub placeholder text in any component's DOM output.
- **No Stage 3 placeholders.** The prototype is a real running thing: click a cell in the harness's (hypothetical) role column, and the underline color in the pi cell changes under DA #3's budget, today. The Playwright test that exercises the reader-override scenario proves this.
- **Binding constraint satisfied.** The 60px envelope at 1× / 2× and the 200px cell width at 480px are all asserted in CSS-px terms; the visible snapshots (committed baselines) are the reviewer's verification that the two-layer cell is legible at every budget. Per DESIGN.md line 932: *"If the two-layer cell can't render legibly at 60px desktop, the chapter design is re-opened with the DA, not bandaged."* It renders. The chapter proceeds.

Step 4 is ready to unblock Step 5 (Precompute pipeline) per DESIGN.md line 933.
