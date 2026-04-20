/*
 * no-raw-font-family — custom Stylelint plugin.
 *
 * Enforcement of DESIGN.md §Typography system, line 113:
 *   "Any element using a font-family declaration outside this set
 *    fails the lint rule `no-raw-font-family`."
 *
 * The three permitted families are exposed as CSS variables in
 * src/lib/styles/tokens.css. This rule rejects any
 * `font-family:` or `font:` declaration whose value does not
 * reference one of:
 *   var(--font-mono)
 *   var(--font-serif)
 *   var(--font-sans)
 *   var(--type-*)   (the type-role shorthands, which already embed a family)
 *
 * The one exception is `tokens.css` itself — the file that defines
 * the three families' raw values. Its path is whitelisted below.
 */

import stylelint from 'stylelint';

const ruleName = 'un-regression/no-raw-font-family';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (value) =>
    `Raw font-family "${value}" is forbidden; reference var(--font-mono|serif|sans) or a var(--type-*) role.`
});

const meta = { url: 'https://example.invalid/un-regression/no-raw-font-family' };

// Files allowed to declare raw font-family values (the token definition itself).
const WHITELIST_SUFFIXES = ['src/lib/styles/tokens.css'];

function isWhitelisted(filePath) {
  if (!filePath) return false;
  return WHITELIST_SUFFIXES.some((suffix) => filePath.replace(/\\/g, '/').endsWith(suffix));
}

function referencesPermittedVar(value) {
  // Permit any of: var(--font-mono), var(--font-serif), var(--font-sans),
  // or var(--type-*) which is a `font` shorthand that already embeds a family.
  return /var\(\s*--(?:font-(?:mono|serif|sans)|type-[a-z0-9-]+)\s*[,)]/i.test(value);
}

const ruleFunction = (primary) => (root, result) => {
  const validOptions = stylelint.utils.validateOptions(result, ruleName, {
    actual: primary,
    possible: [true]
  });
  if (!validOptions) return;

  const source = root.source && root.source.input && root.source.input.file;
  if (isWhitelisted(source)) return;

  root.walkDecls(/^(font-family|font)$/i, (decl) => {
    const val = String(decl.value || '').trim();
    if (!val) return;
    // `font: inherit|initial|unset|revert|revert-layer` — let CSS-wide keywords pass.
    if (/^(inherit|initial|unset|revert|revert-layer)$/i.test(val)) return;

    // A `font:` shorthand may legally use any of the permitted vars; any
    // other form is a raw declaration that bypasses the type-role system.
    if (referencesPermittedVar(val)) return;

    stylelint.utils.report({
      message: messages.rejected(val),
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
