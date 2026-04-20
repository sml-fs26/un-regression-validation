#!/usr/bin/env node
/*
 * gen-features-fixture.mjs — generates the `features.json` fixture used
 * by <RoleColumn>, <RoleCell>, and <RoleLabeledCounter> (Stage 2 step 3).
 *
 * Stage 2 step 5 (precompute pipeline) REPLACES this file with real
 * Python output: `/precompute/absurd_seed.py` provides the 30 absurd
 * ids, and the main pipeline extends each feature row with its full
 * metadata (short_name, full_name, citation, default_role). The schema,
 * invariants, and the 30 + 326 = 356 partition are locked here.
 *
 * DESIGN.md §Data pipeline, line 48:
 *   "features.json | {id, short_name, full_name, citation, default_role,
 *    absurdity_flag}[] (356 rows; 30 with default_role set; ~30 with
 *    absurdity_flag: true per /precompute/absurd_seed.py) | <= 30 KB |
 *    Role column, hover citations, CH1 autocomplete ghost seeding"
 *
 * DESIGN.md §Cross-cutting signature #3 Invariants (line 270):
 *   "326 + 30 = 356 cells exactly. Verified at mount."
 *
 * The 30 authored features come with a `default_role: 'authored'` field
 * and a citation (the hover reveal); the 326 others carry
 * `default_role: null`. The citation strings are placeholders — real
 * bibliographic text arrives at step 5.
 *
 * Usage:
 *   node scripts/gen-features-fixture.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The 30 authored feature short_names. These are the features whose role
// is bracketed [authored] and which cannot be overwritten by user tags
// (DESIGN.md §CC#3 Invariants, line 271). Placeholder names — step 5
// will replace with the real set drawn from the literature.
const AUTHORED = [
  'gdp_per_capita', 'oil_exports', 'life_expectancy', 'gini_index',
  'urbanization_rate', 'child_mortality', 'capital_formation', 'fdi_net',
  'tax_revenue', 'health_expenditure', 'education_expenditure',
  'industry_value_added', 'agriculture_value_added', 'services_value_added',
  'imports_share', 'exports_share', 'current_account', 'fuel_exports',
  'mineral_exports', 'ore_exports', 'electricity_production', 'co2_per_capita',
  'adult_literacy', 'internet_penetration', 'mobile_subscriptions',
  'corruption_index', 'rule_of_law', 'political_stability',
  'regulatory_quality', 'voice_accountability'
];

// Absurd features seeded per BRAINSTORM CH1 wow #2 (the first five names
// appear verbatim in DESIGN.md line 392). Total ~30 per the spec. These
// will be used by CH1's autocomplete ghost-suggestion in step 6.
const ABSURD = [
  'iso3_alphabetical_rank', 'un_member_letters', 'name_numerology_score',
  'scrabble_letter_value', 'capital_vowel_count',
  'flag_stripe_count', 'flag_color_count', 'anthem_word_count',
  'capital_name_length', 'country_name_length', 'vowels_in_name',
  'consonants_in_name', 'iso2_vowel_count', 'iso3_vowel_count',
  'currency_symbol_length', 'capital_syllable_count', 'country_name_syllables',
  'isbn_country_code', 'calling_code_first_digit', 'tld_length',
  'capital_latitude_sign', 'capital_longitude_sign', 'iso_alphabetical_index',
  'flag_has_yellow', 'flag_has_red', 'flag_has_blue', 'flag_has_green',
  'capital_first_letter', 'anthem_tempo_bucket', 'currency_letter_count'
];

// Sanity: sizes defined in DESIGN.md.
if (AUTHORED.length !== 30) {
  throw new Error(`AUTHORED must be 30 names, got ${AUTHORED.length}`);
}
if (ABSURD.length !== 30) {
  throw new Error(`ABSURD must be ~30 names per DESIGN.md line 392; got ${ABSURD.length}`);
}

const TOTAL = 356;

function buildFeatures() {
  const rows = [];
  const absurdSet = new Set(ABSURD);
  const authoredSet = new Set(AUTHORED);
  // First, the 30 authored rows. Stable id space: authored_00..authored_29.
  AUTHORED.forEach((name, idx) => {
    rows.push({
      id: `authored_${String(idx).padStart(2, '0')}`,
      short_name: name,
      full_name: humanize(name),
      citation: `placeholder citation for ${name}; step 5 replaces with real bibliography.`,
      default_role: 'authored',
      absurdity_flag: false
    });
  });
  // Next, the 30 absurd rows. Stable id space: absurd_00..absurd_29.
  ABSURD.forEach((name, idx) => {
    rows.push({
      id: `absurd_${String(idx).padStart(2, '0')}`,
      short_name: name,
      full_name: humanize(name),
      citation: null,
      default_role: null,
      absurdity_flag: true
    });
  });
  // Fill the remainder up to 356 with anonymous un-authored rows.
  const remaining = TOTAL - AUTHORED.length - ABSURD.length;
  for (let i = 0; i < remaining; i++) {
    rows.push({
      id: `feat_${String(i).padStart(3, '0')}`,
      short_name: `feat_${String(i).padStart(3, '0')}`,
      full_name: `unlabeled feature #${i}`,
      citation: null,
      default_role: null,
      absurdity_flag: false
    });
  }
  if (rows.length !== TOTAL) {
    throw new Error(`expected ${TOTAL} rows, built ${rows.length}`);
  }
  // Sanity cross-checks (match DESIGN.md invariants, so a reviewer doesn't
  // have to re-derive them).
  const authoredCount = rows.filter((r) => r.default_role === 'authored').length;
  if (authoredCount !== 30) throw new Error(`expected 30 authored, got ${authoredCount}`);
  const absurdCount = rows.filter((r) => r.absurdity_flag === true).length;
  if (absurdCount !== 30) throw new Error(`expected 30 absurd, got ${absurdCount}`);
  // Absurd and authored MUST be disjoint (an [authored] feature is not a
  // ghost-seed candidate — the absurd ones are extra rows the reader
  // finds in autocomplete).
  for (const name of ABSURD) if (authoredSet.has(name)) {
    throw new Error(`absurd/authored overlap: ${name}`);
  }
  for (const name of AUTHORED) if (absurdSet.has(name)) {
    throw new Error(`authored/absurd overlap: ${name}`);
  }
  return rows;
}

function humanize(snake) {
  return snake.replace(/_/g, ' ');
}

const outPath = resolve(ROOT, 'static/data/features.json');
const rows = buildFeatures();
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(rows) + '\n');
console.log(`wrote ${rows.length} feature rows to ${outPath}`);
