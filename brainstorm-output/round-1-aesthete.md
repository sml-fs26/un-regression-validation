## Round 1 · Divergence · Aesthete

### CH1 — The Bait

- ★ **Choropleth as Constellation**
  - **What:** The opener is a black-velvet world map where countries are not filled regions but single luminous dots, sized by population, color-graded blue→violet→amber by GDP per capita. As the user scrolls, faint silver lines connect the dots into a "constellation of nations." No borders, no labels — just light on indigo.
  - **Why it works:** It reframes "data" as "celestial body." The user inhales before they read a word. Every screenshot looks like an observatory plate.
  - **Risk / prerequisite:** Custom D3 projection + Canvas/WebGL for crisp dots; needs a hand-tuned color ramp (Viridis is too obvious — build a bespoke one).

- ★ **The Twin Bars That Refuse to Differ**
  - **What:** Two horizontal bars in DM Serif Display caps — `RULE OF LAW` and `McDONALD'S PER CAPITA` — animate from 0 to identical lengths in 1.4s with a custom cubic-bezier(.2,.8,.2,1). They land on the same tick. A hairline rule extends from each bar's tip and meets in the middle with a soft *tick* sound. Below, in mono: `r = 0.79   r = 0.78`.
  - **Why it works:** The visual *equality* is the joke. The serif caps make it feel like a verdict, not a chart.
  - **Risk / prerequisite:** Real correlation values must actually be near-equal in the dataset; needs WebAudio for the tick (gated behind a sound toggle).

- ★ **Pearson r as Tide Line**
  - **What:** Instead of a static bar chart for the top correlations, render r as the height of a horizontal "tide" sweeping left-to-right across each row. The tide is a single dark-cyan line with a sub-pixel shimmer; when it reaches its r-value it leaves a chalk mark on the gridline.
  - **Why it works:** Correlation becomes a *physical event*, not a number. The chalk mark is the screenshottable residue.
  - **Risk / prerequisite:** Needs requestAnimationFrame timeline orchestrator; chalk texture is an SVG filter.

### CH2 — The Crash

- ★ **The Hockey Stick as Earthquake Seismogram**
  - **What:** Test MSE plotted against feature count is rendered as an inked seismograph trace on cream paper (the only chapter that breaks the navy — we *invert* materiality to signal alarm). At p≈n, the needle goes vertical and tears through the paper; the tear reveals the navy beneath.
  - **Why it works:** A material rupture for a mathematical rupture. Memorable to the point of cliché-resistance.
  - **Risk / prerequisite:** SVG mask + a hand-drawn tear path; one-shot moment, must trigger on scroll-pin.

- ★ **The Coefficient Storm**
  - **What:** As feature count climbs past p=n, every coefficient β_j is a thin vertical pin on a horizontal axis. They start arranged like piano hammers; as p approaches n, they begin to *vibrate*, then explode outward to ±∞, leaving streaks like long-exposure rain.
  - **Why it works:** "Variance explodes" is abstract. A hundred pins flying off the axis is not.
  - **Risk / prerequisite:** GSAP timeline keyed to scroll progress; need a culled render at high p.

- ★ **Counter That Lies**
  - **What:** A massive DM Serif numeral in the top-right shows TRAIN R² climbing 0.71 → 0.94 → 0.99 → **1.00** as p grows. It pulses gold on landing. Beneath it in 10pt mono: `test_r2 = -3.4`. The contrast is the entire chapter.
  - **Why it works:** The headline number is the lie. The footnote is the truth. Hierarchy = pedagogy.
  - **Risk / prerequisite:** Number-tween component with custom easing; ensure mono caption never visually competes.

### CH3 — The Patch

- ★ **Alpha Slider as Tuning Fork**
  - **What:** The α slider is rendered as a brass tuning fork lying horizontally, struck at α=0 (it shimmers/over-vibrates), damped progressively as α increases (vibration calms to stillness at α→∞). The coefficient bars below "ring down" in sympathy.
  - **Why it works:** Regularization *is* damping. The instrument metaphor teaches the math without saying a word.
  - **Risk / prerequisite:** Requires custom SVG of the fork + a shader-y vibration filter; metaphor must hold for both Ridge and Lasso (it does — Lasso's fork has *teeth* that snap off as α grows).

- ★ **Lasso as Guillotine**
  - **What:** Coefficients are stacked vertically as nameplates. As α slides up, a horizontal blade (the L1 threshold) descends; nameplates whose |β| falls below the blade *drop off* the screen with a small puff of dust. The remaining 12 nameplates glow softly.
  - **Why it works:** Sparsity is selection. Selection is a cut. Visceral and unforgettable.
  - **Risk / prerequisite:** Need a roster of feature names that are individually legible; pace the drops so the user *feels* each loss.

- ★ **ElasticNet as Two Hands on the Same Rope**
  - **What:** A single rope spans the chart. One hand (green-tinted, labeled L2) pulls evenly along its length; the other (red-tinted, L1) pinches it at intervals. The shape of the rope *is* the coefficient profile; the L1/L2 mix slider rotates the hands.
  - **Why it works:** ElasticNet is famously the chapter where readers tune out. Hands on a rope make the trade-off tactile.
  - **Risk / prerequisite:** Custom illustration; risk of being twee — keep the hands schematic, not cartoonish.

### CH4 — The Reveal

- ★ **The Top-20 Catwalk**
  - **What:** Lasso and RF top-20 features walk down a vertical "runway" from top of viewport to bottom, each as a small typographic card (DM Serif name + mono importance bar). They pause at center stage for 200ms. The absurd feature (`McDonald's per capita`) wears a spotlight — a real radial gradient pinning it, with all other features dimmed to 30% opacity.
  - **Why it works:** Feature importances usually are a static bar chart no one screenshots. A *runway* makes it a moment.
  - **Risk / prerequisite:** Scroll-pinned timeline; needs careful labels to fit at body-size.

- ★ **The Side-by-Side Indictment**
  - **What:** Two columns — `LASSO SAYS` and `RANDOM FOREST SAYS` — set in DM Serif caps as if newspaper verdicts. Features common to both glow soft amber and animate to the centerline; features unique to one fade to red. The headline above resolves to: `THEY DISAGREE ON 14 OF 20.`
  - **Why it works:** The newspaper-verdict typography elevates "feature overlap" from technical curiosity to *scandal*.
  - **Risk / prerequisite:** Headline number must be computed from real data; keep the centerline reveal slow (1.8s).

- ★ **Spotlight on the Absurd**
  - **What:** When the user lingers on the McDonald's row, the entire page background dims by 40% with a vignette. A small footnote types itself in mono beneath: `# imported from World Bank Indicators, 2018`. The citation is real. The absurdity is sourced.
  - **Why it works:** Sourcing the joke is what separates *Pudding* from a meme. It commits.
  - **Risk / prerequisite:** Real citation must check out; typewriter effect needs a reduced-motion fallback.

### CH5 — The Trust

- ★ **Boxplots as Heartbeat**
  - **What:** Each repeated split is a thin vertical line that draws onto the canvas at 60ms intervals — like an ECG. After 100 splits, the box-and-whiskers *crystallize* out of the cloud of lines. The audio (optional): a soft *tic* per split, hushed to silence as the box solidifies.
  - **Why it works:** "Distribution from samples" is *the* concept, and most people see a static boxplot. Watching it accumulate is the lesson.
  - **Risk / prerequisite:** Pre-computed split results (don't compute live); WebAudio gated on user opt-in.

- ★ **K-Fold as Loom**
  - **What:** The dataset is a horizontal woven band. K=5 folds appear as five vertical shuttles that pass through the band, each highlighting a different stripe as "test." The train/test split is *literally* a textile pattern.
  - **Why it works:** K-fold is taught with rectangles. A loom makes it ritual.
  - **Risk / prerequisite:** SVG weave pattern; metaphor must survive being explained without becoming kitsch.

- ★ **Lessons Learned as Engraved Plate**
  - **What:** The closing five lessons are set in DM Serif Display, one per scroll-snap, on a dark navy plate with a thin gold rule above each. As each enters viewport, the gold rule draws left-to-right (1.2s, easeOutQuart) and the lesson fades up beneath. Final card: `— END OF ATLAS —` in mono small caps, centered.
  - **Why it works:** It treats the conclusions like *aphorisms*, not bullet points. Readers screenshot aphorisms.
  - **Risk / prerequisite:** Resist the temptation to add icons. Just type.

### X-CUT — Cross-cutting

- ★ **Signature Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` — "the Atlas curve"**
  - **What:** Every meaningful entrance and resolution across all 5 chapters uses this single easing. Confidence in deceleration. No bounces, no elastic, no spring overshoots anywhere.
  - **Why it works:** The site develops a *gait*. Users feel it before they name it.
  - **Risk / prerequisite:** Discipline. One designer must police it.

- ★ **Material: Pressed Indigo Paper + Gold Leaf**
  - **What:** Background is `#0a1830` with a sub-1%-opacity paper grain (subtle SVG noise filter). Hairlines, ticks, and "verdict" highlights are a single warm gold (`#d4a857`, never pure yellow). Charts feel *printed*, not rendered.
  - **Why it works:** Differentiates from every dark-mode SaaS dashboard on earth. Reads as "atlas," not "app."
  - **Risk / prerequisite:** Noise filter must be GPU-accelerated or pre-baked; gold must be used surgically (3–4 moments per chapter, max).

- ★ **Chapter Transitions as Page-Turns**
  - **What:** Between chapters, the current scene doesn't fade — it *folds*. A subtle CSS perspective rotation (3.5° tilt, 800ms) suggests the corner of a page lifting. The next chapter's title rises from below in DM Serif at 96pt, holds for 600ms before content begins.
  - **Why it works:** Reinforces the atlas metaphor at every seam. Users learn the rhythm and lean into it.
  - **Risk / prerequisite:** Must work on mobile (collapse to a vertical wipe); 96pt headline needs responsive scaling.

- ★ **The Recurring Country Dot**
  - **What:** One specific country dot — say, **Norway** — appears in every chapter as an in-text marker. Ch1 it's mid-pack on the McDonald's correlation. Ch2 it's the dot whose prediction explodes. Ch3 it's the dot Lasso *correctly* recovers. Ch5 it's the dot whose CI is widest. Same dot, same hue, different role each chapter.
  - **Why it works:** A character. The reader builds attachment. Data journalism's secret weapon.
  - **Risk / prerequisite:** Pick the country with the best narrative arc *across* the actual results, not for vibes.
