"""beta_path — build /static/data/nor/beta_path.json.

DESIGN.md §Data pipeline line 38:
    "nor/beta_path.json | {p: int, beta: float[]}[] (one row per integer p)
     | <= 180 KB | CH2 buckle"

For each integer p ∈ [10, n-1], compute OLS β̂ by solving the normal
equations on X[:, :p], y. The β array grows as p grows (β is p-long).
The CH2 buckle renders the NOR row's contribution-per-feature; the
per-p β array is the mechanism by which the CSV visibly explodes.

Budget note: 203 rows × (up-to-213-floats per row) ≈ 180 KB at JSON.
We keep coefficients to 4 sig figs to stay well inside the budget;
gzipped this is ~20 KB.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from .paths import beta_path_path
from .synthetic_dataset import SyntheticDataset, build


def beta_at_p(X: np.ndarray, y: np.ndarray, p: int) -> np.ndarray:
    """OLS β̂ on the first p columns of X.

    Uses `np.linalg.lstsq` for numerical stability — the straight normal
    equations become ill-conditioned as p approaches n.
    """
    Xp = X[:, :p]
    beta, *_ = np.linalg.lstsq(Xp, y, rcond=None)
    return beta


def build_path(ds: SyntheticDataset) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    last_p = ds.n - 1  # last well-posed OLS p is n-1
    for p in range(10, last_p):
        b = beta_at_p(ds.X, ds.y, p)
        # 4 significant figures keeps the payload comfortably inside the
        # 180 KB uncompressed budget even for p = n-2.
        rows.append(
            {
                "p": p,
                "beta": [round(float(v), 4) for v in b],
            }
        )
    return rows


def verify(rows: list[dict[str, object]]) -> None:
    if not rows:
        raise ValueError("beta_path.json is empty")
    if rows[0]["p"] != 10:
        raise ValueError(f"beta_path.json first p must be 10; got {rows[0]['p']}")
    last_p = rows[-1]["p"]
    if not isinstance(last_p, int) or last_p < 200:
        raise ValueError(
            f"beta_path.json last p must be >= 200 (covers CH2 buckle); got {last_p}"
        )
    for r in rows:
        p = r["p"]
        beta = r["beta"]
        if not isinstance(beta, list):
            raise ValueError(f"beta at p={p}: not a list")
        if len(beta) != p:
            raise ValueError(f"beta at p={p}: expected {p} entries; got {len(beta)}")


def write(rows: list[dict[str, object]]) -> Path:
    out = beta_path_path()
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
