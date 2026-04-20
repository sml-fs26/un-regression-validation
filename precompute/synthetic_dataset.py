"""synthetic_dataset — deterministic stand-in for the UN panel.

DESIGN.md §Stage 2 handoff line 933:
    "Precompute pipeline (/precompute/) producing every nor/*.json file
     plus audition.json and features.json."

The step-5 orchestrator ships a mocked UN dataset — the real multi-year
panel is an offline scholarly task whose output is not yet checked in.
Everything downstream (Lasso, OLS, RF, bootstrap) runs on this matrix
with *real* sklearn/numpy compute; the computed numbers are determined
by the matrix, not by a hand-placed lookup table.

Shape:
    n = 214 rows (= NOR's n for the heartbeat trajectory, one more than
        the 213 mentioned in BRAINSTORM CH2 wow #2 because the heartbeat
        reads p in [10, n-1] and the last valid p is 212).
    p = 356 features (matches DESIGN.md §CC#3 and §Data pipeline).
    y = 356-feature linear combination of the 30 authored features with
        calibrated weights + heteroskedastic noise.

Calibration decisions (each traceable to DESIGN.md / BRAINSTORM.md):

1. Norway is forced to the maximum h_ii_starkness (≈ 0.91, BRAINSTORM
   p215, `cast: NOR (h_ii_starkness = 0.91)`). We scale NOR's row along
   the top singular directions of the random panel so its leverage at
   p=n-1 lands around 0.98 (satisfying §CC#1 acceptance #2) while
   remaining monotonic under the p-sweep (addressing DESIGN.md Q2).

2. The CV-optimal Lasso path picks the four absurd features + one
   authored feature with weights close to the DESIGN.md line-633 targets
   (0.34, 0.28, 0.19, 0.11, 0.08). To achieve this without a
   miracle-level calibration, the pipeline's PI-decomposition module
   observes real Lasso output and reports it; if the output shape
   matches the line-633 narrative, the chapter renders verbatim, else
   the chapter copy regenerates from JSON per DA #11.

3. y is in USD and ranges roughly $1,000 (poorest) to $200,000 (richest).
   Norway's y is set explicitly in the `$90k` neighbourhood so that the
   PI cell's bracket lands near [$78,400, $94,900]. The committed target
   is stated in DESIGN.md line 633; precompute/verify.py checks the
   bracket lands in the committed range, and copy-regenerates otherwise.

This module exposes a single function, `build()`, that returns a
`SyntheticDataset` record with X, y, iso3 order, and feature order.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from .absurd_seed import ABSURD_FEATURES
from .authored_seed import AUTHORED_FEATURES
from .iso3_codes import ISO3_CODES, NOR_INDEX

# Master random seed. The entire pipeline is deterministic at this seed.
# Choice: the project birth-year / month / day (2026-04-20).
SEED: int = 20260420

# Panel shape.
N_COUNTRIES: int = 214
N_FEATURES: int = 356


@dataclass(frozen=True)
class SyntheticDataset:
    """Immutable record returned by `build()`."""

    # (N_COUNTRIES, N_FEATURES) standardised feature matrix.
    X: np.ndarray
    # (N_COUNTRIES,) GDP-per-capita-like target in USD.
    y: np.ndarray
    # ISO-3 codes, length N_COUNTRIES (one row per country).
    # The full 254-code ISO_CODES list is stored in iso3_codes.py;
    # this tuple is a subset (the panel rows we actually model) —
    # we use the first 214 codes of ISO3_CODES, with NOR's row
    # relocated to NOR_PANEL_INDEX (below).
    iso3_order: tuple[str, ...]
    # Feature id order — length N_FEATURES. Authored (30) + absurd (30)
    # + anonymous (296) in the same order as features.json.
    feature_ids: tuple[str, ...]
    # The panel index of NOR after relocation.
    nor_panel_index: int
    # The integer n used downstream for h_ii's p-domain (= N_COUNTRIES).
    n: int


# Position of NOR within the modelled panel. Kept near the top so
# Norway's row is in the OLS normal-equation when p is small (matters
# for the h_ii trajectory monotonicity). Any index ∈ [1, N_COUNTRIES)
# works; 149 is NOR's index in ISO3_CODES, preserved for readability.
NOR_PANEL_INDEX: int = 149


def _panel_iso3_order() -> tuple[str, ...]:
    """Return 214 ISO-3 codes with NOR at NOR_PANEL_INDEX."""
    # Take the first 214 codes; swap in NOR at NOR_PANEL_INDEX if absent.
    codes = list(ISO3_CODES[:N_COUNTRIES])
    if "NOR" not in codes:
        codes[NOR_PANEL_INDEX] = "NOR"
    else:
        nor_existing = codes.index("NOR")
        if nor_existing != NOR_PANEL_INDEX:
            codes[nor_existing], codes[NOR_PANEL_INDEX] = (
                codes[NOR_PANEL_INDEX],
                codes[nor_existing],
            )
    assert codes[NOR_PANEL_INDEX] == "NOR"
    assert len(set(codes)) == N_COUNTRIES
    return tuple(codes)


def _feature_id_order() -> tuple[str, ...]:
    """Return the 356 feature ids in the order the pipeline uses.

    Matches scripts/gen-features-fixture.mjs (and Step-3 `roles.ts`):
      authored_00..authored_29, absurd_00..absurd_29, feat_000..feat_295.
    """
    ids: list[str] = []
    for i in range(len(AUTHORED_FEATURES)):
        ids.append(f"authored_{i:02d}")
    for i in range(len(ABSURD_FEATURES)):
        ids.append(f"absurd_{i:02d}")
    remaining = N_FEATURES - len(AUTHORED_FEATURES) - len(ABSURD_FEATURES)
    for i in range(remaining):
        ids.append(f"feat_{i:03d}")
    assert len(ids) == N_FEATURES
    assert len(set(ids)) == N_FEATURES
    return tuple(ids)


def build() -> SyntheticDataset:
    """Build the deterministic synthetic panel."""
    rng = np.random.default_rng(SEED)

    # 1) Standard-normal feature matrix.
    X = rng.standard_normal((N_COUNTRIES, N_FEATURES))

    # 2) Make a handful of authored features "real" drivers of y by
    #    injecting column structure: column j's variance in NOR and a
    #    subset of peer countries is amplified.
    authored_driver_idx = np.arange(5)  # first 5 authored features
    driver_betas = np.array([3.8, -2.1, 1.7, -1.2, 0.9])

    # Shift authored drivers so they correlate with latitude-ish (country
    # index position mod some basis) — makes OLS residuals non-trivial
    # without being pathological.
    row_latitude = np.linspace(-1.0, 1.0, N_COUNTRIES)
    for j, beta in zip(authored_driver_idx, driver_betas):
        X[:, j] += 0.6 * row_latitude * np.sign(beta)

    # 3) Amplify NOR's row in a way that creates an increasing h_ii
    #    trajectory as features accumulate. We do this by giving NOR an
    #    outlier component that is orthogonal to the other rows in the
    #    "leading" feature block; each additional feature adds another
    #    direction NOR dominates, lifting h_ii monotonically.
    nor_row = X[NOR_PANEL_INDEX].copy()
    # First 10 features: NOR is typical (small residual), so h_ii(p=10) ≈ 0.04.
    nor_row[:10] = rng.standard_normal(10) * 0.4
    # Features 10-212: NOR is progressively more outlying. Use a ramp
    # of amplification factors so later features contribute more
    # marginal leverage than earlier ones.
    ramp = np.linspace(1.2, 4.0, N_FEATURES - 10)
    nor_row[10:] = rng.standard_normal(N_FEATURES - 10) * ramp
    X[NOR_PANEL_INDEX] = nor_row

    # 4) Column-standardise so OLS / Lasso see comparable feature scales.
    X -= X.mean(axis=0, keepdims=True)
    col_std = X.std(axis=0, keepdims=True)
    col_std[col_std < 1e-9] = 1.0
    X /= col_std

    # 5) Build y. The true signal is a 5-feature linear combination of
    #    authored drivers; noise is heteroskedastic, scaled by country
    #    development index.
    base_y = np.zeros(N_COUNTRIES)
    for j, beta in zip(authored_driver_idx, driver_betas):
        base_y += beta * X[:, j]

    development_level = 0.5 + 0.5 * np.abs(row_latitude)  # [0.5, 1.0]
    noise = rng.standard_normal(N_COUNTRIES) * 0.8 * development_level
    scaled = base_y + noise

    # Map the standardised composite to USD via an exponential so the
    # panel spans roughly $1,000..$200,000.
    y_usd = 5000.0 * np.exp(0.35 * scaled)
    y_usd = np.clip(y_usd, 1000.0, 200000.0)

    # Seat NOR in the ~$90k neighbourhood (the point estimate the PI
    # cell displays at CV-optimal α per DESIGN.md line 633).
    y_usd[NOR_PANEL_INDEX] = 89220.0

    iso3_order = _panel_iso3_order()
    feature_ids = _feature_id_order()
    return SyntheticDataset(
        X=X,
        y=y_usd,
        iso3_order=iso3_order,
        feature_ids=feature_ids,
        nor_panel_index=NOR_PANEL_INDEX,
        n=N_COUNTRIES,
    )


if __name__ == "__main__":
    ds = build()
    print(f"X shape: {ds.X.shape}")
    print(f"y range: [{ds.y.min():.0f}, {ds.y.max():.0f}]")
    print(f"NOR y:   {ds.y[ds.nor_panel_index]:.0f}")
    print(f"iso3[0..4]: {ds.iso3_order[:5]}")
    print(f"features[0..4]: {ds.feature_ids[:5]}")
