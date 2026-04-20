/*
 * ESLint plugin `un-regression` — shared rules for this project.
 *
 * Currently exports a single rule: `no-forbidden-motion-libraries`
 * (DA #1 enforcement, DESIGN.md §Global architecture line 26).
 */

'use strict';

const noForbiddenMotionLibraries = require('./no-forbidden-motion-libraries.js');
const noStoragePersistence = require('./no-storage-persistence.js');

module.exports = {
  rules: {
    'no-forbidden-motion-libraries': noForbiddenMotionLibraries,
    'no-storage-persistence': noStoragePersistence
  }
};
