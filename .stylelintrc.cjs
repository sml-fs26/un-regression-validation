/*
 * Stylelint configuration — DESIGN.md §Typography system + §Color & palette.
 *
 * For step 1 we only wire the `no-raw-font-family` rule (DESIGN.md
 * line 113). Future steps will add `role-color-stroke-only`,
 * `no-keyframes`, `palette-allowlist`, etc.
 *
 * Raw .css files use the default postcss syntax. Svelte files (via
 * the override) use `postcss-html` so `<style>` blocks are parsed.
 */
module.exports = {
  plugins: [
    './tools/stylelint/no-raw-font-family.js',
    './tools/stylelint/no-keyframes.js',
    './tools/stylelint/no-css-animation-over-200ms.js',
    './tools/stylelint/role-color-stroke-only.js'
  ],
  rules: {
    'un-regression/no-raw-font-family': true,
    // Step 2: the first file in the 3-file @keyframes allowlist ships
    // (HeartbeatPulse.svelte). Enforce the ban site-wide; the plugin's
    // own allowlist handles the three exempt files.
    'un-regression/no-keyframes': true,
    // Step 2: the first permitted motion ships (CH2 gold pulse at 180ms).
    // Enforce the 200ms ceiling on every transition/animation duration.
    'un-regression/no-css-animation-over-200ms': true,
    // Step 3: <RoleColumn> + the stroke-only palette utility ship.
    // Enforce role color as stroke-only site-wide from now on.
    // Exemptions listed inside the plugin (tokens.css, role-palette.css,
    // the CH3 PiCellLine2Underline.svelte exception).
    'un-regression/role-color-stroke-only': true
  },
  overrides: [
    {
      files: ['**/*.svelte'],
      customSyntax: 'postcss-html'
    }
  ],
  ignoreFiles: ['build/**', '.svelte-kit/**', 'node_modules/**', 'storybook-static/**']
};
