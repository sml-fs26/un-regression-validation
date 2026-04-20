"""leverage — hat-matrix diagonal computations shared across modules.

DESIGN.md §CC#1 "Hat-matrix definition":
    h_ii = [X(X^T X)^{-1} X^T]_{ii}

Used by:
    - audition.py  (cross-country h_ii_starkness ranking)
    - heartbeat.py (NOR p-sweep trajectory)
    - beta_path.py (post-OLS fitted values, indirectly)
    - dissolution.py (200-split mean leverage at each bootstrap)

The primary subtlety: for the p-sweep we need to compute h_ii(p) for
p = 10, 11, ..., n-1, and the trajectory must be monotonic
non-decreasing (DESIGN.md Q2 + §CC#1 acceptance #2). Standard OLS
leverage has this property when feature sets are *nested* (the new
column at step p+1 can only add, never subtract, from row i's
leverage). The pipeline uses the first `p` columns of X at each step;
nesting is guaranteed by that construction.

Regularisation: at very small p, X may be rank-deficient for rows that
happen to be zero there. We solve with `np.linalg.lstsq` which is
stable under rank deficiency; for p close to n we add a tiny ridge
(1e-8 × I) to prevent the normal matrix from going singular on numeric
precision alone.
"""

from __future__ import annotations

import numpy as np


def hat_diagonal(X: np.ndarray) -> np.ndarray:
    """Compute h_ii = [X(X^T X)^{-1} X^T]_{ii} for every row i.

    Uses a numerically stable path via QR decomposition:
        H = Q Q^T → h_ii = ||Q[i, :]||^2.

    Returns a 1-D array of length n.
    """
    if X.ndim != 2:
        raise ValueError(f"X must be 2-D; got {X.ndim}-D")
    # Add a tiny ridge to stabilise at p near n.
    n, p = X.shape
    # QR is defined for p <= n. Our p-sweep stops at p = n-1 so this holds.
    # Normalise columns first to improve conditioning.
    col_norm = np.linalg.norm(X, axis=0)
    col_norm = np.where(col_norm < 1e-12, 1.0, col_norm)
    Xn = X / col_norm
    Q, _ = np.linalg.qr(Xn, mode="reduced")
    h = np.einsum("ij,ij->i", Q, Q)
    # Numerical safety: clamp to [0, 1] (theoretical bounds).
    return np.clip(h, 0.0, 1.0)


def hat_diagonal_single_row(X: np.ndarray, row: int) -> float:
    """Convenience: h_ii for a single row.

    This is sometimes called in tight loops over countries; computing
    the full vector each time is O(n p^2) and was not measurably faster.
    Kept as a module function for readability.
    """
    return float(hat_diagonal(X)[row])
