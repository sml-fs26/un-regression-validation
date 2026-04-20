/* ==========================================================================
   Chapter 03: The Patch.
   Ridge / Lasso / ElasticNet α-sweep. Test R² climbs out of the crater;
   Lasso strips most features to zero.
   ========================================================================== */

import { renderMath } from "./math.js";

const SWEEP_URL = "../data/ch03_alpha_sweep.json";

const COLORS = {
  ridge:      "#60a5fa",
  lasso:      "#f59e0b",
  elasticnet: "#a78bfa",
  train:      "#22c55e",
  test:       "#ef4444",
};

const LABELS = {
  ridge: "Ridge",
  lasso: "Lasso",
  elasticnet: "Elastic Net",
};

export async function mount(host) {
  const d = await fetch(SWEEP_URL).then(r => r.json());
  const { alphas, models, baseline_ols, n_features } = d;

  // Per-model best α by test R².
  const bests = Object.fromEntries(Object.keys(models).map(name => {
    const tr = models[name].test_r2;
    let bestI = 0, bestV = -Infinity;
    tr.forEach((v, i) => { if (v > bestV) { bestV = v; bestI = i; } });
    return [name, {
      alpha: alphas[bestI],
      test_r2: bestV,
      train_r2: models[name].train_r2[bestI],
      nonzero: models[name].nonzero[bestI],
    }];
  }));

  host.innerHTML = `
    <section class="widget">
      <h2>Regularised \\(R^2\\) across log \\(\\alpha\\)</h2>
      <p class="help">
        All 493 features handed to three regularised linear models &mdash; Ridge, Lasso,
        Elastic Net &mdash; across a log-scale sweep of the regularisation strength
        \\(\\alpha\\). Compare to unregularised OLS (dashed red line):
        <strong style="color:${COLORS.test}">test \\(R^2\\) = ${baseline_ols.test_r2.toFixed(2)}</strong>.
        Every regularised curve climbs out of the crater. The best \\(\\alpha\\) for each model is marked.
      </p>
      <div data-r2-plot class="plot" style="min-height: 440px;"></div>
    </section>

    <section class="widget">
      <h2>Lasso drops features as \\(\\alpha\\) grows</h2>
      <p class="help">
        Of the 493 features handed to Lasso, most are set to zero once the regularisation
        strength exceeds a threshold. The curve shows how many features survive at each
        \\(\\alpha\\). At Lasso's best test-\\(R^2\\) \\(\\alpha\\), only
        <strong style="color:${COLORS.lasso}">${bests.lasso.nonzero}</strong>
        of 493 features carry non-zero coefficients.
      </p>
      <div data-nz-plot class="plot" style="min-height: 380px;"></div>
    </section>

    <section class="widget">
      <h2>Best \\(\\alpha\\) per model</h2>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(220px, 1fr)); gap: 1rem;">
        ${Object.keys(bests).map(name => `
          <div style="background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 6px; padding: 1rem;">
            <div class="mono" style="font-size: 1.05rem; color: ${COLORS[name]};">${LABELS[name]}</div>
            <div class="mono" style="font-size: .85rem; color: var(--text-muted); margin-top: .75rem; line-height: 1.8;">
              \\(\\alpha\\) = ${formatAlpha(bests[name].alpha)}<br>
              train \\(R^2\\) = ${bests[name].train_r2.toFixed(3)}<br>
              test \\(R^2\\) = <strong style="color: ${COLORS.test}">${bests[name].test_r2.toFixed(3)}</strong><br>
              nonzero = ${bests[name].nonzero} / ${n_features}
            </div>
          </div>
        `).join("")}
      </div>
    </section>

    <div class="takeaway">
      <div class="label">takeaway</div>
      <p>
        <em>Regularisation converts memorisation into prediction.</em> With a single extra knob,
        the model stops overfitting and actually generalises. Lasso goes further: it zeroes out
        most features entirely. The next chapter asks the uncomfortable question &mdash; of the
        handful of features Lasso decided to keep, which ones are they?
      </p>
    </div>
  `;

  renderR2($host("data-r2-plot"), alphas, models, baseline_ols, bests);
  renderNonzero($host("data-nz-plot"), alphas, models, bests);
  renderMath(host);

  function $host(attr) { return host.querySelector(`[${attr}]`); }
}

function formatAlpha(a) {
  if (a >= 1) return a.toFixed(a >= 100 ? 0 : 2);
  if (a >= 0.01) return a.toFixed(3);
  return a.toExponential(1);
}

/**
 * Match the axis exactly to the range of α values we actually evaluate.
 * Plotly's auto-log-scale otherwise pads slightly beyond the data.
 */
function computeAlphaRange(alphas, models) {
  return [Math.log10(alphas[0]), Math.log10(alphas[alphas.length - 1])];
}

function renderR2(host, alphas, models, baselineOls, bests) {
  const traces = [];
  for (const name of Object.keys(models)) {
    traces.push({
      type: "scatter", mode: "lines+markers",
      x: alphas, y: models[name].train_r2,
      name: `${LABELS[name]} train`,
      legendgroup: name,
      line: { color: COLORS[name], width: 1.2, dash: "dot" },
      marker: { color: COLORS[name], size: 4, opacity: 0.7 },
      hovertemplate: `α = %{x:.3g}<br>${LABELS[name]} train R² = %{y:.3f}<extra></extra>`,
    });
    traces.push({
      type: "scatter", mode: "lines+markers",
      x: alphas, y: models[name].test_r2,
      name: `${LABELS[name]} test`,
      legendgroup: name,
      line: { color: COLORS[name], width: 2.5 },
      marker: { color: COLORS[name], size: 6 },
      hovertemplate: `α = %{x:.3g}<br>${LABELS[name]} test R² = %{y:.3f}<extra></extra>`,
    });
  }

  // Unregularised OLS baseline.
  traces.push({
    type: "scatter", mode: "lines",
    x: [alphas[0], alphas[alphas.length - 1]],
    y: [baselineOls.test_r2, baselineOls.test_r2],
    name: `OLS test R² (all 493 features)`,
    line: { color: COLORS.test, width: 1, dash: "dash" },
    hovertemplate: `OLS test R² = ${baselineOls.test_r2.toFixed(3)}<extra></extra>`,
  });

  // Mark best-α per model.
  const shapes = [], anns = [];
  for (const name of Object.keys(bests)) {
    shapes.push({
      type: "line", xref: "x", yref: "paper",
      x0: bests[name].alpha, x1: bests[name].alpha,
      y0: 0, y1: 1,
      line: { color: COLORS[name], width: 1, dash: "dot" },
    });
    anns.push({
      x: bests[name].alpha, y: 1.02, xref: "x", yref: "paper",
      text: `${LABELS[name]} best`,
      showarrow: false, xanchor: "center",
      font: { color: COLORS[name], family: "JetBrains Mono, monospace", size: 10 },
    });
  }

  const layout = {
    paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 70, r: 20, t: 50, b: 55 },
    height: 440,
    xaxis: {
      type: "log",
      title: { text: "regularisation strength α (log scale)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966", zerolinecolor: "#233966",
      range: computeAlphaRange(alphas, models),
    },
    yaxis: {
      title: { text: "R² (clamped to [−1, 1])", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966", zerolinecolor: "#233966",
      range: [-1, 1.1],
    },
    shapes, annotations: anns,
    legend: {
      orientation: "h", yanchor: "bottom", y: -0.25, x: 0,
      font: { color: "#e6eaf2", family: "JetBrains Mono, monospace", size: 11 },
    },
    hovermode: "closest",
  };

  Plotly.newPlot(host, traces, layout, { displayModeBar: false, responsive: true });
}

function renderNonzero(host, alphas, models, bests) {
  const traces = Object.keys(models).map(name => ({
    type: "scatter", mode: "lines+markers",
    x: alphas, y: models[name].nonzero,
    name: LABELS[name],
    line: { color: COLORS[name], width: 2.5 },
    marker: { color: COLORS[name], size: 5 },
    hovertemplate: `α = %{x:.3g}<br>${LABELS[name]}: %{y} non-zero coefs<extra></extra>`,
  }));

  const shapes = [], anns = [];
  for (const name of Object.keys(bests)) {
    shapes.push({
      type: "line", xref: "x", yref: "paper",
      x0: bests[name].alpha, x1: bests[name].alpha,
      y0: 0, y1: 1,
      line: { color: COLORS[name], width: 1, dash: "dot" },
    });
  }

  const layout = {
    paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 70, r: 20, t: 30, b: 55 },
    height: 380,
    xaxis: {
      type: "log",
      title: { text: "regularisation strength α (log scale)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966",
      range: computeAlphaRange(alphas, models),
    },
    yaxis: {
      title: { text: "non-zero coefficients (of 493)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966", rangemode: "tozero",
    },
    shapes,
    legend: {
      orientation: "h", yanchor: "bottom", y: 1.02, x: 0,
      font: { color: "#e6eaf2", family: "JetBrains Mono, monospace", size: 11 },
    },
    hovermode: "closest",
  };

  Plotly.newPlot(host, traces, layout, { displayModeBar: false, responsive: true });
}
