"""pipeline — the top-level orchestrator.

DESIGN.md §Stage 2 handoff, line 933:
    "Precompute pipeline (/precompute/) producing every nor/*.json file
     plus audition.json and features.json. CI integration: pipeline
     runs on schedule + precompute/verify.py asserts every empirical
     claim."

Usage:
    python -m precompute.pipeline           # build everything
    python -m precompute.pipeline --verify  # build then run verify.py
    python -m precompute.pipeline --only features heartbeat
                                            # run a subset of steps
    python -m precompute.pipeline --list    # list step names and exit

Every step takes the same synthetic dataset (built once) so a full run
is deterministic at SEED (= 20260420). Sizes are reported uncompressed
and gzipped; the gzipped sizes are what DESIGN.md §Data pipeline's
budget column reports against.

Makefile (/precompute/Makefile) wraps this with the conventional
`make all`, `make verify`, `make clean` targets.
"""

from __future__ import annotations

import argparse
import gzip
import sys
import time
from pathlib import Path

from .synthetic_dataset import build as build_dataset

# Each (name, module.run callable, budget_gzipped_bytes). `budget=None`
# means "no DESIGN.md-authored budget"; otherwise assert actual size.
STEPS: list[tuple[str, str]] = [
    ("features", "precompute.features"),
    ("audition", "precompute.audition"),
    ("heartbeat", "precompute.heartbeat"),
    ("beta_path", "precompute.beta_path"),
    ("diagnostic_path", "precompute.diagnostic_path"),
    ("lasso_sweep", "precompute.lasso_sweep"),
    ("objection_queue", "precompute.objection_queue"),
    ("rf_top20", "precompute.rf_top20"),
    ("dissolution", "precompute.dissolution"),
    ("ecdf_null", "precompute.ecdf_null"),
]


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


def _gzipped_size(path: Path) -> int:
    data = path.read_bytes()
    return len(gzip.compress(data))


def _run_one(
    name: str, module_path: str, ds_cache: list[object]
) -> list[Path]:
    """Run one step. Returns list of Path written."""
    from importlib import import_module

    mod = import_module(module_path)
    run_fn = getattr(mod, "run")
    # Prefer passing the cached synthetic dataset (avoids N rebuilds).
    if not ds_cache:
        ds_cache.append(build_dataset())
    ds = ds_cache[0]
    # Some step's run() doesn't take arguments (features.py) — fall
    # through to a no-arg call if the signature rejects ds.
    try:
        out = run_fn(ds)
    except TypeError:
        out = run_fn()
    if isinstance(out, Path):
        return [out]
    if isinstance(out, (list, tuple)):
        return [Path(p) for p in out]
    raise RuntimeError(f"step {name} returned unexpected type {type(out)}")


def _repo_relative(path: Path) -> str:
    """Render a Path as its /static/data/-anchored key for the budget table."""
    from .paths import STATIC_DATA_DIR

    try:
        rel = path.relative_to(STATIC_DATA_DIR)
    except ValueError:
        return str(path)
    return str(rel).replace("\\", "/")


def run_all(only: list[str] | None = None, verbose: bool = True) -> list[Path]:
    ds_cache: list[object] = []
    all_paths: list[Path] = []
    for name, module_path in STEPS:
        if only and name not in only:
            continue
        t0 = time.monotonic()
        paths = _run_one(name, module_path, ds_cache)
        elapsed = time.monotonic() - t0
        if verbose:
            for p in paths:
                sz = p.stat().st_size
                gz = _gzipped_size(p)
                key = _repo_relative(p)
                budget = SIZE_BUDGETS_GZ.get(key)
                bud_str = f" / budget {budget}B gz" if budget else ""
                print(f"  [{name:>17s}]  {key}  {sz}B ({gz}B gz){bud_str}  {elapsed:.1f}s")
        all_paths.extend(paths)
    return all_paths


def check_budgets(paths: list[Path]) -> None:
    from .paths import STATIC_DATA_DIR

    violations: list[str] = []
    for p in paths:
        try:
            rel = p.relative_to(STATIC_DATA_DIR)
        except ValueError:
            continue
        key = str(rel).replace("\\", "/")
        budget = SIZE_BUDGETS_GZ.get(key)
        if budget is None:
            continue
        gz = _gzipped_size(p)
        if gz > budget:
            violations.append(
                f"  {key}: {gz}B gzipped exceeds {budget}B budget "
                f"(by {gz - budget}B)"
            )
    if violations:
        msg = "\n".join(violations)
        raise SystemExit(
            "Size-budget violations detected (DESIGN.md §Data pipeline):\n"
            + msg
        )


def parse_args(argv: list[str]) -> argparse.Namespace:
    ap = argparse.ArgumentParser(
        prog="python -m precompute.pipeline",
        description="Offline precompute pipeline — builds every JSON the site consumes at runtime.",
    )
    ap.add_argument(
        "--verify", action="store_true", help="Run verify.py after the build."
    )
    ap.add_argument(
        "--only",
        nargs="+",
        choices=[name for name, _ in STEPS],
        help="Run a subset of steps (others are skipped).",
    )
    ap.add_argument("--list", action="store_true", help="List step names and exit.")
    ap.add_argument("--quiet", action="store_true", help="Suppress per-step output.")
    return ap.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    if args.list:
        for name, module_path in STEPS:
            print(f"  {name:>17s}  {module_path}")
        return 0

    t0 = time.monotonic()
    paths = run_all(only=args.only, verbose=not args.quiet)
    print(f"pipeline: {len(paths)} files written in {time.monotonic() - t0:.1f}s")
    try:
        check_budgets(paths)
    except SystemExit as e:
        print(str(e), file=sys.stderr)
        return 2

    if args.verify:
        from . import verify as verify_mod

        verify_mod.main([])
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
