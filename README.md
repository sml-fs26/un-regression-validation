# un-regression-validation

A visual story about spurious regression, built on the
[`cx1_un-games`](https://github.com/eth-bmai-fs26/coding-exercises/tree/week1/cx1_un-games)
dataset (254 countries × 493 features, target: GDP per capita).

Live site (once Pages is enabled):
<https://sml-fs26.github.io/un-regression-validation/>

## Run locally

```bash
python3 -m http.server 8765
# → open http://localhost:8765/
```

The site is static HTML / CSS / vanilla-JS-modules; no build step.
[Plotly](https://plotly.com/javascript/) and
[PapaParse](https://www.papaparse.com/) are loaded from CDN.

## Layout

```
/
├── index.html              # hero + five-chapter grid
├── modules/
│   └── 01_explore.html     # chapter 01 (scatter / ranking / quiz) — live
├── css/style.css           # dark navy theme, role-coded palette
├── js/
│   ├── data.js             # shared CSV loader + Pearson helper
│   ├── top-correlations.js
│   ├── scatter-explorer.js
│   └── quiz.js
├── data/                   # dataset + codebook (served as static)
└── .github/workflows/pages.yml  # deploys root to GitHub Pages on push to main
```

## Chapters

- **01 — The Bait.** Scatter any of the 493 features against GDP. Rank by |Pearson r|. Quiz. *(live)*
- **02 — The Crash.** OLS train/test R² as feature count crosses p = n. *(stub)*
- **03 — The Patch.** Ridge / Lasso / Elastic Net α-sweeps. *(stub)*
- **04 — The Reveal.** Lasso vs Random Forest top-20 importances. *(stub)*
- **05 — The Trust.** Cross-validation distributions. *(stub)*

## Enabling GitHub Pages

Repo Settings → Pages → Source: **GitHub Actions**. The
`.github/workflows/pages.yml` workflow deploys on every push to `main`.

## Archive

Branch [`archive/stage0-stage2-attempt`](../../tree/archive/stage0-stage2-attempt)
preserves an earlier multi-stage agent-driven attempt (brainstorm committee →
design-convergence architect → step-by-step implementer). That scaffold was
abandoned after discovering it had built on a story fabricated by the brainstorm
agents rather than the real Colab-notebook pedagogy.
