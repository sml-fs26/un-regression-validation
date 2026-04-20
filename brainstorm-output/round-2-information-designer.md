## Round 2 · Divergence · Information Designer

### CH1 — The Bait

- ★ **The ECDF Overlay of |r| by Role**
  - **What:** One axis: |r| from 0 to 1. Three empirical CDFs drawn on the same axes — causal (green), spurious (red), incidental (gray). Direct-label each curve where it exits the top.
  - **Why it works:** The shock isn't any one bar — it's that the red and green curves are nearly identical through r ∈ [0.5, 0.85]. An ECDF compresses 355 points into a shape the eye reads in under a second, and the overlap *is* the argument.
  - **Risk / prerequisite:** Needs clean role labels; three curves with tight visual weights or the red/green twin hides the gray.

- ★ **The Permutation Null-Band**
  - **What:** Behind every observed |r| distribution, shade the 95% envelope of |r| under shuffled GDP (1000 permutations). Observed correlations that fall inside the band are *indistinguishable from noise*. Annotate the count: "N features inside the noise band: 186 / 355."
  - **Why it works:** Most scrollytelling treats correlation as "a number." Shading the null rewrites it as "signal vs chance," which is the only honest grounding. The band is the teacher.
  - **Risk / prerequisite:** Must precompute permutations; band must be drawn behind, never in front.

- ★ **The Feature Dendrogram, leaves colored by role**
  - **What:** A radial (circular) hierarchical clustering of the 355 features using 1−|corr| as distance. Leaves on the rim, colored by role. The reader's eye expects causal features to form a green clade; they don't. Green leaves are sprinkled across red-dominated clades.
  - **Why it works:** Non-Cartesian. The *topology* of the feature space is the insight — causality doesn't cluster the way correlation does. Breaks the axis grammar Devil's Advocate called out and adds a chart type viewers rarely screenshot.
  - **Risk / prerequisite:** 355 leaves is tight — prune to top 120 by |r| or the rim becomes a blur; commit to a leaf-label strategy (short codes + tooltip) or none at all.

- ★ **Horizon chart: 355 feature-correlation bands**
  - **What:** One row per feature, 355 rows, horizon-chart encoding of signed r across bootstrapped resamples. Sorted by mean |r|, colored by role (green/red/gray bands). The whole chart is 800×600 and shows every feature's correlation stability at once.
  - **Why it works:** Horizon charts compress a large set of series into a dense, comparable strip. The answer to "355 bars is a receipt" isn't fewer bars — it's a chart form that actually rewards density.
  - **Risk / prerequisite:** Horizon charts have a learning curve; needs a 3-second explainer inset the first time one appears on the site.

### CH2 — The Crash

- ★ **Eigenvalue sparkline strip, one per p**
  - **What:** A small horizontal strip of mini-sparklines — each sparkline is the log-eigenvalue spectrum of XᵀX at a given p. As p→n, the smallest eigenvalue dives toward −∞ on the log axis. Annotate: "this is why coefficients explode."
  - **Why it works:** Names the *mechanism* instead of the symptom. Most scrollytellers show R² falling; almost no one shows the matrix getting singular underneath it. It's the "why."
  - **Risk / prerequisite:** Log-eigenvalue axis must be honestly labeled; the sparkline strip needs enough horizontal room to not become decorative.

- ★ **Bias² + Variance as stacked area**
  - **What:** Single chart, x = p, y = expected test MSE decomposed into bias² (bottom, shrinking) and variance (top, exploding). The classic textbook decomposition drawn *on this dataset*, not in the abstract.
  - **Why it works:** Turns the hockey stick into its constituent parts. Viewers see that overfitting is specifically a variance problem — bias is already near zero well before the crash.
  - **Risk / prerequisite:** Requires honest bias/variance estimation via repeated splits; if bias² looks noisy, the chart suggests the opposite of the lesson.

- ★ **The prediction-interval scream, per country**
  - **What:** Pick 4 anchor countries. For each, plot point-prediction of log-GDP (y) vs p (x), with a 95% prediction-interval band. The points stay near truth; the bands widen until they span the entire GDP range. Four small multiples, shared y-axis.
  - **Why it works:** Per-country uncertainty is visceral. "The model still predicts Norway correctly" looks fine as a point — looks terrifying as a band that spans Burundi to Luxembourg.
  - **Risk / prerequisite:** Prediction intervals must be honest (bootstrap or closed-form for OLS); same 4 anchor countries as the X-cut motif.

### CH3 — The Patch

- ★ **CV-error band with λ_min and λ_1SE**
  - **What:** y = test R² (or −MSE), x = log α, with a ±1 SE envelope from k-fold. Two marks: λ_min (maximum) and λ_1SE (the simplest model within one SE). Direct-label both.
  - **Why it works:** The "best α" is a point; the *honest* best α is a region. Showing the error band kills the fiction of a single correct tuning and introduces the 1-SE rule for free.
  - **Risk / prerequisite:** Must actually compute fold-wise R² and not just mean; the band is the pedagogy, omit it and the chart lies.

- ★ **Effective degrees-of-freedom, Ridge vs Lasso, same axes**
  - **What:** One chart. y = effective df (trace of the hat matrix for Ridge; count of non-zeros for Lasso). x = log α. Two lines, direct-labeled.
  - **Why it works:** "Regularization reduces complexity" is usually hand-waved. A df curve makes it measurable and comparable across methods — and reveals that Ridge never gets to df = 0 while Lasso does.
  - **Risk / prerequisite:** Requires a single consistent df definition per method; a footnote on the formula is non-negotiable.

- ★ **The "shuffled Y" ghost curve**
  - **What:** Re-run the entire α sweep on permuted GDP (pure noise). Overlay the ghost curves on the real coefficient-count plot. On noise, Lasso *still selects features* at small α. The ghost curve shows how many.
  - **Why it works:** Sparsity looks like wisdom. Overlay noise and sparsity on nothing looks nearly identical — a brutal calibration for "few coefficients = meaningful coefficients."
  - **Risk / prerequisite:** Need one clear ghost style (dashed gray) that never competes with the live curve; annotate explicitly.

### CH4 — The Reveal

- ★ **The Confession Equation (typography as chart)**
  - **What:** The fitted Lasso model, written as prose-math in large DM Serif — each term color-coded by role, each coefficient's type-size proportional to |β̂|. Red terms dominate the visual weight; green terms are hairline. "log GDP = **0.31·McDonalds_per_cap** + **0.27·beer_wine_ratio** + … + 0.04·rule_of_law."
  - **Why it works:** Answers Devil's Advocate's "confession" demand with pure information design — type size is a visual channel we rarely use for coefficient magnitude, and it makes the model's priorities legible at one glance. The equation *is* the indictment.
  - **Risk / prerequisite:** Needs a custom typesetting pass; must cap at ~12 terms or the line-break hurts; mobile requires a vertical stacked variant.

- ★ **Selection-stability heatmap**
  - **What:** Rows = top-40 features (sorted by selection frequency). Columns = 200 bootstrap resamples. Cell filled if Lasso selected that feature in that resample. Role color modulates the fill.
  - **Why it works:** Refutes the charitable reading "maybe the absurd features are one-off flukes." They aren't — McDonald's and beer-to-wine form solid horizontal red stripes. The model picks them *consistently*, which is worse than picking them once.
  - **Risk / prerequisite:** 200 bootstrap Lasso fits must be precomputed; rows need a clear sort key.

- ★ **Partial-dependence superposition**
  - **What:** For each top feature, one small panel: x = feature value, y = predicted log-GDP. Lasso's PDP is a straight line (it has to be); RF's PDP is the nonlinear truth. Plot both on the same axes.
  - **Why it works:** Lasso and RF disagree *geometrically*, not just in rank. Viewers see the shape mismatch — Lasso extrapolates linearly where the real relationship saturates. It's the clearest single argument against treating a linear coefficient as "importance."
  - **Risk / prerequisite:** Consistent x-scale (feature percentile, not raw value, if the feature has a heavy tail).

### CH5 — The Trust

- ★ **Per-country error heatmap across splits**
  - **What:** Rows = 254 countries, sorted by GDP. Columns = 200 random splits. Cell color = prediction error when that country was in the test fold (diverging palette). Blank cell = country was in training that split.
  - **Why it works:** Horizontal stripes emerge — some countries are *always* hard (consistent errors regardless of split), some are always easy. That's a per-observation story CV averages over. The chart teaches that test R² is an aggregate hiding structure.
  - **Risk / prerequisite:** Diverging palette must be centered on zero; stripe discovery requires enough splits that every country appears in test ~60 times.

- ★ **Bootstrap CI whiskers on importance rankings**
  - **What:** Top-20 features from the final model, but each with a horizontal whisker spanning its 95% bootstrap-CI on importance. Features whose whiskers cross zero are flagged: "indistinguishable from noise."
  - **Why it works:** Rankings without uncertainty are lies. Showing the whisker reveals that ranks #6 through #14 are all statistical ties — the *ordering* is noise. A brutal addendum to Chapter 4's reveal.
  - **Risk / prerequisite:** Needs a consistent importance metric with a bootstrap distribution; must not hide whiskers behind the bar.

- ★ **Nested-CV vs single-split twin ridgelines**
  - **What:** Two ridgeline distributions of test R² stacked: "single split, repeated" (top) and "nested CV honest estimate" (bottom). The top ridge is optimistically shifted right; the bottom tells the truth. Annotate the gap in R² points.
  - **Why it works:** The number most papers report (the top) is biased upward by the number most papers don't report (the bottom). Putting them on shared axes makes the systematic optimism a measurable distance.
  - **Risk / prerequisite:** Requires nested CV to actually be run on the dataset — a real compute cost, but the point of the chapter.

### X-CUT — Cross-cutting

- ★ **The "null shadow" toggle — site-wide**
  - **What:** Every chart that depicts a signal gets a persistent toggle labeled "show noise." Flipped on, a ghost version of the chart appears overlaid — the same analysis run on permuted GDP. Permutation-null becomes a first-class citizen of the whole site.
  - **Why it works:** One unified mechanism for teaching "what would this look like under chance?" No hand-waving per chapter. Every figure carries its own statistical conscience.
  - **Risk / prerequisite:** Requires permutation precomputes for each chart; ghost styling must be rigidly consistent (dashed gray, 40% opacity, always behind).

- ★ **Error bars are mandatory, everywhere**
  - **What:** A site-wide rule: no point estimate — no bar height, no line position, no ranking — appears without its associated uncertainty. Bootstrap, fold variance, or confidence band, depending on the quantity. If it can't be quantified, it gets a ghost-style "±?" marker.
  - **Why it works:** Most pitfalls in this site's subject matter come from treating point estimates as truths. Making uncertainty a visual rule teaches the reader's eye to *expect* whiskers — and notice when they're missing in the wild.
  - **Risk / prerequisite:** Discipline across the whole authoring process; one uncovered chart breaks the grammar.
