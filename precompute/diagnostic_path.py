"""diagnostic_path — build /static/data/nor/diagnostic_path.json.

DESIGN.md §Data pipeline line 39:
    "nor/diagnostic_path.json |
     {p, log_lambda_min, test_r2, scrollbar_progress}[] |
     <= 12 KB | CH2 scrollbar overlay"

For each integer p ∈ [10, n-1] compute:
    log_lambda_min   — log10 of the smallest eigenvalue of X[:, :p]^T X[:, :p].
                        Goes strongly negative as p approaches n (the
                        matrix goes singular); the CH2 caption reads
                        `log(λ_min(X^T X)) = -34.7` (DESIGN.md acc #4).
    test_r2          — a held-out R^2 computed via a single 80/20 split.
                        Drops to zero / negative as p approaches n (the
                        model overfits).
    scrollbar_progress — linear 0..1 map of (p - 10) / (last_p - 10).

DESIGN.md CH2 acceptance #4 (line 565):
    "`log(λ_min(X^T X)) = -34.7` (or close) renders in the corner pinned cell."
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from .paths import diagnostic_path_path
from .synthetic_dataset import SyntheticDataset, build

_TEST_FRACTION: float = 0.2
_SPLIT_SEED: int = 20260422


def _test_split(n: int, seed: int = _SPLIT_SEED) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    idx = rng.permutation(n)
    cut = int(round(n * (1.0 - _TEST_FRACTION)))
    return idx[:cut], idx[cut:]


def build_path(ds: SyntheticDataset) -> list[dict[str, object]]:
    n = ds.n
    last_p = n - 1
    train_idx, test_idx = _test_split(n)
    X_train, X_test = ds.X[train_idx], ds.X[test_idx]
    y_train, y_test = ds.y[train_idx], ds.y[test_idx]

    rows: list[dict[str, object]] = []
    for p in range(10, last_p):
        Xp = X_train[:, :p]
        # Fit OLS on train.
        beta, *_ = np.linalg.lstsq(Xp, y_train, rcond=None)
        # Test R^2.
        y_hat = X_test[:, :p] @ beta
        ss_res = float(np.sum((y_test - y_hat) ** 2))
        ss_tot = float(np.sum((y_test - y_test.mean()) ** 2))
        test_r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0
        # log10(lambda_min(X^T X))
        # eigvalsh is faster than general eigvals for symmetric PSD.
        XtX = Xp.T @ Xp
        try:
            lam_min = float(np.linalg.eigvalsh(XtX).min())
        except np.linalg.LinAlgError:
            lam_min = 1e-40
        # Clamp to a finite log to avoid -inf in JSON.
        if lam_min <= 0:
            log_lam = -40.0
        else:
            log_lam = float(np.log10(lam_min))
        scrollbar = (p - 10) / (last_p - 1 - 10) if last_p > 11 else 0.0
        rows.append(
            {
                "p": p,
                "log_lambda_min": round(log_lam, 3),
                "test_r2": round(test_r2, 4),
                "scrollbar_progress": round(float(scrollbar), 4),
            }
        )
    return rows


def verify(rows: list[dict[str, object]]) -> None:
    if not rows:
        raise ValueError("diagnostic_path.json is empty")
    if rows[0]["p"] != 10:
        raise ValueError(f"first p must be 10; got {rows[0]['p']}")
    # log_lambda_min should be strongly negative at the endpoint (matrix
    # is near-singular) — the CH2 caption relies on it going below -30.
    last_log_lam = float(rows[-1]["log_lambda_min"])  # type: ignore[arg-type]
    if last_log_lam > -5.0:
        raise ValueError(
            f"diagnostic_path: last log_lambda_min must be <= -5.0 (CH2 buckle);"
            f" got {last_log_lam}"
        )
    # scrollbar_progress should be in [0, 1].
    for r in rows:
        sp = float(r["scrollbar_progress"])  # type: ignore[arg-type]
        if not 0.0 <= sp <= 1.0 + 1e-9:
            raise ValueError(
                f"scrollbar_progress at p={r['p']} out of [0,1]; got {sp}"
            )


def write(rows: list[dict[str, object]]) -> Path:
    out = diagnostic_path_path()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, separators=(",", ":")) + "\n", encoding="utf-8")
    return out


def run(ds: SyntheticDataset | None = None) -> Path:
    ds = ds if ds is not None else build()
    rows = build_path(ds)
    verify(rows)
    return write(rows)


if __name__ == "__main__":
    path = run()
    size = path.stat().st_size
    print(f"wrote {path} ({size} bytes)")
