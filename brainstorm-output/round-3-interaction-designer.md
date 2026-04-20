## Round 3 · Cross-pollination · Interaction Designer

### CH1 — The Bait

- ★ **The Card Catalog With Three Handles** (amplifies Aesthete's Card Catalog Drawer + Info Designer's ECDF-by-role + my Correlation Library)
  - **What:** Aesthete's museum drawer, but with three brass pulls beneath labeled `r`, `role`, `alphabet`. Yank any pull and the 355 cards FLIP-animate into that order in 900ms. Under `r` the green and red cards interleave; under `role` they separate into three clean lanes (becoming a live ECDF-strip); under `alphabet` they scatter to nonsense. The reader's hand sorts 355 objects three ways and *feels* that role is the only axis along which they separate cleanly — but r doesn't care.
  - **Why it works:** Combines the Aesthete's archival materiality with Info Designer's ECDF revelation and answers Devil's Advocate's ban on the 355-bar chart. Sorting is the gesture; the insight is that no sort separates the liars from the truth-tellers along the r-axis.
  - **Risk / prerequisite:** Spine typography must stay legible at 355-card density; FLIP choreography across three orderings must stage nicely on touch.

- ★ **The PhD Wager → Suspect Board Pipeline** (amplifies Pedagogue's "Bet your PhD" + my Flashcards + kickstarts the X-cut Suspect Board)
  - **What:** Before any chart, one forced binary: two unlabeled scatters, swipe or click for "real predictor." Commit. Reveal. Whichever you picked wrong gets auto-pinned to the Suspect Board in the margin — your first pin is a feature you already disbelieved. By the third flashcard you have a visible roster of your own misjudgments, and a small counter reads `wrong: 3 of 3`.
  - **Why it works:** Pedagogue's commitment trick + persistent state = the reader's mistakes are the sitewide ledger. CH4's confession later indicts features *the reader themselves flagged*, not ones we handed down.
  - **Risk / prerequisite:** Swipe must be reversible (undo the commit); tone of the counter must be deadpan, not taunting.

### CH2 — The Crash

- ★ **The Coefficient Storm Is The Chapter** (amplifies Devil's Advocate's ESCALATE demand + Aesthete's pins/piano keys + my Feature Dial)
  - **What:** Open on a row of 100 hair-thin vertical pins at rest along a horizontal rail. One dial: `p`. As the reader drags, pins begin to tremble — amplitude is |β̂_j|. Past p≈0.7n, pins start tearing loose and streaking off-viewport, each leaving a vertical scar on the rail where it used to stand. The *accumulated scars* plot themselves into a negative-space curve that IS the test-R² hockey stick — but the curve is drawn as absence, not line. No axis, no R² label, until the reader stops dragging; then a single gold hairline rises with the label `this is overfitting`. The hockey stick has been replaced by its own evidence.
  - **Why it works:** Answers Devil's ESCALATE with force: the crash is debris, not a downward line. Preserves the Feature Dial gesture but removes the redundant chart below it — the dial's output *is* the rail, and the rail *is* the chart.
  - **Risk / prerequisite:** Coefficient explosion precomputed at every integer p; reduced-motion fallback shows three frames (p=50, p=n, p=350) as small multiples.

- ★ **Throw Norway Into the Test Set, Watch The Budget Collapse** (mashes Pedagogue's "Budget of Surprise" ledger + Info Designer's per-country prediction-interval scream + my "Throw a country into the model" + Aesthete's vellum ledger aesthetic)
  - **What:** Beside the storm, a vellum ledger: left column `INCOME: n = 254 rows`, right column `EXPENSES: p coefficients`. Both columns tick in real time as the reader drags `p`. When expenses exceed income, the right column begins to bleed (Aesthete's ink). The recurring country — Norway — has a dedicated row at the bottom showing its prediction ± PI band. As p crosses n, Norway's band explodes from ±$3K to ±$40T. User can *drag Norway's dot* from train to test and watch the ledger tip harder. A single sentence overlays the bleed: `the model ran out of countries to learn from.`
  - **Why it works:** Three framings of the same mechanism (budget, PI width, country identity) collapse into one scene. The reader sees the math, the prose, and the character all break together.
  - **Risk / prerequisite:** Requires closed-form OLS PI; Norway must remain visible on mobile (sticky row at bottom of ledger).

### CH3 — The Patch

- ★ **The Brass Scale With A 1-SE Detent** (amplifies Aesthete's Weighing Scale + Info Designer's CV-error band + my Sweet-Spot Magnet)
  - **What:** The beaux-arts brass scale is the α control. Grab the pivot beam and tip it. Behind the scale, the CV-error curve with its ±1SE band is faintly engraved on the back wall. The beam has TWO magnetic detents: a small one at α_min (visible as a hairline gold notch) and a bigger one at α_1SE (a *deeper* gold notch, surprising the user who expected one answer). The detents tell you by touch that "the right α" is a region, not a point. Overshooting either detent is allowed; the scale resists briefly, then yields.
  - **Why it works:** The "best α is a region" lesson is taught by the *haptic discovery that there are two magnets*. The Aesthete's metaphor carries the Info Designer's 1-SE rule as a physical feature.
  - **Risk / prerequisite:** Detent resistance must be subtle (maybe 150ms transition curve slowdown in a ±2px zone); brass illustration stays austere.

- ★ **Volume Knob Overlaid With a Ghost Station** (mashes Pedagogue's Volume Knob + Info Designer's "shuffled Y ghost curve" + my Entry-Order Racetrack)
  - **What:** The α knob tunes a real station (coefficient paths) AND a ghost station (same sweep on permuted GDP, shown in 30%-opacity dashed strokes right alongside). As the reader rotates the knob from noise → music → silence, the real station crystallizes into the 20 Lasso entries while the ghost station *also* produces 20 entries — but different ones, jittery, never the same twice. A tiny inset at the dial center reads: `features Lasso kept here — on real data: 20; on noise: 22.` The music/noise metaphor has been made quantitative: the station exists, the ghost exists too, and the knob is always picking a blend.
  - **Why it works:** The volume knob already earns the sweet-spot lesson; the ghost overlay preempts the CH4 betrayal by showing *now* that sparsity selects from noise too. CH4 becomes inevitable instead of shocking.
  - **Risk / prerequisite:** Ghost must be unambiguously distinct (dashed + lower opacity + explicit label); permutation precomputes required.

### CH4 — The Reveal

- ★ **The Cross-Examined Confession** (amplifies Devil's Advocate AMPLIFY from R1 + Pedagogue's Coefficient Confession + Aesthete's typewriter staging + my Confession Booth)
  - **What:** Black viewport. Mono cursor. Lasso types its own verdict line by line — `+0.27 × McDonald's_per_million`, `+0.19 × name_numerology_score`, `+0.14 × Eurovision_finals_appearances`. Each line has a small `[OBJECT]` affordance. Click it and the line *strikes itself through*, the coefficient drops to zero live, and the predicted-vs-actual scatter (inset, upper right, small) re-fits before your eyes. The model pauses, then confesses another substitute line in its place — "replacing that term with +0.21 × Scrabble_score." The reader learns by objection that **the model doesn't need truth, it needs any 20 numbers**. Every strikethrough gets auto-added to the Suspect Board.
  - **Why it works:** Devil's scar demand + Pedagogue's courtroom + live ablation = the only scene in the whole site where the reader's agency and the model's perversity are in direct dialogue. You can't out-object it.
  - **Risk / prerequisite:** Fast re-fits (precomputed LOO-coefficient table keyed by struck-out subsets for up to ~8 strikeouts); reduced-motion shows the whole transcript at once with static objection markers.

- ★ **The Stability Heatmap As A Double-Take** (mashes Info Designer's selection-stability heatmap + my "Defend It / Demolish It" + Pedagogue's "Lineup Reversed" callback)
  - **What:** Immediately after the confession, a single heatmap: rows = features the reader just objected to, columns = 200 bootstrap Lasso refits, cell = selected in that fit. McDonald's is a *solid* red stripe. Beer-to-Wine is a solid red stripe. The reader who hoped the confession was a fluke now sees the model pick the same absurd features 180 / 200 times. Above the heatmap, the CH1 flashcard pairs reappear in miniature with a verdict: `you picked A; Lasso picked B in 94% of universes.` Your intuition was right; the model's was consistently wrong.
  - **Why it works:** Solves the charitable-reading escape hatch ("maybe once") and weaponizes the CH1 commitment into a vindication, per Pedagogue. The reader's trust in their own gut is rebuilt at the moment the model's credibility is torched.
  - **Risk / prerequisite:** Bootstrap Lasso precomputes (200 fits); heatmap must sort rows by selection frequency so stripes are legible.

### CH5 — The Trust

- ★ **Dissolve The Headline** (amplifies Devil's Advocate KILL demand + my Split Wheel + Aesthete's Ghost Splits + Pedagogue's Parallel Universes)
  - **What:** The scene opens with ONE giant gold number — `test R² = 0.52` — centered, DM Serif 120pt, the hero stat from CH3. A single button: `re-split`. Press it once: the number jitters, a ghost 0.47 leaves a faint trail, the 0.52 numeral visibly quivers. Hold-to-repeat: the numeral *dissolves into a cloud of 200 ghost-numerals* floating in formation, the mean stabilizing as `0.34 ± 0.11`. The headline that was presented as a fact has become a distribution the reader watched disintegrate. The boxplot never appears — or appears only as a small mono footnote after the dissolution finishes.
  - **Why it works:** Devil's KILL demanded dissolution, not annotation. The *identity* of the hero number is destroyed on camera. Not "here's a boxplot with the headline marked" — the headline IS the boxplot, liquefied.
  - **Risk / prerequisite:** 200 precomputed splits; reduced-motion shows start state, midpoint, end state as three frames; the final sentence `the number you read was one draw` must be the only prose.

- ★ **The Rose Window You Paint** (mashes Aesthete's Rose Window + my Fold Painter + Info Designer's per-country error heatmap)
  - **What:** Gothic rose window with 10 empty petals. Reader paints countries into petals with a brush — two strokes per country (one color, one petal assignment). Clicking PLAY rotates the glow around the petals fold-by-fold; each rotation stamps an R² into the medallion center. A badly-painted window (e.g., all Sub-Saharan countries in one petal) produces wild variance visible as a *wobbling* medallion numeral. Hit "randomize" and the petals auto-fill; the medallion steadies. The reader has physically demonstrated why random folding matters, via a sacred geometry that respected them enough not to patronize.
  - **Why it works:** Preserves the Aesthete's liturgical image, surfaces the Info Designer's per-country error structure via bad paintings, and keeps the gesture honest — the reader is the foldmaker, and bad folds are *their* making.
  - **Risk / prerequisite:** Paint UX must work on touch; randomize must be one tap; rose window stays gothic-austere, no stained-glass fantasy.

### X-CUT — Cross-cutting

- ★ **Suspect Board ↔ Marginalia Track ↔ Scorecard: one unified ledger** (mashes my Suspect Board + Aesthete's Marginalia Track + Pedagogue's Scorecard of Wrong Guesses)
  - **What:** The right-margin strip has three lanes, top-to-bottom: (1) **Marginalia** — the 5 numeric facts Aesthete specified, typeset one per chapter; (2) **Suspects** — thumbnail pins for features the reader flagged or struck out; (3) **Scorecard** — the reader's prediction outcomes. All three lanes are the *same object* rendered at 60px wide, 9pt mono, ink-of-the-chapter. Tap any pin or any score to jump back to the scene where it originated. By the final screen, the three lanes are the reader's personal argument history — screenshotable as one column.
  - **Why it works:** Three separate memory devices were already proposed by three personas; collapsing them into one marginal column is both architecturally cleaner and narratively richer — the reader's receipts, the site's self-annotation, and the quantitative facts all build in parallel.
  - **Risk / prerequisite:** Mobile must collapse to a pull-tab drawer; the column must never compete with chart space (max 10% of viewport width on desktop).

- ★ **The Dial Audit: two gestures survive, the rest are glyphs** (responds to Devil's Advocate ESCALATE about nine sliders)
  - **What:** Formal proposal — the site has exactly TWO live interactive controls: the **Feature Dial in CH2** (the storm) and the **α Scale in CH3** (the brass beam). Every other "slider" in prior rounds demotes to a *scrubbable glyph* tied to scroll progress — no separate handle, the reader's scroll position is the control. The CH1 catalog sorts once per scroll-section, not on demand. The CH5 dissolve is a button, not a slider. The Confession objections in CH4 are clicks, not drags. Two dials, two moments of true "what-if," everywhere else is choreographed.
  - **Why it works:** Devil's Advocate is right — nine knobs means no argument. Concentrating agency at two places makes the CH2 dial feel like causing the crash and the CH3 scale feel like earning the fix. The rest of the site commits to *showing*, and those two moments commit to *letting you break it*.
  - **Risk / prerequisite:** Requires the whole committee to hold the line; the temptation to add "one more slider" per chapter must be refused in code review.
