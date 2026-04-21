/* ==========================================================================
   Site-wide text-density toggle (detailed / overview).

   Mirrors depth-toggle.js for the math disclosure blocks — this one hides or
   shows descriptive prose instead. Flip class on <body>:
     body.density-detailed  → (default) everything visible
     body.density-overview  → titles + diagrams only; prose hidden via CSS

   The CSS rules that do the hiding live in css/style.css under the
   `body.density-overview` selector block. This module owns only the control
   UI and the persisted state.
   ========================================================================== */

const STORAGE_KEY = "un-games-density";
const MODES = ["detailed", "overview"];
const DEFAULT_MODE = "detailed";

function readMode() {
  try {
    const v = window.localStorage?.getItem(STORAGE_KEY);
    if (MODES.includes(v)) return v;
  } catch (_) { /* private browsing */ }
  return DEFAULT_MODE;
}

function writeMode(mode) {
  try { window.localStorage?.setItem(STORAGE_KEY, mode); } catch (_) {}
}

function applyMode(mode) {
  const body = document.body;
  for (const m of MODES) body.classList.toggle(`density-${m}`, m === mode);
}

export function installDensityToggle() {
  if (document.getElementById("density-toggle")) return;
  const host = document.createElement("div");
  host.id = "density-toggle";
  host.className = "ui-toggle";
  host.setAttribute("role", "radiogroup");
  host.setAttribute("aria-label", "text density");
  host.innerHTML = `
    <span class="ui-toggle-label">text</span>
    <button type="button" data-mode="detailed" aria-pressed="false">detailed</button>
    <button type="button" data-mode="overview" aria-pressed="false">overview</button>
  `;
  document.body.appendChild(host);

  const setActive = (mode) => {
    for (const btn of host.querySelectorAll("button")) {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
  };

  host.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-mode]");
    if (!btn) return;
    const mode = btn.dataset.mode;
    writeMode(mode);
    applyMode(mode);
    setActive(mode);
  });

  const initial = readMode();
  applyMode(initial);
  setActive(initial);
}
