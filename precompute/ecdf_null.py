"""ecdf_null — build /static/data/nor/ecdf_null.json.

DESIGN.md §Data pipeline line 47:
    "nor/ecdf_null.json | {abs_r: float[]} for full 356-feature null +
     permutation band | <= 14 KB | CH1 ECDF reveal"

DESIGN.md §CH1 line 428:
    "ECDF caption visible: `you built this in thirty seconds. 186 of
     356 features would have fit inside it.`"

DESIGN.md §CH1 acceptance #7 (line 477):
    "The `186 / 356` count is loaded from ecdf_null.json, not hard-coded."

The ECDF reveal fires at the end of CH1's query sequence. The `abs_r`
array holds the 356-feature |Pearson r(feature, y)| for the SYNTHETIC
null — i.e., for y shuffled so that no feature should be meaningfully
correlated. The CH1 caption reads the count of features whose real
|r| exceeds the 95th percentile of the null, which is the "how many
features would have fit inside the reader's ECDF" number.

The file's `abs_r` is the 356 real |r| values (the feature vs y
correlations under the true signal), sorted so the ECDF construction
is O(1) on the site. The count rendered in copy is computed from JSON
at build time and committed as a separate field.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from .paths import ecdf_null_path
from .synthetic_dataset import SyntheticDataset, build


# Number of shuffled-null permutations used to estimate the 95%
# band (BRAINSTORM CH1 "350-tick rain" uses 350 draws; we use 350 as
# well so the ECDF reveal's visual vocabulary matches).
N_PERMUTATIONS: int = 350


def compute_abs_r(X: np.ndarray, y: np.ndarray) -> np.ndarray:
    """|Pearson r| between every column of X and y. Length = X.shape[1]."""
    y_centred = y - y.mean()
    y_norm = np.linalg.norm(y_centred)
    if y_norm < 1e-12:
        raise ValueError("y is constant — cannot compute Pearson r")
    X_centred = X - X.mean(axis=0, keepdims=True)
    X_norms = np.linalg.norm(X_centred, axis=0)
    # Avoid division by zero on degenerate columns.
    X_norms = np.where(X_norms < 1e-12, 1.0, X_norms)
    r = (X_centred.T @ y_centred) / (X_norms * y_norm)
    return np.abs(r)


def build_payload(ds: SyntheticDataset) -> dict[str, object]:
    """Assemble the ECDF-null JSON payload."""
    abs_r_real = compute_abs_r(ds.X, ds.y)

    # Null distribution: shuffle y N_PERMUTATIONS times and take the
    # 95th percentile of |r| on each shuffle to build a band of
    # "what |r| a random feature would reach by chance".
    rng = np.random.default_rng(20260423)
    null_maxes: list[float] = []
    for _ in range(N_PERMUTATIONS):
        y_perm = rng.permutation(ds.y)
        null_maxes.append(float(np.quantile(compute_abs_r(ds.X, y_perm), 0.95)))
    null_band_95 = float(np.quantile(null_maxes, 0.95))

    # Count features whose real |r| falls INSIDE the null band — i.e.,
    # features that would have been indistinguishable from random under
    # permutation. The DESIGN.md CH1 caption commits to 186/356.
    fits_inside_null = int((abs_r_real <= null_band_95).sum())

    # Sort descending for ECDF construction ergonomics on the site.
    sorted_abs_r = sorted(float(v) for v in abs_r_real.tolist())
    # 4 dp keeps the file under budget.
    return {
        "abs_r": [round(v, 4) for v in sorted_abs_r],
        "n_features": int(len(abs_r_real)),
        "null_band_95": round(null_band_95, 4),
        "fits_inside_null": fits_inside_null,
    }


def verify(payload: dict[str, object]) -> None:
    abs_r = payload["abs_r"]
    if not isinstance(abs_r, list) or len(abs_r) != 356:
        raise ValueError(
            f"abs_r must be length 356; got {len(abs_r) if isinstance(abs_r, list) else type(abs_r)}"
        )
    # Monotonic non-decreasing (ECDF construction on the site).
    last = -1.0
    for v in abs_r:
        if not isinstance(v, (int, float)):
            raise ValueError("abs_r contains a non-numeric value")
        if float(v) < last - 1e-9:
            raise ValueError("abs_r must be sorted ascending for ECDF use")
        last = float(v)
    # Fits-inside-null count: DESIGN.md §CH1 acceptance #7 only binds the
    # fact that it is loaded from JSON, not a specific value. DESIGN.md
    # line 457's fallback ("you built this in {N} seconds — and
    # {fewer-fit} of 356 features would have fit") explicitly covers
    # non-186 outcomes (DA #11). verify.py checks the structural bound
    # 1 <= fits < 356 (excluding the degenerate edges), not a narrative
    # integer — the copy template pulls whatever JSON contains.
    fits = payload["fits_inside_null"]
    if not isinstance(fits, int) or not 1 <= fits < 356:
        raise ValueError(f"fits_inside_null out of structural range [1, 356): {fits}")
    null_band = payload["null_band_95"]
    if not isinstance(null_band, (int, float)) or not 0 < float(null_band) < 1:
        raise ValueError(f"null_band_95 out of (0, 1): {null_band}")


def write(payload: dict[str, object]) -> Path:
    out = ecdf_null_path()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
    return out


def run(ds: SyntheticDataset | None = None) -> Path:
    ds = ds if ds is not None else build()
    payload = build_payload(ds)
    verify(payload)
    return write(payload)


if __name__ == "__main__":
    path = run()
    size = path.stat().st_size
    print(f"wrote {path} ({size} bytes)")
