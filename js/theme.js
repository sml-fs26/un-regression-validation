/* ==========================================================================
   Site-wide theme toggle (dark / light).

   Installs a fixed control at top-left and flips the class on <body>:
     body.theme-dark   → (default) navy palette
     body.theme-light  → neutral light palette via CSS variable overrides

   Plotly charts hard-code background / font / grid colours in each module's
   layout object. Rather than patching every call site, we wrap Plotly.newPlot
   and Plotly.react once — after the chart renders we Plotly.relayout it with
   the current theme's tokens. A theme-toggle click then re-runs relayout on
   every live plot in the DOM.

   Persistence: localStorage "un-games-theme"; wrapped in try/catch so private
   browsing does not break the site.
   ========================================================================== */

const STORAGE_KEY = "un-games-theme";
const MODES = ["dark", "light"];
const DEFAULT_MODE = "dark";

const TOKENS = {
  dark: {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font_color:    "#e6eaf2",
    grid_major:    "#233966",
    grid_minor:    "#11213f",
    axis_title:    "#94a3b8",
  },
  light: {
    paper_bgcolor: "#ffffff",
    plot_bgcolor:  "#ffffff",
    font_color:    "#1f2937",
    grid_major:    "#d1d5db",
    grid_minor:    "#e5e7eb",
    axis_title:    "#4b5563",
  },
};

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

export function currentTheme() { return readMode(); }
export function plotTokens() { return TOKENS[readMode()]; }

function relayoutPatch() {
  const t = plotTokens();
  return {
    paper_bgcolor: t.paper_bgcolor,
    plot_bgcolor:  t.plot_bgcolor,
    "font.color":  t.font_color,
    "xaxis.gridcolor":       t.grid_major,
    "xaxis.zerolinecolor":   t.grid_major,
    "xaxis.linecolor":       t.grid_major,
    "xaxis.title.font.color": t.axis_title,
    "xaxis.tickfont.color":  t.font_color,
    "yaxis.gridcolor":       t.grid_minor,
    "yaxis.zerolinecolor":   t.grid_minor,
    "yaxis.linecolor":       t.grid_minor,
    "yaxis.title.font.color": t.axis_title,
    "yaxis.tickfont.color":  t.font_color,
  };
}

function relayoutAll() {
  const Plotly = window.Plotly;
  if (!Plotly) return;
  const patch = relayoutPatch();
  for (const el of document.querySelectorAll(".js-plotly-plot")) {
    try { Plotly.relayout(el, patch); } catch (_) {}
  }
}

function applyMode(mode) {
  const body = document.body;
  for (const m of MODES) body.classList.toggle(`theme-${m}`, m === mode);
  relayoutAll();
}

function patchPlotly() {
  const Plotly = window.Plotly;
  if (!Plotly || Plotly.__unThemeWrapped) return;
  const origNewPlot = Plotly.newPlot.bind(Plotly);
  const origReact   = Plotly.react.bind(Plotly);
  const wrap = (fn) => function(el, ...rest) {
    const result = fn(el, ...rest);
    const after = () => { try { Plotly.relayout(el, relayoutPatch()); } catch (_) {} };
    if (result && typeof result.then === "function") {
      return result.then(r => { after(); return r; });
    }
    after();
    return result;
  };
  Plotly.newPlot = wrap(origNewPlot);
  Plotly.react   = wrap(origReact);
  Plotly.__unThemeWrapped = true;
}

export function installThemeToggle() {
  if (document.getElementById("theme-toggle")) return;
  patchPlotly();

  const host = document.createElement("div");
  host.id = "theme-toggle";
  host.className = "ui-toggle";
  host.setAttribute("role", "radiogroup");
  host.setAttribute("aria-label", "theme");
  host.innerHTML = `
    <span class="ui-toggle-label">theme</span>
    <button type="button" data-mode="dark"  aria-pressed="false">dark</button>
    <button type="button" data-mode="light" aria-pressed="false">light</button>
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
