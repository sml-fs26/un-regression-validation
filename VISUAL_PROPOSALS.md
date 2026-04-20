# Visual proposals for un-regression-validation

## What vae_sunrises does well

- **Medium enacts message.** An 8-stop background gradient scrubbed by scroll (`#0B0E1A -> #FFF8F0`, DESIGN.md sec 6) turns the page from night to dawn.
- **Act structure + sticky side-by-side.** Five `<section data-act>` blocks; GSAP ScrollTrigger pins a canvas column while prose scrolls (`.sticky-container`, index.html ~1133-1197).
- **Depth-layered disclosure.** Nested `<details data-depth="intuitive|technical|deep">` with lazy KaTeX (index.html ~1059-1077). A fixed `#depth-toggle` flips the whole document.
- **Semantic color pairs as tokens.** `--encoder-primary` (cool) vs `--decoder-primary` (warm) used consistently for borders, result cards, particle targets (DESIGN.md sec 6).
- **The decoder IS the visualization.** Hover-to-decode at 30fps; no static diagrams.
- **One wow moment per act.** First Pixel bloom, grid-to-scatter FLIP, encoder particle storm, smooth morph (DESIGN.md sec 9).

## Proposals for this site

### 1. Scroll-driven "confidence crash" gradient on ch02
**What:** Bind `<body>` background to a scroll-scrubbed gradient that goes calm navy at `p=1`, alarm-red near `p=n`, black past it. One GSAP ScrollTrigger + `d3.interpolateRgbBasis`.
**Where:** `modules/02_crash.html`.
**Why:** vae_sunrises uses the gradient to enact the sunrise; here the gradient enacts the p=n cliff. The reader feels the catastrophe before the chart confirms it.
**Effort:** S. **Data:** existing `ch02_sweep.json` scroll position.

### 2. Sticky country-card atlas in ch01
**What:** Sticky right-column canvas (vae's `.sticky-container`). Hovering a point shows ISO-3, flag glyph, log(GDP), the feature value, and a sparkline across the 10 top-correlated features. Clicking pins up to 3 countries (the 4-pin mechanic, sec 3.2).
**Where:** ch01 scatter explorer, extendable to ch04.
**Why:** Countries are the atoms here but dots are anonymous. Pinning mirrors vae's pick-2-and-interpolate and gives an object to carry across chapters.
**Effort:** M. **Data:** country, ISO, `gdp_per_capita_usd`, 10 highest-|r| features precomputed to `ch01_countrycard.json`.

### 3. Role-stratified beeswarm instead of ranked bars
**What:** Three horizontal beeswarms (one per role) on the same |r| axis, dot color = role token (`--role-causal`, `--role-spurious`, `--role-incidental` already in style.css). Vertical line at the best spurious |r|.
**Where:** ch01 `top-correlations` widget.
**Why:** A ranked bar list hides the thesis; stacked swarms make "spurious outranks half of causal" visible at a glance. Uses the repo's semantic-color convention the way vae_sunrises uses encoder/decoder colors.
**Effort:** S. **Data:** `codebook.csv` + precomputed |r| per feature.

### 4. Lasso feature storm between ch03 and ch04
**What:** Port vae's encoder particle animation (P0.9, ~200 Canvas2D particles, fire-once on IntersectionObserver). As `alpha` sweeps up, 493 particles drift: those Lasso zeros fall and fade; survivors converge into a "kept" bin. Particle color = role.
**Where:** transition between ch03 alpha slider and ch04 top-20.
**Why:** Lasso selection is usually a before/after table; this makes selection visible, and role-color surfaces spurious survivors. Direct analogue of vae's image-shatters moment (sec 9 item 4).
**Effort:** M. **Data:** per-alpha coefficients precomputed to `ch03_lasso_trajectory.json`.

### 5. Resampling ribbon replacing the ch05 box plot
**What:** Draw 100 thin horizontal lines (one per split) at their R² value, opacity 0.15, stacked. Scrub control replays them left-to-right; current split flashes white; a running mean + 2sigma band grows. The seed-42 line stays highlighted in `--accent-gold`.
**Where:** ch05 resampling widget.
**Why:** The pedagogy is "one number came from one draw". A static violin shows spread; a scrub-through-draws ribbon shows contingency. Borrows vae's scroll-scrubbed grid-to-scatter (sec 3.3).
**Effort:** S. **Data:** existing `ch05_cv_distribution.json`.

### 6. Depth toggle for math across all chapters
**What:** Copy vae_sunrises' fixed `#depth-toggle` (top-left, three states). Wrap existing math (ch03 loss functions, ch05 CV math) in nested `<details data-depth>` exactly as in vae index.html 1059-1077. Toggle flips every `<details>` via one `body.show-all-math` class.
**Where:** cross-cutting.
**Why:** The site currently mixes informal hooks with MathJax display equations in ch03 with no way to defer. One toggle respects both the narrative and the formal reader.
**Effort:** S. **Data:** none.

### 7. Role-coded coefficient constellation on ch04
**What:** Scatter where x = Lasso |coef|, y = RF importance, color = role, size = |corr with GDP|. Diagonal marks agreement; brushing links to the ch03 path plot.
**Where:** ch04, replacing the two parallel top-20 lists.
**Why:** The chapter asks the reader to diff two ranked lists. A scatter makes disagreement geometric; a spurious-red dot in the top-right is the chapter's punchline.
**Effort:** M. **Data:** `ch04_importances.json` + RF importances aligned by feature index + `codebook.csv`.

### 8. Journey souvenir at the end of ch05
**What:** vae ends with a "ghost sunrise" (P1.10). Here: a card summarising the session — countries hovered, pinned, seconds spent at p>n — plus a replay showing the last-seen OLS prediction for a random held-out country with actual-vs-predicted. `localStorage`, try/catch wrapped.
**Where:** ch05 outro.
**Why:** A shareable closer that personalises 254 countries. The vae version made latent space memorable by returning the user's last decode; the equivalent here returns their worst prediction.
**Effort:** S. **Data:** `localStorage` only.
