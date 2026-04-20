"""rf_top20 — build /static/data/nor/rf_top20.json.

DESIGN.md §Data pipeline line 44:
    "nor/rf_top20.json | {feature_id, importance, pdp_shape}[]
     | <= 12 KB | CH4 JOIN result"

DESIGN.md §CH4 Data requirements line 743:
    "nor/rf_top20.json (Random Forest top-20 features for the JOIN)."

DESIGN.md §CH4 acceptance #7 (line 770):
    "The CH1 pin renders in the JOIN result with rf_importance: NaN
     (verified against real RF data; if the pin is in RF top-20, copy
     adapts...)."

pdp_shape: 6-point sampling of the marginal Partial Dependence curve,
normalized to [0, 1]. Used by the site's 9pt "pdp_shape_agrees"
column in <Ch4JoinedTable>.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.ensemble import RandomForestRegressor

from .paths import rf_top20_path
from .synthetic_dataset import SyntheticDataset, build

# Number of features in the ranking (DESIGN.md line 44).
TOP_K: int = 20

# Partial-dependence sample points.
PDP_N_SAMPLES: int = 6


def _pdp_shape(rf: RandomForestRegressor, X: np.ndarray, feature: int) -> list[float]:
    """Sample the marginal PDP for `feature` at PDP_N_SAMPLES quantiles."""
    xs = np.quantile(X[:, feature], np.linspace(0.05, 0.95, PDP_N_SAMPLES))
    base = X.mean(axis=0)
    samples: list[float] = []
    for x_val in xs:
        row = base.copy()
        row[feature] = float(x_val)
        pred = float(rf.predict(row.reshape(1, -1))[0])
        samples.append(pred)
    arr = np.asarray(samples, dtype=float)
    # Normalize to [0, 1] within this feature so downstream rendering is
    # scale-free.
    lo, hi = float(arr.min()), float(arr.max())
    if hi - lo < 1e-9:
        return [0.5] * PDP_N_SAMPLES
    return [round((v - lo) / (hi - lo), 3) for v in arr]


def build_top20(ds: SyntheticDataset | None = None) -> list[dict[str, object]]:
    ds = ds if ds is not None else build()
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        random_state=20260432,
        n_jobs=1,
    ).fit(ds.X, ds.y)
    importance = rf.feature_importances_.astype(float)
    order = np.argsort(-importance)[:TOP_K]
    rows: list[dict[str, object]] = []
    for feat_idx in order:
        feat_idx_int = int(feat_idx)
        rows.append(
            {
                "feature_id": ds.feature_ids[feat_idx_int],
                "importance": round(float(importance[feat_idx_int]), 5),
                "pdp_shape": _pdp_shape(rf, ds.X, feat_idx_int),
            }
        )
    return rows


def verify(rows: list[dict[str, object]]) -> None:
    if len(rows) != TOP_K:
        raise ValueError(f"rf_top20 must have {TOP_K} rows; got {len(rows)}")
    ids = {r["feature_id"] for r in rows}
    if len(ids) != TOP_K:
        raise ValueError("rf_top20 has duplicate feature_id")
    # importance is non-increasing (descending sort invariant).
    prev = float("inf")
    for r in rows:
        imp = float(r["importance"])  # type: ignore[arg-type]
        if imp > prev + 1e-9:
            raise ValueError("rf_top20 is not descending-sorted")
        prev = imp
    for r in rows:
        pdp = r["pdp_shape"]
        if not isinstance(pdp, list) or len(pdp) != PDP_N_SAMPLES:
            raise ValueError(f"pdp_shape for {r['feature_id']} has wrong shape")


def write(rows: list[dict[str, object]]) -> Path:
    out = rf_top20_path()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, separators=(",", ":")) + "\n", encoding="utf-8")
    return out


def run(ds: SyntheticDataset | None = None) -> Path:
    rows = build_top20(ds)
    verify(rows)
    return write(rows)


if __name__ == "__main__":
    path = run()
    size = path.stat().st_size
    print(f"wrote {path} ({size} bytes)")
