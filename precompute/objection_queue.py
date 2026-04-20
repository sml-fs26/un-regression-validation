"""objection_queue — build /static/data/nor/objection_queue.json.

DESIGN.md §Data pipeline line 43:
    "nor/objection_queue.json | [{step: 0..8, struck_features,
     replacement_feature, beta, ci, stability_frac, contribution_usd,
     refused?: bool}] | <= 14 KB | CH4 objection mechanism"

DESIGN.md §CH4 acceptance #5 (line 768):
    "Objection queue substitutes through 8 steps; the 9th is refused
     with the `queue empty` comment **only if** the precomputed 9th
     replacement is genuinely absurd. If the precompute pipeline finds
     the 9th substitution sensible ... the chapter renders honest copy."

DESIGN.md Q4 (line 968):
    "Is the 9th objection-queue substitution genuinely absurd (so the
     `queue empty` refusal is honest), or is it a defensible feature?"

Mechanism: starting from the 18 surviving Lasso coefficients at
CV-optimal α (the CH4 β̂ row), the reader strikes features one at a
time with `[×]`. Each strike triggers a refit with that feature +
previously-struck ones removed. Step K's replacement feature is the
strongest surviving coefficient in the refit. The queue caps at 8; if
the 9th replacement is plausibly defensible (an authored feature, not
an absurd one), we set `refused: false` and the chapter's copy
regenerates per DA #11.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.linear_model import Lasso

from .paths import objection_queue_path
from .synthetic_dataset import SyntheticDataset, build
from .lasso_sweep import _cv_optimal_alpha

# Max queue length (DESIGN.md §CH4 acceptance #5: 8 objections, possibly
# a 9th refused).
MAX_OBJECTIONS: int = 8

# Stability threshold: the fraction of bootstrap resamples at which the
# replacement feature survives. Used by CH4 copy.
N_STABILITY_RESAMPLES: int = 50


def _surviving_indices(beta: np.ndarray) -> np.ndarray:
    return np.flatnonzero(np.abs(beta) > 1e-9)


def _strongest_alive(beta: np.ndarray, banned: set[int]) -> int | None:
    survivors = [(i, abs(beta[i])) for i in range(len(beta)) if i not in banned]
    survivors = [(i, v) for i, v in survivors if v > 1e-9]
    if not survivors:
        return None
    survivors.sort(key=lambda kv: -kv[1])
    return survivors[0][0]


def _stability_frac(
    ds: SyntheticDataset,
    alpha: float,
    feature_idx: int,
    banned: set[int],
    n: int = N_STABILITY_RESAMPLES,
    seed: int = 20260428,
) -> float:
    """Fraction of n bootstrap refits where feature_idx survives."""
    rng = np.random.default_rng(seed)
    kept_count = 0
    col_keep_mask = np.ones(ds.X.shape[1], dtype=bool)
    for bi in banned:
        col_keep_mask[bi] = False
    for _ in range(n):
        idx = rng.integers(0, ds.n, ds.n)
        Xb = ds.X[idx]
        yb = ds.y[idx]
        Xb_filtered = Xb * col_keep_mask  # zero-out banned columns
        model = Lasso(alpha=alpha, max_iter=5000, random_state=seed).fit(Xb_filtered, yb)
        if abs(model.coef_[feature_idx]) > 1e-9:
            kept_count += 1
    return kept_count / n


def _is_authored(feature_id: str) -> bool:
    return feature_id.startswith("authored_")


def build_queue(ds: SyntheticDataset | None = None) -> list[dict[str, object]]:
    ds = ds if ds is not None else build()
    alpha_cv = _cv_optimal_alpha(ds)

    # Initial Lasso fit at CV-optimal.
    base_model = Lasso(alpha=alpha_cv, max_iter=10000, random_state=20260429).fit(
        ds.X, ds.y
    )
    beta = base_model.coef_.astype(float)
    survivors = _surviving_indices(beta).tolist()
    if not survivors:
        raise ValueError("cv-optimal Lasso kept zero features — pipeline invariant broken")

    banned: set[int] = set()
    struck_features: list[str] = []
    queue: list[dict[str, object]] = []
    current_beta = beta.copy()

    for step in range(MAX_OBJECTIONS):
        # Strike the strongest-magnitude surviving feature (the reader's
        # natural first target — top of the β̂ row).
        struck_idx = _strongest_alive(current_beta, banned)
        if struck_idx is None:
            # Nothing left to strike; exit early.
            break
        banned.add(struck_idx)
        struck_features.append(ds.feature_ids[struck_idx])

        # Refit with banned columns zeroed.
        col_mask = np.ones(ds.X.shape[1], dtype=bool)
        for bi in banned:
            col_mask[bi] = False
        X_f = ds.X * col_mask
        refit = Lasso(alpha=alpha_cv, max_iter=10000, random_state=20260430 + step).fit(
            X_f, ds.y
        )
        new_beta = refit.coef_.astype(float)
        current_beta = new_beta

        # Replacement: strongest-magnitude surviving feature not yet banned.
        repl_idx = _strongest_alive(new_beta, banned)
        if repl_idx is None:
            queue.append(
                {
                    "step": step,
                    "struck_features": list(struck_features),
                    "replacement_feature": None,
                    "beta": None,
                    "ci": [None, None],
                    "stability_frac": 0.0,
                    "contribution_usd": None,
                    "refused": True,
                }
            )
            break
        repl_id = ds.feature_ids[repl_idx]
        repl_beta = float(new_beta[repl_idx])
        # Contribution = NOR's fitted contribution from this feature.
        contrib = round(float(ds.X[ds.nor_panel_index, repl_idx] * repl_beta), 0)
        stability = round(
            _stability_frac(ds, alpha_cv, repl_idx, banned), 3
        )
        # CI via per-feature Gaussian bootstrap of the coefficient.
        rng = np.random.default_rng(20260431 + step)
        samples: list[float] = []
        for _ in range(N_STABILITY_RESAMPLES):
            idx = rng.integers(0, ds.n, ds.n)
            Xs = (ds.X * col_mask)[idx]
            ys = ds.y[idx]
            m = Lasso(alpha=alpha_cv, max_iter=5000).fit(Xs, ys)
            samples.append(float(m.coef_[repl_idx]))
        ci = [
            round(float(np.quantile(samples, 0.025)), 3),
            round(float(np.quantile(samples, 0.975)), 3),
        ]
        queue.append(
            {
                "step": step,
                "struck_features": list(struck_features),
                "replacement_feature": repl_id,
                "beta": round(repl_beta, 4),
                "ci": ci,
                "stability_frac": stability,
                "contribution_usd": contrib,
                "refused": False,
            }
        )

    # 9th entry: genuine test of Q4. Attempt one more replacement.
    ninth_struck_idx = _strongest_alive(current_beta, banned)
    if ninth_struck_idx is not None:
        banned.add(ninth_struck_idx)
        col_mask = np.ones(ds.X.shape[1], dtype=bool)
        for bi in banned:
            col_mask[bi] = False
        X_f = ds.X * col_mask
        refit = Lasso(alpha=alpha_cv, max_iter=10000, random_state=20260499).fit(
            X_f, ds.y
        )
        ninth_replacement_idx = _strongest_alive(refit.coef_.astype(float), banned)
        if ninth_replacement_idx is None:
            ninth_id: str | None = None
        else:
            ninth_id = ds.feature_ids[ninth_replacement_idx]
        # The 9th entry is REFUSED iff the candidate would be "genuinely
        # absurd" (an absurd_NN or unlabeled-feat feature). If it's an
        # authored feature, the refusal is honest-false and copy
        # regenerates to the DA #11 fallback line.
        refused = ninth_id is None or not _is_authored(ninth_id)
        queue.append(
            {
                "step": len(queue),  # 8
                "struck_features": list(struck_features) + [ds.feature_ids[ninth_struck_idx]],
                "replacement_feature": ninth_id,
                "beta": None if ninth_id is None else round(float(refit.coef_[ninth_replacement_idx]), 4),
                "ci": [None, None],
                "stability_frac": 0.0,
                "contribution_usd": None,
                "refused": refused,
            }
        )
    return queue


def verify(queue: list[dict[str, object]]) -> None:
    if not queue:
        raise ValueError("objection_queue.json is empty")
    if len(queue) > 9:
        raise ValueError(f"queue must be <= 9 entries (8 + final); got {len(queue)}")
    for i, entry in enumerate(queue):
        if entry["step"] != i:
            raise ValueError(f"entry {i}: step field must be {i}; got {entry['step']}")
    # The final entry carries `refused`. If refused=True the queue ran
    # dry (CH4 wow #2 "queue empty" line); if refused=False the chapter
    # ships the honest-non-empty fallback per DESIGN.md line 768.
    final = queue[-1]
    if "refused" not in final:
        raise ValueError("final entry must carry 'refused' flag")


def write(queue: list[dict[str, object]]) -> Path:
    out = objection_queue_path()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(queue, separators=(",", ":")) + "\n", encoding="utf-8")
    return out


def run(ds: SyntheticDataset | None = None) -> Path:
    q = build_queue(ds)
    verify(q)
    return write(q)


if __name__ == "__main__":
    path = run()
    size = path.stat().st_size
    print(f"wrote {path} ({size} bytes)")
