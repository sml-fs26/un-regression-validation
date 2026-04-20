/* ==========================================================================
   Widget: Top Correlations bar chart.
   Ranks all features by |Pearson r| with log-GDP, coloured by role.
   ========================================================================== */

import { ROLE_COLORS, column, pearson, logSafe } from "./data.js";

export function renderTopCorrelations(host, { rows, columns, roleOf, target }, opts = {}) {
  const topN = opts.topN ?? 30;

  const yGdp    = column(rows, target);
  const yLogGdp = yGdp.map(logSafe);

  // Rank features by |Pearson r| against log-GDP.
  const ranked = columns
    .map(col => ({
      name: col,
      role: roleOf[col] ?? "incidental",
      r:    pearson(column(rows, col), yLogGdp),
    }))
    .filter(d => Number.isFinite(d.r))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));

  const slice = ranked.slice(0, topN).reverse(); // reverse so largest appears at top of horiz bar

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
      "<b>%{y}</b><br>|r| = %{x:.3f}<br>" +
      "role: %{customdata}<extra></extra>",
    customdata: slice.map(d => d.role),
  }];

  const layout = {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 240, r: 40, t: 20, b: 40 },
    height: 620,
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
    bargap: 0.25,
  };

  Plotly.newPlot(host, data, layout, { displayModeBar: false, responsive: true });

  // Summary under the chart.
  const roleCounts = { causal: 0, spurious: 0, incidental: 0 };
  for (const d of ranked.slice(0, topN)) roleCounts[d.role] = (roleCounts[d.role] ?? 0) + 1;
  const caption = document.createElement("div");
  caption.className = "muted mono";
  caption.style.marginTop = ".75rem";
  caption.style.fontSize  = ".82rem";
  caption.textContent =
    `Top ${topN}: ${roleCounts.causal} causal · ${roleCounts.spurious} spurious · ` +
    `${roleCounts.incidental} incidental.`;
  host.parentElement.appendChild(caption);

  return ranked;
}
