/*
 * no-keyframes — custom Stylelint plugin.
 *
 * DESIGN.md §CC#8 line 325:
 *   "Custom Stylelint rule `no-keyframes`: bans `@keyframes` entirely
 *    except in three named files (`/src/lib/components/ch2/HeartbeatPulse.svelte`,
 *    `/src/lib/components/ch3/StrikethroughDraw.svelte`,
 *    `/src/lib/components/ch4/RoleStrokeHover.svelte`)."
 *
 * Step 2 ships the first of these (HeartbeatPulse.svelte). Steps 3 and
 * 4 (per the Build order) ship the other two. The rule is already
 * active site-wide so a stray @keyframes added in a future step is a
 * CI fail, not a surprise.
 */

import stylelint from 'stylelint';

const ruleName = 'un-regression/no-keyframes';

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (name) =>
    `@keyframes "${name}" is forbidden outside the three allowlisted files ` +
    `(HeartbeatPulse.svelte, StrikethroughDraw.svelte, RoleStrokeHover.svelte). ` +
    `DA #1 (emit-don't-perform). See DESIGN.md §CC#8.`
});

const meta = { url: 'https://example.invalid/un-regression/no-keyframes' };

// Path suffixes (POSIX-normalized) allowed to declare @keyframes.
const ALLOWED_SUFFIXES = [
  'src/lib/components/ch2/HeartbeatPulse.svelte',
  'src/lib/components/ch3/StrikethroughDraw.svelte',
  'src/lib/components/ch4/RoleStrokeHover.svelte'
];

function isAllowedPath(filePath) {
  if (!filePath) return false;
  const normalized = filePath.replace(/\\/g, '/');
  return ALLOWED_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

const ruleFunction = (primary) => (root, result) => {
  const validOptions = stylelint.utils.validateOptions(result, ruleName, {
    actual: primary,
    possible: [true]
  });
  if (!validOptions) return;

  const source = root.source && root.source.input && root.source.input.file;
  if (isAllowedPath(source)) return;

  root.walkAtRules((atRule) => {
    // Match @keyframes and the vendor-prefixed variants.
    if (/^-?(?:-\w+-)?keyframes$/i.test(atRule.name)) {
      stylelint.utils.report({
        message: messages.rejected(atRule.params),
        node: atRule,
        result,
        ruleName
      });
    }
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
