"""features — build /static/data/features.json.

DESIGN.md §Data pipeline line 48:
    "features.json | {id, short_name, full_name, citation, default_role,
     absurdity_flag}[] (356 rows; 30 with default_role set; ~30 with
     absurdity_flag: true per /precompute/absurd_seed.py) | <= 30 KB |
     Role column, hover citations, CH1 autocomplete ghost seeding"

DESIGN.md §CC#3 Invariants line 270:
    "326 + 30 = 356 cells exactly."

DESIGN.md §CH1 Data requirements line 441:
    "/precompute/absurd_seed.py output (~30 feature ids with
     absurdity_flag: true) is merged into features.json at build time;
     no separate runtime file."
"""

from __future__ import annotations

import json
from pathlib import Path

from .absurd_seed import absurd_rows
from .authored_seed import authored_rows
from .paths import features_json_path

# Total rows committed by DESIGN.md.
TOTAL_ROWS: int = 356


def build_features() -> list[dict[str, object]]:
    """Assemble the 356 feature rows."""
    rows: list[dict[str, object]] = []
    rows.extend(authored_rows())
    rows.extend(absurd_rows())
    # Fill the remainder with anonymous feat_NNN rows. These are the
    # features the site lists as "unlabeled" in the role column —
    # available for reader tagging but not part of the authored set.
    remaining = TOTAL_ROWS - len(rows)
    for i in range(remaining):
        rows.append(
            {
                "id": f"feat_{i:03d}",
                "short_name": f"feat_{i:03d}",
                "full_name": f"unlabeled feature #{i}",
                "citation": None,
                "default_role": None,
                "absurdity_flag": False,
            }
        )
    return rows


def verify(rows: list[dict[str, object]]) -> None:
    """Run the DESIGN.md-level invariants; raise on violation."""
    if len(rows) != TOTAL_ROWS:
        raise ValueError(f"features.json must have {TOTAL_ROWS} rows; got {len(rows)}")
    authored = [r for r in rows if r["default_role"] == "authored"]
    if len(authored) != 30:
        raise ValueError(f"expected 30 authored rows; got {len(authored)}")
    absurd = [r for r in rows if r["absurdity_flag"] is True]
    if len(absurd) != 30:
        raise ValueError(f"expected 30 absurd rows; got {len(absurd)}")
    ids = {r["id"] for r in rows}
    if len(ids) != TOTAL_ROWS:
        raise ValueError("features.json contains duplicate ids")
    # Authored and absurd must be disjoint.
    for r in rows:
        if r["default_role"] == "authored" and r["absurdity_flag"] is True:
            raise ValueError(f"row {r['id']} is both authored and absurd")


def write(rows: list[dict[str, object]]) -> Path:
    """Write features.json to /static/data/features.json. Returns path."""
    out = features_json_path()
    out.parent.mkdir(parents=True, exist_ok=True)
    # Compact JSON (no spaces) to stay well under the 30 KB budget.
    out.write_text(json.dumps(rows, separators=(",", ":")) + "\n", encoding="utf-8")
    return out


def run() -> Path:
    rows = build_features()
    verify(rows)
    return write(rows)


if __name__ == "__main__":
    path = run()
    size = path.stat().st_size
    print(f"wrote {path} ({size} bytes)")
