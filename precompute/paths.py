"""paths — canonical /static/data/ output locations.

Centralises the file paths so every module agrees on where JSON lands.
"""

from __future__ import annotations

from pathlib import Path

# /precompute/ is one level below repo root.
REPO_ROOT: Path = Path(__file__).resolve().parent.parent

STATIC_DATA_DIR: Path = REPO_ROOT / "static" / "data"


def features_json_path() -> Path:
    return STATIC_DATA_DIR / "features.json"


def audition_json_path() -> Path:
    return STATIC_DATA_DIR / "audition.json"


def country_dir(iso3: str) -> Path:
    return STATIC_DATA_DIR / iso3.lower()


def h_ii_trajectory_path(iso3: str) -> Path:
    return country_dir(iso3) / "h_ii_trajectory.json"


def beta_path_path() -> Path:
    return country_dir("NOR") / "beta_path.json"


def diagnostic_path_path() -> Path:
    return country_dir("NOR") / "diagnostic_path.json"


def lasso_alpha_path_path() -> Path:
    return country_dir("NOR") / "lasso_alpha_path.json"


def pi_decomposition_path() -> Path:
    return country_dir("NOR") / "pi_decomposition.json"


def pi_shuffled_path() -> Path:
    return country_dir("NOR") / "pi_shuffled.json"


def objection_queue_path() -> Path:
    return country_dir("NOR") / "objection_queue.json"


def rf_top20_path() -> Path:
    return country_dir("NOR") / "rf_top20.json"


def dissolution_cloud_path() -> Path:
    return country_dir("NOR") / "dissolution_cloud.json"


def bootstrap_ci_path() -> Path:
    return country_dir("NOR") / "bootstrap_ci.json"


def ecdf_null_path() -> Path:
    return country_dir("NOR") / "ecdf_null.json"
