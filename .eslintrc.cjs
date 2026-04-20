/*
 * ESLint configuration — DESIGN.md §Global architecture, line 26.
 *
 * The custom rule `un-regression/no-forbidden-motion-libraries`
 * rejects any import of a JavaScript motion library, enforcing DA #1
 * (emit-don't-perform).
 *
 * The plugin itself is a private package at ./tools/eslint, wired
 * into package.json devDependencies via `file:./tools/eslint` so
 * ESLint resolves it as `eslint-plugin-un-regression`.
 *
 * Other project lint rules (no-storage-persistence, no-input-range,
 * no-css-animation-over-200ms, role-color-stroke-only) are scheduled
 * for later build steps and are not wired here.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    extraFileExtensions: ['.svelte']
  },
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  plugins: ['@typescript-eslint', 'un-regression'],
  rules: {
    'un-regression/no-forbidden-motion-libraries': 'error',
    // DA #9 (DESIGN.md line 916): no localStorage, no IndexedDB, no
    // cookies. sessionStorage is explicitly permitted (ScrollGate uses
    // it in step 13). Step 3 wires the rule because the <RoleColumn>
    // store is the first piece of reader state where a well-meaning
    // future maintainer might reach for localStorage.
    'un-regression/no-storage-persistence': 'error'
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    {
      // Custom ESLint-plugin source files are CommonJS; turn off the
      // module-system complaint about their `require` use.
      files: ['tools/eslint/**/*.js'],
      env: { node: true, commonjs: true }
    }
  ],
  ignorePatterns: [
    '.svelte-kit/',
    'build/',
    'node_modules/',
    'storybook-static/',
    'playwright-report/',
    'test-results/'
  ]
};
