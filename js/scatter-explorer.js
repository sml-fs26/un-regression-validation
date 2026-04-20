/* ==========================================================================
   Widget: Scatter Explorer.
   Pick any feature; scatter it against GDP per capita. Toggle log-scale axes.
   ========================================================================== */

import { ROLE_COLORS, column, pearson, logSafe } from "./data.js";

export function mountScatterExplorer(host, { rows, columns, roleOf, descOf, target }) {
  const $select = host.querySelector("[data-feature-select]");
  const $logY   = host.querySelector("[data-log-y]");
  const $logX   = host.querySelector("[data-log-x]");
  const $plot   = host.querySelector("[data-plot]");
  const $meta   = host.querySelector("[data-meta]");

  // Group options by role so the user can see the buckets.
  const groups = { causal: [], spurious: [], incidental: [] };
  for (const col of columns) {
    const role = roleOf[col] ?? "incidental";
    (groups[role] ??= []).push(col);
  }
  const roleOrder = ["causal", "spurious", "incidental"];
  const roleLabel = { causal: "▸ CAUSAL", spurious: "▸ SPURIOUS", incidental: "▸ INCIDENTAL" };

  $select.innerHTML = "";
  for (const role of roleOrder) {
    const list = (groups[role] ?? []).slice().sort();
    if (list.length === 0) continue;
    const og = document.createElement("optgroup");
    og.label = roleLabel[role];
    for (const col of list) {
      const o = document.createElement("option");
      o.value = col;
      o.textContent = col;
      og.appendChild(o);
    }
    $select.appendChild(og);
  }
  // Default to a memorable spurious feature if present, else first option.
  const spurious = groups.spurious ?? [];
  const preferred = [
    "scrabble_score_country_name",
    "vowels_in_country_name",
    "capital_scrabble_score",
    "letters_in_country_name",
    "unesco_world_heritage_sites",
    "vowel_to_consonant_ratio",
  ];
  let defaultFeat = preferred.find(p => columns.includes(p))
                  ?? (spurious[0] ?? columns[0]);
  $select.value = defaultFeat;

  function render() {
    const feat = $select.value;
    const role = roleOf[feat] ?? "incidental";
    const col  = roleOrder.includes(role) ? role : "incidental";
    const colr = ROLE_COLORS[col];

    const xRaw = column(rows, feat);
    const yRaw = column(rows, target);
    const iso  = rows.map(r => r.iso3);

    const logX = !!$logX.checked;
    const logY = !!$logY.checked;
    const x = logX ? xRaw.map(logSafe) : xRaw;
    const y = logY ? yRaw.map(logSafe) : yRaw;

    // Correlation in the chosen space.
    const r = pearson(x, y);

    const keep = x.map((xv, i) =>
      Number.isFinite(xv) && Number.isFinite(y[i])
    );
    const xs = x.filter((_, i) => keep[i]);
    const ys = y.filter((_, i) => keep[i]);
    const labels = iso.filter((_, i) => keep[i]);

    const data = [{
      type: "scatter",
      mode: "markers",
      x: xs, y: ys, text: labels,
      marker: {
        size: 9,
        color: colr,
        line: { width: 0.5, color: "#0a1830" },
        opacity: 0.88,
      },
      hovertemplate: `<b>%{text}</b><br>${feat} = %{x}<br>${target} = %{y}<extra></extra>`,
      name: feat,
    }];

    const layout = {
      paper_bgcolor: "#0a1830",
      plot_bgcolor:  "#0a1830",
      font: { family: "JetBrains Mono, monospace", color: "#e6eaf2", size: 12 },
      margin: { l: 60, r: 30, t: 10, b: 50 },
      height: 480,
      xaxis: {
        title: { text: (logX ? "log₁₀(" : "") + feat + (logX ? ")" : ""),
                 font: { size: 12, color: "#94a3b8" } },
        gridcolor: "#233966",
        zerolinecolor: "#233966",
      },
      yaxis: {
        title: { text: (logY ? "log₁₀(GDP per capita, USD)" : "GDP per capita, USD"),
                 font: { size: 12, color: "#94a3b8" } },
        gridcolor: "#233966",
        zerolinecolor: "#233966",
      },
      showlegend: false,
    };

    Plotly.react($plot, data, layout, { displayModeBar: false, responsive: true });

    // Meta line.
    const descTxt = descOf[feat] ? ` &middot; ${descOf[feat]}` : "";
    const roleChip = `<span class="chip ${role}">${role}</span>`;
    $meta.innerHTML =
      `<span class="mono">r = ${Number.isFinite(r) ? r.toFixed(3) : "n/a"}</span> ` +
      `&middot; role: ${roleChip}${descTxt}`;
  }

  $select.addEventListener("change", render);
  $logY.addEventListener("change", render);
  $logX.addEventListener("change", render);
  render();
}
