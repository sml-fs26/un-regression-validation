#!/usr/bin/env python3
"""
Precompute data for chapters 03 (The Patch), 04 (The Reveal), and 05 (The Trust).

Mirrors the pedagogy of notebooks 03–05 in `cx1_un-games/notebooks/`.

Outputs:
- data/ch03_alpha_sweep.json
- data/ch04_importances.json
- data/ch05_cv_distribution.json
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import ElasticNet, Lasso, LinearRegression, Ridge
from sklearn.metrics import r2_score
from sklearn.model_selection import KFold, train_test_split
from sklearn.preprocessing import StandardScaler

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"

SEED = 42
TEST_FRAC = 0.2


def load_data() -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    df = pd.read_csv(DATA_DIR / "gdp_spurious_regression_dataset.csv", index_col="iso3")
    cb = pd.read_csv(DATA_DIR / "codebook.csv")
    y = df["gdp_per_capita_usd"]
    X = df.drop(columns=["gdp_per_capita_usd"])
    return X, y, cb


def split_and_scale(X: pd.DataFrame, y: pd.Series):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_FRAC, random_state=SEED,
    )
    sc = StandardScaler().fit(X_train)
    return sc.transform(X_train), sc.transform(X_test), y_train.values, y_test.values, list(X.columns), sc


# ------------------------------------------------------------------- Ch 03

def chapter_03(X: pd.DataFrame, y: pd.Series) -> dict:
    Xtr, Xte, ytr, yte, feats, _ = split_and_scale(X, y)

    alphas = np.logspace(-3, 5, 45)  # log-scale sweep

    out = {"alphas": alphas.tolist(), "models": {}}

    models = {
        "ridge":      lambda a: Ridge(alpha=a, max_iter=20000),
        "lasso":      lambda a: Lasso(alpha=a, max_iter=50000),
        "elasticnet": lambda a: ElasticNet(alpha=a, l1_ratio=0.5, max_iter=50000),
    }

    for name, make in models.items():
        train_r2, test_r2, nonzero = [], [], []
        for a in alphas:
            m = make(a).fit(Xtr, ytr)
            train_r2.append(float(r2_score(ytr, m.predict(Xtr))))
            test_r2.append(float(r2_score(yte, m.predict(Xte))))
            coef = m.coef_
            nonzero.append(int(np.sum(np.abs(coef) > 1e-8)))
        out["models"][name] = {
            "train_r2": train_r2,
            "test_r2":  test_r2,
            "nonzero":  nonzero,
        }

    # Also record OLS baseline on the full feature set (for context).
    ols = LinearRegression().fit(Xtr, ytr)
    out["baseline_ols"] = {
        "train_r2": float(r2_score(ytr, ols.predict(Xtr))),
        "test_r2":  float(r2_score(yte, ols.predict(Xte))),
    }

    out["n_features"] = len(feats)
    return out


# ------------------------------------------------------------------- Ch 04

def chapter_04(X: pd.DataFrame, y: pd.Series, cb: pd.DataFrame) -> dict:
    Xtr, Xte, ytr, yte, feats, _ = split_and_scale(X, y)

    # Pick a reasonable Lasso α. Use the α that maximises test R² on our split
    # (this is the same logic the notebook uses — "CV-optimal α" proxy).
    alphas = np.logspace(-3, 3, 30)
    best_alpha, best_r2, best_model = None, -np.inf, None
    for a in alphas:
        m = Lasso(alpha=a, max_iter=50000).fit(Xtr, ytr)
        r2 = r2_score(yte, m.predict(Xte))
        if r2 > best_r2:
            best_alpha, best_r2, best_model = float(a), float(r2), m

    lasso_coef = best_model.coef_
    lasso_top = (
        pd.DataFrame({"feature": feats, "coef": lasso_coef, "abs_coef": np.abs(lasso_coef)})
        .sort_values("abs_coef", ascending=False)
        .head(20)
        .reset_index(drop=True)
    )
    lasso_nonzero = int(np.sum(np.abs(lasso_coef) > 1e-8))

    # Random Forest, default n_estimators=200 for stability of importances.
    rf = RandomForestRegressor(n_estimators=200, random_state=SEED, n_jobs=-1).fit(Xtr, ytr)
    rf_imp = rf.feature_importances_
    rf_r2_test  = float(r2_score(yte, rf.predict(Xte)))
    rf_r2_train = float(r2_score(ytr, rf.predict(Xtr)))
    rf_top = (
        pd.DataFrame({"feature": feats, "importance": rf_imp})
        .sort_values("importance", ascending=False)
        .head(20)
        .reset_index(drop=True)
    )

    role_map = dict(zip(cb["column_name"], cb["role"]))

    def by_role(frame: pd.DataFrame, val_col: str) -> list[dict]:
        out = []
        for _, r in frame.iterrows():
            out.append({
                "feature": r["feature"],
                "value":   float(r[val_col]),
                "role":    role_map.get(r["feature"], "incidental"),
            })
        return out

    return {
        "lasso": {
            "alpha":      best_alpha,
            "test_r2":    best_r2,
            "train_r2":   float(r2_score(ytr, best_model.predict(Xtr))),
            "nonzero":    lasso_nonzero,
            "n_features": len(feats),
            "top20":      by_role(lasso_top, "abs_coef"),
        },
        "rf": {
            "train_r2": rf_r2_train,
            "test_r2":  rf_r2_test,
            "top20":    by_role(rf_top, "importance"),
        },
    }


# ------------------------------------------------------------------- Ch 05

def chapter_05(X: pd.DataFrame, y: pd.Series) -> dict:
    # Repeated train/test splits: 100 seeds, for several model families.
    # Tell the user what varying *just the split* looks like.
    n_splits = 100

    # Pick one reasonable regularized model config for each family.
    model_specs = [
        ("OLS (all features)", lambda: LinearRegression()),
        ("Ridge α=10",          lambda: Ridge(alpha=10, max_iter=20000)),
        ("Lasso α=100",         lambda: Lasso(alpha=100, max_iter=50000)),
        ("Random Forest",       lambda: RandomForestRegressor(n_estimators=100, random_state=0, n_jobs=-1)),
    ]

    results: dict[str, list[float]] = {name: [] for name, _ in model_specs}

    rng = np.random.default_rng(SEED)
    seeds = rng.integers(0, 10_000, size=n_splits)

    for s in seeds:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_FRAC, random_state=int(s),
        )
        sc = StandardScaler().fit(X_train)
        Xtr_s = sc.transform(X_train); Xte_s = sc.transform(X_test)

        for name, make in model_specs:
            m = make().fit(Xtr_s, y_train.values)
            score = r2_score(y_test.values, m.predict(Xte_s))
            results[name].append(float(score))

    # k-fold cross-validation, for comparison: same four models, k=5.
    kf = KFold(n_splits=5, shuffle=True, random_state=SEED)
    kfold_results: dict[str, list[float]] = {name: [] for name, _ in model_specs}

    Xv = X.values; yv = y.values
    for tr_idx, te_idx in kf.split(Xv):
        Xtr, Xte = Xv[tr_idx], Xv[te_idx]
        ytr, yte = yv[tr_idx], yv[te_idx]
        sc = StandardScaler().fit(Xtr)
        Xtr_s = sc.transform(Xtr); Xte_s = sc.transform(Xte)
        for name, make in model_specs:
            m = make().fit(Xtr_s, ytr)
            score = r2_score(yte, m.predict(Xte_s))
            kfold_results[name].append(float(score))

    # Summarise.
    def stats(vals: list[float]) -> dict:
        arr = np.asarray(vals)
        return {
            "mean":   float(arr.mean()),
            "std":    float(arr.std()),
            "min":    float(arr.min()),
            "q25":    float(np.percentile(arr, 25)),
            "median": float(np.median(arr)),
            "q75":    float(np.percentile(arr, 75)),
            "max":    float(arr.max()),
        }

    return {
        "n_splits": n_splits,
        "models": [
            {"name": name, "test_r2": results[name], "summary": stats(results[name])}
            for name, _ in model_specs
        ],
        "kfold": {
            "k":      5,
            "models": [
                {"name": name, "test_r2": kfold_results[name], "summary": stats(kfold_results[name])}
                for name, _ in model_specs
            ],
        },
    }


# ------------------------------------------------------------------- Main

def main() -> None:
    X, y, cb = load_data()
    print(f"loaded {X.shape[0]} countries × {X.shape[1]} features")

    print("ch03 — alpha sweep")
    ch03 = chapter_03(X, y)
    (DATA_DIR / "ch03_alpha_sweep.json").write_text(json.dumps(ch03))
    for name, stats in ch03["models"].items():
        best = max(stats["test_r2"])
        best_i = stats["test_r2"].index(best)
        print(f"  {name:12s} best test R² = {best:.3f} at α = {ch03['alphas'][best_i]:.4g}"
              f" (nonzero: {stats['nonzero'][best_i]})")

    print("ch04 — Lasso vs RF top-20")
    ch04 = chapter_04(X, y, cb)
    (DATA_DIR / "ch04_importances.json").write_text(json.dumps(ch04))
    print(f"  lasso @ α={ch04['lasso']['alpha']:.4g}: test R²={ch04['lasso']['test_r2']:.3f}, "
          f"{ch04['lasso']['nonzero']}/{ch04['lasso']['n_features']} features kept")
    print(f"  rf: test R²={ch04['rf']['test_r2']:.3f}")

    print("ch05 — repeated splits + kfold")
    ch05 = chapter_05(X, y)
    (DATA_DIR / "ch05_cv_distribution.json").write_text(json.dumps(ch05))
    for m in ch05["models"]:
        s = m["summary"]
        print(f"  {m['name']:24s} repeat-split R²: median={s['median']:.3f} "
              f"[Q25={s['q25']:.3f}, Q75={s['q75']:.3f}]")


if __name__ == "__main__":
    main()
