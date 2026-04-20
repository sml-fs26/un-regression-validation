## Round 2 · Divergence · Interaction Designer

### CH1 — The Bait

- ★ **The Correlation Library**
  - **What:** 355 features rendered as book spines on a tall shelf, height = |r|, color = role. Pull a spine off the shelf → it opens into a double-page spread: left page the scatter, right page the feature's description and source. Drag spines to sort: by r, by alphabet, by role. McDonald's and rule-of-law stand shoulder to shoulder, same height.
  - **Why it works:** Direct manipulation of the whole 355-volume library replaces the 355-bar chart — users *browse* instead of scan, and discover the lookalikes by touch.
  - **Risk / prerequisite:** Must handle touch-drag sorting with FLIP; needs consistent spine typography to read as a library, not a stadium.

- ★ **The Guessing Pipette**
  - **What:** A draggable eyedropper floats over the choropleth. Pick a country (suck it up), then drop it onto any feature bar below to see "what that feature would predict for this country" as a little pin relative to truth. Drop 5 countries onto "McDonald's" — the pins cluster tight. Drop them on "education" — same. Drop them on "numerology" — *also* tight.
  - **Why it works:** Lets the user manually stress-test correlation with countries they care about; the clustering is the revelation.
  - **Risk / prerequisite:** Pipette metaphor must be legible at first sight; precompute per-country predictions for a few candidate features.

- ★ **Double-Blind A/B Flashcards**
  - **What:** Two feature scatters appear unlabeled, countries in spectrum color. Swipe left for "real predictor," right for "nonsense." Reveal score: *you got 4/12.* Wrong answers are saved to a pocket that becomes CH4's villain roster.
  - **Why it works:** Forced binary choice exposes the viewer's inability to distinguish spurious from causal by eyeball — and quietly seeds CH4.
  - **Risk / prerequisite:** Need ~12 well-matched pairs; must respect reduced-motion and not feel like Tinder-for-statistics unless intended.

### CH2 — The Crash

- ★ **The Breadcrumb Trail of p**
  - **What:** As the user drags the features-dial, a breadcrumb dot is dropped on the R² curve at every position they stop. Release, drag again — their trail builds up, showing the exact region they lingered in. A "record of regret" overlay highlights breadcrumbs that landed past p≈n.
  - **Why it works:** Rewards exploration with memory; the breadcrumbs west of the cliff become visible evidence of the user's own overconfidence.
  - **Risk / prerequisite:** Trail must be clearable; shouldn't clutter the main curve.

- ★ **Throw a Country into the Model**
  - **What:** Pick any country dot and physically drag it from the "train" pile to the "test" pile. The test-R² needle twitches. Drag ten countries over and watch predictions for *those specific* countries jitter wildly as p grows. Puts names on the error.
  - **Why it works:** Lets the user feel sample-size effects via the cost of every country they move; "Norway just made the cliff worse" is a lesson.
  - **Risk / prerequisite:** Needs on-the-fly re-fit at small p or a precomputed grid over hold-out subsets.

- ★ **The Twin-Panel Freeze**
  - **What:** Two actual-vs-predicted scatters with a central "freeze" button. At any p, the user hits freeze and the current scatters pin in a gallery strip below. Stack freezes at p=20, p=80, p=200, p=350 — get a four-panel gallery of the collapse, side by side, shareable.
  - **Why it works:** Turns transient animation into a persistent comparison the user built themselves; they curate the argument.
  - **Risk / prerequisite:** Gallery strip needs clear "clear" and "share" controls.

### CH3 — The Patch

- ★ **The Coefficient Tug-of-War**
  - **What:** Two anchored handles at the edges of the bar panel: left labeled "fit harder" (α↓), right labeled "shrink harder" (α↑). User grabs the bar skyline itself and tugs — the skyline resists, α reads out live. Bars pop to zero under L1 with a small snap that's audible to the fingertip.
  - **Why it works:** Reframes α not as a number but as a physical tension you set; the coefficients are a rope, you choose how taut.
  - **Risk / prerequisite:** Tug direction must map unambiguously to α; "bar goes up when I pull up" must hold.

- ★ **The Entry-Order Racetrack**
  - **What:** On top of the Lasso path, feature cards line up on a starting grid. Sweep α from ∞ → 0 and the cards cross the finish line one by one — first 5 highlighted as "entered the model." A user can scrub the α sweep back and forth and see cards reverse out. Absurd features finishing in the top 5 get a red finisher's ribbon automatically.
  - **Why it works:** Lasso path becomes a race with winners and losers; rankings are legible without reading a chart.
  - **Risk / prerequisite:** Needs a precomputed entry-order; don't let the racetrack metaphor override the math.

- ★ **Regularizer Comparator**
  - **What:** Three miniatures of the same coefficient skyline stacked vertically (Ridge, Lasso, ElasticNet). Single α slider drives all three. A "lens" (circle of magnification) follows the cursor and zooms whichever panel it's over so details stay legible at small size.
  - **Why it works:** Shared control + shared data makes the character of each regularizer obvious in parallel, not by memory.
  - **Risk / prerequisite:** Magnifier lens must be cheap to render and not cause layout thrash.

### CH4 — The Reveal

- ★ **The Confession Booth**
  - **What:** A dark pinned scene. The model *speaks* its coefficients, one feature at a time, monospace text typing itself in: `0.31 × livestock_per_capita`, `0.27 × goats_per_thousand_women`, `0.19 × scrabble_letter_value_of_capital_city_name`. User can press **pause** on the confession, and **object** to any single line (click a feature → its coefficient drops to zero live, and the predicted-vs-actual jitters). The model confesses another line and keeps going until the user has nuked enough to realize: none of this was causation, all of it was fit.
  - **Why it works:** Makes the model the defendant and the user the cross-examiner. Every objection is a direct-manipulation gesture that has a real numerical consequence.
  - **Risk / prerequisite:** Tone must be dry, not theatrical; typing effect needs a reduced-motion path; live ablation needs fast client-side re-fit or a precomputed LOO table.

- ★ **Drag-to-Cross-Reference**
  - **What:** Lasso top-20 in a column. Drag any feature horizontally → a line draws to RF top-20 and the matching card highlights (or "NOT RANKED" slot lights up red). Drag more features to accumulate a chord diagram of model disagreement. Save the result.
  - **Why it works:** Disagreement is the story — user builds the chord diagram themselves rather than being handed one.
  - **Risk / prerequisite:** Chord ends must be stable targets; clear gesture affordance (ghost line follows finger).

- ★ **"Defend It" → "Demolish It"**
  - **What:** For each absurd top-20 feature, two buttons. *Defend It* pops a mock op-ed plausibility story. *Demolish It* shows the feature's coefficient in 50 random repeat-splits — wildly different each time. User sees: the story is stable, the fit is not.
  - **Why it works:** Contrast between narrative stability and numerical instability is the core lesson of post-hoc explanation.
  - **Risk / prerequisite:** Mock op-eds must be funny but not cruel; instability animation must be clearly sourced from repeated splits.

### CH5 — The Trust

- ★ **The Split Wheel**
  - **What:** A big dial around the world map. Spin it — on release, the dial settles and countries physically leap into "train" or "test" piles. Each spin stamps a test-R² dot into a boxplot. 20 spins fills the box. The user sees the dot for their very first spin (labeled "THE HEADLINE") looking lonely in the upper whisker.
  - **Why it works:** The dataset re-shuffling is the gesture, and the accumulating boxplot is the feedback; users *earn* every dot.
  - **Risk / prerequisite:** Precompute enough splits that spin-to-dot feels instant; dial spin needs inertia.

- ★ **The Fold Painter**
  - **What:** User paints groups of countries onto the world map in 5 colors (= 5 folds). Hit play → each fold becomes the test set in turn, R² per fold reported, mean + spread shown. Bad fold splits (e.g., all of Africa in one fold) produce terrible variance — user learns why random is the default.
  - **Why it works:** Turns fold construction into a paint-by-numbers where the user's geographic prejudices become statistical prejudices, visibly.
  - **Risk / prerequisite:** Need a clean "clear/randomize" button; painting UX must work on touch without scroll-hijacking.

- ★ **The Lessons Quilt**
  - **What:** 5 lesson cards, but each card is a live miniature of the scene it came from (not a screenshot). Tap a card → it expands into a mini-sandbox with one residual slider active. User can poke the lesson and see it still holds. Closing gesture: drag all 5 cards into a quilt layout they can share as an image.
  - **Why it works:** Review becomes re-experiment; the summary is not a list but a rebuildable panel of evidence.
  - **Risk / prerequisite:** Mini-scenes must be cheap (render-at-thumbnail state snapshots).

### X-CUT — Cross-cutting

- ★ **The Suspect Board**
  - **What:** A persistent side-rail "board" where users pin features they've grown suspicious of. Starts empty in CH1. Any feature they touch in any chart can be dragged to the board. By CH4 it's full of red yarn connecting their earlier hunches to the model's confessions. Click any pin to jump back to the chapter where they flagged it.
  - **Why it works:** Builds a personal case file across the entire scroll — the user's own trail of skepticism becomes the spine of the site.
  - **Risk / prerequisite:** State persistence across chapters; the board must be collapsible so it doesn't crowd narrow screens.

- ★ **Break-the-Axis Toggle**
  - **What:** A single global toggle top-right: *Grid* / *Globe*. Every chart has an alternate non-Cartesian render — correlation leaderboard becomes a constellation, hockey stick becomes a spiral, coefficient path becomes a radial inflow. Hitting the toggle re-renders the whole chapter in the other grammar with shared data.
  - **Why it works:** Grants the reader the right to see the same truth in two grammars; forces us, the authors, to prove every chart is about the data and not the axes.
  - **Risk / prerequisite:** Double the design work per chart; only viable if we commit to 2–3 charts getting the dual treatment, not all.
