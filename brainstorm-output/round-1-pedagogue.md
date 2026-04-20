## Round 1 · Divergence · Pedagogue

### CH1 — The Bait

- ★ **The Two-Column Lineup**
  - **What:** Open with a blind taste test. Show two feature columns side-by-side, both with r ≈ 0.78 against log-GDP. Label A and B. Reader guesses which is "real." Reveal: A is rule-of-law index, B is McDonald's per million. Both correlate identically.
  - **Why it works:** The reader's gut said "obviously A." The numbers said "identical." That gap between intuition and arithmetic is the entire chapter in one scroll.
  - **Risk / prerequisite:** Need to cherry-pick an absurd feature whose r truly rivals a serious one — verify in data first.

- ★ **The Correlation Leaderboard (sorted, interleaved)**
  - **What:** A horizontal bar chart of Pearson r for all 356 features, sorted. Color by role. The reader scrolls and sees green and red bars *shuffled together* — Eurovision wins sits between institutions index and trade openness.
  - **Why it works:** Sorting is the reader's mental heuristic for "importance." The chart weaponizes that heuristic and then detonates it with color.
  - **Risk / prerequisite:** Requires honest role-labeling up front; reader must accept our ground truth.

- ★ **"The 0.9 Club"**
  - **What:** Highlight every feature with |r| > 0.7 as "suspiciously good friends of GDP." Give them a club badge. Count them: dozens. Ask: if correlation were truth, which one do we believe?
  - **Why it works:** Abundance kills the signal. One strong correlation feels like evidence; forty feels like a lottery.
  - **Risk / prerequisite:** Threshold has to be chosen so the club is embarrassingly large.

- ★ **Beer-to-Wine as the mascot**
  - **What:** Pick ONE absurd feature — beer-to-wine ratio — and personify it across the whole site. It's the recurring villain. Chapter 1 introduces it with a high r. Chapter 4 reveals it got picked by Lasso.
  - **Why it works:** Stories need a named character. "Feature 237" is forgettable; "Beer-to-Wine" is a running joke.
  - **Risk / prerequisite:** The feature must actually survive into later chapters' results.

### CH2 — The Crash

- ★ **The Feature Slider of Doom**
  - **What:** A single slider: "How many features in the model?" Drag from 10 → 254 → 356. Two numbers animate: train R² (climbs to 1.0) and test R² (falls off a cliff past p = n). The reader *causes* the catastrophe.
  - **Why it works:** Interactivity turns "p > n is bad" into a muscle memory. The reader's own hand pulls the trigger.
  - **Risk / prerequisite:** Requires pre-computed regressions at every slider stop; needs smooth animation.

- ★ **The Hockey Stick of Doom**
  - **What:** Name the chart. Literally. Label it "The Hockey Stick of Doom" in the figure caption. Train R² line is flat-near-1; test R² line is the hockey stick.
  - **Why it works:** Named figures get remembered. "Hockey Stick of Doom" will show up in screenshots on Twitter.
  - **Risk / prerequisite:** Don't overuse — one named figure per chapter, max.

- ★ **The Vanishing Test Set**
  - **What:** Visualize it as a wall the model has to predict *behind*. As p grows, the wall gets taller and the predictions on the other side get wilder. At p = n, the wall is infinite — perfect on our side, chaos on theirs.
  - **Why it works:** Gives overfitting a physical geometry. Memorization on one side, gibberish on the other.
  - **Risk / prerequisite:** Needs a good visual metaphor render; easy to overdesign.

- ★ **"Every country is a special snowflake"**
  - **What:** Aphorism. When p = n, the model can assign one coefficient per country to fit it exactly. There are no shared patterns, only individual verdicts.
  - **Why it works:** Explains degrees of freedom without the word "degrees of freedom."
  - **Risk / prerequisite:** Don't anthropomorphize so far that the math gets fuzzy.

### CH3 — The Patch

- ★ **The Shrinkage Dial**
  - **What:** A λ slider. On the left: OLS chaos (the crash from CH2 reappears). On the right: everything zero. Somewhere in the middle: the sweet spot where test R² peaks. Reader finds it by hand.
  - **Why it works:** The reader discovers that regularization isn't magic — it's a tradeoff curve with a maximum they can *see*.
  - **Risk / prerequisite:** The U-shape must be visually obvious at the sweet spot.

- ★ **Lasso as a bouncer**
  - **What:** Metaphor. Lasso is a bouncer at a club with 356 hopefuls trying to get in. It lets in maybe 20. The rest get a coefficient of exactly zero — turned away at the door.
  - **Why it works:** "Coefficient shrinkage" is jargon. "Bouncer kicks out 336 features" is a scene.
  - **Risk / prerequisite:** Ridge vs. Lasso distinction must not get lost — maybe Ridge is "the bouncer who lets everyone in but makes them whisper."

- ★ **The Cliffhanger Peek**
  - **What:** End CH3 with test R² = +0.52 and a triumphant tone — we fixed it! Then one sentence: "Let's see *which* features Lasso decided to keep." Cut to black before revealing.
  - **Why it works:** Classic mid-season finale. Gives CH4 somewhere to land.
  - **Risk / prerequisite:** Requires CH3 to feel genuinely victorious so CH4's betrayal lands.

- ★ **"From −8 to +0.5"**
  - **What:** Put the number progression in the URL of the page, in the chapter title, in the aphorism. Make it the slogan.
  - **Why it works:** Numbers with signs flipped tell a story: we went from worse-than-guessing to genuinely predictive.
  - **Risk / prerequisite:** Only if the real numbers cooperate.

### CH4 — The Reveal

- ★ **"Lasso picked the numerologist"**
  - **What:** The reveal shot. Show Lasso's top 10 selected features. Among them: name numerology, Scrabble score. Then show Random Forest's top 10: institutions, trade, education. Side by side. Let the pictures talk.
  - **Why it works:** The reader believed CH3's hero. CH4 shows the hero was fooled. Betrayal is the best teacher.
  - **Risk / prerequisite:** The data must actually show this — run both first and confirm.

- ★ **The Lineup Return**
  - **What:** Callback to CH1's two-column lineup. Remember A vs. B? Lasso picked B. Random Forest picked A. The reader's original gut was right; the linear model wasn't.
  - **Why it works:** Circular narrative closes the loop started on page one.
  - **Risk / prerequisite:** Only works if CH1 framed the lineup memorably.

- ★ **"Sparse ≠ sensible"**
  - **What:** Aphorism. Lasso is sparse. Sparse sounds like parsimony, and parsimony sounds like wisdom. But sparse is just "few" — and few wrong answers is still wrong.
  - **Why it works:** Demolishes a common ML-beginner assumption: that L1 penalty selects "the important ones."
  - **Risk / prerequisite:** Need to be fair — Lasso isn't *always* wrong, just wrong here.

- ★ **The Hall of Shame**
  - **What:** A literal gallery on the page. Portraits of the absurd features Lasso kept: Beer-to-Wine, Scrabble Score, Miss Universe wins. Each with its coefficient displayed like a Hall-of-Fame plaque.
  - **Why it works:** The absurdity is the argument. You don't need to explain why this is bad.
  - **Risk / prerequisite:** Design debt; needs real care to not look like a meme.

### CH5 — The Trust

- ★ **The Slot Machine**
  - **What:** Re-run the analysis with a different random seed. Watch the "best features" list change. Pull the handle again. Different features. Again. Different again. The split was a lottery.
  - **Why it works:** The reader *sees* instability as motion. Cross-validation becomes the obvious medicine.
  - **Risk / prerequisite:** Needs multiple pre-computed splits for the animation.

- ★ **"One split is an anecdote; five is evidence"**
  - **What:** Aphorism to anchor the CV section.
  - **Why it works:** Compresses the entire pedagogical payload of CH5 into eight words.
  - **Risk / prerequisite:** None — cheap to deploy.

- ★ **The Lessons Learned scroll**
  - **What:** Closing montage. One sentence per chapter, each a callback. "Correlation lied (CH1). OLS crashed (CH2). Regularization patched (CH3). But sparse wasn't sensible (CH4). And one split is an anecdote (CH5)."
  - **Why it works:** Gives the reader five sticky lines to take away. Every one is tweet-sized.
  - **Risk / prerequisite:** Don't let it become a checklist — must read like a poem.

- ★ **The Humility Clause**
  - **What:** End not with "now you know" but with "now you know what to *doubt*." The atlas has blank spots. Real understanding is knowing the map is incomplete.
  - **Why it works:** Turns the whole site from a lesson into an orientation. Readers leave as skeptics, which is the point.
  - **Risk / prerequisite:** Tone must not tip into cynicism.

### X-CUT — Cross-cutting

- ★ **The Atlas of Nations framing**
  - **What:** The dark navy aesthetic is literally an atlas — old cartography styling. Each chapter is a "plate." Features are "landmarks." The villain features get little icons like map symbols (a mustache for Miss Universe, a crown for Eurovision).
  - **Why it works:** Unifies the aesthetic to a single metaphor instead of "dark mode dashboard." Atlases are about knowledge with edges — perfectly aligned with the humility thesis.
  - **Risk / prerequisite:** Commit to the theme or it reads as inconsistent.

- ★ **Three Colors, One Legend**
  - **What:** Green = causal (truth), Red = spurious (lie), Gray = incidental (noise). Introduce in CH1 with a tiny inline legend. Every chart, every chapter, same three colors, no exceptions. By CH4 the reader reads role-color before reading label.
  - **Why it works:** Repeated visual vocabulary becomes semantic vocabulary. Readers *feel* red bars as suspicious by chapter three.
  - **Risk / prerequisite:** Color-blind safe palette check required.

- ★ **Beer-to-Wine: the recurring character**
  - **What:** Named absurd feature that appears in CH1 (suspiciously high r), CH3 (Lasso keeps it), CH4 (Hall of Shame), CH5 (unstable across splits). A narrative through-line.
  - **Why it works:** Turns a feature into a character. Readers remember characters, not variables.
  - **Risk / prerequisite:** Data must cooperate; backup candidates: Scrabble Score, name numerology.

- ★ **The Predictions Log**
  - **What:** At the start of each chapter, ask the reader: "Predict the answer." Sticky note the answer. Reveal at end. The reader accumulates a scorecard by CH5.
  - **Why it works:** Prediction-then-reveal is the surprise mechanism. A running scorecard gamifies humility — readers *see* their intuitions fail repeatedly.
  - **Risk / prerequisite:** Requires localStorage plumbing; predictions must be answerable in one click.
