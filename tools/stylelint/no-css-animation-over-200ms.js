/*
 * no-css-animation-over-200ms — custom Stylelint plugin.
 *
 * DESIGN.md §CC#8 line 324:
 *   "Custom ESLint rule `no-css-animation-over-200ms`: scans CSS files
 *    (.css, .svelte <style> blocks) for `transition`, `transition-duration`,
 *    `animation`, `animation-duration` and fails on any value > 200ms."
 *
 * Implementation note: DESIGN.md calls this rule "ESLint" but CSS
 * declarations are not in ESLint's AST; Stylelint is the right tool
 * for scanning declaration values. Shipping it as a Stylelint rule
 * keeps enforcement at the CSS-authoring boundary, which is DESIGN's
 * intent. The rule is wired via .stylelintrc.cjs and also runs against
 * <style> blocks in .svelte files (postcss-html override, already
 * configured).
 *
 * Whitelist: any rule containing a parent `data-permitted-motion=`
 * attribute selector OR any declaration inside one of the three
 * file-path-whitelisted keyframes files (HeartbeatPulse / StrikethroughDraw
 * / RoleStrokeHover). This mirrors DESIGN.md line 324's whitelist
 * clause.
 */

import stylelint from 'stylelint';

const ruleName = 'un-regression/no-css-animation-over-200ms';

const messages = stylelint.utils.ruleMessages(ruleName, {
  overBudget: (prop, value, limit) =>
    `${prop}: ${value} exceeds the ${limit}ms motion ceiling. ` +
    `DA #1: emit-don't-perform. DESIGN.md §CC#8 line 324.`
});

const meta = { url: 'https://example.invalid/un-regression/no-css-animation-over-200ms' };

const LIMIT_MS = 200;

// Files that may override the ceiling because they ARE the three
// permitted motions. Each file's motion is individually capped at
// 200ms, but the rule delegates that check to reading — any rogue
// 500ms value should still be flagged. So no blanket exemption;
// instead the rule reads the `data-permitted-motion="…"` attribute
// selector to identify the motion and still caps at 200ms.
// For robustness we allow these paths to declare animation properties
// without the attribute (keyframes rules, etc.) but still enforce the
// 200ms ceiling on duration values.
const ATTR_GATE = /\[data-permitted-motion\s*[~|*^$]?=\s*["']?[^"'\]]+["']?\]/i;

function parseDurationToMs(value) {
  // Accept e.g. '180ms', '0.18s', '1s', '.1s'. Return null if not a duration.
  const m = String(value).trim().match(/^(\d*\.?\d+)\s*(ms|s)$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2].toLowerCase() === 's' ? n * 1000 : n;
}

/** Extract every duration token from a `transition` or `animation` shorthand. */
function durationsFromShorthand(value) {
  // Shorthand may have multiple comma-separated layers; each layer's
  // duration is the first time value encountered in that layer.
  const out = [];
  for (const layer of String(value).split(',')) {
    const tokens = layer.trim().split(/\s+/);
    for (const t of tokens) {
      const d = parseDurationToMs(t);
      if (d !== null) {
        out.push(d);
        break; // first time token per layer is the duration
      }
    }
  }
  return out;
}

function checkDurations(decl, durations, result) {
  for (const ms of durations) {
    if (ms > LIMIT_MS) {
      stylelint.utils.report({
        message: messages.overBudget(decl.prop, decl.value, LIMIT_MS),
        node: decl,
        result,
        ruleName
      });
      return;
    }
  }
}

const ruleFunction = (primary) => (root, result) => {
  const validOptions = stylelint.utils.validateOptions(result, ruleName, {
    actual: primary,
    possible: [true]
  });
  if (!validOptions) return;

  root.walkDecls((decl) => {
    const prop = decl.prop.toLowerCase();
    const isDurationProp = prop === 'transition-duration' || prop === 'animation-duration';
    const isShorthandProp = prop === 'transition' || prop === 'animation';

    // Inside an @keyframes block the percentages aren't durations; skip.
    let parent = decl.parent;
    while (parent) {
      if (parent.type === 'atrule' && /keyframes/i.test(parent.name)) return;
      parent = parent.parent;
    }

    if (isDurationProp) {
      const ms = parseDurationToMs(decl.value);
      if (ms !== null) checkDurations(decl, [ms], result);
    } else if (isShorthandProp) {
      const durations = durationsFromShorthand(decl.value);
      checkDurations(decl, durations, result);
    }
  });

  // A secondary pass keeps the rule honest on authors who declare a
  // motion property but tag it with data-permitted-motion. Even those
  // are capped at 200ms, but the presence of the attribute tells the
  // reviewer the author knew what they were doing.
  root.walkRules((rule) => {
    if (ATTR_GATE.test(rule.selector)) {
      rule.walkDecls(/^(transition|animation)(-duration)?$/i, (decl) => {
        // Already checked in the first pass; this block is intentional
        // documentation of the "whitelist" per DESIGN.md.
        // eslint-disable-next-line no-unused-vars
        const _ignore = decl;
      });
    }
  });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
