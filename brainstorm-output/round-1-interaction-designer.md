## Round 1 · Divergence · Interaction Designer

### CH1 — The Bait
- ★ **The Honest Bar Race**
  - **What:** Pearson-r bars start sorted by "what you'd guess matters" (rule of law, education, healthcare). On scroll-in, bars physically slide to re-sort by actual correlation — and McDonald's per capita *glides past* rule of law with a soft click.
  - **Why it works:** The user feels the indignity of the ranking change rather than reading about it; the animation is the argument.
  - **Risk / prerequisite:** Need stable re-sort choreography (FLIP animation) and a short "aha" pause after McDonald's passes.

- ★ **Dual-Lens Choropleth**
  - **What:** Map with two stacked hemispheres you drag a vertical seam across — left half colored by GDP, right half colored by McDonald's density. Drag the seam left/right to sweep the reveal across the globe.
  - **Why it works:** The user discovers by hand that the two maps are nearly the same picture; correlation becomes visceral, not statistical.
  - **Risk / prerequisite:** Requires two pre-rendered choropleths with matched color quantiles; seam must be buttery on touch.

- ★ **"Pick Your Culprit" Scatter**
  - **What:** Click any bar in the correlation ranking → the scatter plot underneath morphs (feature axis animates to that variable, r value counts up, regression line rotates into place). Country dots keep their identity across transitions.
  - **Why it works:** Linked views make the abstract r number snap to a geometric shape; users learn that "strong correlation" has a *look*.
  - **Risk / prerequisite:** Must preserve country-dot identity across re-layouts (object constancy) or the insight evaporates.

- ★ **Guess-Then-Reveal Slider**
  - **What:** Before the bars appear, user drags a slider labeled "How strong is McDonald's ↔ GDP?" from r=0 to r=1. On release, the true value lights up on the slider track with a thin ghost line of their guess left behind.
  - **Why it works:** Prediction-before-reveal burns the surprise into memory; the ghost mark shames the prior belief just enough.
  - **Risk / prerequisite:** Only works once per session; needs a skip-affordance for returning visitors.

### CH2 — The Crash
- ★ **The Feature Dial (Hockey Stick as Gesture)**
  - **What:** A single big dial labeled "features used (p)" from 1 → 400. Dragging it sweeps a moving vertical line across the R² curves AND simultaneously animates the actual-vs-predicted scatter on the right. Near p=n, the dial develops a *haptic resistance* (CSS transition easing slows) as the test-R² cliff approaches.
  - **Why it works:** The user's own hand produces the catastrophe; the physical resistance near the cliff encodes the danger before they read a word.
  - **Risk / prerequisite:** Need pre-computed R² at every integer p; resistance must be subtle, not annoying.

- ★ **Two-Pane Diverge**
  - **What:** Two actual-vs-predicted scatters side-by-side sharing the dial above. Left is train, right is test. As p grows, left pane tightens to a razor-thin line on y=x; right pane *explodes* into a starburst around p=n. Country dots are the same entities in both panes.
  - **Why it works:** Overfitting is the geometric divergence between the two panes — a single visual gestalt replaces 500 words of explanation.
  - **Risk / prerequisite:** Scatter must preserve country identity and axis range; otherwise the starburst just looks like noise.

- ★ **Drag-the-Cliff**
  - **What:** User can grab the *cliff edge* of the test-R² curve and pull it horizontally — this changes n (sample size) via subsetting — and watches the cliff slide with their finger. "p=n" stays locked under their thumb.
  - **Why it works:** Teaches that the disaster is about the ratio p/n, not some mystical number; the cliff is a property of the data, not the algorithm.
  - **Risk / prerequisite:** Requires precomputed R² for multiple n values (bake a grid); drag target must be discoverable.

### CH3 — The Patch
- ★ **Three-Up α Sweep**
  - **What:** One shared α slider (log scale) drives three mini-panels: Ridge, Lasso, ElasticNet. Each shows its coefficient skyline in real time — Ridge shrinks uniformly, Lasso chops features to zero with a little "snap" animation, ElasticNet does both.
  - **Why it works:** The user sees the *character* of each regularizer by watching them respond differently to the same input.
  - **Risk / prerequisite:** Coefficient paths must be precomputed densely enough that slider feels continuous.

- ★ **Kill-a-Feature Game**
  - **What:** Beside the Lasso skyline, user can click any coefficient bar to force it to zero manually. A live test-R² gauge updates. Challenge: "Can you beat Lasso at α=0.1 by hand?"
  - **Why it works:** Turns regularization from a formula into a game the user loses — teaching humility about human feature selection.
  - **Risk / prerequisite:** Need snappy recompute (either precomputed knockout combos or fast client-side OLS on small p).

- ★ **The Sweet-Spot Magnet**
  - **What:** The α slider has a soft magnetic detent at CV-optimal α. Drag past it and the slider pulls you back; a tiny gold halo marks the spot only after you've first over- and under-shot.
  - **Why it works:** Users *physically feel* that there's a right answer and that it's neither zero nor infinity.
  - **Risk / prerequisite:** Magnet must be overridable; otherwise it feels like a rigged slider.

### CH4 — The Reveal
- ★ **The Importance Ladder Reveal**
  - **What:** Lasso top-20 and RF top-20 appear as two ladders side-by-side. Feature names are cards. User hovers a card → a thin line draws across to the same feature's rank in the other model (or fades if absent). Absurd features (numerology, Scrabble) glow red the first time they're hovered.
  - **Why it works:** The cross-model agreement/disagreement becomes a literal visible thread; the absurdity lights up on contact.
  - **Risk / prerequisite:** Needs clean feature-name normalization across both models.

- ★ **The "Defend It" Button**
  - **What:** Under each absurd top-20 feature, a small button: "Defend this predictor." Click → a mock op-ed headline appears ("Why Scrabble Scores Drive Economic Growth — An Explainer"). User laughs, then the headline fades to show the actual r-value and the causal graph: nothing.
  - **Why it works:** Weaponizes the plausibility-engine of human storytelling against the user, then disarms it.
  - **Risk / prerequisite:** Needs 6–8 genuinely funny but not cruel mock headlines; tone calibration matters.

- ★ **Spotlight Sweep**
  - **What:** As the user scrolls, a spotlight slides down the top-20 list, pausing on each absurd feature for 2 seconds with its scatter popping into a side panel (country dots + regression line). Scrolling controls the spotlight position — scroll up to revisit.
  - **Why it works:** Auto-play that respects user agency; each absurd feature gets its own moment without requiring a click.
  - **Risk / prerequisite:** Scroll-linked animation must be reversible and not hijack the page.

### CH5 — The Trust
- ★ **Shuffle the Deck**
  - **What:** A big "Re-split" button that, on press, visibly shuffles country cards into train/test piles and drops a new R² dot into the boxplot. Hold-to-repeat makes 50 dots rain down in a few seconds, boxplot whiskers growing live.
  - **Why it works:** Variance becomes a physical accumulation; the user sees that "one R²" is a single draw from a distribution.
  - **Risk / prerequisite:** Precomputed or fast-enough splits; shuffle animation must not feel gratuitous.

- ★ **K-Fold Carousel**
  - **What:** K country cards arranged in a ring. One slot is highlighted as "test fold." User drags the ring to rotate — each rotation computes and stamps a fold-R² on a running strip chart. After one full rotation, the mean R² appears in the center.
  - **Why it works:** Abstract "k-fold CV" becomes a hand-cranked mechanism; the user literally rotates through folds.
  - **Risk / prerequisite:** Rotation must snap cleanly to k positions; works best for k=5 or k=10.

- ★ **Lessons as Flippable Cards**
  - **What:** Each Lessons Learned card is a 3D flip — front shows the lesson title + one-line claim, back shows the evidence scene in miniature (re-rendered live, same data, smaller). Hover/tap to flip; keyboard arrows to navigate.
  - **Why it works:** Review is *re-encounter*, not reread; the user's hand re-touches every prior insight.
  - **Risk / prerequisite:** Mini-scenes must be cheap to render (SVG snapshots, not full re-computes).

### X-CUT — Cross-cutting
- ★ **Persistent Country Identity**
  - **What:** Every country is a dot with a consistent color (GDP spectrum) and position-memory across chapters. Hovering "Switzerland" in Ch1 highlights Switzerland in Ch2's scatter, Ch4's residual plot, and Ch5's fold membership.
  - **Why it works:** Turns the dataset into a cast of characters; users form narrative attachment to specific countries and track their fate through the methodology.
  - **Risk / prerequisite:** Requires a global highlight bus and stable country → color mapping; adds wiring complexity but pays off every chapter.

- ★ **The Scrubber of Regret**
  - **What:** A thin persistent timeline at the top records every slider position, every click, every feature-knockout. User can scrub backward to any prior state; the whole page rewinds.
  - **Why it works:** Reversibility is trust; users explore harder when they know nothing is permanent.
  - **Risk / prerequisite:** State management is non-trivial; scope to per-chapter scrubber if global is too much.
