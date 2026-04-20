/* ==========================================================================
   Chapter 02: The Crash.
   Renders the OLS train/test R² hockey stick + actual-vs-predicted scatters.
   Data precomputed offline by scripts/precompute_ch02.py.
   ========================================================================== */

const SWEEP_URL = "../data/ch02_sweep.json";
const PREDS_URL = "../data/ch02_predictions.json";

const COLOR_TRAIN = "#22c55e"; // green — model sees this data
const COLOR_TEST  = "#ef4444"; // red — the news that actually matters
const COLOR_CLIFF = "#f59e0b"; // gold — the p = n vertical

export async function mount(host) {
  const [sweep, predsBundle] = await Promise.all([
    fetch(SWEEP_URL).then(r => r.json()),
    fetch(PREDS_URL).then(r => r.json()),
  ]);
  const snapshots = predsBundle.snapshots;
  const snapshotPs = snapshots.map(s => s.p);

  host.innerHTML = `
    <section class="widget">
      <h2>The hockey stick</h2>
      <p class="help">
        Train an OLS regression on the first <em>p</em> features (80/20 split, seed=42). Drag
        the <em>p</em> scrubber to add features left-to-right. Train R² rises to 1 as the model
        memorises the training set. Test R² crashes across the cliff at
        <span class="mono" style="color:${COLOR_CLIFF}">p = n = ${sweep.n_train}</span> and
        does not merely degrade — it goes to negative infinity. The chart clamps to
        R² ≥ &minus;5; at p = 200 the true test R² is
        <strong style="color:${COLOR_TEST}">&minus;208</strong>.
      </p>

      <div class="controls">
        <label>p (features):
          <input type="range" data-p-range min="0" max="${sweep.ps.length - 1}" value="0" step="1" style="width: 360px; accent-color: ${COLOR_CLIFF};">
          <span class="mono" data-p-label style="min-width: 2.5rem; display: inline-block; text-align:right; color:${COLOR_CLIFF};">5</span>
        </label>
        <label>snapshot:
          <select data-p-select>
            ${snapshotPs.map(p => `<option value="${p}">p = ${p}</option>`).join("")}
          </select>
        </label>
      </div>

      <div data-sweep-plot class="plot" style="min-height: 420px;"></div>
    </section>

    <section class="widget">
      <h2>Actual vs predicted</h2>
      <p class="help">
        Two scatter plots side by side: GDP predicted from the fitted OLS model plotted
        against the actual GDP, for both the training countries and the held-out test
        countries. Points on the diagonal (y = x) mean the model was right. A model that
        genuinely learned the relationship hugs the diagonal in <strong>both</strong> panels.
      </p>
      <div data-preds-title class="help mono" style="margin-bottom: .75rem;"></div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div data-preds-train class="plot" style="min-height: 360px;"></div>
        <div data-preds-test  class="plot" style="min-height: 360px;"></div>
      </div>
    </section>

    <div class="takeaway">
      <div class="label">takeaway</div>
      <p>
        <em>Memorisation is not learning.</em> Perfect training R² can sit alongside any test
        R² you want, including arbitrarily negative ones. The only honest measure of a model
        is how it performs on data it has never seen. Chapter 03 asks whether regularisation
        can pull the test curve back up.
      </p>
    </div>
  `;

  const $range  = host.querySelector("[data-p-range]");
  const $label  = host.querySelector("[data-p-label]");
  const $select = host.querySelector("[data-p-select]");
  const $sweep  = host.querySelector("[data-sweep-plot]");
  const $ptrain = host.querySelector("[data-preds-train]");
  const $ptest  = host.querySelector("[data-preds-test]");
  const $ptitle = host.querySelector("[data-preds-title]");

  renderSweep($sweep, sweep, 0);
  // Find nearest snapshot to initial p.
  let currentSnap = nearestSnapshot(snapshots, sweep.ps[0]);
  renderPredictions($ptrain, $ptest, $ptitle, currentSnap);

  $range.addEventListener("input", () => {
    const i = +$range.value;
    const p = sweep.ps[i];
    $label.textContent = String(p);
    // Highlight current p on the sweep chart; snap predictions to nearest snapshot.
    updateSweepMarker($sweep, sweep, i);
    const snap = nearestSnapshot(snapshots, p);
    if (snap.p !== currentSnap.p) {
      currentSnap = snap;
      $select.value = String(snap.p);
      renderPredictions($ptrain, $ptest, $ptitle, snap);
    }
  });

  $select.addEventListener("change", () => {
    const p = +$select.value;
    const snap = snapshots.find(s => s.p === p);
    if (!snap) return;
    currentSnap = snap;
    // Also move the slider to nearest index.
    const idx = nearestSweepIndex(sweep.ps, p);
    $range.value = String(idx);
    $label.textContent = String(sweep.ps[idx]);
    updateSweepMarker($sweep, sweep, idx);
    renderPredictions($ptrain, $ptest, $ptitle, snap);
  });
}

function nearestSweepIndex(ps, target) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < ps.length; i++) {
    const d = Math.abs(ps[i] - target);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

function nearestSnapshot(snapshots, target) {
  let best = snapshots[0], bestD = Infinity;
  for (const s of snapshots) {
    const d = Math.abs(s.p - target);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

function renderSweep(host, sweep, highlightIdx) {
  const { ps, train_r2, test_r2, n_train, p_max } = sweep;

  // Clamp test R² for display but show the true min as a label.
  const CLAMP = -5;
  const testClamped = test_r2.map(v => Math.max(v, CLAMP));

  const minTest = Math.min(...test_r2);
  const minIdx = test_r2.indexOf(minTest);

  const traces = [
    {
      type: "scatter", mode: "lines+markers",
      x: ps, y: train_r2,
      name: "train R²",
      line: { color: COLOR_TRAIN, width: 2.5 },
      marker: { color: COLOR_TRAIN, size: 6 },
      hovertemplate: "p = %{x}<br>train R² = %{y:.3f}<extra></extra>",
    },
    {
      type: "scatter", mode: "lines+markers",
      x: ps, y: testClamped,
      name: "test R²",
      line: { color: COLOR_TEST, width: 2.5 },
      marker: { color: COLOR_TEST, size: 6 },
      // Custom hover: show the actual (unclamped) value.
      hovertemplate: ps.map((p, i) => `p = ${p}<br>test R² = ${test_r2[i].toFixed(2)}<extra></extra>`),
      text: test_r2.map((v, i) => v < CLAMP ? `actually ${v.toFixed(1)}` : ""),
    },
  ];

  const shapes = [
    // Cliff marker at p = n_train.
    {
      type: "line", xref: "x", yref: "paper",
      x0: n_train, x1: n_train, y0: 0, y1: 1,
      line: { color: COLOR_CLIFF, width: 1.5, dash: "dash" },
    },
    // y=0 reference.
    {
      type: "line", xref: "paper", yref: "y",
      x0: 0, x1: 1, y0: 0, y1: 0,
      line: { color: "#233966", width: 1 },
    },
  ];

  const annotations = [
    {
      x: n_train, y: 1.0, xref: "x", yref: "y", xanchor: "left",
      text: ` p = n_train = ${n_train}`,
      showarrow: false,
      font: { color: COLOR_CLIFF, family: "JetBrains Mono, monospace", size: 11 },
    },
    {
      x: ps[minIdx], y: CLAMP + 0.2, xref: "x", yref: "y",
      text: `test R² = ${minTest.toFixed(1)}  ↓`,
      showarrow: false,
      font: { color: COLOR_TEST, family: "JetBrains Mono, monospace", size: 11 },
      xanchor: "left",
    },
  ];

  const layout = {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 60, r: 20, t: 20, b: 50 },
    height: 420,
    xaxis: {
      title: { text: "number of features (p), in codebook order", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      range: [0, p_max + 10],
    },
    yaxis: {
      title: { text: "R² (clamped to ≥ −5 for legibility)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      range: [-5.2, 1.1],
    },
    shapes, annotations,
    legend: {
      orientation: "h", yanchor: "bottom", y: 1.02, x: 0,
      font: { color: "#e6eaf2", family: "JetBrains Mono, monospace" },
    },
    hovermode: "closest",
  };

  Plotly.react(host, traces, layout, { displayModeBar: false, responsive: true });
  updateSweepMarker(host, sweep, highlightIdx);
}

function updateSweepMarker(host, sweep, idx) {
  // Overlay a vertical line + current-p marker on the sweep chart.
  const p = sweep.ps[idx];
  const tr = sweep.train_r2[idx];
  const te = sweep.test_r2[idx];
  const teClamped = Math.max(te, -5);

  const trueShapes = (host.layout?.shapes ?? []).filter(s => s.name !== "marker").slice();
  trueShapes.push({
    type: "line", xref: "x", yref: "paper",
    x0: p, x1: p, y0: 0, y1: 1,
    line: { color: "#e6eaf2", width: 1 },
    name: "marker",
  });

  Plotly.relayout(host, {
    shapes: trueShapes,
    "annotations[2]": {
      x: p, y: 1.08, xref: "x", yref: "y", xanchor: "center",
      text: `p = ${p} · train R² = ${tr.toFixed(2)} · test R² = ${te.toFixed(2)}`,
      showarrow: false,
      font: { color: "#e6eaf2", family: "JetBrains Mono, monospace", size: 11 },
    },
  });
}

function renderPredictions(trainHost, testHost, titleHost, snap) {
  titleHost.innerHTML =
    `<strong style="color:#e6eaf2">p = ${snap.p}</strong> · ` +
    `train R² = <span style="color:${COLOR_TRAIN}">${snap.train_r2.toFixed(3)}</span> · ` +
    `test R² = <span style="color:${COLOR_TEST}">${snap.test_r2.toFixed(3)}</span>`;

  renderOneAvP(trainHost, "train", snap.y_true_train, snap.y_pred_train, snap.iso_train, COLOR_TRAIN);
  renderOneAvP(testHost,  "test",  snap.y_true_test,  snap.y_pred_test,  snap.iso_test,  COLOR_TEST);
}

function renderOneAvP(host, label, yTrue, yPred, iso, color) {
  // Compute axis range that includes the diagonal cleanly.
  const vals = [...yTrue, ...yPred].filter(Number.isFinite);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.05 || 1;
  const lim = [lo - pad, hi + pad];

  const traces = [
    {
      type: "scatter", mode: "lines",
      x: lim, y: lim,
      line: { color: "#233966", width: 1, dash: "dash" },
      hoverinfo: "skip",
      showlegend: false,
    },
    {
      type: "scatter", mode: "markers",
      x: yTrue, y: yPred, text: iso,
      marker: { color, size: 8, opacity: 0.8, line: { width: 0.5, color: "#0a1830" } },
      hovertemplate: `<b>%{text}</b><br>actual = %{x:,.0f}<br>predicted = %{y:,.0f}<extra></extra>`,
      showlegend: false,
    },
  ];

  const layout = {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 11 },
    margin: { l: 60, r: 20, t: 35, b: 50 },
    height: 360,
    title: {
      text: label === "train" ? "TRAIN (203 countries)" : "TEST (51 countries)",
      font: { color: color, size: 12, family: "JetBrains Mono, monospace" },
      x: 0, xanchor: "left",
    },
    xaxis: {
      title: { text: "actual GDP per capita", font: { size: 11, color: "#94a3b8" } },
      gridcolor: "#233966",
    },
    yaxis: {
      title: { text: "predicted GDP per capita", font: { size: 11, color: "#94a3b8" } },
      gridcolor: "#233966",
    },
  };

  Plotly.react(host, traces, layout, { displayModeBar: false, responsive: true });
}
