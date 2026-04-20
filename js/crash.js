/* ==========================================================================
   Chapter 02: The Crash.
   Static hockey-stick chart + a small-multiples grid of actual-vs-predicted
   at fixed p values (no interaction — the data tells the whole story).
   Data precomputed offline by scripts/precompute_ch02.py.
   ========================================================================== */

import { renderMath } from "./math.js";

const SWEEP_URL = "../data/ch02_sweep.json";
const PREDS_URL = "../data/ch02_predictions.json";

const COLOR_TRAIN = "#22c55e"; // green — model sees this data
const COLOR_TEST  = "#ef4444"; // red   — the news that actually matters
const COLOR_CLIFF = "#f59e0b"; // gold  — p = n cliff

export async function mount(host) {
  const [sweep, predsBundle] = await Promise.all([
    fetch(SWEEP_URL).then(r => r.json()),
    fetch(PREDS_URL).then(r => r.json()),
  ]);
  const snapshots = predsBundle.snapshots;

  // Proposal 1 (preview): scroll-driven confidence-crash gradient. Bind --crash-t
  // (0 at top, 1 at bottom) on <body>. Easing via smoothstep so the "cliff"
  // feels sharper near p = n_train.
  installCrashScroll();

  // Pick four representative p values: "too small to matter", "comfortable",
  // "the cliff", "all features". These all exist in the precomputed snapshot set.
  const want = [5, 100, sweep.n_train, sweep.p_max];
  const picks = want
    .map(p => snapshots.reduce((best, s) =>
      Math.abs(s.p - p) < Math.abs(best.p - p) ? s : best, snapshots[0]))
    // Dedupe while preserving order.
    .filter((s, i, arr) => arr.findIndex(t => t.p === s.p) === i);

  host.innerHTML = `
    <section class="widget">
      <h2>The hockey stick</h2>
      <p class="help">
        Fit OLS on the first \\(p\\) features (80/20 split, seed = 42). Green = train
        \\(R^2\\), red = test \\(R^2\\). As \\(p\\) grows the train score rises to 1: the
        model memorises every training country perfectly. The test score collapses across the
        cliff at <span class="mono" style="color:${COLOR_CLIFF}">\\(p = n = ${sweep.n_train}\\)</span>
        and plunges to <strong style="color:${COLOR_TEST}">\\(-208\\)</strong> at
        \\(p = 200\\). The chart clamps to \\(R^2 \\geq -5\\) for legibility; hover any point
        to read its true value.
      </p>
      <div data-sweep-plot class="plot" style="min-height: 460px;"></div>
    </section>

    <section class="widget">
      <h2>Actual vs predicted &mdash; four snapshots of the same model</h2>
      <p class="help">
        Four OLS models trained with different feature counts. For each: on the left, GDP
        predicted from the model plotted against actual GDP on the training countries; on the
        right, the same plot on the held-out test countries. Points on the diagonal mean the
        model was right. A model that genuinely learned hugs the diagonal in
        <strong>both</strong> panels. Watch how, at \\(p\\) near \\(n\\), the right-hand (test)
        panel disintegrates even as the left (train) locks onto the diagonal. Axes are clipped
        to the real-GDP range; a few catastrophic predictions can fall off-chart.
      </p>
      <div data-preds-grid style="display: grid; gap: 1.25rem;"></div>
    </section>

    <div class="takeaway">
      <div class="label">takeaway</div>
      <p>
        <em>Memorisation is not learning.</em> Perfect training \\(R^2\\) can sit alongside
        any test \\(R^2\\) you want, including arbitrarily negative ones. The only honest
        measure of a model is how it performs on data it has never seen. Chapter 03 asks
        whether regularisation can pull the test curve back up.
      </p>
    </div>
  `;

  renderSweep(host.querySelector("[data-sweep-plot]"), sweep);
  renderPredGrid(host.querySelector("[data-preds-grid]"), picks);
  renderMath(host);
}

/**
 * Proposal 1 — scroll-driven gradient on ch02.
 * Computes t in [0,1] from the scroll position and writes `--crash-top` and
 * `--crash-bottom` rgb() strings on <body>. The CSS in style.css uses those
 * variables as the two stops of a fixed-background linear gradient.
 * Colour path (t = 0 → 1):
 *   top    rgb( 10,  24,  48 )   calm navy
 *          rgb(120,   5,   5 )   alarm red
 *   bottom rgb( 10,  24,  48 )   calm navy
 *          rgb(  0,   0,   0 )   black past the cliff
 * A smoothstep easing makes the cliff feel non-linear.
 */
function installCrashScroll() {
  if (typeof window === "undefined") return;
  const body = document.body;
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const rgb = (r, g, b) => `rgb(${r}, ${g}, ${b})`;

  let ticking = false;
  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const y = Math.min(1, Math.max(0, window.scrollY / max));
    const t = y * y * (3 - 2 * y); // smoothstep
    const top = rgb(lerp(10, 120, t), lerp(24, 5, t), lerp(48, 5, t));
    const bot = rgb(lerp(10, 5, t),   lerp(24, 0, t), lerp(48, 0, t));
    body.style.setProperty("--crash-top", top);
    body.style.setProperty("--crash-bottom", bot);
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

function renderSweep(host, sweep) {
  const { ps, train_r2, test_r2, n_train, p_max } = sweep;
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
      customdata: test_r2,
      hovertemplate: "p = %{x}<br>test R² = %{customdata:.2f}<extra></extra>",
    },
  ];

  const layout = {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 70, r: 30, t: 30, b: 55 },
    height: 460,
    xaxis: {
      title: { text: "number of features (p), in codebook order", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      range: [0, p_max],
      autorange: false,
      rangemode: "nonnegative",
      constrain: "range",
    },
    yaxis: {
      title: { text: "R² (clamped to ≥ −5)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966",
      zerolinecolor: "#233966",
      range: [-5.2, 1.1],
    },
    shapes: [
      {
        type: "line", xref: "x", yref: "paper",
        x0: n_train, x1: n_train, y0: 0, y1: 1,
        line: { color: COLOR_CLIFF, width: 1.5, dash: "dash" },
      },
      {
        type: "line", xref: "paper", yref: "y",
        x0: 0, x1: 1, y0: 0, y1: 0,
        line: { color: "#233966", width: 1 },
      },
    ],
    annotations: [
      {
        x: n_train, y: 1.06, xref: "x", yref: "y", xanchor: "left",
        text: ` p = n_train = ${n_train}`,
        showarrow: false,
        font: { color: COLOR_CLIFF, family: "JetBrains Mono, monospace", size: 11 },
      },
      {
        x: ps[minIdx], y: CLAMP + 0.18, xref: "x", yref: "y", xanchor: "left",
        text: `test R² = ${minTest.toFixed(1)} at p = ${ps[minIdx]}  ↓ off-chart`,
        showarrow: false,
        font: { color: COLOR_TEST, family: "JetBrains Mono, monospace", size: 11 },
      },
    ],
    legend: {
      orientation: "h", yanchor: "bottom", y: 1.02, x: 0,
      font: { color: "#e6eaf2", family: "JetBrains Mono, monospace" },
    },
    hovermode: "closest",
  };

  Plotly.newPlot(host, traces, layout, { displayModeBar: false, responsive: true });
}

function renderPredGrid(host, picks) {
  host.innerHTML = "";
  for (const snap of picks) {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "180px minmax(0, 1fr) minmax(0, 1fr)";
    row.style.gap = "1rem";
    row.style.alignItems = "center";
    row.innerHTML = `
      <div class="mono" style="font-size: .85rem;">
        <div style="font-size: 1.15rem; color: var(--text);">p = ${snap.p}</div>
        <div style="margin-top: .5rem; color: var(--text-muted);">
          train R² = <span style="color:${COLOR_TRAIN}">${snap.train_r2.toFixed(3)}</span><br>
          test R²  = <span style="color:${COLOR_TEST}">${snap.test_r2.toFixed(3)}</span>
        </div>
      </div>
      <div data-plot-tr style="min-height: 260px; min-width: 0;"></div>
      <div data-plot-te style="min-height: 260px; min-width: 0;"></div>
    `;
    host.appendChild(row);
    renderAvP(row.querySelector("[data-plot-tr]"), "train",
              snap.y_true_train, snap.y_pred_train, snap.iso_train, COLOR_TRAIN);
    renderAvP(row.querySelector("[data-plot-te]"), "test",
              snap.y_true_test,  snap.y_pred_test,  snap.iso_test,  COLOR_TEST);
  }
}

function renderAvP(host, label, yTrue, yPred, iso, color) {
  // Range the axes to the actual GDP values only, with 5% padding.
  // Catastrophic-overfit predictions at p near n can land at ±10^18; clipping
  // to the sane range keeps the reasonable cluster visible — the user asked
  // for this explicitly ("ok if a small portion of points are not plotted").
  const trueVals = yTrue.filter(Number.isFinite);
  const lo = Math.min(...trueVals), hi = Math.max(...trueVals);
  const pad = (hi - lo) * 0.05 || 1;
  const lim = [lo - pad, hi + pad];
  // Count how many predicted points fall off-chart so the caption can say so.
  const offChart = yPred.filter(v => Number.isFinite(v) && (v < lim[0] || v > lim[1])).length;

  const traces = [
    {
      type: "scatter", mode: "lines",
      x: lim, y: lim,
      line: { color: "#233966", width: 1, dash: "dash" },
      hoverinfo: "skip", showlegend: false,
    },
    {
      type: "scatter", mode: "markers",
      x: yTrue, y: yPred, text: iso,
      marker: { color, size: 7, opacity: 0.8, line: { width: 0.5, color: "#0a1830" } },
      hovertemplate: `<b>%{text}</b><br>actual = %{x:,.0f}<br>predicted = %{y:,.0f}<extra></extra>`,
      showlegend: false,
    },
  ];

  const layout = {
    paper_bgcolor: "#0a1830",
    plot_bgcolor:  "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 10 },
    margin: { l: 52, r: 12, t: 28, b: 42 },
    height: 260,
    title: {
      text: offChart > 0
        ? `${label.toUpperCase()} · ${offChart} off-chart`
        : label.toUpperCase(),
      font: { color, size: 11, family: "JetBrains Mono, monospace" },
      x: 0, xanchor: "left",
    },
    xaxis: {
      title: { text: "actual", font: { size: 10, color: "#94a3b8" } },
      gridcolor: "#233966",
      range: lim,
      autorange: false,
    },
    yaxis: {
      title: { text: "predicted", font: { size: 10, color: "#94a3b8" } },
      gridcolor: "#233966",
      range: lim,
      autorange: false,
    },
  };

  Plotly.newPlot(host, traces, layout, { displayModeBar: false, responsive: true });
}
