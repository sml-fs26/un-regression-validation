## Round 1 · Divergence · Information Designer

### CH1 — The Bait

- ★ **The Pearson Strip: role-sorted, not magnitude-sorted**
  - **What:** Horizontal strip plot of all 355 |r| values as tick marks on a single axis, stacked in three lanes (causal / spurious / incidental). No bars, no sorting by magnitude — just density along the correlation axis.
  - **Why it works:** The shock isn't "McDonald's is high" — it's "red ticks are **indistinguishable** from green ticks in the 0.6–0.8 band." Lanes make the overlap pre-attentive; position does all the work.
  - **Risk / prerequisite:** Needs tick-mark jitter or a thin beeswarm to avoid overplot at the high end.

- ★ **Choropleth → Feature swap**
  - **What:** Opener is a world choropleth of GDP. On scroll, the same geometry re-colors to McDonald's per capita, then rule of law, then beer consumption — **same map, same scale position, four encodings in sequence**.
  - **Why it works:** Holding geometry constant while swapping the encoded variable makes the viewer feel how interchangeable these "predictors" look to a naive regression.
  - **Risk / prerequisite:** All four must be quantile-binned on the same color ramp or the comparison cheats.

- ★ **Scatter-matrix of the Top-6 "r" Offenders**
  - **What:** 6×6 sparkline-scatter grid, each cell is GDP vs feature, dot color by role. Annotate only the diagonal with |r| in large type.
  - **Why it works:** Forces the viewer to see the *shape* of the correlation, not just its number. Red and green shapes look nearly identical — that's the point.
  - **Risk / prerequisite:** Keep axes uniform (log GDP) across all 36 cells or small multiples lose their power.

### CH2 — The Crash

- ★ **The Hockey Stick, with twin trails**
  - **What:** Single chart, x = p/n ratio (not raw p), y = R². Two lines: train (rises smooth to 1.0), test (climbs, peaks, then **falls off a cliff past p/n ≈ 0.7**). Direct-label both lines at their right endpoints; annotate the crash point with a short sentence, not a legend.
  - **Why it works:** p/n on the x-axis makes this generalizable beyond this dataset — the viewer internalizes a *ratio*, not a raw count.
  - **Risk / prerequisite:** Must show the pre-crash sweet spot clearly; the peak of test R² is the pedagogical anchor.

- ★ **Residual rug, not residual scatter**
  - **What:** Instead of two actual-vs-predicted scatters side by side, show **two rug plots of residuals** stacked: train rug is a thin line (all zero), test rug explodes into a wide smear. Same x-axis.
  - **Why it works:** Collapses the "perfect train, garbage test" story into one vertical glance; the data-ink ratio is ruthless.
  - **Risk / prerequisite:** Need a shared residual scale that doesn't clip the test tails — or the lie becomes ours.

- ★ **Coefficient fireworks**
  - **What:** As p grows, plot the distribution of |β̂| coefficients as a ridgeline (one ridge per p value). The ridges stay tame, then suddenly the tails blow out by 3 orders of magnitude.
  - **Why it works:** Shows *why* the crash happens — not just that test R² falls, but that the model is hallucinating enormous coefficients to fit noise.
  - **Risk / prerequisite:** Log-|β| axis must be labeled honestly with a "log scale" flag.

### CH3 — The Patch

- ★ **The Path Plot, not the sweep**
  - **What:** The classic Lasso coefficient path: x = log α (decreasing), y = coefficient value, one line per feature, colored by role (causal/spurious/incidental). As α decreases, features enter the model one by one.
  - **Why it works:** You watch the *order of entry*. Causal features should enter first; if spurious (McDonald's) sneaks in before rule-of-law, that's the teachable moment right there on the chart.
  - **Risk / prerequisite:** With 355 lines it's a spaghetti disaster — must fade non-entering features to near-transparent and label only the first 10 to enter.

- ★ **Ridge vs Lasso, shared axes, stacked**
  - **What:** Two stacked small multiples: top is Ridge coefficient path, bottom is Lasso. Same x (log α), same y (coefficient). The visual contrast — Ridge shrinks smoothly, Lasso zeros out — becomes a single image.
  - **Why it works:** Juxtaposition teaches the L1/L2 difference without a single equation.
  - **Risk / prerequisite:** Need identical y-scales or the comparison is rigged.

### CH4 — The Reveal

- ★ **The Slope Graph of Rankings**
  - **What:** Two columns — Lasso top-20 on the left, Random Forest top-20 on the right. Lines connect the same feature across the two. Causal features' lines are green and mostly horizontal. Spurious ones zigzag wildly or appear in only one column.
  - **Why it works:** Tufte's slope graph weaponized for feature importance: the *crossings* are the story. "McDonald's is #4 for Lasso and #97 for RF" becomes a visible diagonal.
  - **Risk / prerequisite:** Must handle the "only in one model" case gracefully — dangling line to a "not ranked" gutter.

- ★ **Spotlight cards with embedded sparkline**
  - **What:** For each absurd feature (numerology, scrabble, McDonald's), a small card: feature name, its GDP scatter as a 60px sparkline, the r value, and a one-line caption. Four cards in a row.
  - **Why it works:** The sparkline is the receipt — you can't dismiss the correlation without seeing it.
  - **Risk / prerequisite:** Captions must not editorialize; let the scatter speak.

### CH5 — The Trust

- ★ **The Boxplot, honestly drawn**
  - **What:** Test R² distribution across N=200 random splits, shown as a **strip plot with a boxplot overlay** — every split is a dot, the box summarizes. Annotate the single "lucky" split that gave the headline R² from Chapter 2.
  - **Why it works:** One dot labeled "the number we reported" inside a wide cloud makes the case for repeated splits without a word of narration.
  - **Risk / prerequisite:** Must show the full spread including the bad splits; no trimming.

- ★ **K-fold as a gantt-style strip**
  - **What:** K horizontal bars, each split into train (gray) and test (accent) blocks at different positions. Below each, the fold's test R². The animation sweeps the test block across, fold by fold.
  - **Why it works:** Makes the mechanics of k-fold visible as a *partition*, not a black box. The per-fold R² variance is right there under each bar.
  - **Risk / prerequisite:** Resist adding a pie chart of "average" — keep the per-fold values as the primary signal.

### X-CUT — Cross-cutting

- ★ **A persistent role-legend-in-the-margin**
  - **What:** Instead of legends per chart, a thin always-visible strip at the top of the page: green square "causal," red "spurious," gray "incidental" — a persistent key that every chart inherits.
  - **Why it works:** Removes legend tax from every single chart. The color grammar becomes part of the site's identity.
  - **Risk / prerequisite:** Only works if the palette is rigidly consistent across all five chapters — no green meaning "good" in Ch5 and "causal" in Ch1.

- ★ **The "same 4 countries" thread**
  - **What:** Pick 4 anchor countries spanning the GDP spectrum (e.g., Burundi, Vietnam, Poland, Norway). Every scatter, every ridge, every boxplot highlights these same 4 dots in their spectrum colors.
  - **Why it works:** Gives the viewer recurring landmarks across 5 chapters — they learn to find Norway, and suddenly the high-dim story has characters.
  - **Risk / prerequisite:** The 4 must be chosen once and never changed; inconsistency kills the device.
