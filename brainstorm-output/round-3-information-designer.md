## Round 3 · Cross-pollination · Information Designer

### CH1 — The Bait

- ★ **Commit-then-ECDF (mashup: Pedagogue's "bet your PhD" + my ECDF overlay + my permutation null-band)**
  - **What:** Open with two unlabeled scatters — reader picks which is "real." On reveal, both scatters dissolve into single ticks on a shared |r| axis, then 353 more ticks fly in to join them as three ECDF curves (causal/spurious/incidental), with a gray null-band from permuted GDP shaded behind. Reader's pick lands as a labeled tick inside the band or outside it.
  - **Why it works:** Commitment (Pedagogue) anchors the emotional shock; the ECDF (me) generalizes the shock from two features to 355 features in one frame; the null-band (me) tells them how many of those 355 ticks live inside pure noise. Three pedagogical beats, one figure.
  - **Risk / prerequisite:** The reader's pick-tick must persist across the transition (object constancy); permutations precomputed; the null-band's upper bound must not obscure the curves crossing it.

- ★ **Radial Catalog (mashup: Aesthete's Card Catalog Drawer + my Feature Dendrogram)**
  - **What:** The catalog drawer opens and cards fan into a radial dendrogram — each card's tab becomes a leaf on the rim, clustered by 1−|corr|. Role-color lives on the tab edge only (per Aesthete's stroke rule). Pulling a tab slides that card *and its siblings in the same clade* out of the rim, revealing a clade-level scatter underneath.
  - **Why it works:** The drawer is the hook; the dendrogram is the argument. Correlation clusters (red + green mixed in the same clade) become tactile — you pull one card and five incriminating neighbors come with it.
  - **Risk / prerequisite:** Prune to top ~120 features by |r| or the rim blurs; radial clustering must be computed once and cached; typographic tabs at 72 leaves/half-circle is fiddly on mobile.

### CH2 — The Crash

- ★ **Pins with an Eigenvalue Cause (amplify: Devil's Advocate's storm-replaces-hockey-stick + my eigenvalue sparkline)**
  - **What:** Aesthete's pins are not arranged alphabetically — they're sorted by the eigenvectors of XᵀX. The pin tied to the smallest eigenvalue tears loose *first*. A tiny sparkline in the margin tracks log λ_min as p grows; when the sparkline crosses a threshold, the corresponding pin detaches. Debris accumulates; R² emerges as negative space among the scars.
  - **Why it works:** Devil's Advocate was right that the hockey stick is cliché — but the storm needs a cause or it's just aesthetics. The eigenvalue is the cause. Pins tear loose in the exact order the math demands: you see the singular matrix collapsing.
  - **Risk / prerequisite:** The eigenvalue sparkline must stay a marginal element — if it becomes the star, we're back to charts. The detach order must be numerically real, not choreographed.

- ★ **The Bleeding Ledger of Four Countries (mashup: Aesthete's ledger-that-bleeds + my per-country prediction-interval scream)**
  - **What:** The ledger page has four columns — Burundi, Vietnam, Poland, Norway (the X-cut anchor countries). Left-pane `FITTED` numbers stay crisp; right-pane `HELD OUT` numbers begin as tight digits and bleed into 95% prediction-interval bands as p grows. Burundi's ink floods the column first; Norway holds longest, then also bleeds. The bleed-width *is* the interval.
  - **Why it works:** The ink-bleed from Aesthete is gorgeous but abstract; tying it to four named countries makes it a story about whose predictions drown first. Prediction intervals widen at different rates across the GDP spectrum, and the page literally shows that unevenness.
  - **Risk / prerequisite:** Interval widths must be honestly scaled to the column — no aesthetic cheating where Burundi bleeds "prettier." Reduced-motion fallback shows the end state with interval hairlines.

### CH3 — The Patch

- ★ **The Brass Scale with a 1-SE Bracket (mashup: Aesthete's weighing scale + my CV-error band with λ_1SE)**
  - **What:** The brass scale tips as the reader moves α. A thin gold bracket — not a point — marks the "balanced" region: the 1-SE band around λ_min. Inside the bracket, the beam hovers level. The reader discovers that *many* α values are equivalent within sampling noise. A tiny inset curve beneath the scale shows CV R² ± SE, with the bracket drawn below matching the bracket on the beam.
  - **Why it works:** The single-point "optimal α" is a lie that regularization demos always tell. The bracket makes honest that the answer is a region, not a number — and the brass instrument earns its weight by showing calibrated imprecision instead of false precision.
  - **Risk / prerequisite:** Fold-wise R² must be computed; the 1-SE rule needs a brief footnote; bracket must not feel like "pick anywhere, nothing matters."

- ★ **Erosion on Shuffled Data (mashup: Aesthete's erosion profile + my shuffled-Y ghost curve)**
  - **What:** Aesthete's cliff-face of strata is drawn twice: once in solid indigo (real data), once in 30% dashed gray behind it (shuffled-Y). Same erosion force (α sweep). The gray ghost landscape erodes almost identically — same number of strata survive at the same α thresholds. Spurious strata in the real cliff *outlast* the noise ghost by almost nothing.
  - **Why it works:** "Lasso selected 21 features" sounds like wisdom. "Lasso selects 18 features on pure noise at the same α" strips the wisdom bare. The erosion metaphor survives intact; the ghost is the calibration.
  - **Risk / prerequisite:** Ghost must be visually subordinate (dashed, gray, never in front); single shuffle is misleading — use median of 50 shuffles.

### CH4 — The Reveal

- ★ **The Confession, with Receipts (mashup: Aesthete's typewriter confession + my Confession Equation typography + my selection-stability heatmap)**
  - **What:** Each confession line types itself: `I weighted McDonald's at +0.27.` As each line lands, a single horizontal strip of 200 bootstrap dots writes itself beneath the line — dense, red, unbroken: *the model confessed this same sin in 194/200 resamples*. Confessions accumulate top-to-bottom; stability strips stack below them. After five, the full top-12 resolves into the Confession Equation with term type-size scaled by |β̂|, term color by role, and each term underscored by its own stability strip.
  - **Why it works:** A one-time confession is a joke; a *stable* confession is an indictment. The stability strip refutes the charitable reading "maybe this was a fluke" in the exact instant the confession happens. Typography + heatmap + theatre, fused.
  - **Risk / prerequisite:** 200 bootstrap Lasso fits must be precomputed; the strip must be thin enough not to overpower the text. Reduced-motion fallback: full confession + strips rendered statically.

- ★ **The Dueling PDPs (mashup: Aesthete's Dueling Ledgers + my partial-dependence superposition)**
  - **What:** The two vellum sheets (`LASSO` / `RANDOM FOREST`) list top-20 features as before, but each row carries a tiny embedded sparkline showing the feature's partial-dependence curve *from that model*. Lasso's sparklines are all straight lines; RF's are curves. Matching features are joined by gold thread — but the thread color shifts to red where the sparkline shapes disagree geometrically. The 6 surviving threads are now further sorted into "agree in rank *and* shape" (gold) vs "agree in rank, disagree in shape" (amber).
  - **Why it works:** Ranking agreement is shallow; geometric agreement is deep. The sparkline pair in each row shows *how* the two models use the feature differently. Lasso's linear extrapolation next to RF's saturating curve is the one image that teaches why linear coefficients cannot be "importance."
  - **Risk / prerequisite:** 40 sparklines on a page is dense — cap height at 14px and use shared x-scale (percentile, not raw); the three-color thread grammar must be introduced cleanly.

### CH5 — The Trust

- ★ **The Dissolution (answers Devil's Advocate's challenge + mashup: my nested-CV ridgelines + Aesthete's ghost splits)**
  - **What:** The chapter opens with Chapter 2's headline number — `R² = 0.87` — rendered in 200pt DM Serif, centered, gold. It holds for two seconds. Then 199 ghost dots rain in around it — one per split. The giant number begins to **crumble**: each pixel of the numeral is recruited by the nearest ghost dot and pulls toward it. After 3 seconds, there is no headline number — only a cloud of 200 dots, one of which is slightly larger and labeled *the number we reported*. Beneath the cloud, a ridgeline silhouette crystallizes showing the single-split distribution (top) vs the nested-CV distribution (bottom), honestly shifted.
  - **Why it works:** Devil's Advocate is right: a boxplot is invisible. But *dissolution* is not in any stats textbook — the headline number literally disintegrates into the sampling distribution that always surrounded it. The ridgeline silhouette afterwards is the honest inventory: here's what a single split says, here's what nested CV says, here's the gap.
  - **Risk / prerequisite:** Crumble animation is expensive — precompute pixel trajectories to nearest target dot; the nested-CV ridgeline must be real (honest compute, not faked); reduced-motion fallback shows the final cloud + ridgeline statically with a caption.

- ★ **Norway's Row (mashup: Pedagogue's recurring Norway + my per-country error heatmap + Interaction Designer's Fold Painter)**
  - **What:** The per-country error heatmap (254 rows × 200 splits) has one row highlighted — Norway's — with a thin gold rule above and below. Norway's row is a volatile stripe: some splits predict Norway to within 3%, others miss by an order of magnitude. On the same page, a miniature world map lets the reader *paint* a k-fold assignment. Paint "Norway alone in its fold" → Norway's row in the heatmap rewrites to show that fold's error at 10× the size of any split.
  - **Why it works:** The heatmap tells the aggregate truth ("some countries are always hard"); Norway's row tells the character-driven truth ("our friend is one of them"); the fold painter makes it a direct manipulation. Three lenses on the same fact, braided through the X-cut motif.
  - **Risk / prerequisite:** Norway must actually be a high-variance country in the data — if not, pick the country that performs the arc; painting requires fast re-fit or a small precomputed grid of fold assignments.

### X-CUT — Cross-cutting

- ★ **Uncertainty as a Hairline (mashup: my error-bars-mandatory rule + my null shadow toggle + Aesthete's single-hairline grammar)**
  - **What:** One unified visual grammar for uncertainty across the whole site: every error bar, every confidence band, every permutation-null overlay is rendered as a **1px gold hairline** (or dashed gray for null). No thick whiskers, no semi-transparent fills, no colored bands. If it's uncertain, it's a hairline. If it's null, it's a dashed hairline. The hairline is already the site's punctuation mark; now it also carries the site's statistical conscience.
  - **Why it works:** Three separate rules (mandatory error bars, null shadows, single hairline) collapse into one visual primitive. Users learn a single stroke type and by Ch3 they read it as "this number has noise" without being told. A vocabulary of one.
  - **Risk / prerequisite:** Hairlines at 1px risk invisibility on some displays — may need 1.5px at smaller sizes. Dashed gray for null must be distinct from the gold hairline for uncertainty; color-blind check required.

- ★ **The Marginalia Carries Its Own Whiskers (mashup: Aesthete's marginalia track + my error-bars-mandatory rule)**
  - **What:** The running right-margin marginalia that accumulates chapter-by-chapter (Ch1: 37 features r > 0.6. Ch2: R² = −3.4. etc.) never reports a bare number. Every line carries a bootstrap bracket or bound: `Ch1: 37 features r > 0.6 [95%: 31–44]`, `Ch4: 6/20 features agree across models [bootstrap: 4–9]`, `Ch5: R² across splits 0.41 ± 0.18`. The marginalia is the site's summary — making it hairline-bracketed makes uncertainty part of the summary, not a footnote.
  - **Why it works:** The final takeaway of the site shouldn't be a list of point estimates. By Ch5, the reader has watched numbers earn their brackets in real time. The marginalia is the proof that the lesson of uncertainty was structural, not rhetorical.
  - **Risk / prerequisite:** Brackets at 9pt mono are tight — may need to abbreviate (`±` instead of `[95%:]`); the brackets must be real bootstrap outputs, not hand-picked ranges.
