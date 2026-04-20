## Round 2 · Divergence · Aesthete

### CH1 — The Bait

- ★ **The Card Catalog Drawer**
  - **What:** No bars. The opener is a wooden card-catalog drawer rendered in cream and indigo — 356 index cards stacked edge-on, each with a feature name typeset in DM Serif small caps. The drawer slides open on scroll; cards fan up like a Rolodex. The reader drags the cursor across and any card lifts slightly, revealing its r on a tiny mono tab. Green cards (causal) and red cards (spurious) are physically indistinguishable from the edge — that's the lesson.
  - **Why it works:** Replaces the tired 355-bar chart with a **library drawer of suspects**. Tactile, archival, and the epistemic anxiety is built into the material: you have to *pull a card* to know what it is.
  - **Risk / prerequisite:** Custom SVG card illustration + a physics-lite fan animation; the drawer metaphor must not become twee — render it austere, like a museum accession drawer, not a kid's toy.

- ★ **The r-Value as Sentence Set in Caslon**
  - **What:** Before any chart, one full-viewport typographic slide: `McDonald's restaurants per million predicts national wealth as well as rule of law.` Set in 72pt DM Serif, justified left, with `r = 0.78` and `r = 0.79` in 14pt mono beneath, each number on its own line. Hold for a full second before the scroll continues.
  - **Why it works:** Typography as argument. The reader reads a sentence they can't unhear before they see a single pixel of data. Screenshot-ready as a pull quote.
  - **Risk / prerequisite:** Requires restraint — no background texture, no illustration, no animation beyond the text fading up character-by-character at 18ms/char.

- ★ **The Shelf of Almost-Identical Silhouettes**
  - **What:** Six scatterplots of GDP against its top-r "friends" — but rendered as **silhouettes only** (filled regions, no axes, no points), stacked horizontally like books on a shelf. All six silhouettes are the same shape: a diagonal blob from low-left to high-right. Caption: `These six features are not interchangeable. They look it.`
  - **Why it works:** Six identical blobs is the argument. The reader's eye wants to find the difference; the design denies them one.
  - **Risk / prerequisite:** Silhouette rendering via convex hull or KDE contour; must resist the urge to add axes "for clarity."

### CH2 — The Crash

- ★ **The Ledger Page That Bleeds Ink**
  - **What:** Chapter 2 is rendered as a single vellum accounting page — warm off-white, faint ruled lines, a serif column head reading `FITTED VALUES` and `PREDICTED — HELD OUT`. As the feature counter climbs in a margin, the left column's numbers settle into neat rows; the right column's numbers begin to *bleed* — ink spreading outward, digits becoming smears, then rivers of black that flow down the page. At p=n the right column is a black waterfall.
  - **Why it works:** Accounting ledgers are the grammar of *mistakes you cannot undo*. The bleed is a one-way material event — same direction as overfitting's irreversibility. No other chapter uses this page; it becomes unique.
  - **Risk / prerequisite:** SVG mask + filter choreography; the ink-bleed must be one-shot, not looped. Needs a prefers-reduced-motion static fallback showing the final bled state.

- ★ **Mourning Rule Above the Cliff**
  - **What:** When the test-R² line crosses below zero for the first time, a thin gold hairline draws itself across the full viewport at the zero mark, and above it, in 12pt DM Serif italic, the phrase `below this line, the model is worse than guessing the mean` types itself out left-to-right. The line stays for the rest of the chapter.
  - **Why it works:** Turns a technical threshold into a visible threshold. The hairline becomes the chapter's horizon — the reader reads everything after in reference to it.
  - **Risk / prerequisite:** Typewriter cadence must match the Atlas easing; the sentence lowercases `the mean` without italics for emphasis — small typographic move, large memorability.

- ★ **The Piano Keys That Detune**
  - **What:** Coefficients as a row of vertical piano keys along the bottom of the scene, ebony and ivory. As p grows, the keys start to tilt individually, like a piano being rained on. Past p=n, keys break loose from the keyboard entirely and drift upward off-screen like ash. The chord that was "the model" is no longer playable.
  - **Why it works:** Coefficient instability as *instrumental failure* — the machine that played wealth-prediction literally comes apart. Subtler and more literary than a seismograph tear.
  - **Risk / prerequisite:** SVG key illustration + individual key drift animation; resist sound here — silence is the right answer.

### CH3 — The Patch

- ★ **The Brass Weighing Scale**
  - **What:** Center-stage is a beaux-arts brass scale on an indigo ground. Left pan holds a pile of gold coins labeled `fit`; right pan holds a pile of black iron labeled `penalty`. The α slider is the pivot beam — drag to tip the balance. Coefficient bars along the base shrink or vanish in sympathy with the tilt.
  - **Why it works:** Bias-variance as *weights on a scale* is the oldest and best metaphor we've never actually drawn. Brass and iron make it feel like a 19th-century instrument of judgment.
  - **Risk / prerequisite:** Custom SVG illustration (brass rendering matters — bad brass ruins it); must resist adding steam or filigree. The scale should look *exact*, like a laboratory balance.

- ★ **The Lasso Path as Erosion Profile**
  - **What:** The coefficient path is rendered not as lines but as a geological cross-section — a cliff face where each feature is a stratum of rock. As α increases (left to right), the softer strata (spurious features) erode away first, leaving the hard strata (causal) standing. Label the surviving layers in DM Serif small caps along the remaining rock.
  - **Why it works:** The spaghetti-lines problem in coefficient paths is solved by making the paths *geology*. Erosion is a directional, patient force — same as regularization.
  - **Risk / prerequisite:** Requires a custom shader or pre-baked SVG of the strata; risks looking like a generic stock illustration — must be rendered in the same indigo-and-gold palette, not earthy browns.

- ★ **Three α-Sweep Panels as Triptych**
  - **What:** Ridge, Lasso, ElasticNet as a formal triptych — three arched panels in a single hanging frame, each with its coefficient field. A single slider *beneath* the frame controls all three. The panels share a hairline gold border; caption in 14pt serif italic: `three hands, one patient.`
  - **Why it works:** Triptych is an altar-form — religious visual grammar elevates a technical comparison to a meditation. The shared slider is the physical argument that these are variations, not alternatives.
  - **Risk / prerequisite:** Arched panel SVG + discipline to not overdecorate the frame; on mobile the triptych must stack vertically without losing the "one frame" feeling.

### CH4 — The Reveal

- ★ **The Confession**
  - **What:** Full-viewport black. A single cursor blinks in mono 14pt at screen center. Then, one line at a time, Lasso *confesses* its coefficients: `I weighted McDonald's restaurants at +0.27.` (1.4s hold) `I weighted name-letter numerology at +0.19.` (1.4s) `I weighted Eurovision finals appearances at +0.14.` (1.4s). Each line is preceded by a soft gold tick; each number fades in last, pulses once. After the fifth confession, the viewport fills with the full top-20 as a dense mono paragraph, and a single serif sentence below reads: `this is what the model believed.`
  - **Why it works:** Devil's Advocate was right — the feature-importance chart is an autopsy waiting to happen. The model speaks in first person; the reader cannot un-hear it. This is the scar.
  - **Risk / prerequisite:** Typewriter pacing is everything — too fast and it's a meme, too slow and it's a lecture. Target 180ms/line, 1.4s between. No illustrations. No charts. Just text, cursor, and tick. Requires reduced-motion static fallback that shows the whole confession at once.

- ★ **The Dueling Ledgers**
  - **What:** Two tall sheets of vellum hang side by side — `LASSO` and `RANDOM FOREST` hand-lettered across the tops. Each sheet lists its top-20 features in DM Serif small caps, one per line, with the importance weight in mono at the right margin. Features that appear on both sheets are joined by a thin gold thread stretched between them. Only 6 threads. The rest dangle, unconnected.
  - **Why it works:** The *sparseness of the threads* is the indictment. You can count the agreement in a single glance. The vellum material reinforces Chapter 2's ledger — two pages from the same book, the second contradicting the first.
  - **Risk / prerequisite:** Thread rendering must be subtle; 6 gold threads across dark navy should read as a constellation, not a spiderweb.

- ★ **The Museum Label**
  - **What:** When the reader hovers any of Lasso's absurd picks, a small engraved brass museum label appears beside the feature: feature name in DM Serif caps, source citation in 9pt mono (`World Bank Indicators, 2018; McKinsey Global Institute, 2021`), and one italic line: `The model considered this a pillar of national wealth.` The label is sourced, real, and unforgiving.
  - **Why it works:** Museum labels grant *seriousness* to absurd objects. The citation is the twist of the knife — this isn't a joke, this is what the data actually said.
  - **Risk / prerequisite:** All citations must be real. No fake attributions. The brass material (a subtle bevel gradient, no shine) must be consistent with the scale in CH3.

### CH5 — The Trust

- ★ **The Rose Window of Folds**
  - **What:** K-fold CV rendered as a gothic rose window — K=10 petals radiating from a central medallion labeled `all countries`. Each petal is a fold; the highlighted petal (the current test set) glows gold while the others dim. Rotate through K positions. At the center, the mean R² crystallizes as a gilded numeral after all folds have rotated through.
  - **Why it works:** Devil's Advocate demanded one non-Cartesian chapter. Rose windows are **rotational, sacred, and exactly as patient as cross-validation**. The metaphor teaches: every petal is equally valid; no petal is the answer; the whole window is the answer.
  - **Risk / prerequisite:** Custom SVG rose window (architectural reference, not fantasy-novel) + rotation choreography; must avoid decoration creep. Gothic, not frilly.

- ★ **The Ghost Splits**
  - **What:** As the repeated-split boxplot accumulates, each of the 200 splits leaves behind a ghost — a faint 5%-opacity R² dot. After all 200, the box-and-whiskers crystallizes from the fog of ghosts in a single gold stroke. Tap the box: the ghosts re-appear, one at a time, at 40ms intervals, replaying the variance. Each ghost that passes lights up a single country dot in a mini-world-map in the margin — showing which countries happened to be in its test set.
  - **Why it works:** Variance as *accumulated haunting*. Every one of the 200 splits is a separate ghost story; the box is the exorcism that summarizes them. Keeps country-identity threaded through the final chapter.
  - **Risk / prerequisite:** 200 ghosts rendered via canvas, not SVG; mini-map must be tiny enough not to steal focus. Audio optional — a single low hush as the box crystallizes.

- ★ **The Aphorism Plates**
  - **What:** Five closing lessons rendered as engraved brass plates, one per scroll-snap, mounted on indigo paper. Each plate reveals with: (1) the plate rising from below at `cubic-bezier(0.2, 0.8, 0.2, 1)`, (2) a gold hairline drawing left-to-right above it, (3) the lesson typing itself in 48pt DM Serif italic. Final plate is unengraved — blank brass — with the caption: `the next lesson is yours.`
  - **Why it works:** Brass engraving is the visual grammar of *permanence and humility* together. The blank final plate is the mic drop — the reader is conscripted into the conclusion.
  - **Risk / prerequisite:** Restraint. No icons. No bullet points. The lessons themselves must each be tweet-sized and written as aphorisms, not summaries.

### X-CUT — Cross-cutting

- ★ **The Single Hairline as Structural Grammar**
  - **What:** Every meaningful divider across all five chapters is a **1px gold hairline** — no weight variation, no gradient, no shadow. Section breaks, chart axes, callout underlines, lesson plate tops. The hairline is the site's punctuation mark. It appears on every screen, always drawing left-to-right at 1.2s using the Atlas curve.
  - **Why it works:** A single repeated visual element becomes a *signature*. Users learn the hairline like they learn a cadence; it becomes the site's heartbeat.
  - **Risk / prerequisite:** Strict discipline — no dashed lines, no double rules, no variations. If a designer reaches for a thicker line, they must justify it in code review.

- ★ **The Marginalia Track**
  - **What:** A thin persistent column on the right edge of every chapter — 60px wide, 9pt mono, ink-color-of-the-chapter — that carries the reader's *running memory*: "Ch1: 37 features correlate with r > 0.6. Ch2: at p=356, test R² = -3.4. Ch3: Lasso kept 21. Ch4: 6 of 21 agree with RF. Ch5: R² varies ±0.18 across splits." Each new chapter adds one line; prior lines dim but remain. By Ch5 the marginalia is the whole argument in 5 numeric lines.
  - **Why it works:** Marginalia is how readers *annotate* books — the site annotates itself on behalf of the reader. By the end, the reader has a typeset summary they've watched being written.
  - **Risk / prerequisite:** Must not interfere with chart space; on mobile collapses to a drawer. Tone of the lines must be factual, not editorial.

- ★ **The Tick That Closes Each Chapter**
  - **What:** At the end of every chapter, a single brass tick (the same soft WebAudio cue, if enabled) accompanies the gold hairline drawing across the viewport and the chapter number incrementing in the top corner: `I.` → `II.` → `III.` The roman numerals are set in DM Serif with a thin rule beneath. This is the only consistent audio cue in the entire site.
  - **Why it works:** One gesture, five repetitions, becomes a ritual. Readers learn to expect the tick and feel the chapter close when they hear it. Restraint is the design.
  - **Risk / prerequisite:** WebAudio must be gated behind a site-level sound toggle; the tick is sub-100ms, never jarring. Reduced-motion users get the visual hairline only.

- ★ **The Role Color Is Always a Stroke, Never a Fill**
  - **What:** Causal-green, spurious-red, incidental-gray — across every chapter, these colors appear *only* as outlines, hairlines, or thin strokes. Fills are always the indigo-and-cream palette. This means a causal country-dot is a green-outlined circle on cream; a spurious coefficient bar is a red-outlined rectangle on indigo. The role-color is a *label*, not a *weight*.
  - **Why it works:** Most dashboards use fill-color to signal role, which makes saturated charts exhausting. Outlines treat role-color as typography — structural, not ornamental. Charts stay calm even when dense.
  - **Risk / prerequisite:** Needs stroke-width ≥1.5px at display sizes to stay legible; color-blind safe check required; one exception may be needed for the signature "verdict" gold moments.
