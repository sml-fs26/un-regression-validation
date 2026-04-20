/*
 * motionWatcher.ts — DEV-mode inline-style motion detector.
 *
 * DESIGN.md §Cross-cutting signature #8, "Dev-mode runtime check" (line 326):
 *   "MutationObserver on document.body watches for any element gaining a
 *    style attribute with `transition` or `animation`; logs console.error
 *    and surfaces a dev overlay. Inert in production."
 *
 * Invocation: src/routes/+layout.svelte calls `startMotionWatcher()`
 * inside an `if (import.meta.env.DEV)` branch during onMount. No-op in
 * production bundles — the Vite tree-shaker drops the dead branch, and
 * this file never ships in non-DEV builds.
 *
 * Detection rule (matches ESLint's `no-css-animation-over-200ms`):
 *   the style string contains `transition`, `transition-duration`,
 *   `animation`, or `animation-duration` AND resolves to >200ms OR an
 *   empty string that grants motion via a named animation.
 * For runtime simplicity we flag ANY inline `transition:` or
 * `animation:` declaration on any body descendant; authored components
 * never use inline style for motion (all three permitted motions live
 * in `.svelte` `<style>` blocks).
 */

let observer: MutationObserver | null = null;

const MOTION_PROP_RE = /\b(transition|animation)\s*(-duration)?\s*:/i;

function onMutation(mutations: MutationRecord[]): void {
  for (const m of mutations) {
    if (m.type !== 'attributes' || m.attributeName !== 'style') continue;
    const el = m.target as HTMLElement;
    const style = el.getAttribute('style') ?? '';
    if (MOTION_PROP_RE.test(style)) {
      // eslint-disable-next-line no-console
      console.error(
        '[motion-watcher] inline-style motion declaration detected ' +
          `on <${el.tagName.toLowerCase()}>: "${style}". ` +
          'DA #1 forbids runtime-added motion; declare it in a .svelte ' +
          '<style> block gated by data-permitted-motion=...'
      );
      surfaceDevOverlay(el, style);
    }
  }
}

function surfaceDevOverlay(el: HTMLElement, style: string): void {
  if (typeof document === 'undefined') return;
  let overlay = document.getElementById('motion-watcher-dev-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'motion-watcher-dev-overlay';
    overlay.setAttribute('data-testid', 'motion-watcher-dev-overlay');
    Object.assign(overlay.style, {
      position: 'fixed',
      left: '8px',
      bottom: '8px',
      zIndex: '9999',
      background: '#B23A3A',
      color: '#fff',
      padding: '6px 8px',
      font: '11px/1.3 ui-monospace, monospace',
      maxWidth: '60vw',
      whiteSpace: 'pre-wrap',
      pointerEvents: 'none'
    });
    document.body.appendChild(overlay);
  }
  overlay.textContent =
    `motion-watcher: inline-style motion on <${el.tagName.toLowerCase()}>\n` + style;
}

export function startMotionWatcher(): () => void {
  if (typeof document === 'undefined') return () => {};
  if (observer) return stopMotionWatcher;
  observer = new MutationObserver(onMutation);
  observer.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
  return stopMotionWatcher;
}

export function stopMotionWatcher(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}
