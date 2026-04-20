/* ==========================================================================
   Widget: Top Correlations bar chart.
   Two view modes:
     - "overall":     top N of 493, ordered by |r|. Spurious features usually
                      fall below the top 30, so the role mix is mostly
                      causal + incidental (the first pedagogical point).
     - "per-role":    top K of each role, side by side. Makes visible the
                      second pedagogical point: spurious features still reach
                      |r| > 0.4 even though they are literal nonsense — with
                      333 spurious features, the strongest correlate is not
                      zero, it is surprising.
   ========================================================================== */

import { ROLE_COLORS, column, pearson, logSafe } from "./data.js";

const ROLES = ["causal", "spurious", "incidental"];
const ROLE_LABEL = { causal: "causal", spurious: "spurious", incidental: "incidental" };

function rankFeatures(bundle) {
  const { rows, columns, roleOf, target } = bundle;
  const yLogGdp = column(rows, target).map(logSafe);
  return columns
    .map(col => ({
      name: col,
      role: roleOf[col] ?? "incidental",
      r:    pearson(column(rows, col), yLogGdp),
    }))
    .filter(d => Number.isFinite(d.r))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}

function renderOverall(host, ranked, topN) {
  const slice = ranked.slice(0, topN).reverse();
  const data = [{
    type: "bar",
    orientation: "h",
    x: slice.map(d => Math.abs(d.r)),
    y: slice.map(d => d.name),
    marker: {
      color: slice.map(d => ROLE_COLORS[d.role] ?? ROLE_COLORS.incidental),
      line:  { width: 0 },
    },
    hovertemplate:
      "<b>%{y}</b><br>|r| = %{x:.3f}<br>role: %{customdata}<extra></extra>",
    customdata: slice.map(d => d.role),
  }];
  const layout = sharedLayout(Math.max(420, 22 * slice.length + 120));
  Plotly.react(host, data, layout, { displayModeBar: false, responsive: true });
}

function renderPerRole(host, ranked, topK) {
  // Build one bar group per role; concatenate into a single horizontal chart
  // with explicit role dividers (hairline y-axis tick labels).
  const blocks = ROLES.map(role => {
    const top = ranked.filter(d => d.role === role).slice(0, topK);
    return { role, top };
  });

  const ys = [], xs = [], colors = [], labels = [];
  // Reversed so the first (largest) within each role group appears at top visually.
  for (const { role, top } of blocks) {
    for (const d of top.slice().reverse()) {
      ys.push(d.name);
      xs.push(Math.abs(d.r));
      colors.push(ROLE_COLORS[role]);
      labels.push(role);
    }
  }

  const data = [{
    type: "bar",
    orientation: "h",
    x: xs, y: ys,
    marker: { color: colors, line: { width: 0 } },
    hovertemplate:
      "<b>%{y}</b><br>|r| = %{x:.3f}<br>role: %{customdata}<extra></extra>",
    customdata: labels,
  }];

  // Role-divider annotations: horizontal bands + label on the right.
  const shapes = [];
  const annotations = [];
  let cursor = 0;
  for (const { role, top } of blocks) {
    const n = top.length;
    if (n === 0) continue;
    const y0 = cursor - 0.5;
    const y1 = cursor + n - 0.5;
    shapes.push({
      type: "rect", xref: "paper", yref: "y",
      x0: 0, x1: 1, y0, y1,
      fillcolor: ROLE_COLORS[role], opacity: 0.05, line: { width: 0 },
      layer: "below",
    });
    annotations.push({
      xref: "paper", yref: "y",
      x: 1.0, y: (y0 + y1) / 2,
      xanchor: "right", yanchor: "middle",
      text: `<b>${ROLE_LABEL[role].toUpperCase()}</b>`,
      showarrow: false,
      font: { family: "JetBrains Mono, monospace", size: 11, color: ROLE_COLORS[role] },
    });
    cursor += n;
  }

  const layout = sharedLayout(Math.max(520, 22 * ys.length + 120));
  layout.shapes = shapes;
  layout.annotations = annotations;
  Plotly.react(host, data, layout, { displayModeBar: false, responsive: true });
}

function sharedLayout(height) {
  return {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 260, r: 110, t: 15, b: 45 },
    height,
    xaxis: {
      title: { text: "|Pearson r| with log₁₀(GDP per capita)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      range: [0, 1],
    },
    yaxis: {
      automargin: true,
      tickfont: { size: 11, family: "JetBrains Mono, monospace" },
      gridcolor: "#11213f",
    },
    bargap: 0.28,
  };
}

/**
 * Mount the bar chart with a view-mode toggle.
 * `host` is an empty container element; this function injects the controls
 * and the plot host, then keeps them in sync with user toggles.
 */
export function mountTopCorrelations(host, bundle, opts = {}) {
  const defaultK = opts.topK ?? 15;
  const defaultN = opts.topN ?? 30;

  host.innerHTML = `
    <div class="controls">
      <label>view:
        <select data-view>
          <option value="per-role" selected>top of each role</option>
          <option value="overall">top overall</option>
        </select>
      </label>
      <label>per role K:
        <select data-topk>
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="15" selected>15</option>
          <option value="25">25</option>
        </select>
      </label>
      <label>overall N:
        <select data-topn>
          <option value="15">15</option>
          <option value="30" selected>30</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </label>
    </div>
    <div data-plot class="plot"></div>
    <div data-caption class="muted mono" style="margin-top: .75rem; font-size: .82rem;"></div>
  `;

  const $view    = host.querySelector("[data-view]");
  const $topk    = host.querySelector("[data-topk]");
  const $topn    = host.querySelector("[data-topn]");
  const $plot    = host.querySelector("[data-plot]");
  const $caption = host.querySelector("[data-caption]");

  const ranked = rankFeatures(bundle);

  // Precompute the strongest |r| per role for the caption.
  const topByRole = Object.fromEntries(
    ROLES.map(role => [role, (ranked.find(d => d.role === role)?.r) ?? 0])
  );

  function render() {
    const mode = $view.value;
    if (mode === "overall") {
      const n = +$topn.value;
      renderOverall($plot, ranked, n);
      $topn.disabled = false;
      $topk.disabled = true;
      $caption.innerHTML =
        `Top ${n} of 493 features by |r|. ` +
        `<span style="color:${ROLE_COLORS.spurious}">spurious</span> features rarely reach the overall top-30, but ` +
        `their strongest (|r| ≈ ${Math.abs(topByRole.spurious).toFixed(2)}) is higher than you might guess from noise.`;
    } else {
      const k = +$topk.value;
      renderPerRole($plot, ranked, k);
      $topn.disabled = true;
      $topk.disabled = false;
      $caption.innerHTML =
        `Top ${k} of each role. ` +
        `Strongest by role: ` +
        ROLES.map(r => `<span class="mono" style="color:${ROLE_COLORS[r]}">${r}</span> |r|≈${Math.abs(topByRole[r]).toFixed(2)}`).join(" · ") +
        `. <strong>Causal</strong> and <strong>incidental</strong> features are nearly indistinguishable by correlation alone; ` +
        `even the strongest <strong style="color:${ROLE_COLORS.spurious}">spurious</strong> feature, which is literal nonsense, ` +
        `still outranks roughly half of all causal features.`;
    }
  }

  $view.addEventListener("change", render);
  $topk.addEventListener("change", render);
  $topn.addEventListener("change", render);
  render();

  return ranked;
}

// Backwards-compatible wrapper used by 01_explore.html (old call site).
export function renderTopCorrelations(host, bundle, opts = {}) {
  return mountTopCorrelations(host, bundle, opts);
}
