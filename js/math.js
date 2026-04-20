/* ==========================================================================
   KaTeX auto-render helper.
   Pages load KaTeX + its auto-render contrib via <script> in the head. This
   module exports a single `renderMath(root)` that runs auto-render on a DOM
   subtree, for widgets that inject HTML after initial page render.
   ========================================================================== */

const DELIMS = [
  { left: "$$", right: "$$", display: true },
  { left: "\\[", right: "\\]", display: true },
  { left: "$",  right: "$",  display: false },
  { left: "\\(", right: "\\)", display: false },
];

/** Run KaTeX auto-render on a root element. Safe to call if KaTeX isn't loaded yet. */
export function renderMath(root) {
  if (!root) return;
  const fn = globalThis.renderMathInElement;
  if (typeof fn !== "function") {
    // KaTeX auto-render hasn't loaded yet; defer.
    window.addEventListener("load", () => {
      try { globalThis.renderMathInElement?.(root, { delimiters: DELIMS, throwOnError: false }); }
      catch (_) {}
    }, { once: true });
    return;
  }
  try { fn(root, { delimiters: DELIMS, throwOnError: false }); }
  catch (_) {}
}
