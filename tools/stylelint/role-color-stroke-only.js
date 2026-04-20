/*
 * role-color-stroke-only — custom Stylelint plugin.
 *
 * Enforcement of DESIGN.md §Color & palette line 209 + §CC#5 line 295:
 *   "Any rule with background-color or color set to a --role-* value,
 *    outside <PiCellLine2Underline>, fails the custom Stylelint rule
 *    role-color-stroke-only. The CH3 exception is component-gated: only
 *    the file src/lib/components/ch3/PiCellLine2Underline.svelte is
 *    permitted to use border-bottom-color: var(--role-spurious) etc."
 *
 * The rule inspects every declaration and rejects references to
 * `var(--role-*)` in these properties:
 *
 *   - background, background-color, background-image
 *   - color  (outside PiCellLine2Underline.svelte; `.role-stroke--bracket`
 *     in the palette-utility file is the approved channel for color:)
 *   - border-bottom-color / border-bottom (outside PiCellLine2Underline)
 *   - fill, fill-opacity
 *
 * Allowed (because they are the stroke-only path):
 *   - border-bottom on `--stroke` (NOT `--role-*` directly)
 *   - outline / outline-color on `--stroke`
 *
 * Two files have a blanket exemption: tokens.css (defines --role-*),
 * role-palette.css (defines .role-stroke*), and
 * PiCellLine2Underline.svelte (the one CH3 exception). Any other file
 * that references `var(--role-causal|spurious|incidental|unlabeled)` in
 * a fill/background/color declaration is a rule violation.
 */

import stylelint from 'stylelint';

const ruleName = 'un-regression/role-color-stroke-only';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (prop, value) =>
    `"${prop}: ${value}" uses a --role-* color as fill; stroke-only is the contract. ` +
    `Reach the palette via .role-stroke / .role-stroke--country-dot / ` +
    `.role-stroke--bracket with --stroke set, or use the one CH3 exception ` +
    `<PiCellLine2Underline>. See DESIGN.md §CC#5.`
});

const meta = { url: 'https://example.invalid/un-regression/role-color-stroke-only' };

// Files that are allowed to reference var(--role-*) directly.
const EXEMPT_SUFFIXES = [
  'src/lib/styles/tokens.css',                               // defines --role-*
  'src/lib/styles/role-palette.css',                         // doesn't reference --role-* but whitelisted for defence-in-depth
  'src/lib/components/ch3/PiCellLine2Underline.svelte'       // the DESIGN.md §CC#5 named exception
];

// Properties that would be a "fill" of role color. border-bottom alone
// is OK when the value is `var(--stroke)` because that is the intended
// indirection; we flag it only if the value mentions `var(--role-*)`.
const FILL_LIKE_PROPS = new Set([
  'background',
  'background-color',
  'background-image',
  'color',
  'border-bottom',
  'border-bottom-color',
  'border-top',
  'border-top-color',
  'border-left',
  'border-left-color',
  'border-right',
  'border-right-color',
  'border',
  'border-color',
  'fill',
  'stroke-fill',
  'caret-color',
  'box-shadow'
]);

const ROLE_VAR_RE = /var\(\s*--role-(causal|spurious|incidental|unlabeled)\s*[,)]/i;

function isExempt(filePath) {
  if (!filePath) return false;
  const p = filePath.replace(/\\/g, '/');
  return EXEMPT_SUFFIXES.some((suffix) => p.endsWith(suffix));
}

const ruleFunction = (primary) => (root, result) => {
  const validOptions = stylelint.utils.validateOptions(result, ruleName, {
    actual: primary,
    possible: [true]
  });
  if (!validOptions) return;

  const source = root.source && root.source.input && root.source.input.file;
  if (isExempt(source)) return;

  root.walkDecls((decl) => {
    const prop = String(decl.prop || '').toLowerCase();
    if (!FILL_LIKE_PROPS.has(prop)) return;
    const value = String(decl.value || '');
    if (!ROLE_VAR_RE.test(value)) return;
    stylelint.utils.report({
      message: messages.rejected(decl.prop, value),
      node: decl,
      result,
      ruleName
    });
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
