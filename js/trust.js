/* ==========================================================================
   Chapter 05: The Trust.
   Repeated train/test splits (100 seeds) for 4 model families, plotted as a
   strip/box chart. Shows the spread of test R² that a single split hides.
   Also: a 5-fold CV boxplot for comparison.
   ========================================================================== */

import { renderMath } from "./math.js";

const CV_URL = "../data/ch05_cv_distribution.json";
const PREDS_URL = "../data/ch02_predictions.json";

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
  const [d, preds] = await Promise.all([
    fetch(CV_URL).then(r => r.json()),
    fetch(PREDS_URL).then(r => r.json()).catch(() => null),
  ]);

  const maxSpread = Math.max(...d.models.map(m => m.summary.max - m.summary.min));
  const worstModelEntry = d.models.reduce((w, m) =>
    (m.summary.max - m.summary.min) > (w.summary.max - w.summary.min) ? m : w, d.models[0]);

  host.innerHTML = `
    <section class="widget">
      <h2>${d.n_splits} random train/test splits, ${d.models.length} models <span class="preview-note">preview · ribbon</span></h2>
      <p class="help">
        Everything you have seen so far came from one random split of the data (seed = 42).
        Change the seed, re-split, refit. Test \\(R^2\\) changes. Each short horizontal tick
        below is <strong>one 80/20 split</strong>. Drag the slider or press
        <span class="mono">▶ replay</span> to watch the splits paint in one at a time: the
        current split flashes white, the running mean (yellow) settles as more splits arrive,
        and the seed-42 baseline stays highlighted in <span style="color:#f59e0b">gold</span>.
        The widest model (<strong class="mono">${worstModelEntry.name}</strong>) spans
        ${(worstModelEntry.summary.max - worstModelEntry.summary.min).toFixed(2)} \\(R^2\\)
        units across splits.
        The three regularised models use the \\(\\alpha\\) Chapter 03 selected as best on the
        seed-42 split &mdash; we are asking how that \\(\\alpha\\) behaves when the split changes.
      </p>
      <div class="ribbon-controls" data-ribbon-controls>
        <button type="button" data-play>▶ replay</button>
        <input type="range" min="1" max="100" step="1" value="100" aria-label="split cursor">
        <span data-split-label class="mono" style="color: var(--text-dim);">—</span>
      </div>
      <div data-strip-plot class="plot" style="min-height: 460px;"></div>
    </section>

    <section class="widget">
      <h2>\\(k\\)-fold cross-validation (\\(k = ${d.kfold.k}\\))</h2>
      <p class="help">
        \\(k\\)-fold CV is a principled alternative to one random split: partition the data into
        \\(k = ${d.kfold.k}\\) equal-sized folds, train on \\(k - 1\\) of them, test on the one
        held out, and cycle through all \\(k\\) combinations. The spread of the \\(k\\) test
        scores is the model&rsquo;s honest uncertainty on this dataset.
      </p>

      <details class="depth-block" data-depth="deep">
        <summary>the CV estimator, formally</summary>
        <div class="depth-body">
          <p class="help" style="margin:0;">
            Let \\(\\{(\\mathcal{D}^{\\text{tr}}_k, \\mathcal{D}^{\\text{te}}_k)\\}_{k=1}^K\\) be a
            partition of the \\(n\\) countries into \\(K\\) folds. For a learning algorithm
            \\(\\mathcal{A}\\) that returns a predictor \\(\\hat f_k = \\mathcal{A}(\\mathcal{D}^{\\text{tr}}_k)\\),
            the \\(K\\)-fold cross-validated risk estimate is
            \\[
              \\widehat{R}_{\\text{CV}} = \\frac{1}{K} \\sum_{k=1}^{K}
                \\frac{1}{|\\mathcal{D}^{\\text{te}}_k|} \\sum_{(x,y) \\in \\mathcal{D}^{\\text{te}}_k}
                \\ell(y, \\hat f_k(x))
            \\]
            Unlike a single 80/20, every country appears in exactly one test fold and \\(K-1\\)
            training folds; the estimator trades variance (\\(K\\) lower-variance estimates
            averaged) for a small bias (each \\(\\hat f_k\\) is trained on \\(n(K-1)/K\\) rows,
            not \\(n\\)).
          </p>
        </div>
      </details>

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

    <section class="widget" data-souvenir-slot>
      <h2>Your souvenir <span class="preview-note">preview · new</span></h2>
      <p class="help">
        A keepsake from the crash: a random held-out country from Chapter 02&rsquo;s
        seed-42 OLS (all 493 features). Press the die to pull another country. The
        prediction is the one the over-fit model actually made, back when you were briefly
        a hero.
      </p>
      <div data-souvenir></div>
    </section>
  `;

  renderStrip(host.querySelector("[data-strip-plot]"), d.models);
  renderKFold(host.querySelector("[data-kfold-plot]"), d.kfold.models);
  renderSouvenir(host.querySelector("[data-souvenir]"), preds);
  renderMath(host);
}

/**
 * Proposal 5 (preview): resampling ribbon.
 * For each model we draw one thin horizontal tick per split at its R² value,
 * opacity 0.15, stacked vertically per model. A scrub control "flashes" the
 * current split in white. The seed-42 split (index 0 by our generator) is
 * highlighted in accent-gold and labelled.
 *
 * This replaces the repeated-splits box plot only — the k-fold chart below
 * is untouched.
 */
function renderStrip(host, models) {
  // Compute visible y-range robustly from combined p02/p98.
  const all = models.flatMap(m => m.test_r2).filter(v => Number.isFinite(v));
  const sorted = all.slice().sort((a, b) => a - b);
  const p02 = sorted[Math.floor(sorted.length * 0.02)];
  const p98 = sorted[Math.floor(sorted.length * 0.98)];
  const lo = Math.max(-2, Math.min(p02, 0));
  const hi = Math.min(1.05, p98 + 0.05);

  // Column x-slot per model. Ticks span ±halfWidth of centre.
  const halfWidth = 0.38;

  const nSplits = models[0]?.test_r2?.length ?? 0;

  const buildTraces = (visibleCount) => {
    const traces = [];

    models.forEach((m, mi) => {
      const xCentre = mi;
      const n = m.test_r2.length;
      const shown = Math.min(n, visibleCount);

      // Faint grey ticks for all splits (always drawn; scrub controls opacity
      // by re-emitting the visible subset in accent-gold below).
      const xs = [], ys = [];
      for (let i = 0; i < n; i++) {
        const y = m.test_r2[i];
        if (!Number.isFinite(y)) continue;
        // Three points per tick: left, right, gap — build as a single line
        // trace with NaN separators.
        xs.push(xCentre - halfWidth, xCentre + halfWidth, NaN);
        ys.push(y, y, NaN);
      }
      traces.push({
        type: "scattergl",
        mode: "lines",
        x: xs, y: ys,
        line: { color: modelColor(m.name), width: 1.2 },
        opacity: 0.18,
        hoverinfo: "skip",
        showlegend: false,
      });

      // Running mean ± 2σ band over the first `shown` splits.
      if (shown >= 2) {
        const slice = m.test_r2.slice(0, shown).filter(Number.isFinite);
        const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
        const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
        const sd = Math.sqrt(variance);
        // Mean line + ±2σ band (as lines — a single rect is easier via shapes,
        // but doing it as traces lets hover pick it up).
        traces.push({
          type: "scatter",
          mode: "lines",
          x: [xCentre - halfWidth, xCentre + halfWidth],
          y: [mean, mean],
          line: { color: "#fcd34d", width: 1.8 },
          name: `${m.name} mean`,
          hovertemplate:
            `<b>${m.name}</b><br>mean after ${shown} splits = ${mean.toFixed(3)}<br>σ = ${sd.toFixed(3)}<extra></extra>`,
          showlegend: false,
        });
      }

      // Highlight the seed-42 split (index 0).
      if (n > 0 && Number.isFinite(m.test_r2[0])) {
        traces.push({
          type: "scatter",
          mode: "lines",
          x: [xCentre - halfWidth, xCentre + halfWidth],
          y: [m.test_r2[0], m.test_r2[0]],
          line: { color: "#f59e0b", width: 2.2 },
          hovertemplate:
            `<b>${m.name}</b><br>seed = 42 split<br>test R² = ${m.test_r2[0].toFixed(3)}<extra></extra>`,
          showlegend: false,
        });
      }

      // Scrub highlight: current split in white.
      const cursor = Math.min(shown, n) - 1;
      if (cursor >= 0 && Number.isFinite(m.test_r2[cursor])) {
        traces.push({
          type: "scatter",
          mode: "lines+markers",
          x: [xCentre - halfWidth, xCentre + halfWidth],
          y: [m.test_r2[cursor], m.test_r2[cursor]],
          line: { color: "#ffffff", width: 2 },
          marker: { color: "#ffffff", size: 5 },
          hovertemplate:
            `<b>${m.name}</b><br>split #${cursor + 1} test R² = ${m.test_r2[cursor].toFixed(3)}<extra></extra>`,
          showlegend: false,
        });
      }
    });

    return traces;
  };

  const tickvals = models.map((_, i) => i);
  const ticktext = models.map(m => m.name);

  const layout = {
    paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
    margin: { l: 70, r: 20, t: 30, b: 95 },
    height: 460,
    yaxis: {
      title: { text: "test R² (one tick = one 80/20 split)", font: { size: 12, color: "#94a3b8" } },
      gridcolor: "#233966", zerolinecolor: "#233966",
      range: [lo, hi],
      zeroline: true,
    },
    xaxis: {
      tickvals, ticktext,
      tickfont: { family: "JetBrains Mono, monospace", size: 10 },
      tickangle: -18,
      range: [-0.7, models.length - 0.3],
      showgrid: false,
    },
    showlegend: false,
    hovermode: "closest",
    shapes: [
      {
        type: "line", xref: "paper", yref: "y",
        x0: 0, x1: 1, y0: 0, y1: 0,
        line: { color: "#233966", width: 1, dash: "dot" },
      },
    ],
  };

  Plotly.newPlot(host, buildTraces(nSplits), layout, { displayModeBar: false, responsive: true });

  // Scrub controls live inside a sibling .ribbon-controls div (injected by
  // caller). We look it up relative to host.
  const controls = host.parentElement?.querySelector("[data-ribbon-controls]");
  if (controls && nSplits > 0) {
    const slider = controls.querySelector("input[type='range']");
    const label  = controls.querySelector("[data-split-label]");
    const playBtn = controls.querySelector("[data-play]");
    slider.min = "1";
    slider.max = String(nSplits);
    slider.value = String(nSplits);
    const update = (v) => {
      const k = Math.max(1, Math.min(nSplits, Number(v) | 0));
      label.textContent = `split ${k} / ${nSplits}`;
      Plotly.react(host, buildTraces(k), layout, { displayModeBar: false, responsive: true });
    };
    slider.addEventListener("input", (e) => update(e.target.value));
    update(nSplits);

    // Simple play animation: step through splits at ~20 fps.
    let timer = null;
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; playBtn.textContent = "▶ replay"; }
    };
    playBtn.addEventListener("click", () => {
      if (timer) { stop(); return; }
      playBtn.textContent = "■ stop";
      let k = 1;
      slider.value = "1"; update(1);
      timer = setInterval(() => {
        k++;
        if (k > nSplits) { stop(); return; }
        slider.value = String(k);
        update(k);
      }, 60);
    });
  }
}

/**
 * Proposal 8 (preview): journey souvenir card.
 * Picks a random held-out country from the last-seen OLS-at-all-features
 * snapshot in ch02_predictions.json (seed 42 split). Persists the most
 * recently drawn country in localStorage so refreshes keep the keepsake.
 * A share button writes a URL-hash so readers can link to their souvenir.
 */
function renderSouvenir(host, predsBundle) {
  if (!host) return;
  if (!predsBundle || !predsBundle.snapshots?.length) {
    host.innerHTML = `<p class="muted mono">Souvenir unavailable: ch02 predictions not loaded.</p>`;
    return;
  }

  // Use the snapshot with the largest p (all 493 features, OLS of doom).
  const snap = predsBundle.snapshots.reduce((a, b) => (b.p > a.p ? b : a), predsBundle.snapshots[0]);
  const countries = snap.iso_test ?? [];
  const yTrue = snap.y_true_test ?? [];
  const yPred = snap.y_pred_test ?? [];

  if (!countries.length) {
    host.innerHTML = `<p class="muted mono">Souvenir unavailable: no test countries in snapshot.</p>`;
    return;
  }

  // Prefer a country from the URL hash if present (for shared links), else
  // localStorage, else a fresh random pick.
  let safeStore = null;
  try { safeStore = window.localStorage; } catch (_) { safeStore = null; }
  const storedIdx = (() => {
    try {
      const fromHash = new URL(window.location.href).hash;
      const m = /souvenir=(\d+)/.exec(fromHash);
      if (m) return Number(m[1]);
    } catch (_) {}
    try {
      const v = safeStore?.getItem("un-games-souvenir-idx");
      if (v != null) return Number(v);
    } catch (_) {}
    return null;
  })();

  const valid = countries
    .map((_, i) => i)
    .filter(i => Number.isFinite(yTrue[i]) && Number.isFinite(yPred[i]));
  if (!valid.length) {
    host.innerHTML = `<p class="muted mono">Souvenir unavailable: no finite predictions.</p>`;
    return;
  }

  const pickRandom = () => valid[Math.floor(Math.random() * valid.length)];
  let idx = Number.isFinite(storedIdx) && valid.includes(storedIdx) ? storedIdx : pickRandom();

  host.innerHTML = `
    <div class="souvenir-card">
      <div>
        <div class="souvenir-caption">
          Your model predicted <span class="country" data-country></span>.
          It was <span data-verdict></span>.
        </div>
        <div class="souvenir-stats">
          p = ${snap.p} features · seed = 42 · test R² = <span style="color: var(--role-spurious)">${snap.test_r2.toFixed(2)}</span><br>
          actual GDP    = <span class="actual"    data-actual></span> USD/person<br>
          OLS predicted = <span class="predicted" data-predicted></span> USD/person<br>
          |log₁₀ error| = <span data-logerr></span>
        </div>
        <div class="souvenir-share">
          <button type="button" data-reroll>↻ roll another country</button>
          <button type="button" data-share>⧉ copy share link</button>
        </div>
      </div>
      <div class="souvenir-plot" data-souvenir-plot></div>
    </div>
  `;

  const $country   = host.querySelector("[data-country]");
  const $verdict   = host.querySelector("[data-verdict]");
  const $actual    = host.querySelector("[data-actual]");
  const $predicted = host.querySelector("[data-predicted]");
  const $logerr    = host.querySelector("[data-logerr]");
  const $reroll    = host.querySelector("[data-reroll]");
  const $share     = host.querySelector("[data-share]");
  const $plot      = host.querySelector("[data-souvenir-plot]");

  const fmt = v => (Math.abs(v) >= 1e6
    ? (v / 1e6).toFixed(2) + "M"
    : Math.abs(v) >= 1e3
      ? (v / 1e3).toFixed(1) + "K"
      : v.toFixed(0));

  const update = () => {
    const name = countries[idx];
    const a = yTrue[idx];
    const p = yPred[idx];
    const err = Math.abs(Math.log10(Math.max(Math.abs(p), 1)) - Math.log10(Math.max(Math.abs(a), 1)));
    let verdict = "wrong by a comic margin";
    if (err < 0.15) verdict = "remarkably close";
    else if (err < 0.4) verdict = "within an order of magnitude";
    else if (err < 1.0) verdict = "off by a factor of a few";
    else if (err < 2.0) verdict = "off by one-to-two orders of magnitude";

    $country.textContent = name;
    $verdict.textContent = verdict;
    $actual.textContent = fmt(a);
    $predicted.textContent = Number.isFinite(p) ? fmt(p) : "—";
    $logerr.textContent = err.toFixed(2);

    try { safeStore?.setItem("un-games-souvenir-idx", String(idx)); } catch (_) {}
    renderSouvenirPlot($plot, snap, idx);
  };

  $reroll.addEventListener("click", () => {
    let next = pickRandom();
    if (valid.length > 1) {
      let guard = 10;
      while (next === idx && guard-- > 0) next = pickRandom();
    }
    idx = next;
    update();
  });

  $share.addEventListener("click", async () => {
    try {
      const url = new URL(window.location.href);
      url.hash = `souvenir=${idx}`;
      const link = url.toString();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        $share.textContent = "✓ copied";
      } else {
        window.prompt("Share link:", link);
      }
      setTimeout(() => { $share.textContent = "⧉ copy share link"; }, 1400);
    } catch (_) {
      /* ignore clipboard failures — link still in URL */
    }
  });

  update();
}

function renderSouvenirPlot(host, snap, idx) {
  if (!host) return;
  const { y_true_test: yt, y_pred_test: yp } = snap;
  const valid = yt.map((_, i) => i).filter(i => Number.isFinite(yt[i]) && Number.isFinite(yp[i]));
  const xs = valid.map(i => yt[i]);
  const ys = valid.map(i => yp[i]);
  const lo = Math.min(...xs) * 0.9;
  const hi = Math.max(...xs) * 1.1;
  const clamp = v => Math.min(Math.max(v, lo), hi);
  const yClamped = ys.map(clamp);

  const traces = [
    {
      type: "scatter", mode: "lines",
      x: [lo, hi], y: [lo, hi],
      line: { color: "#233966", width: 1, dash: "dash" },
      hoverinfo: "skip", showlegend: false,
    },
    {
      type: "scatter", mode: "markers",
      x: xs, y: yClamped,
      marker: { color: "#94a3b8", size: 6, opacity: 0.6 },
      hoverinfo: "skip", showlegend: false,
    },
    {
      type: "scatter", mode: "markers",
      x: [yt[idx]], y: [clamp(yp[idx])],
      marker: { color: "#f59e0b", size: 14, line: { width: 2, color: "#0a1830" }, symbol: "star" },
      hovertemplate: `actual = %{x:,.0f}<br>predicted = %{y:,.0f}<extra></extra>`,
      showlegend: false,
    },
  ];

  const layout = {
    paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
    font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 10 },
    margin: { l: 52, r: 12, t: 12, b: 42 },
    height: 260,
    xaxis: { title: { text: "actual GDP", font: { size: 10, color: "#94a3b8" } }, gridcolor: "#233966", range: [lo, hi] },
    yaxis: { title: { text: "predicted (clamped)", font: { size: 10, color: "#94a3b8" } }, gridcolor: "#233966", range: [lo, hi] },
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
