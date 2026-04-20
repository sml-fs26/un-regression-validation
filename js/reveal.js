/* ==========================================================================
   Chapter 04: The Reveal.
   Lasso's top 20 non-zero coefficients vs Random Forest's top 20 feature
   importances, side by side, each bar coloured by its codebook role.
   ========================================================================== */

const IMP_URL = "../data/ch04_importances.json";

const ROLE_COLOR = {
  causal:     "#22c55e",
  spurious:   "#ef4444",
  incidental: "#94a3b8",
};

export async function mount(host) {
  const d = await fetch(IMP_URL).then(r => r.json());

  const lassoSurvivors = d.lasso.top20;
  const rfTop = d.rf.top20;
  const lassoBreak = countByRole(lassoSurvivors);
  const rfBreak = countByRole(rfTop);

  host.innerHTML = `
    <section class="widget">
      <h2>Lasso's top 20 vs Random Forest's top 20</h2>
      <p class="help">
        Left: the 20 features with the largest absolute Lasso coefficient at the α that
        maximises test R² (α ≈ <span class="mono">${d.lasso.alpha.toFixed(2)}</span>;
        Lasso keeps <strong style="color:#f59e0b">${d.lasso.nonzero}</strong> of
        ${d.lasso.n_features} features non-zero). Right: the 20 features with the largest
        <span class="mono">feature_importances_</span> from a default Random Forest. Each bar is
        coloured by its role in the codebook: <span class="mono" style="color:${ROLE_COLOR.causal}">causal</span>,
        <span class="mono" style="color:${ROLE_COLOR.spurious}">spurious</span>,
        <span class="mono" style="color:${ROLE_COLOR.incidental}">incidental</span>.
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
        <div>
          <div style="font-family: var(--font-mono); color: var(--text-muted); margin-bottom: .5rem; font-size: .9rem;">
            Lasso — <span style="color:${ROLE_COLOR.causal}">${lassoBreak.causal} causal</span>
            · <span style="color:${ROLE_COLOR.spurious}">${lassoBreak.spurious} spurious</span>
            · <span style="color:${ROLE_COLOR.incidental}">${lassoBreak.incidental} incidental</span>
            · test R² = <strong style="color:#ef4444">${d.lasso.test_r2.toFixed(3)}</strong>
          </div>
          <div data-lasso-plot class="plot" style="min-height: 560px;"></div>
        </div>
        <div>
          <div style="font-family: var(--font-mono); color: var(--text-muted); margin-bottom: .5rem; font-size: .9rem;">
            Random Forest — <span style="color:${ROLE_COLOR.causal}">${rfBreak.causal} causal</span>
            · <span style="color:${ROLE_COLOR.spurious}">${rfBreak.spurious} spurious</span>
            · <span style="color:${ROLE_COLOR.incidental}">${rfBreak.incidental} incidental</span>
            · test R² = <strong style="color:#ef4444">${d.rf.test_r2.toFixed(3)}</strong>
          </div>
          <div data-rf-plot class="plot" style="min-height: 560px;"></div>
        </div>
      </div>
    </section>

    <div class="takeaway">
      <div class="label">takeaway</div>
      <p>
        <em>The model chose some features you would not have.</em> Lasso keeps features that
        look causal on paper but sits beside features the codebook flags as spurious. A
        different model family &mdash; Random Forest, with no linearity assumption &mdash;
        picks a different set, and the disagreement is the argument for not trusting any
        single model's feature picks. Chapter 05 asks how stable any of this is across
        resamples of the data.
      </p>
    </div>
  `;

  renderTopBar(host.querySelector("[data-lasso-plot]"), lassoSurvivors, "|coef|");
  renderTopBar(host.querySelector("[data-rf-plot]"),    rfTop,          "importance");
}

function countByRole(items) {
  const c = { causal: 0, spurious: 0, incidental: 0 };
  for (const it of items) c[it.role] = (c[it.role] ?? 0) + 1;
  return c;
}

function renderTopBar(host, items, xLabel) {
  const sorted = items.slice().sort((a, b) => a.value - b.value); // ascending for horiz bars
  const data = [{
    type: "bar",
    orientation: "h",
    x: sorted.map(it => it.value),
    y: sorted.map(it => it.feature),
    marker: {
      color: sorted.map(it => ROLE_COLOR[it.role]),
      line: { width: 0 },
    },
    hovertemplate: "<b>%{y}</b><br>" + xLabel + " = %{x:.4g}<br>role: %{customdata}<extra></extra>",
    customdata: sorted.map(it => it.role),
  }];
  const layout = {
    paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 11 },
    margin: { l: 230, r: 20, t: 10, b: 40 },
    height: 560,
    xaxis: { title: { text: xLabel, font: { size: 11, color: "#94a3b8" } }, gridcolor: "#233966" },
    yaxis: { automargin: true, tickfont: { size: 10 } },
    bargap: 0.25,
  };
  Plotly.newPlot(host, data, layout, { displayModeBar: false, responsive: true });
}
