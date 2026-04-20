#!/usr/bin/env node
/*
 * forbidden-libraries-check.js — package.json auditor.
 *
 * Enforcement of DESIGN.md §Global architecture, line 26 (DA #1).
 *
 * Scans dependencies + devDependencies of the project package.json
 * for any of the forbidden motion libraries. Exits non-zero with a
 * listed violation if any are present. Run as part of `npm run lint`.
 *
 * This complements the ESLint rule
 * `un-regression/no-forbidden-motion-libraries`, which catches
 * imports but not packages listed in package.json that a stray
 * script might require at runtime or build time.
 */

import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_EXACT = new Set([
  'framer-motion',
  'gsap',
  'motion',
  'lottie-web',
  'popmotion',
  'react-spring',
  '@react-spring/core',
  '@react-spring/web',
  'auto-animate',
  '@formkit/auto-animate',
  'aos'
]);
const ANIMAT_RE = /animat/i;

function isForbidden(name) {
  if (FORBIDDEN_EXACT.has(name)) return true;
  const bare = name.replace(/^@[^/]+\//, '');
  return ANIMAT_RE.test(bare);
}

const pkgPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const all = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
  ...(pkg.peerDependencies || {}),
  ...(pkg.optionalDependencies || {})
};

const violations = Object.keys(all).filter(isForbidden);
if (violations.length > 0) {
  console.error('\nForbidden motion libraries present in package.json (DA #1):');
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error(
    '\nSee DESIGN.md §Global architecture, line 26. DA #1: the site ' +
      'emits, it does not perform. Remove these packages and re-run.'
  );
  process.exit(1);
}

console.log('forbidden-libraries-check: 0 violations. package.json is clean.');
