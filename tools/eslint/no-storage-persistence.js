/*
 * no-storage-persistence — custom ESLint rule.
 *
 * DESIGN.md DA #9 (line 916):
 *   "Every commitment is irrevocable in session. No localStorage, no
 *    IndexedDB, no cookies. No 'undo' button anywhere. ESLint rule
 *    no-storage-persistence bans localStorage. and indexedDB
 *    references. The <RoleColumn> store has no revoke() method."
 *
 * The rule inspects every identifier + member-expression and rejects:
 *   - any reference to `localStorage` (as identifier, `window.localStorage`,
 *     `globalThis.localStorage`)
 *   - any reference to `indexedDB` (as identifier, `window.indexedDB`)
 *   - any call to `document.cookie` reader or writer
 *
 * `sessionStorage` is explicitly PERMITTED — <ScrollGate> uses it for
 * its `tutorialCompleted` flag (DESIGN.md line 342). The rule only
 * bans the three storage channels DA #9 forbids.
 */

'use strict';

const FORBIDDEN_GLOBALS = new Set(['localStorage', 'indexedDB']);

function isCookieAccess(node) {
  // document.cookie (either read or write).
  return (
    node &&
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.property &&
    node.property.type === 'Identifier' &&
    node.property.name === 'cookie' &&
    node.object &&
    ((node.object.type === 'Identifier' && node.object.name === 'document') ||
      (node.object.type === 'MemberExpression' &&
        node.object.property &&
        node.object.property.type === 'Identifier' &&
        node.object.property.name === 'document'))
  );
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow localStorage, IndexedDB, and document.cookie references (DA #9, irrevocable in session).',
      recommended: true
    },
    schema: [],
    messages: {
      forbiddenLocal:
        'Reference to `{{name}}` is forbidden by DA #9 (DESIGN.md line 916). ' +
        'Use sessionStorage or the in-memory Svelte stores instead.',
      forbiddenCookie:
        '`document.cookie` access is forbidden by DA #9 (DESIGN.md line 916). ' +
        'Use sessionStorage or in-memory stores instead.'
    }
  },
  create(context) {
    return {
      // `localStorage`, `indexedDB` used as bare identifiers.
      Identifier(node) {
        if (!FORBIDDEN_GLOBALS.has(node.name)) return;
        // Skip the property name of a member expression (`foo.localStorage`
        // is fine at the identifier level; we catch window.localStorage
        // via the member-expression check below).
        const parent = node.parent;
        if (
          parent &&
          parent.type === 'MemberExpression' &&
          parent.property === node &&
          !parent.computed
        ) {
          return;
        }
        // Skip object-literal keys: `{ localStorage: 'foo' }` is a
        // property label, not a reference.
        if (parent && parent.type === 'Property' && parent.key === node && !parent.computed) {
          return;
        }
        context.report({ node, messageId: 'forbiddenLocal', data: { name: node.name } });
      },
      // window.localStorage, globalThis.indexedDB, etc.
      MemberExpression(node) {
        if (isCookieAccess(node)) {
          context.report({ node, messageId: 'forbiddenCookie' });
          return;
        }
        if (
          node.property &&
          node.property.type === 'Identifier' &&
          FORBIDDEN_GLOBALS.has(node.property.name) &&
          !node.computed
        ) {
          context.report({
            node,
            messageId: 'forbiddenLocal',
            data: { name: node.property.name }
          });
        }
      }
    };
  }
};
