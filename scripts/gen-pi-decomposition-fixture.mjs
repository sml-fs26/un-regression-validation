#!/usr/bin/env node
/*
 * gen-pi-decomposition-fixture.mjs — generates `nor/pi_decomposition.json`
 * and `nor/pi_shuffled.json` for Stage 2 step 4 (<PiCellComposition>).
 *
 * Stage 2 step 5 (precompute pipeline) REPLACES both files with real
 * Python output from `/precompute/pi_decomposition.py`. The schema,
 * numeric targets, and the 5-term cv-optimal composition are locked
 * here so step 4's prototype can render legibly at 1× / 2× / 480px
 * *before* any chapter content ships.
 *
 * DESIGN.md §Data pipeline line 41:
 *   "nor/pi_decomposition.json |
 *    {alpha, point: float, ci: [float, float],
 *     terms: {feature_id, weight, role_at_build}[]}
 *    for each α step | ≤ 60 KB | CH3 PI cell"
 *
 * DESIGN.md §CH3 state machine line 633:
 *   "`at-cv-optimal` | α reaches the cell-internal flag cv_optimal |
 *    manual scrub away | line 1: `[$78,400, $94,900]`;
 *    line 2: `0.34·num + 0.28·mcd + 0.19·scr + 0.11·bw + 0.08·rule`"
 *
 * BRAINSTORM CH3 wow #1 ("the PI cell that contains its own refutation")
 * specifies "four red underlines. One green." — four absurd features +
 * one authored. The authored one here is `rule_of_law` (authored_26 in
 * the features fixture); the four absurd are the first four items of
 * features.json's absurd set.
 *
 * BRAINSTORM CH3 wow #2: the peer cell must render a ≥78% red
 * composition under shuffled-Y. This fixture emits 5 terms whose
 * weights sum to 1.0, of which 4 carry role_at_build='spurious' → the
 * red share is 0.34+0.28+0.19+0.11 = 0.92 (well over the 78% target).
 *
 * Schema note: the DESIGN.md minimum is {feature_id, weight, role_at_build}.
 * This fixture adds one display field — `abbrev` — because the 7pt
 * line-2 equation in BRAINSTORM CH3 wow #1 uses author-chosen
 * abbreviations (`num`, `mcd`, `scr`, `bw`, `rule`) that are not
 * mechanically derivable from `short_name`. Step 5's Python pipeline
 * may refine the abbreviation policy; for now the field is stable and
 * parsed as a string. The TS type in src/lib/stores/pi.ts accepts
 * abbrev as part of the term shape.
 *
 * Usage:
 *   node scripts/gen-pi-decomposition-fixture.mjs
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FEATURES = JSON.parse(
  readFileSync(resolve(ROOT, 'static/data/features.json'), 'utf8')
);

function featureIdByShortName(shortName) {
  const row = FEATURES.find((r) => r.short_name === shortName);
  if (!row) {
    throw new Error(
      `no feature row with short_name='${shortName}' in features.json; ` +
        `scripts/gen-features-fixture.mjs must run before this script.`
    );
  }
  return row.id;
}

/** The five cv-optimal terms per DESIGN.md line 633 + BRAINSTORM CH3 wow #1. */
const CV_OPTIMAL_TERMS = [
  // weight, short_name_in_features_json, abbrev_in_equation, role_at_build
  { weight: 0.34, short_name: 'name_numerology_score', abbrev: 'num', role_at_build: 'spurious' },
  { weight: 0.28, short_name: 'consonants_in_name',   abbrev: 'mcd', role_at_build: 'spurious' },
  { weight: 0.19, short_name: 'scrabble_letter_value', abbrev: 'scr', role_at_build: 'spurious' },
  { weight: 0.11, short_name: 'flag_has_blue',         abbrev: 'bw',  role_at_build: 'spurious' },
  { weight: 0.08, short_name: 'rule_of_law',           abbrev: 'rule', role_at_build: 'authored' }
];

/** Minimum-α (nearly zero) → 356-term pandemonium. Prototype uses a reduced
 *  subset so the snapshot is legible; the real pipeline at step 5 can
 *  restore the full 356 terms (the prototype's DOM holds 12 for test
 *  frames). */
const EXTREME_MIN_TERMS = [
  ...CV_OPTIMAL_TERMS.map((t) => ({ ...t, weight: +(t.weight / 2).toFixed(4) })),
  { weight: 0.04, short_name: 'flag_stripe_count',    abbrev: 'stp', role_at_build: 'spurious' },
  { weight: 0.04, short_name: 'flag_has_yellow',      abbrev: 'yel', role_at_build: 'spurious' },
  { weight: 0.03, short_name: 'capital_name_length',  abbrev: 'cap', role_at_build: 'spurious' },
  { weight: 0.03, short_name: 'tld_length',           abbrev: 'tld', role_at_build: 'spurious' },
  { weight: 0.03, short_name: 'gdp_per_capita',       abbrev: 'gdp', role_at_build: 'authored' },
  { weight: 0.03, short_name: 'life_expectancy',      abbrev: 'lif', role_at_build: 'authored' },
  { weight: 0.03, short_name: 'oil_exports',          abbrev: 'oil', role_at_build: 'authored' }
];

/** The three α steps the prototype ships.
 *  Step 5 will extend this to the full ~32-step sweep per DESIGN.md
 *  line 639 ("α-sweep, ~32 steps"). */
function buildDecomposition(isShuffled) {
  // Point estimate in NOK (Norway, 2012-ish) for an adult in a PI cell.
  // The bracket [$78,400, $94,900] is the DESIGN.md-authored target at
  // CV-optimal α. The point sits at the midpoint.
  const point = 86650;
  const ciCvOptimal = [78400, 94900];
  const ciMinAlpha = [65200, 108100]; // wider at small α
  const ciMaxAlpha = [null, null];    // empty cell at α=∞

  const weightSum = (terms) => terms.reduce((a, t) => a + t.weight, 0);
  if (Math.abs(weightSum(CV_OPTIMAL_TERMS) - 1.0) > 1e-9) {
    throw new Error(`CV-optimal weights must sum to 1.0; got ${weightSum(CV_OPTIMAL_TERMS)}`);
  }

  const toTerm = (t) => ({
    feature_id: featureIdByShortName(t.short_name),
    weight: +t.weight.toFixed(4),
    abbrev: t.abbrev,
    role_at_build: t.role_at_build
  });

  // Shuffled-Y peer: same 5 terms, same weights, but roles at build are
  // ALL spurious (including the one that would have been authored in the
  // real data). BRAINSTORM CH3 wow #2 target: ≥ 78% red. Here 5/5 = 100%.
  // Narrative: "the shuffled null still picks absurd columns."
  const shuffledTerms = CV_OPTIMAL_TERMS.map((t) => ({
    ...t,
    role_at_build: /** @type {const} */ ('spurious')
  }));

  const steps = [
    {
      alpha: 0.0012,
      step_label: 'extreme-min',
      is_cv_optimal: false,
      point,
      ci: ciMinAlpha,
      terms: (isShuffled ? shuffledTerms : EXTREME_MIN_TERMS).map(toTerm)
    },
    {
      alpha: 0.1018,
      step_label: 'cv-optimal',
      is_cv_optimal: true,
      point,
      ci: ciCvOptimal,
      terms: (isShuffled ? shuffledTerms : CV_OPTIMAL_TERMS).map(toTerm)
    },
    {
      alpha: 12.0,
      step_label: 'extreme-max',
      is_cv_optimal: false,
      point: null,
      ci: ciMaxAlpha,
      terms: []
    }
  ];

  // Assertions the runtime parser in src/lib/stores/pi.ts replicates.
  const cvIdx = steps.findIndex((s) => s.is_cv_optimal);
  if (cvIdx < 0) throw new Error('no cv-optimal step');
  const cv = steps[cvIdx];
  if (cv.terms.length !== 5) {
    throw new Error(`cv-optimal must have 5 terms (BRAINSTORM CH3 wow #1); got ${cv.terms.length}`);
  }
  const redShare = cv.terms
    .filter((t) => t.role_at_build === 'spurious')
    .reduce((a, t) => a + t.weight, 0);
  if (isShuffled) {
    // BRAINSTORM CH3 wow #2: ≥ 78% red on the shuffled cell.
    if (redShare < 0.78) {
      throw new Error(
        `pi_shuffled cv-optimal must be ≥ 78% red (BRAINSTORM CH3 wow #2); got ${redShare}`
      );
    }
  } else {
    // BRAINSTORM CH3 wow #1 "four red underlines. One green." → ≥ 0.78 red.
    if (redShare < 0.78) {
      throw new Error(
        `pi_decomposition cv-optimal must be ≥ 78% red; got ${redShare}`
      );
    }
  }
  return {
    iso3: 'NOR',
    shuffled: isShuffled,
    cv_optimal_index: cvIdx,
    steps
  };
}

function writeFixture(relPath, body) {
  const full = resolve(ROOT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(body) + '\n');
  console.log(`wrote ${relPath} (${JSON.stringify(body).length} bytes)`);
}

writeFixture('static/data/nor/pi_decomposition.json', buildDecomposition(false));
writeFixture('static/data/nor/pi_shuffled.json', buildDecomposition(true));
