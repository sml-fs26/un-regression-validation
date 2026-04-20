/* ==========================================================================
   Data loader — fetches the UN-games dataset + codebook.
   Shared by every module page. Uses PapaParse (loaded via CDN).
   ========================================================================== */

export const DATA_URL     = "../data/gdp_spurious_regression_dataset.csv";
export const CODEBOOK_URL = "../data/codebook.csv";

export const ROLE_COLORS = {
  causal:     "#22c55e",
  spurious:   "#ef4444",
  incidental: "#94a3b8",
  target:     "#f59e0b",
};

/** Parse CSV string (from fetch) into an array of objects, with header row. */
function parseCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

/**
 * Load dataset + codebook, return an object with:
 *   - rows:     array of country rows (254 × 495). first column `iso3` is a string.
 *   - features: array of { column_name, description, source, role } from codebook (length 494,
 *               includes the target row and all 493 feature rows).
 *   - roleOf:   map column_name -> role string.
 *   - columns:  array of feature-column names (excludes 'iso3' and the target), in dataset order.
 *   - target:   name of target column ("gdp_per_capita_usd").
 *   - isoByCol: map column_name -> description (for tooltips).
 */
export async function loadData() {
  const [datasetText, codebookText] = await Promise.all([
    fetch(DATA_URL).then(r => r.text()),
    fetch(CODEBOOK_URL).then(r => r.text()),
  ]);
  const rows     = parseCsv(datasetText);
  const features = parseCsv(codebookText);

  const roleOf  = {};
  const descOf  = {};
  const sourceOf = {};
  for (const f of features) {
    roleOf[f.column_name]  = f.role;
    descOf[f.column_name]  = f.description;
    sourceOf[f.column_name] = f.source;
  }

  const target = "gdp_per_capita_usd";
  const allCols = Object.keys(rows[0] || {});
  const columns = allCols.filter(c => c !== "iso3" && c !== target);

  return {
    rows,
    features,
    roleOf,
    descOf,
    sourceOf,
    columns,
    target,
  };
}

/** Pearson correlation between two parallel numeric arrays; ignores non-finite pairs. */
export function pearson(xs, ys) {
  let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  const L = Math.min(xs.length, ys.length);
  for (let i = 0; i < L; i++) {
    const x = xs[i], y = ys[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    n++;
    sx += x; sy += y;
    sxx += x * x; syy += y * y;
    sxy += x * y;
  }
  if (n < 3) return NaN;
  const cov = sxy - (sx * sy) / n;
  const vx  = sxx - (sx * sx) / n;
  const vy  = syy - (sy * sy) / n;
  if (vx <= 0 || vy <= 0) return NaN;
  return cov / Math.sqrt(vx * vy);
}

/** Extract a numeric column from `rows`, returning an array of same length (NaN for non-numeric). */
export function column(rows, name) {
  const out = new Array(rows.length);
  for (let i = 0; i < rows.length; i++) {
    const v = rows[i][name];
    out[i] = (typeof v === "number" && Number.isFinite(v)) ? v : NaN;
  }
  return out;
}

/** Log10 with safe handling for <= 0 (returns NaN). */
export function logSafe(v) {
  return (Number.isFinite(v) && v > 0) ? Math.log10(v) : NaN;
}
