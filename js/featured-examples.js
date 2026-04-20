/* ==========================================================================
   Widget: Featured examples.
   Curated picks per role (causal / incidental / spurious) with a small
   scatter plot for each, so the reader can see what the category *feels*
   like before wading into the 493-feature ranking below.
   ========================================================================== */

import { ROLE_COLORS, column, pearson, logSafe } from "./data.js";

const FEATURED_URL = "../data/featured_examples.json";

const ROLE_ORDER = ["causal", "incidental", "spurious"];
const ROLE_HEADING = {
  causal:     "Causal",
  incidental: "Incidental",
  spurious:   "Spurious",
};
const ROLE_TAGLINE = {
  causal:     "a plausible mechanism for wealth",
  incidental: "moves with wealth, doesn&rsquo;t cause it",
  spurious:   "no mechanism at all",
};

function loadFeatured() {
  return fetch(FEATURED_URL).then(r => {
    if (!r.ok) throw new Error(`featured_examples.json: ${r.status}`);
    return r.json();
  });
}

function renderScatter(host, { rows, target, feature, role, r }) {
  const xRaw = column(rows, feature);
  const yLog = column(rows, target).map(logSafe);

  const xs = [], ys = [], labels = [];
  for (let i = 0; i < rows.length; i++) {
    const xv = xRaw[i], yv = yLog[i];
    if (Number.isFinite(xv) && Number.isFinite(yv)) {
      xs.push(xv); ys.push(yv); labels.push(rows[i].iso3);
    }
  }

  const data = [{
    type: "scatter",
    mode: "markers",
    x: xs, y: ys, text: labels,
    marker: {
      size: 5,
      color: ROLE_COLORS[role] ?? ROLE_COLORS.incidental,
      opacity: 0.78,
      line: { width: 0.4, color: "#0a1830" },
    },
    hovertemplate: `<b>%{text}</b><br>${feature} = %{x}<br>log&#8321;&#8320;(GDP) = %{y:.2f}<extra></extra>`,
  }];

  const layout = {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 10 },
    margin: { l: 36, r: 10, t: 6, b: 28 },
    height: 200,
    xaxis: {
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      tickfont: { size: 9, color: "#6b7b97" },
      nticks: 4,
    },
    yaxis: {
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      tickfont: { size: 9, color: "#6b7b97" },
      nticks: 4,
    },
    showlegend: false,
    annotations: [{
      x: 0.98, y: 0.04, xref: "paper", yref: "paper",
      xanchor: "right", yanchor: "bottom",
      text: `|r| = ${Math.abs(r).toFixed(2)}`,
      font: { color: "#94a3b8", family: "JetBrains Mono, monospace", size: 10 },
      showarrow: false,
    }],
  };

  Plotly.react(host, data, layout, { displayModeBar: false, responsive: true });
}

export async function mountFeaturedExamples(host, bundle) {
  let featured;
  try {
    featured = await loadFeatured();
  } catch (err) {
    host.innerHTML = `<div class="loading">Could not load featured examples: ${err.message}</div>`;
    return;
  }

  // Recompute |r| from the dataset so the displayed number is never stale.
  const yLog = column(bundle.rows, bundle.target).map(logSafe);
  for (const role of ROLE_ORDER) {
    for (const pick of (featured[role] ?? [])) {
      const rCalc = pearson(column(bundle.rows, pick.feature), yLog);
      if (Number.isFinite(rCalc)) pick.r = rCalc;
    }
  }

  // Inline styles keep css/style.css untouched.
  host.innerHTML = `
    <div class="fe-grid" style="
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    ">
      ${ROLE_ORDER.map(role => `
        <div class="fe-col" data-role="${role}" style="
          display: flex;
          flex-direction: column;
          gap: .9rem;
          background: #0e1d3a;
          border: 1px solid var(--border);
          border-top: 3px solid ${ROLE_COLORS[role]};
          border-radius: 6px;
          padding: 1rem .95rem 1.1rem;
        ">
          <div>
            <h3 style="
              font-family: 'DM Serif Display', Georgia, serif;
              font-size: 1.35rem;
              font-weight: 400;
              margin: 0;
              color: ${ROLE_COLORS[role]};
              letter-spacing: .01em;
            ">${ROLE_HEADING[role]}</h3>
            <div style="
              font-family: 'JetBrains Mono', monospace;
              font-size: .72rem;
              color: var(--text-dim);
              letter-spacing: .04em;
              margin-top: .15rem;
            ">${ROLE_TAGLINE[role]}</div>
          </div>
          <div class="fe-items" data-items></div>
        </div>
      `).join("")}
    </div>
  `;

  // Build the per-role item lists.
  for (const role of ROLE_ORDER) {
    const col = host.querySelector(`.fe-col[data-role="${role}"] [data-items]`);
    const picks = featured[role] ?? [];
    for (const pick of picks) {
      if (!bundle.columns.includes(pick.feature)) continue;

      const card = document.createElement("div");
      card.className = "fe-item";
      card.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: .35rem;
        padding: .6rem .1rem .3rem;
        border-top: 1px solid rgba(35,57,102,.5);
      `;
      card.innerHTML = `
        <div style="
          font-family: 'JetBrains Mono', monospace;
          font-size: .82rem;
          color: ${ROLE_COLORS[role]};
          word-break: break-word;
          line-height: 1.3;
        ">${pick.feature}</div>
        <div style="
          font-family: 'Inter', system-ui, sans-serif;
          font-size: .78rem;
          color: var(--text-muted);
          font-style: italic;
        ">${pick.label}</div>
        <div data-plot style="
          min-height: 200px;
          margin: .15rem 0 .25rem;
        "></div>
        <div style="
          font-family: 'Inter', system-ui, sans-serif;
          font-size: .82rem;
          line-height: 1.45;
          color: var(--text);
        ">${pick.explain}</div>
      `;
      col.appendChild(card);

      renderScatter(card.querySelector("[data-plot]"), {
        rows:    bundle.rows,
        target:  bundle.target,
        feature: pick.feature,
        role,
        r:       pick.r,
      });
    }
  }

  // Narrow viewports: stack the three columns.
  const mq = window.matchMedia("(max-width: 800px)");
  const applyStack = () => {
    const grid = host.querySelector(".fe-grid");
    if (!grid) return;
    grid.style.gridTemplateColumns = mq.matches ? "1fr" : "repeat(3, 1fr)";
  };
  applyStack();
  mq.addEventListener?.("change", applyStack);
}
