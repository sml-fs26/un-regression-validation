/* ==========================================================================
   Widget: Guess-the-Role quiz.
   Shows a scatter for one feature; the reader guesses causal / spurious /
   incidental; reveals the codebook's actual role + a one-line explanation.
   ========================================================================== */

import { ROLE_COLORS, column, pearson, logSafe } from "./data.js";

const PICKS = [
  {
    feature: "scrabble_score_country_name",
    explain:
      "Scrabble tile values for the letters of a country&rsquo;s English name have no mechanism " +
      "linking them to wealth. Any correlation is the noise that appears when you test 300+ features.",
  },
  {
    feature: "rule_of_law_index",
    explain:
      "Reliable institutions protect property rights, enforce contracts, and lower the cost " +
      "of investment &mdash; the mechanism economists actually posit for prosperity.",
  },
  {
    feature: "vowels_in_country_name",
    explain:
      "The spelling of a country&rsquo;s English exonym is historical accident. Correlation " +
      "with GDP is coincidence amplified by a small sample and many feature rolls.",
  },
  {
    feature: "life_expectancy_at_birth",
    explain:
      "Life expectancy compresses dozens of health-system, nutrition, and income-distribution " +
      "mechanisms into one number &mdash; a textbook causal correlate of prosperity.",
  },
  {
    feature: "pct_internet_users",
    explain:
      "Internet penetration lowers transaction costs, accelerates knowledge diffusion, and is " +
      "plausibly part of a productivity mechanism the literature takes seriously.",
  },
  {
    feature: "unesco_world_heritage_sites",
    explain:
      "UNESCO recognitions correlate with wealth (rich countries lobby and preserve more), " +
      "but the sites do not <em>produce</em> GDP &mdash; they accumulate alongside it.",
  },
  {
    feature: "unemployment_rate",
    explain:
      "Unemployment is a real labour-market statistic that moves with GDP in complicated ways, " +
      "but it is not the root cause of national income. The codebook marks it incidental.",
  },
];

export function mountQuiz(host, { rows, roleOf, columns, descOf, target }) {
  // Resolve each pick's actual column (preferred name else first fallback that exists).
  const picks = PICKS
    .map(p => {
      const candidates = [p.feature, ...(p.fallback ?? [])];
      const col = candidates.find(c => columns.includes(c));
      return col ? { ...p, feature: col } : null;
    })
    .filter(Boolean);

  if (picks.length === 0) {
    host.innerHTML = `<div class="loading">No known quiz features present in this dataset.</div>`;
    return;
  }

  const state = { idx: 0, score: 0, answered: new Array(picks.length).fill(false) };

  const yLogGdp = column(rows, target).map(logSafe);

  const $fname    = host.querySelector("[data-feature-name]");
  const $fdesc    = host.querySelector("[data-feature-desc]");
  const $choices  = host.querySelector("[data-choices]");
  const $explain  = host.querySelector("[data-explain]");
  const $plot     = host.querySelector("[data-plot]");
  const $progress = host.querySelector("[data-progress]");
  const $next     = host.querySelector("[data-next]");

  function renderQuestion() {
    const q = picks[state.idx];
    $fname.textContent = q.feature;
    $fdesc.innerHTML   = descOf[q.feature] ?? "";
    $explain.innerHTML = "";
    $progress.textContent =
      `${state.idx + 1} / ${picks.length} · score: ${state.score}`;
    $next.style.visibility = "hidden";

    // Build role-choice buttons fresh.
    $choices.innerHTML = "";
    const options = ["causal", "spurious", "incidental"];
    for (const opt of options) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opt;
      b.dataset.role = opt;
      b.addEventListener("click", () => chooseRole(opt, b));
      $choices.appendChild(b);
    }

    // Scatter.
    const xRaw = column(rows, q.feature);
    const xs = [], ys = [], labels = [];
    for (let i = 0; i < rows.length; i++) {
      const xv = xRaw[i], yv = yLogGdp[i];
      if (Number.isFinite(xv) && Number.isFinite(yv)) {
        xs.push(xv); ys.push(yv); labels.push(rows[i].iso3);
      }
    }
    const r = pearson(xs, ys);
    const data = [{
      type: "scatter", mode: "markers",
      x: xs, y: ys, text: labels,
      marker: { size: 9, color: "#94a3b8", opacity: 0.6, line: { width: 0.5, color: "#0a1830" } },
      hovertemplate: `<b>%{text}</b><br>${q.feature} = %{x}<extra></extra>`,
    }];
    const layout = {
      paper_bgcolor: "#0a1830", plot_bgcolor: "#0a1830",
      font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
      margin: { l: 60, r: 20, t: 10, b: 50 },
      height: 340,
      xaxis: { title: { text: q.feature, font: { size: 11, color: "#94a3b8" } }, gridcolor: "#233966" },
      yaxis: { title: { text: "log₁₀(GDP per capita)", font: { size: 11, color: "#94a3b8" } }, gridcolor: "#233966" },
      showlegend: false,
      annotations: [
        {
          x: 0.98, y: 0.04, xref: "paper", yref: "paper", xanchor: "right",
          text: `|r| = ${Number.isFinite(r) ? Math.abs(r).toFixed(3) : "&mdash;"}`,
          font: { color: "#94a3b8", family: "JetBrains Mono, monospace", size: 11 },
          showarrow: false,
        },
      ],
    };
    Plotly.react($plot, data, layout, { displayModeBar: false, responsive: true });
  }

  function chooseRole(choice, btn) {
    if (state.answered[state.idx]) return;
    const q = picks[state.idx];
    const correct = roleOf[q.feature] ?? "incidental";
    state.answered[state.idx] = true;

    // Update button classes + disable.
    for (const b of $choices.querySelectorAll("button")) {
      b.disabled = true;
      if (b.dataset.role === correct) b.classList.add("is-answer");
    }
    if (choice === correct) {
      btn.classList.add("chosen-correct");
      state.score++;
    } else {
      btn.classList.add("chosen-incorrect");
    }

    // Recolor the plot's markers by the true role.
    Plotly.restyle($plot, { "marker.color": ROLE_COLORS[correct], "marker.opacity": 0.88 });

    $explain.innerHTML =
      `<span class="mono" style="color:${ROLE_COLORS[correct]}">${correct}.</span> ${q.explain}`;
    $progress.textContent =
      `${state.idx + 1} / ${picks.length} · score: ${state.score}`;
    $next.style.visibility = state.idx < picks.length - 1 ? "visible" : "hidden";
    if (state.idx === picks.length - 1) {
      $explain.innerHTML += `<br><strong style="color:#f59e0b">Final score: ${state.score} / ${picks.length}.</strong>`;
    }
  }

  $next.addEventListener("click", () => {
    if (state.idx < picks.length - 1) {
      state.idx++;
      renderQuestion();
    }
  });

  renderQuestion();
}
