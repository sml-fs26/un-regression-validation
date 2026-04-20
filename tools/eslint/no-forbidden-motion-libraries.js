/*
 * no-forbidden-motion-libraries — custom ESLint rule.
 *
 * Enforcement of DESIGN.md §Global architecture, line 26:
 *   "Forbidden libraries (enforced via `package.json` ESLint rule):
 *    framer-motion, gsap, motion, lottie-web, popmotion,
 *    react-spring, auto-animate, aos, anything matching
 *    /animat/i in dependency name."
 *
 * DA #1 (emit-don't-perform) forbids importing any JavaScript motion
 * library. This rule inspects every import statement and every
 * dynamic `import()` expression and rejects the above names.
 *
 * A companion script (tools/forbidden-libraries-check.js) scans
 * package.json dependencies for the same patterns so that a
 * forbidden library cannot sneak in via a direct install.
 */

'use strict';

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

// Any package whose bare name (without @scope/) matches /animat/i is
// rejected as well. DESIGN.md: "anything matching /animat/i in
// dependency name."
const ANIMAT_RE = /animat/i;

function isForbidden(name) {
  if (!name || typeof name !== 'string') return false;
  if (FORBIDDEN_EXACT.has(name)) return true;
  // Strip a leading @scope/ so `/animat/i` matches the package's own name.
  const bare = name.replace(/^@[^/]+\//, '');
  return ANIMAT_RE.test(bare);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing motion libraries forbidden by DA #1 (emit-don\'t-perform).',
      recommended: true
    },
    schema: [],
    messages: {
      forbidden:
        'Import of "{{name}}" is forbidden by DA #1 (DESIGN.md §Global architecture, line 26). The site emits, it does not perform.'
    }
  },
  create(context) {
    function check(node, name) {
      if (isForbidden(name)) {
        context.report({ node, messageId: 'forbidden', data: { name } });
      }
    }
    return {
      ImportDeclaration(node) {
        check(node, node.source && node.source.value);
      },
      ImportExpression(node) {
        if (node.source && node.source.type === 'Literal') {
          check(node, node.source.value);
        }
      },
      CallExpression(node) {
        // require('framer-motion') and similar.
        if (
          node.callee &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal'
        ) {
          check(node, node.arguments[0].value);
        }
      }
    };
  }
};
