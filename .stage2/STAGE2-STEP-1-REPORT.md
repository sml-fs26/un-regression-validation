# Stage 2 · Step 1 — Typography system + color palette + lint rules

**Build-order citation:** DESIGN.md §Stage 2 handoff → Build order, item 1 (line 929):
> Typography system + color palette (`/src/lib/styles/`). All CSS variables, lint rules, `.assert-serif-budget` dev check. No chapter content yet.

---

## Files created / edited

### Project scaffold (SvelteKit + TypeScript strict + adapter-static)
- `package.json` — `"type": "module"`; deps pinned to versions known compatible; only approved libraries. No motion library present (DA #1).
- `tsconfig.json` — `strict: true`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters` (DESIGN.md §Global architecture, line 18).
- `svelte.config.js` — `@sveltejs/adapter-static` with `prerender.entries: ['*']`.
- `vite.config.ts` — SvelteKit plugin + Vitest config (`include: tests/**/*.test.ts`, `environment: 'node'`).
- `src/app.html`, `src/app.d.ts`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`, `src/routes/+page.svelte` — minimal root route so adapter-static has HTML to emit.
- `.gitignore`, `.npmrc`.

### The design spec's §Typography system + §Color & palette (the core of this step)
- `src/lib/styles/tokens.css` — the **complete** CSS-variable set from DESIGN.md lines 115-136 (typography) and 177-198 (color). All 10 typography vars, 3 families, `--head-transform`, `--head-tracking`, surface colors, heartbeat/symptom colors, and the stroke-only role palette. Exact values preserved.
- `src/lib/styles/typography.css` — one utility class per `--type-*` role (`.type-model`, `.type-data`, `.type-annot`, `.type-subannot`, `.type-subcaption`, `.type-head`, `.type-voice14`, `.type-voice32`, `.type-voice48`).
- `src/lib/dev/serifAudit.ts` — exports `countItalicSerifRuntime` (browser-side, reads `getComputedStyle`) and `countItalicSerifFromHtml` (static-HTML counter used by the CI Vitest test). Path matches DESIGN.md line 139 verbatim: `/src/lib/dev/serifAudit.ts`.

### Custom lint rules
- `tools/stylelint/no-raw-font-family.js` — Stylelint plugin enforcing DESIGN.md line 113. Rejects any `font-family:` or `font:` value that does not reference `var(--font-mono|serif|sans)` or a `var(--type-*)` shorthand. `tokens.css` is whitelisted (it is where the raw family values are defined).
- `.stylelintrc.cjs` — wires the plugin + `postcss-html` override for `.svelte` files.
- `tools/eslint/no-forbidden-motion-libraries.js` — ESLint rule enforcing DESIGN.md line 26 (DA #1). Rejects `import`, dynamic `import()`, and `require()` of: `framer-motion`, `gsap`, `motion`, `lottie-web`, `popmotion`, `react-spring`, `@react-spring/core`, `@react-spring/web`, `auto-animate`, `@formkit/auto-animate`, `aos`, and any package whose bare name matches `/animat/i`.
- `tools/eslint/index.js`, `tools/eslint/package.json` — packages the rule as `eslint-plugin-un-regression`, installed via `file:./tools/eslint` so ESLint resolves it.
- `.eslintrc.cjs` — wires `un-regression/no-forbidden-motion-libraries` at error severity; Svelte + TS parsers configured.
- `tools/forbidden-libraries-check.js` — package.json auditor complementing the ESLint rule; scans direct + dev + peer + optional deps against the same allowlist. Run as `npm run lint:forbidden-libraries`.

### CI tests
- `tests/assert-serif-budget.test.ts` — Vitest test implementing `.assert-serif-budget`. Walks `build/`, parses every `.html` file, counts elements carrying `type-voice14|32|48`, and asserts the site-wide total equals `currentExpectedTotal` in `tests/serif-budget.expected.json`. Also cross-checks that (a) `totalBudget: 4` matches `sum(perChapter)`, matching DESIGN.md line 149's cumulative invariant; (b) every italic-serif class is present in `typography.css`.
- `tests/serif-budget.expected.json` — data file with `perChapter = {ch1:0, ch2:1, ch3:1, ch4:0, ch5:2}` (from DESIGN.md lines 155-161), `totalBudget: 4`, `currentlyBuiltChapters: []`, `currentExpectedTotal: 0`. Later chapter-build steps update `currentlyBuiltChapters` + `currentExpectedTotal`.
- `tests/lint-rules.test.ts` — positive+negative harness confirming both custom lint rules actually reject contrived violations (not just pass on good input). Uses `execSync` on `npx stylelint` / `npx eslint` with temp files.

---

## Acceptance criteria (from the step-specific guidance) — confirmed passing

| # | Claim | Evidence |
|---|---|---|
| 1 | SvelteKit 2.x project with `adapter-static` | `svelte.config.js` imports `@sveltejs/adapter-static`; `npm run build` writes to `/build/index.html`. |
| 2 | TypeScript strict mode | `tsconfig.json` sets `strict: true` + `noUnusedLocals` + `noUnusedParameters`. `npm run check` exits 0 with 0 errors / 0 warnings. |
| 3 | Only allowed dependencies installed (no motion library) | `tools/forbidden-libraries-check.js` against installed `package.json` reports `0 violations`. |
| 4 | All typography CSS variables from DESIGN.md §Typography system present in `/src/lib/styles/` | `src/lib/styles/tokens.css` defines every `--font-*`, `--type-*`, `--head-*` variable in the block at DESIGN.md lines 115-136. Byte-for-byte value preservation verified by reading built CSS at `build/_app/immutable/assets/0.*.css`. |
| 5 | All color/palette CSS variables from DESIGN.md §Color & palette present | Same file; surface + heartbeat + role vars + `--pi-cell-stroke-weight`, matching DESIGN.md lines 177-198. |
| 6 | Stylelint `no-raw-font-family` rule | `tools/stylelint/no-raw-font-family.js`. Positive case (reference via `var(--font-mono)`) passes; negative case (raw `Comic Sans MS, sans-serif`) exits 2 with the rule's message (verified by `tests/lint-rules.test.ts`). |
| 7 | ESLint rule banning forbidden motion libraries | `tools/eslint/no-forbidden-motion-libraries.js`. Positive (import `node:fs`) passes; negatives (`framer-motion`, `some-animation-kit`) both report violations (verified by `tests/lint-rules.test.ts`). |
| 8 | `.assert-serif-budget` as a Vitest test parsing built HTML | `tests/assert-serif-budget.test.ts`; walks `build/`, counts italic-serif class occurrences per DESIGN.md line 149 invariant (`total == 4` at full build; `0` at this step since no chapters shipped yet). |
| 9 | `npm run build && npm run test && npm run lint` all pass | Exit codes captured: `BUILD=0 TEST=0 LINT=0`. `npm run check` (wired into `lint`) also `EXIT=0`. |

---

## Commands executed (final run)

```
$ npm install                    # installs 349 packages, 0 forbidden
$ npm run build                  # → build/index.html + _app/; exit 0
$ npm run test                   # → 2 files, 10 tests, all passing; exit 0
$ npm run lint                   # eslint + stylelint + forbidden-libraries + svelte-check; exit 0
$ npm run check                  # svelte-check: 0 errors, 0 warnings; exit 0
```

Vitest summary (from the final run):
- `tests/assert-serif-budget.test.ts` — 5 tests passed.
- `tests/lint-rules.test.ts` — 5 tests passed.

Built static output:
- `build/index.html` (1,844 bytes) — contains `<h1 class="type-model title …"># five_deaths_of_norway.ipynb</h1>`. Zero italic-DM-Serif elements (no `type-voice14|32|48`), matching `currentExpectedTotal = 0`.
- `build/_app/immutable/assets/0.D6ZuUxj8.css` — contains all variables from `tokens.css` + utility classes from `typography.css`.

---

## Deferred items (and their governing DESIGN.md section)

Step 1's scope per the step-specific guidance is: "CSS variables, `no-raw-font-family` Stylelint rule, ESLint rule banning forbidden motion libraries, `.assert-serif-budget` Vitest test." The following lint rules appear in DESIGN.md but are explicitly scoped to later steps and are **not** required to be wired at Step 1; they are stubs in the intent of the config files and will be added by the step that first depends on them:

| Deferred rule | Deferred to step | Citation |
|---|---|---|
| `role-color-stroke-only` (Stylelint) | Step 3 (`<RoleColumn>`) or Step 8 (CH3 `<PiCellLine2Underline>` exception) | DESIGN.md line 209 + §Cross-cutting #5 acceptance |
| `no-keyframes` (Stylelint, 3-file allowlist) | Step 2 (CH2 heartbeat pulse file is the first permitted keyframe) | DESIGN.md line 325 |
| `no-css-animation-over-200ms` (ESLint) | Step 2 or later (first CH with a transition) | DESIGN.md line 324 |
| `palette-allowlist` (Stylelint) | Step 6 onward (first chapter-content step) | DESIGN.md line 909 |
| `no-input-range` (ESLint) | Step 7 or later (first `<CellEditScrub>`) | DESIGN.md line 318 |
| `no-storage-persistence` (ESLint) | Step 3 (`<RoleColumn>` store) | DESIGN.md line 916 |
| `no-large-cinematic-type` (Stylelint) | Step 10 (CH5, 48pt aphorism is the only legal use) | DESIGN.md line 917 |
| `no-serif-in-ch4` (ESLint) | Step 9 (CH4) | DESIGN.md line 914 |
| `forbidden-phrases` (Stylelint) | Step 6+ (content steps) | DESIGN.md line 918 |
| `MutationObserver` dev-mode inline-style check | Step 2 (first runtime component) | DESIGN.md line 326 |

The cross-chapter `.assert-serif-budget` target (`totalBudget: 4`, DESIGN.md line 149) is already codified in `tests/serif-budget.expected.json`; chapter-build steps bump `currentlyBuiltChapters` + `currentExpectedTotal` when they add their chapter's italic-serif line, and the final step (14, Visual regression baseline) is the one that sees `currentExpectedTotal` reach 4.

---

## Notes for the reviewer

1. **Family preservation.** The three font-family strings in `tokens.css` match DESIGN.md lines 118-120 character-for-character, including the fallback stack ordering (DM Serif Display → Georgia → serif; JetBrains Mono → ui-monospace → monospace).
2. **`--type-subcaption` is mono, `font-style: normal`.** DESIGN.md's reconciliation note (line 165) and counter-argument block (line 167) were specific: CH1's sub-caption is 7pt mono per BRAINSTORM CH1 wow #1. The `.type-subcaption` utility class in `typography.css` sets `font-style: normal` explicitly so no descendant rule can flip it to italic without a CSS override that `no-raw-font-family` would flag through other means.
3. **Italic-serif counting strategy.** The CI test counts by class name (`type-voice14|32|48`) rather than by `getComputedStyle` because adapter-static ships static HTML and the browser is not running at test time. The runtime `serifAudit.ts` provides the `getComputedStyle` path for the dev-mode overlay (step 2 onward will import it from a DEV-only `+layout.svelte` hook). Both counters target the same elements — any italic-serif role must be added to both `typography.css` and `ITALIC_SERIF_CLASSES`, and `tests/assert-serif-budget.test.ts` has a cross-check that fails if they drift.
4. **Q7 sanity check (DESIGN.md line 971).** The 14pt CH2 italic line is present as `--type-voice14` in both `tokens.css` and the `typography.css` utility class, and is counted as part of the site-wide budget (ch2 = 1, contributing to the total-4 invariant).
5. **Reduced-motion.** No transitions or keyframes exist at this step, so there is nothing to suppress under `prefers-reduced-motion`. The `no-keyframes` Stylelint rule is deferred to step 2, which is when the first permitted keyframe file ships.
