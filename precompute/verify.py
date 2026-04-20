"""verify — empirical-claim asserter.

DESIGN.md §Stage 2 handoff, line 933:
    "CI integration: pipeline runs on schedule + precompute/verify.py
     asserts every empirical claim."

DESIGN.md §Test discipline, line 107:
    "Empirical-claim tests: a `precompute/verify.py` script asserts
     every empirical claim in the spec (e.g., `assert
     lasso_at_cv_optimal_alpha[NOR].pi_red_share >= 0.92`). If a claim
     fails, the precompute pipeline writes the actual value and the
     chapter's copy regenerates from a template that pulls from the
     JSON — never from a hard-coded string."

DESIGN.md §DA binding #11 (line 918):
    "Every empirical claim is loaded from JSON, not hard-coded.
     precompute/verify.py asserts each claim and writes the actual
     value to JSON; copy templates pull from JSON via {value}
     placeholders."

This module is DESCRIPTIVE of the invariants: a failing check raises
(and the pipeline exits non-zero), but the JSON files themselves are
already written — the CI workflow is: run pipeline.py, then run
verify.py; if verify fails, a PR is opened with the updated JSON and
copy templates regenerate.

Each CLAIM function below binds to a specific DESIGN.md / BRAINSTORM.md
line; the check's message cites the line so a reviewer tracing a
failure can find the source.

Usage:
    python -m precompute.verify                # check all claims
    python -m precompute.verify --list         # list checks
    python -m precompute.verify --only heartbeat
"""

from __future__ import annotations

import argparse
import gzip
import json
import sys
from pathlib import Path
from typing import Callable

from .paths import (
    STATIC_DATA_DIR,
    audition_json_path,
    beta_path_path,
    bootstrap_ci_path,
    diagnostic_path_path,
    dissolution_cloud_path,
    ecdf_null_path,
    features_json_path,
    h_ii_trajectory_path,
    lasso_alpha_path_path,
    objection_queue_path,
    pi_decomposition_path,
    pi_shuffled_path,
    rf_top20_path,
)

# DESIGN.md §Data pipeline line 34-50 budgets (gzipped bytes).
SIZE_BUDGETS_GZ: dict[str, int] = {
    "audition.json": 8 * 1024,
    "features.json": 30 * 1024,
    "nor/h_ii_trajectory.json": 6 * 1024,
    "ury/h_ii_trajectory.json": 6 * 1024,
    "nor/beta_path.json": 180 * 1024,
    "nor/diagnostic_path.json": 12 * 1024,
    "nor/lasso_alpha_path.json": 90 * 1024,
    "nor/pi_decomposition.json": 60 * 1024,
    "nor/pi_shuffled.json": 60 * 1024,
    "nor/objection_queue.json": 14 * 1024,
    "nor/rf_top20.json": 12 * 1024,
    "nor/dissolution_cloud.json": 14 * 1024,
    "nor/bootstrap_ci.json": 10 * 1024,
    "nor/ecdf_null.json": 14 * 1024,
}


def _load(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _gz(path: Path) -> int:
    return len(gzip.compress(path.read_bytes()))


# ---------------------------------------------------------------------------
# Claim checks.
#
# Each `check_*` raises AssertionError on failure, returns str on success.
# The string is the passing-evidence line — printed as "PASS check_name: ..."
# by the driver.
# ---------------------------------------------------------------------------


def check_features_shape() -> str:
    """DESIGN.md line 48 + §CC#3 line 270."""
    rows = _load(features_json_path())
    assert isinstance(rows, list), "features.json must be a list"
    assert len(rows) == 356, f"features.json must have 356 rows; got {len(rows)}"
    authored = [r for r in rows if r.get("default_role") == "authored"]
    assert len(authored) == 30, f"30 authored; got {len(authored)}"
    absurd = [r for r in rows if r.get("absurdity_flag") is True]
    assert len(absurd) == 30, f"30 absurd; got {len(absurd)}"
    # Non-overlap.
    authored_ids = {r["id"] for r in authored}
    absurd_ids = {r["id"] for r in absurd}
    assert authored_ids.isdisjoint(absurd_ids), "authored/absurd overlap"
    # Total uniqueness.
    all_ids = {r["id"] for r in rows}
    assert len(all_ids) == 356, "features.json has duplicate ids"
    return f"356 rows (30 authored, 30 absurd, 296 unlabeled)"


def check_audition_shape() -> str:
    """DESIGN.md line 36 + §CC#4 line 284 (NOR is the winner)."""
    rows = _load(audition_json_path())
    assert isinstance(rows, list) and len(rows) == 254, f"254 rows required"
    assert rows[0]["iso3"] == "NOR", f"NOR must be winner; got {rows[0]['iso3']}"
    assert (
        float(rows[0]["h_ii_starkness"]) >= 0.5
    ), f"NOR starkness must be substantial; got {rows[0]['h_ii_starkness']}"
    prev = float("inf")
    for r in rows:
        v = float(r["h_ii_starkness"])
        assert v <= prev + 1e-9, "audition.json not descending-sorted"
        prev = v
    return f"NOR starkness = {rows[0]['h_ii_starkness']} wins over {rows[1]['iso3']} @ {rows[1]['h_ii_starkness']}"


def check_heartbeat_nor() -> str:
    """DESIGN.md §CC#1 Invariants; Q2 line 966."""
    rows = _load(h_ii_trajectory_path("NOR"))
    assert isinstance(rows, list) and len(rows) > 0
    assert rows[0]["p"] == 10, "first p must be 10"
    assert float(rows[0]["h_ii"]) <= 0.05 + 1e-6, (
        f"first h_ii must be near 0.04; got {rows[0]['h_ii']}"
    )
    last = -float("inf")
    for r in rows:
        h = float(r["h_ii"])
        assert h >= last - 1e-9, f"NOT monotonic at p={r['p']}"
        last = h
    last_h = float(rows[-1]["h_ii"])
    assert last_h >= 0.98, (
        f"NOR last h_ii must be >= 0.98 (§CC#1 #2); got {last_h}"
    )
    return (
        f"{len(rows)} rows, p∈[{rows[0]['p']}, {rows[-1]['p']}], "
        f"monotonic, endpoints {rows[0]['h_ii']} → {last_h}"
    )


def check_heartbeat_ury() -> str:
    """URY recast fixture (DESIGN.md §CC#1 Recast behavior)."""
    rows = _load(h_ii_trajectory_path("URY"))
    assert isinstance(rows, list) and len(rows) > 0
    assert rows[0]["p"] == 10
    last = -float("inf")
    for r in rows:
        h = float(r["h_ii"])
        assert h >= last - 1e-9, f"URY NOT monotonic at p={r['p']}"
        last = h
    assert float(rows[-1]["h_ii"]) < 0.98, (
        "URY last h_ii must be < 0.98 (recast demonstrates n < NOR's)"
    )
    return f"{len(rows)} rows, ends at {rows[-1]['h_ii']} < 0.98"


def check_nor_leverage_highest() -> str:
    """DESIGN.md §CH2 acceptance #3 line 564:
    'NOR has the highest leverage trajectory among visible-row countries.'

    Implementation: compare NOR's last h_ii to every other country's last
    h_ii in audition.json (since audition's starkness IS a leverage
    derivative). NOR must be the maximum.
    """
    rows = _load(audition_json_path())
    nor_val = next(r["h_ii_starkness"] for r in rows if r["iso3"] == "NOR")
    for r in rows:
        if r["iso3"] == "NOR":
            continue
        assert float(r["h_ii_starkness"]) <= float(nor_val) + 1e-9, (
            f"{r['iso3']} exceeds NOR: {r['h_ii_starkness']} vs {nor_val}"
        )
    return f"NOR starkness {nor_val} is max over 253 peers"


def check_pi_cv_optimal_five() -> str:
    """DESIGN.md §CH3 acceptance #2 + state machine line 633; Q3 line 967."""
    payload = _load(pi_decomposition_path())
    steps = payload["steps"]
    cv = steps[payload["cv_optimal_index"]]
    assert cv["is_cv_optimal"] is True
    terms = cv["terms"]
    assert len(terms) == 5, f"cv-optimal terms must be 5; got {len(terms)}"
    wsum = sum(float(t["weight"]) for t in terms)
    assert abs(wsum - 1.0) < 1e-3, f"weights must sum to 1.0; got {wsum}"
    # Committed ratios (DESIGN.md line 633).
    expected = [0.34, 0.28, 0.19, 0.11, 0.08]
    actual = [float(t["weight"]) for t in terms]
    for e, a in zip(expected, actual):
        assert abs(a - e) < 1e-3, f"cv-optimal weight {a} != {e}"
    # Committed bracket.
    ci = cv["ci"]
    assert ci == [78400.0, 94900.0], f"cv-optimal CI must be [78400, 94900]; got {ci}"
    # Red share (Q3: >= 0.92).
    red = sum(
        float(t["weight"]) for t in terms if t["role_at_build"] == "spurious"
    )
    assert red >= 0.92 - 1e-6, f"red share must be >= 0.92; got {red}"
    return f"5 terms, weights {actual}, CI {ci}, red-share {red:.3f}"


def check_pi_shuffled_red() -> str:
    """DESIGN.md §CH3 acceptance #4 line 664; Q3 line 967."""
    payload = _load(pi_shuffled_path())
    cv = payload["steps"][payload["cv_optimal_index"]]
    terms = cv["terms"]
    assert payload["shuffled"] is True
    red = sum(
        float(t["weight"]) for t in terms if t["role_at_build"] == "spurious"
    )
    assert red >= 0.78 - 1e-6, f"shuffled red share must be >= 0.78; got {red}"
    return f"shuffled red-share {red:.3f} >= 0.78"


def check_lasso_alpha_path() -> str:
    """DESIGN.md line 40."""
    rows = _load(lasso_alpha_path_path())
    assert isinstance(rows, list)
    assert len(rows) == 32, f"alpha path should be 32 steps; got {len(rows)}"
    # alphas monotonic non-decreasing (log-spaced grid).
    last = -float("inf")
    for r in rows:
        a = float(r["alpha"])
        assert a >= last - 1e-9, "alpha path must be sorted ascending"
        last = a
    # At least one row has kept_features non-empty.
    assert any(len(r["kept_features"]) > 0 for r in rows), (
        "every alpha row has zero kept features"
    )
    return f"{len(rows)} alpha steps, α∈[{rows[0]['alpha']}, {rows[-1]['alpha']}]"


def check_beta_path() -> str:
    """DESIGN.md line 38."""
    rows = _load(beta_path_path())
    assert isinstance(rows, list)
    assert rows[0]["p"] == 10
    last_p = rows[-1]["p"]
    assert last_p >= 200, f"beta_path must cover CH2 buckle; last p = {last_p}"
    for r in rows:
        assert len(r["beta"]) == r["p"], (
            f"beta_path at p={r['p']}: expected {r['p']} entries, got {len(r['beta'])}"
        )
    return f"{len(rows)} rows, last p={last_p}, β dim = p at each row"


def check_diagnostic_path() -> str:
    """DESIGN.md §CH2 acceptance #4 line 565."""
    rows = _load(diagnostic_path_path())
    assert isinstance(rows, list)
    assert rows[0]["p"] == 10
    last = rows[-1]
    assert float(last["log_lambda_min"]) <= -5.0, (
        f"log λ_min must go strongly negative near p=n; got {last['log_lambda_min']}"
    )
    return (
        f"{len(rows)} rows; first log λ_min = {rows[0]['log_lambda_min']}, "
        f"last = {last['log_lambda_min']}"
    )


def check_objection_queue() -> str:
    """DESIGN.md §CH4 acceptance #5 line 768; Q4 line 968."""
    q = _load(objection_queue_path())
    assert isinstance(q, list) and 1 <= len(q) <= 9
    for i, entry in enumerate(q):
        assert entry["step"] == i, f"step {i}: index mismatch"
    final = q[-1]
    assert "refused" in final, "final entry must carry 'refused'"
    # Q4 fidelity: report which branch we're on.
    refusal_state = "refused=True (queue-empty branch)" if final["refused"] else (
        f"refused=False (9th substitution {final['replacement_feature']!r} is defensible)"
    )
    return f"{len(q)} entries; final: {refusal_state}"


def check_rf_top20() -> str:
    """DESIGN.md line 44."""
    rows = _load(rf_top20_path())
    assert isinstance(rows, list) and len(rows) == 20
    prev = float("inf")
    for r in rows:
        imp = float(r["importance"])
        assert imp <= prev + 1e-9, "rf_top20 not descending-sorted"
        prev = imp
    return f"20 features, top {rows[0]['feature_id']} (importance={rows[0]['importance']})"


def check_dissolution_cloud() -> str:
    """DESIGN.md §CH5 acceptance #2 line 875 + #3 line 876."""
    p = _load(dissolution_cloud_path())
    pairs = p["pairs"]
    assert isinstance(pairs, list) and len(pairs) == 200, (
        f"pairs must be 200; got {len(pairs) if isinstance(pairs, list) else type(pairs)}"
    )
    for pair in pairs:
        assert "predicted_gdp" in pair and "h_ii" in pair
    assert 0 <= int(p["realized_percentile"]) <= 100
    rs = p["ridgeline_samples"]
    for key in ("single_split", "nested_cv"):
        assert len(rs[key]) == 200, f"ridgeline_samples.{key} len != 200"
    return (
        f"200 pairs; realized_percentile={p['realized_percentile']}; "
        f"mean={p['mean_predicted_usd']}"
    )


def check_bootstrap_ci() -> str:
    """DESIGN.md line 46 + §CH5 acceptance #5 line 878."""
    rows = _load(bootstrap_ci_path())
    assert isinstance(rows, list) and len(rows) >= 1
    for r in rows:
        assert "feature_id" in r and "beta" in r and "ci" in r and "stability" in r
        assert len(r["ci"]) == 2
    return f"{len(rows)} kept features with CI + stability"


def check_ecdf_null() -> str:
    """DESIGN.md line 47 + §CH1 acceptance #7 line 477."""
    p = _load(ecdf_null_path())
    assert isinstance(p, dict)
    abs_r = p["abs_r"]
    assert isinstance(abs_r, list) and len(abs_r) == 356
    fits = p["fits_inside_null"]
    assert isinstance(fits, int) and 1 <= fits < 356
    return (
        f"356-element abs_r ECDF; fits_inside_null={fits}; "
        f"null_band_95={p['null_band_95']}"
    )


def check_size_budgets() -> str:
    """DESIGN.md §Data pipeline line 34-50: gzipped size budgets."""
    violations: list[str] = []
    for rel, budget in SIZE_BUDGETS_GZ.items():
        path = STATIC_DATA_DIR / rel
        if not path.exists():
            violations.append(f"{rel}: file missing")
            continue
        gz = _gz(path)
        if gz > budget:
            violations.append(f"{rel}: {gz}B gz > {budget}B budget")
    assert not violations, (
        "Size-budget violations:\n  " + "\n  ".join(violations)
    )
    # Report max utilisation as an evidence line.
    utilisations: list[tuple[str, float]] = []
    for rel, budget in SIZE_BUDGETS_GZ.items():
        path = STATIC_DATA_DIR / rel
        if path.exists():
            utilisations.append((rel, _gz(path) / budget))
    max_file, max_ut = max(utilisations, key=lambda kv: kv[1])
    return f"all {len(SIZE_BUDGETS_GZ)} budgets hold; hottest {max_file} @ {max_ut * 100:.1f}%"


# ---------------------------------------------------------------------------
# Runner.
# ---------------------------------------------------------------------------


CHECKS: list[tuple[str, Callable[[], str]]] = [
    ("features_shape", check_features_shape),
    ("audition_shape", check_audition_shape),
    ("heartbeat_nor", check_heartbeat_nor),
    ("heartbeat_ury", check_heartbeat_ury),
    ("nor_leverage_highest", check_nor_leverage_highest),
    ("beta_path", check_beta_path),
    ("diagnostic_path", check_diagnostic_path),
    ("lasso_alpha_path", check_lasso_alpha_path),
    ("pi_cv_optimal_five", check_pi_cv_optimal_five),
    ("pi_shuffled_red", check_pi_shuffled_red),
    ("objection_queue", check_objection_queue),
    ("rf_top20", check_rf_top20),
    ("dissolution_cloud", check_dissolution_cloud),
    ("bootstrap_ci", check_bootstrap_ci),
    ("ecdf_null", check_ecdf_null),
    ("size_budgets", check_size_budgets),
]


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(
        prog="python -m precompute.verify",
        description="Empirical-claim asserter for /static/data/ (DESIGN.md §Test discipline line 107).",
    )
    ap.add_argument("--list", action="store_true", help="List checks and exit.")
    ap.add_argument(
        "--only",
        nargs="+",
        choices=[name for name, _ in CHECKS],
        help="Run a subset of checks.",
    )
    args = ap.parse_args(argv)

    if args.list:
        for name, _ in CHECKS:
            print(f"  {name}")
        return 0

    failures: list[tuple[str, str]] = []
    passes: list[tuple[str, str]] = []
    for name, fn in CHECKS:
        if args.only and name not in args.only:
            continue
        try:
            msg = fn()
            passes.append((name, msg))
            print(f"  PASS  {name:>22s}  {msg}")
        except AssertionError as e:
            failures.append((name, str(e)))
            print(f"  FAIL  {name:>22s}  {e}")
        except Exception as e:  # noqa: BLE001
            failures.append((name, f"{type(e).__name__}: {e}"))
            print(f"  ERR   {name:>22s}  {type(e).__name__}: {e}")

    print()
    print(f"verify: {len(passes)} passed, {len(failures)} failed")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
