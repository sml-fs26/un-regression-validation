/* ==========================================================================
   Chapter 05: The Trust.
   Repeated train/test splits (100 seeds) for 4 model families, plotted as a
   strip/box chart. Shows the spread of test R² that a single split hides.
   Also: a 5-fold CV boxplot for comparison.
   ========================================================================== */

import { renderMath } from "./math.js";

const CV_URL = "../data/ch05_cv_distribution.json";

// Colors keyed by a prefix so they survive changes to the α shown in the label.
const MODEL_PREFIX_COLORS = [
  { prefix: "OLS",           color: "#ef4444" },
  { prefix: "Ridge",         color: "#60a5fa" },
  { prefix: "Lasso",         color: "#f59e0b" },
  { prefix: "Elastic Net",   color: "#a78bfa" },
  { prefix: "Random Forest", color: "#22c55e" },
];
const modelColor = name =>
  (MODEL_PREFIX_COLORS.find(m => name.startsWith(m.prefix))?.color) ?? "#e6eaf2";

export async function mount(host) {
  const d = await fetch(CV_URL).then(r => r.json());

  const maxSpread = Math.max(...d.models.map(m => m.summary.max - m.summary.min));
  const worstModelEntry = d.models.reduce((w, m) =>
    (m.summary.max - m.summary.min) > (w.summary.max - w.summary.min) ? m : w, d.models[0]);

  host.innerHTML = `
    <section class="widget">
      <h2>${d.n_splits} random train/test splits, ${d.models.length} models</h2>
      <p class="help">
        Everything you have seen so far came from one random split of the data (seed = 42).
        Change the seed, re-split, refit. Test \\(R^2\\) changes. Repeating the split
        <strong>${d.n_splits} times</strong> and collecting the test \\(R^2\\) from each
        exposes the distribution the single number hides. The widest model (<strong
        class="mono">${worstModelEntry.name}</strong>) spans ${(worstModelEntry.summary.max - worstModelEntry.summary.min).toFixed(2)}
        \\(R^2\\) units across splits.
        The three regularised models use the \\(\\alpha\\) Chapter 03 selected as best on the
        seed-42 split &mdash; we are asking how that \\(\\alpha\\) behaves when the split changes.
      </p>
      <div data-strip-plot class="plot" style="min-height: 420px;"></div>
    </section>

    <section class="widget">
      <h2>\\(k\\)-fold cross-validation (\\(k = ${d.kfold.k}\\))</h2>
      <p class="help">
        \\(k\\)-fold CV is a principled alternative to one random split: partition the data into
        \\(k = ${d.kfold.k}\\) equal-sized folds, train on \\(k - 1\\) of them, test on the one
        held out, and cycle through all \\(k\\) combinations. The spread of the \\(k\\) test
        scores is the model&rsquo;s honest uncertainty on this dataset.
      </p>
      <div data-kfold-plot class="plot" style="min-height: 360px;"></div>
    </section>

    <section class="widget">
      <h2>Summary table</h2>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-family: var(--font-mono); font-size: .9rem;">
          <thead>
            <tr style="color: var(--text-muted); text-align: right;">
              <th style="text-align: left; padding: .5rem 1rem; border-bottom: 1px solid var(--border);">model</th>
              <th style="padding: .5rem 1rem; border-bottom: 1px solid var(--border);">median test \\(R^2\\)</th>
              <th style="padding: .5rem 1rem; border-bottom: 1px solid var(--border);">Q25 — Q75</th>
              <th style="padding: .5rem 1rem; border-bottom: 1px solid var(--border);">min</th>
              <th style="padding: .5rem 1rem; border-bottom: 1px solid var(--border);">max</th>
            </tr>
          </thead>
          <tbody>
            ${d.models.map(m => `
              <tr style="text-align: right;">
                <td style="text-align: left; padding: .45rem 1rem; color: ${modelColor(m.name)};">${m.name}</td>
                <td style="padding: .45rem 1rem;">${m.summary.median.toFixed(3)}</td>
                <td style="padding: .45rem 1rem; color: var(--text-muted);">${m.summary.q25.toFixed(3)} — ${m.summary.q75.toFixed(3)}</td>
                <td style="padding: .45rem 1rem; color: var(--text-muted);">${m.summary.min.toFixed(3)}</td>
                <td style="padding: .45rem 1rem; color: var(--text-muted);">${m.summary.max.toFixed(3)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <div class="takeaway">
      <div class="label">takeaway</div>
      <p>
        <em>One split lied.</em> Whatever test \\(R^2\\) you reported from a single 80/20 was
        a draw from a distribution, and the distribution is wider than you guessed. Report
        medians across many splits, or cross-validate; never claim a point estimate is
        &ldquo;the answer.&rdquo; That is the end of this story, and where every honest model
        report begins.
      </p>
    </div>
  `;

  renderStrip(host.querySelector("[data-strip-plot]"), d.models);
  renderKFold(host.querySelector("[data-kfold-plot]"), d.kfold.models);
  renderMath(host);
}

function renderStrip(host, models) {
  const traces = models.map(m => ({
    type: "box",
    y: m.test_r2,
    name: m.name,
    marker: { color: modelColor(m.name), size: 5, opacity: 0.6 },
    line: { color: modelColor(m.name) },
    fillcolor: modelColor(m.name) + "22",
    boxpoints: "all",
    jitter: 0.5,
    pointpos: 0,
    boxmean: true,
    hovertemplate: "<b>%{x}</b><br>test R² = %{y:.3f}<extra></extra>",
  }));

  // Visible range: cover 5th..95th percentile with padding, so OLS outliers
  // don't squash the rest.
  const all = models.flatMap(m => m.test_r2).filter(v => Number.isFinite(v));
  const sorted = all.slice().sort((a, b) => a - b);
  const p02 = sorted[Math.floor(sorted.length * 0.02)];
  const p98 = sorted[Math.floor(sorted.length * 0.98)];
  const lo = Math.max(-2, Math.min(p02, 0));
  const hi = Math.min(1.05, p98 + 0.05);

  const layout = {
    paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 70, r: 20, t: 20, b: 70 },
    height: 420,
    yaxis: {
      title: { text: "test R² (clamped to visible range)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966", zerolinecolor: "#233966",
      range: [lo, hi],
    },
    xaxis: { tickfont: { family: "JetBrains Mono, monospace" } },
    showlegend: false,
    hovermode: "closest",
  };

  Plotly.newPlot(host, traces, layout, { displayModeBar: false, responsive: true });
}

function renderKFold(host, models) {
  const traces = models.map(m => ({
    type: "box",
    y: m.test_r2,
    name: m.name,
    marker: { color: modelColor(m.name), size: 7 },
    line: { color: modelColor(m.name) },
    fillcolor: modelColor(m.name) + "22",
    boxpoints: "all",
    jitter: 0.3,
    pointpos: 0,
    boxmean: true,
  }));

  const layout = {
    paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 70, r: 20, t: 20, b: 70 },
    height: 360,
    yaxis: {
      title: { text: "fold test R²", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966", zerolinecolor: "#233966",
      range: [-1, 1.05],
    },
    xaxis: { tickfont: { family: "JetBrains Mono, monospace" } },
    showlegend: false,
  };
  Plotly.newPlot(host, traces, layout, { displayModeBar: false, responsive: true });
}
