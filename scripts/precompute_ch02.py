#!/usr/bin/env python3
"""
Precompute Chapter 02 (The Crash) data.

Mirrors `cx1_un-games/notebooks/02_overfitting.ipynb`:
- 80/20 train/test split, random_state=42
- StandardScaler on features
- sklearn LinearRegression (uses np.linalg.lstsq under the hood when singular,
  which is what produces the runaway "memorise train, explode on test" gap
  once p > n)

Outputs:
- data/ch02_sweep.json        { ps: [...], train_r2: [...], test_r2: [...], n_train, n_test, p_max }
- data/ch02_predictions.json  [{ p, iso3: [...], y_true: [...], y_pred_train: [...], ... }]
                              for a handful of representative p values.

Usage: python3 scripts/precompute_ch02.py  (run from repo root)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"

SEED = 42
TEST_FRAC = 0.2

# p values to sweep. Dense near p = n so the cliff is legible.
# Notebook uses: range(5, 300, 10) + range(300, N, 25) + [N]. We mirror that,
# then add a handful beyond N to keep the degeneracy visible past p = N.
def sweep_counts(n_features: int, n_train: int) -> list[int]:
    ps: list[int] = []
    ps += list(range(5, min(n_train, 200), 10))
    # Dense around the p = n_train cliff.
    ps += list(range(max(1, n_train - 15), n_train + 15))
    ps += list(range(n_train + 20, min(n_features, n_train + 80), 10))
    ps += list(range(max(n_train + 80, 300), n_features, 25))
    ps += [n_features]
    ps = sorted(set(p for p in ps if 1 <= p <= n_features))
    return ps


def main() -> None:
    csv_path = DATA_DIR / "gdp_spurious_regression_dataset.csv"
    df = pd.read_csv(csv_path, index_col="iso3")
    y_full = df["gdp_per_capita_usd"].values.astype(float)
    X_full = df.drop(columns=["gdp_per_capita_usd"]).astype(float)

    feature_order = list(X_full.columns)  # codebook order, as the notebook does
    n_features = len(feature_order)

    X_train, X_test, y_train, y_test, iso_train, iso_test = train_test_split(
        X_full.values, y_full, df.index.values,
        test_size=TEST_FRAC, random_state=SEED,
    )
    n_train = len(y_train)
    n_test = len(y_test)
    print(f"n_train = {n_train}, n_test = {n_test}, n_features = {n_features}")

    ps = sweep_counts(n_features, n_train)
    print(f"sweeping {len(ps)} p values: {ps[:5]} … {ps[-5:]}")

    # Sweep
    train_r2, test_r2 = [], []
    preds_by_p: dict[int, dict] = {}
    snapshot_ps = sorted(set([
        5, 25, 100, n_train - 5, n_train, n_train + 5, 300, n_features,
    ]))
    snapshot_ps = [p for p in snapshot_ps if 1 <= p <= n_features]

    for p in ps:
        cols = np.arange(p)
        Xtr = X_train[:, cols]
        Xte = X_test[:, cols]

        sc = StandardScaler().fit(Xtr)
        Xtr_s = sc.transform(Xtr)
        Xte_s = sc.transform(Xte)

        model = LinearRegression()
        model.fit(Xtr_s, y_train)
        yp_tr = model.predict(Xtr_s)
        yp_te = model.predict(Xte_s)

        r2_tr = r2_score(y_train, yp_tr)
        r2_te = r2_score(y_test, yp_te)
        train_r2.append(float(r2_tr))
        test_r2.append(float(r2_te))

        if p in snapshot_ps:
            preds_by_p[int(p)] = {
                "p": int(p),
                "train_r2": float(r2_tr),
                "test_r2":  float(r2_te),
                "iso_train": [str(x) for x in iso_train],
                "y_true_train": [float(x) for x in y_train],
                "y_pred_train": [float(x) for x in yp_tr],
                "iso_test":  [str(x) for x in iso_test],
                "y_true_test":  [float(x) for x in y_test],
                "y_pred_test":  [float(x) for x in yp_te],
            }

    out_sweep = {
        "ps": [int(p) for p in ps],
        "train_r2": train_r2,
        "test_r2":  test_r2,
        "n_train": int(n_train),
        "n_test": int(n_test),
        "p_max": int(n_features),
        "seed": SEED,
        "test_frac": TEST_FRAC,
        "feature_order": feature_order,
    }
    (DATA_DIR / "ch02_sweep.json").write_text(json.dumps(out_sweep))
    print(f"wrote data/ch02_sweep.json ({len(ps)} points)")

    out_preds = {"snapshots": [preds_by_p[p] for p in sorted(preds_by_p.keys())]}
    (DATA_DIR / "ch02_predictions.json").write_text(json.dumps(out_preds))
    print(f"wrote data/ch02_predictions.json ({len(preds_by_p)} snapshots)")


if __name__ == "__main__":
    main()
