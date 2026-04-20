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

/* ==========================================================================
   Proposal 3 (preview): role-stratified beeswarm.
   Three horizontal beeswarms (one per role) sharing the same |r| axis. A
   vertical dashed line marks the best spurious feature; a second marks the
   best causal — so the "spurious reaches into the causal distribution"
   thesis is visible at a glance.
   ========================================================================== */
function beeswarmJitter(values, binWidth = 0.01, bandHeight = 0.32) {
  // Deterministic stacked-beeswarm y-offsets: bin by |r|, for each bin stagger
  // points symmetrically around 0. Points land on fixed rows so the swarm
  // stays tidy and does not re-jitter on every render.
  const bins = new Map();
  const yOffsets = new Array(values.length);
  const order = values
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v);
  for (const { v, i } of order) {
    const key = Math.round(v / binWidth);
    const k = bins.get(key) ?? 0;
    bins.set(key, k + 1);
    // 0, +1, -1, +2, -2, ... so the swarm is symmetric around y = 0.
    const sign = k === 0 ? 0 : (k % 2 === 1 ? 1 : -1);
    const rank = Math.floor((k + 1) / 2);
    yOffsets[i] = sign * rank;
  }
  const maxRank = Math.max(1, ...yOffsets.map(Math.abs));
  return yOffsets.map(o => (o / maxRank) * bandHeight);
}

function renderBeeswarm(host, ranked) {
  // One horizontal band per role, centered at y = 0, 1, 2.
  const ROLE_Y = { causal: 2, incidental: 1, spurious: 0 };
  const ROLE_ORDER = ["causal", "incidental", "spurious"];

  const byRole = { causal: [], incidental: [], spurious: [] };
  for (const d of ranked) {
    (byRole[d.role] ?? byRole.incidental).push(d);
  }

  const traces = [];
  for (const role of ROLE_ORDER) {
    const pts = byRole[role];
    if (!pts.length) continue;
    const xs = pts.map(d => Math.abs(d.r));
    const jitter = beeswarmJitter(xs, 0.012, 0.38);
    const ys = jitter.map(j => ROLE_Y[role] + j);
    traces.push({
      type: "scatter",
      mode: "markers",
      x: xs, y: ys,
      text: pts.map(d => d.name),
      customdata: pts.map(d => d.role),
      name: role,
      marker: {
        color: ROLE_COLORS[role],
        size: 7,
        opacity: 0.78,
        line: { width: 0.5, color: "#0a1830" },
      },
      hovertemplate:
        "<b>%{text}</b><br>|r| = %{x:.3f}<br>role: %{customdata}<extra></extra>",
      showlegend: false,
    });
  }

  // Pedagogy lines: best spurious |r| (the headline), best causal for contrast.
  const bestSpur = ranked.find(d => d.role === "spurious");
  const bestCaus = ranked.find(d => d.role === "causal");
  const shapes = [];
  const annotations = [];
  if (bestSpur) {
    const x = Math.abs(bestSpur.r);
    shapes.push({
      type: "line", xref: "x", yref: "paper",
      x0: x, x1: x, y0: 0, y1: 1,
      line: { color: ROLE_COLORS.spurious, width: 1.3, dash: "dash" },
    });
    annotations.push({
      xref: "x", yref: "paper", x, y: 1.02, xanchor: "center",
      text: `best spurious |r| = ${x.toFixed(2)}`,
      showarrow: false,
      font: { color: ROLE_COLORS.spurious, family: "JetBrains Mono, monospace", size: 10 },
    });
  }
  if (bestCaus) {
    const x = Math.abs(bestCaus.r);
    shapes.push({
      type: "line", xref: "x", yref: "paper",
      x0: x, x1: x, y0: 0, y1: 1,
      line: { color: ROLE_COLORS.causal, width: 1, dash: "dot" },
    });
    annotations.push({
      xref: "x", yref: "paper", x, y: 1.08, xanchor: "center",
      text: `best causal |r| = ${x.toFixed(2)}`,
      showarrow: false,
      font: { color: ROLE_COLORS.causal, family: "JetBrains Mono, monospace", size: 10 },
    });
  }

  // Role count labels inside each band.
  for (const role of ROLE_ORDER) {
    const n = byRole[role].length;
    annotations.push({
      xref: "paper", yref: "y",
      x: 0.005, y: ROLE_Y[role],
      xanchor: "left", yanchor: "middle",
      text: `<b>${role.toUpperCase()}</b> · ${n}`,
      showarrow: false,
      font: { color: ROLE_COLORS[role], family: "JetBrains Mono, monospace", size: 11 },
    });
  }

  const layout = {
    paper_bgcolor: "#0a1830",
    plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 20, r: 20, t: 35, b: 55 },
    height: 440,
    xaxis: {
      title: { text: "|Pearson r| with log₁₀(GDP per capita)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      range: [0, 1],
    },
    yaxis: {
      tickvals: [0, 1, 2],
      ticktext: ["", "", ""],
      range: [-0.6, 2.6],
      gridcolor: "#11213f",
      zerolinecolor: "#11213f",
      showgrid: false,
      fixedrange: true,
    },
    shapes,
    annotations,
    hovermode: "closest",
    showlegend: false,
  };

  Plotly.react(host, traces, layout, { displayModeBar: false, responsive: true });
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
 * Mount the correlations widget. Default view is the role-stratified
 * beeswarm (Proposal 3); a small toggle keeps the original ranked-bar view
 * available for readers who want the old behaviour.
 */
export function mountTopCorrelations(host, bundle, opts = {}) {
  const topN = opts.topN ?? 100;

  host.innerHTML = `
    <div class="controls" data-view-toggle style="gap:.5rem; margin-bottom:.75rem;">
      <label style="color: var(--text-dim);">view:</label>
      <button type="button" data-view="beeswarm">role-stratified beeswarm</button>
      <button type="button" data-view="overall">top-${topN} ranked bars</button>
      <button type="button" data-view="per-role">per-role bars</button>
    </div>
    <div data-plot class="plot"></div>
    <div data-caption class="muted mono" style="margin-top: .75rem; font-size: .82rem;"></div>
  `;
  const $plot    = host.querySelector("[data-plot]");
  const $caption = host.querySelector("[data-caption]");
  const $toggle  = host.querySelector("[data-view-toggle]");

  const ranked = rankFeatures(bundle);

  const roleCountsAll = { causal: 0, spurious: 0, incidental: 0 };
  for (const d of ranked) roleCountsAll[d.role] = (roleCountsAll[d.role] ?? 0) + 1;
  const topSpur = ranked.find(d => d.role === "spurious");
  const topCaus = ranked.find(d => d.role === "causal");

  const renderFor = (view) => {
    for (const btn of $toggle.querySelectorAll("button")) {
      btn.classList.toggle("is-answer", btn.dataset.view === view);
    }
    if (view === "overall")       renderOverall($plot, ranked, topN);
    else if (view === "per-role") renderPerRole($plot, ranked, Math.ceil(topN / 3));
    else                          renderBeeswarm($plot, ranked);

    if (view === "beeswarm") {
      const beaten = topSpur
        ? ranked.filter(d => d.role === "causal" && Math.abs(d.r) < Math.abs(topSpur.r)).length
        : 0;
      const totalCaus = roleCountsAll.causal;
      $caption.innerHTML =
        `<strong>All 493 features</strong> plotted by \\(|r|\\) with \\(\\log_{10}(\\text{GDP per capita})\\), stratified by role. ` +
        `<span style="color:${ROLE_COLORS.causal}">${roleCountsAll.causal} causal</span> · ` +
        `<span style="color:${ROLE_COLORS.spurious}">${roleCountsAll.spurious} spurious</span> · ` +
        `<span style="color:${ROLE_COLORS.incidental}">${roleCountsAll.incidental} incidental</span>. ` +
        (topSpur && topCaus
          ? `The strongest spurious feature (<span class="mono">${topSpur.name}</span>, \\(|r| \\approx ${Math.abs(topSpur.r).toFixed(2)}\\)) ` +
            `out-correlates <strong>${beaten} of ${totalCaus}</strong> causal features — the pedagogical punchline of chapter 01.`
          : "");
    } else {
      const roleCounts = { causal: 0, spurious: 0, incidental: 0 };
      for (const d of ranked.slice(0, topN)) roleCounts[d.role] = (roleCounts[d.role] ?? 0) + 1;
      $caption.innerHTML =
        `Top ${topN} of 493 features by \\(|r|\\) with \\(\\log_{10}(\\text{GDP per capita})\\). ` +
        `<span style="color:${ROLE_COLORS.causal}">${roleCounts.causal} causal</span> · ` +
        `<span style="color:${ROLE_COLORS.spurious}">${roleCounts.spurious} spurious</span> · ` +
        `<span style="color:${ROLE_COLORS.incidental}">${roleCounts.incidental} incidental</span>. ` +
        (topSpur
          ? `Strongest spurious feature in the list (<span class="mono">${topSpur.name}</span>) reaches \\(|r| \\approx ${Math.abs(topSpur.r).toFixed(2)}\\).`
          : "");
    }
    renderMath($caption);
  };

  $toggle.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-view]");
    if (!btn) return;
    renderFor(btn.dataset.view);
  });

  renderFor("beeswarm");

  return ranked;
}

// Backwards-compatible wrapper used by 01_explore.html (old call site).
export function renderTopCorrelations(host, bundle, opts = {}) {
  return mountTopCorrelations(host, bundle, opts);
}
