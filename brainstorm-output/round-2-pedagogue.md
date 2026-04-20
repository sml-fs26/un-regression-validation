## Round 2 · Divergence · Pedagogue

### CH1 — The Bait

- ★ **"Which one would you bet your PhD on?"**
  - **What:** Open with a single question above two unlabeled scatter plots. Both show log-GDP on y-axis; both show r = 0.78 cloud shapes. "One of these is a real driver of prosperity. The other is a joke. Pick." Reader clicks. Reveal: one is institutions quality, one is name-numerology score. Both look identical.
  - **Why it works:** The reader *commits* before learning. Commitment + wrongness = the chapter's emotional anchor. Everything downstream is "remember when you picked wrong in 8 seconds?"
  - **Risk / prerequisite:** Need two features whose scatter shapes truly are indistinguishable at this r — verify in data.

- ★ **The Correlation Cemetery**
  - **What:** Pivot from "bar chart of 355 features" to a field of headstones in the dark navy, each stone bearing a feature name and its |r|. Stones are arranged by r (tall = high correlation). Causal stones are green-lit; spurious are red-lit; incidental are gray. Reader scrolls across a graveyard where McDonald's and institutions are buried at the same height.
  - **Why it works:** Kills the bar-chart cliché dead. A cemetery is non-Cartesian, unforgettable, and the metaphor ("correlations die equally, truth and lies side by side") *is* the lesson. Screenshot bait.
  - **Risk / prerequisite:** Aesthetic discipline — must not slide into Halloween kitsch. Stones are thin slabs, not cartoon tombs.

- ★ **"The only thing McDonald's and rule-of-law have in common is a number"**
  - **What:** Aphorism placed directly under the interleaved chart.
  - **Why it works:** Compresses "correlation is not causation" into a sentence the reader has never heard phrased that way. Tweet-sized.
  - **Risk / prerequisite:** Must follow the reveal, never precede it.

### CH2 — The Crash

- ★ **The Budget of Surprise**
  - **What:** Reframe p > n as an accounting problem. "You have n countries. Each country gives you one piece of surprise — how far it is from average. You have p features, each of which demands a coefficient. When p > n, you're spending more surprise than you have." Show it as a literal ledger: INCOME = n rows, EXPENSES = p coefficients. The ledger goes red.
  - **Why it works:** Degrees of freedom without the phrase "degrees of freedom." The reader understands bankruptcy; now they understand overfitting.
  - **Risk / prerequisite:** The analogy must not trivialize — a note at the end linking to the actual linear algebra.

- ★ **"The model that passes every test has learned every answer"**
  - **What:** Aphorism for the moment train R² = 1.00.
  - **Why it works:** Reframes perfect training as the symptom, not the success. The reader already knows what "memorization" means from school.
  - **Risk / prerequisite:** Pair with the test-R² cliff within the same scroll to avoid triumph misreading.

- ★ **The Prediction Graveyard**
  - **What:** Callback to CH1's cemetery. At p = n, render test-set predictions for 50 held-out countries — each as a headstone with "predicted GDP" vs "actual GDP" carved in. Most are wrong by orders of magnitude. The cemetery is where predictions go to die.
  - **Why it works:** Recurring motif gains meaning. Now the cemetery is the *model's* failure, not just correlation's. Visual rhyme locks the lesson.
  - **Risk / prerequisite:** Only works if CH1 committed to the cemetery — or this beat relocates to CH1.

### CH3 — The Patch

- ★ **The Volume Knob, not the Slider**
  - **What:** λ is rendered as an old-stereo volume knob. At 0: everything is playing at once, cacophony, test R² = −8. At ∞: silence, everything zero, test R² = 0. Somewhere in between: music. The reader turns the knob by hand and finds the station.
  - **Why it works:** Shrinkage as *tuning in*. Reader already knows what over-amped distortion sounds like; now they know what it looks like.
  - **Risk / prerequisite:** The knob must have audible-feeling detents at the sweet spot.

- ★ **"Lasso doesn't keep the best features. It keeps features that survive a budget cut."**
  - **What:** Aphorism planted in CH3, not CH4 — so when CH4's betrayal arrives, the reader *already has the seed of doubt*.
  - **Why it works:** Sets up the reveal without spoiling it. The reader reads this at the triumphant moment and something feels off.
  - **Risk / prerequisite:** Tonal placement — too prominent kills CH4; too subtle wastes it.

- ★ **The False Dawn**
  - **What:** Name the chapter's tone. Test R² climbs from −8 to +0.52. Chart it in gold against a brightening navy. The reader thinks: we did it. Then the final line of the chapter: "Let's see *who* Lasso invited to the party." Cut.
  - **Why it works:** Literally calling it a "false dawn" in the chapter tag line primes reader to expect a betrayal without giving it away.
  - **Risk / prerequisite:** The visual triumph must be genuinely earned — no ironic framing yet.

### CH4 — The Reveal

- ★ **The Coefficient Confession**
  - **What:** Build on the Devil's Advocate amplify. Render Lasso's surviving features as a courtroom transcript, one line per feature, typed out in mono with a cursor. "Feature 41: Scrabble score of country name. Coefficient: +0.27. Status: retained." Reader scrolls, model incriminates itself. Set it on a dark navy page with a single spotlight on each line as it types.
  - **Why it works:** A confession is a dramatic form. Feature importance becomes testimony. The reader is the jury. Absurd features read aloud are far worse than absurd features in a list.
  - **Risk / prerequisite:** Tone — must feel judicial, not comedic. One joke feature per five serious-sounding ones; the absurdity accumulates.

- ★ **"Random Forest didn't know numerology was a joke. It just didn't care."**
  - **What:** Aphorism explaining why RF dodged the trap. Not moral superiority — algorithmic indifference to linear-combination tricks.
  - **Why it works:** Readers assume "smarter algorithm saw through the lie." The real answer is "different algorithm, different blind spots." Humbles RF before the reader over-crowns it.
  - **Risk / prerequisite:** Must land in a footnote or sidebar; main thread stays focused on Lasso's failure.

- ★ **The Lineup Reversed**
  - **What:** Callback to CH1's "bet your PhD" scatter plots. Reader picked one and was told both were lookalikes. Now in CH4: "Remember those two scatters? Lasso picked the joke. Random Forest picked the real one. Your gut was right. Your math was wrong."
  - **Why it works:** Redeems the reader's intuition — which the site spent four chapters undermining — at exactly the right moment. Turns humility into agency.
  - **Risk / prerequisite:** Only lands if CH1's commitment device was strong.

### CH5 — The Trust

- ★ **The Parallel Universes Panel**
  - **What:** Five small multiples across the top of the page: five different random seeds, five different "top 10 features Lasso picked." The lists *barely overlap*. Beer-to-Wine is in universe 1 but not 2. McDonald's is in 3 and 5 but not 4. Reader sees that the "chosen features" were never chosen — they were randomly grabbed.
  - **Why it works:** Visualizes the lottery directly. No narration needed. Five universes, five different conspiracies.
  - **Risk / prerequisite:** Results must actually be unstable across seeds — verify first.

- ★ **"A single train/test split is a ghost story. Cross-validation is a census."**
  - **What:** Aphorism for the CV section.
  - **Why it works:** Ghost story = one person's anecdote, possibly true, possibly not. Census = systematic counting. Pairs the vibe with the method.
  - **Risk / prerequisite:** None.

- ★ **The Humility Postcard**
  - **What:** Final screen of the site. A single postcard with the Atlas-of-Nations typography: "You came here for answers. You leave with better questions. That's what good science looks like." Signed: The Atlas. Option to download as PNG.
  - **Why it works:** Shareability. Readers who finish want a trophy. The postcard is that trophy — and it spreads the site's thesis in the process.
  - **Risk / prerequisite:** Typography must earn it; a PNG that looks like a midwit meme defeats the whole aesthetic.

### X-CUT — Cross-cutting

- ★ **The Graveyard Motif**
  - **What:** Cemetery appears in CH1 (correlations buried equally), CH2 (failed predictions), and CH5 (a final plot where each dot is a country with a small headstone icon showing its CV prediction error). Three appearances, escalating meaning: first a shock, then a consequence, then a census.
  - **Why it works:** Recurring metaphor becomes structural. The reader tracks the motif across chapters and learns that "dying correlations" is a theme, not a gag.
  - **Risk / prerequisite:** Design must restrain itself — navy, thin gold rules, no cartoon ghosts. Commit once, thin it out elsewhere.

- ★ **The Scorecard of Wrong Guesses**
  - **What:** Every chapter opens with a one-click prediction ("Will Lasso beat OLS? Y/N." "Will cross-validation change the top feature? Y/N."). Reader answers. At site's end, a final page lists all 5 predictions with a green or red mark. Most readers will be wrong on 3+.
  - **Why it works:** Prediction-before-reveal is the surprise mechanism, applied structurally across the whole site. Readers leave with receipts.
  - **Risk / prerequisite:** localStorage plumbing; questions must be answerable without prior knowledge.

- ★ **The Recurring Country: Norway**
  - **What:** Norway is our character. CH1: high on McDonald's-per-capita, high on GDP (correlation dogma). CH2: its prediction explodes to $–40 trillion at p > n. CH3: Lasso gets Norway right to within 5%. CH4: Lasso got it right *for the wrong reasons* (Scrabble score was doing the work). CH5: across 200 splits, Norway's predicted GDP has a confidence interval wider than its actual GDP.
  - **Why it works:** One country, five fates, five lessons. Readers track Norway's story and learn each chapter's point through its individual journey. This is how data journalism beats textbooks.
  - **Risk / prerequisite:** Pick the country whose actual data performs this arc; Norway is a guess, verify with analysis.
