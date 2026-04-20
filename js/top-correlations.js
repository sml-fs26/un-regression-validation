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
import { renderMath } from "./math.js";

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
 * Mount the bar chart. Always renders the top 100 of 493 by |r|, role-colored.
 * No toggles: the ranked list speaks for itself.
 */
export function mountTopCorrelations(host, bundle, opts = {}) {
  const topN = opts.topN ?? 100;

  host.innerHTML = `
    <div data-plot class="plot"></div>
    <div data-caption class="muted mono" style="margin-top: .75rem; font-size: .82rem;"></div>
  `;
  const $plot    = host.querySelector("[data-plot]");
  const $caption = host.querySelector("[data-caption]");

  const ranked = rankFeatures(bundle);
  renderOverall($plot, ranked, topN);

  const roleCounts = { causal: 0, spurious: 0, incidental: 0 };
  for (const d of ranked.slice(0, topN)) roleCounts[d.role] = (roleCounts[d.role] ?? 0) + 1;
  const topSpur = ranked.find(d => d.role === "spurious");

  $caption.innerHTML =
    `Top ${topN} of 493 features by \\(|r|\\) with \\(\\log_{10}(\\text{GDP per capita})\\). ` +
    `<span style="color:${ROLE_COLORS.causal}">${roleCounts.causal} causal</span> · ` +
    `<span style="color:${ROLE_COLORS.spurious}">${roleCounts.spurious} spurious</span> · ` +
    `<span style="color:${ROLE_COLORS.incidental}">${roleCounts.incidental} incidental</span>. ` +
    (topSpur
      ? `Strongest spurious feature in the list (<span class="mono">${topSpur.name}</span>) reaches \\(|r| \\approx ${Math.abs(topSpur.r).toFixed(2)}\\).`
      : "");
  renderMath($caption);

  return ranked;
}

// Backwards-compatible wrapper used by 01_explore.html (old call site).
export function renderTopCorrelations(host, bundle, opts = {}) {
  return mountTopCorrelations(host, bundle, opts);
}
