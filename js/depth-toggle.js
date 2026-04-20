/* ==========================================================================
   Proposal 6 (preview): depth toggle for math.

   Injects a fixed three-state control (intuitive / technical / deep) in the
   top-left of the viewport. A single class on <body> flips the visibility
   of every <details class="depth-block" data-depth="..."> on the page:

     body.depth-intuitive  → only intuitive-depth content visible
     body.depth-technical  → intuitive + technical visible
     body.depth-deep       → everything visible

   The current mode is persisted in localStorage (key `un-games-depth`)
   inside a try/catch so private-browsing doesn't break the site.

   On chapters that use this module, each formal math block should be
   wrapped in:

     <details class="depth-block" data-depth="technical" open>
       <summary>the math</summary>
       <div class="depth-body"> … $$ … $$ … </div>
     </details>
   ========================================================================== */

const STORAGE_KEY = "un-games-depth";
const MODES = ["intuitive", "technical", "deep"];
const DEFAULT_MODE = "technical";

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
  for (const m of MODES) body.classList.toggle(`depth-${m}`, m === mode);
  // Open visible details blocks so the content doesn't hide behind an extra
  // click; leave the summary available to re-fold if the reader wants.
  for (const el of document.querySelectorAll("details.depth-block")) {
    const d = el.dataset.depth || "intuitive";
    const show =
      (mode === "deep") ||
      (mode === "technical" && d !== "deep") ||
      (mode === "intuitive" && d === "intuitive");
    if (show) el.setAttribute("open", "");
  }
}

export function installDepthToggle() {
  if (document.getElementById("depth-toggle")) return; // idempotent
  const host = document.createElement("div");
  host.id = "depth-toggle";
  host.setAttribute("role", "radiogroup");
  host.setAttribute("aria-label", "math depth");
  host.innerHTML = `
    <span class="depth-label">math</span>
    <button type="button" data-mode="intuitive" aria-pressed="false">intuitive</button>
    <button type="button" data-mode="technical" aria-pressed="false">technical</button>
    <button type="button" data-mode="deep"      aria-pressed="false">deep</button>
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
