"""precompute — the offline Python pipeline that produces every JSON the
site reads at runtime.

DESIGN.md §Data pipeline (line 28):

    "All quantitative content is precomputed by an offline Python
     pipeline (/precompute/, separate from the site repo). The site
     reads only static JSON. Runtime computation is approximately zero."

Module layout:

    absurd_seed.py        the 30 absurd feature ids (CH1 autocomplete seed)
    authored_seed.py      the 30 authored feature ids + citation strings
    iso3_codes.py         the 254 UN-member ISO-3 country codes
    synthetic_dataset.py  deterministic stand-in for the UN panel
                          (step 5 ships a mock; real UN data replaces it
                          when the pipeline is promoted to CI)
    features.py           builds /static/data/features.json
    audition.py           builds /static/data/audition.json
    heartbeat.py          builds /static/data/{iso3}/h_ii_trajectory.json
    beta_path.py          builds /static/data/nor/beta_path.json
    diagnostic_path.py    builds /static/data/nor/diagnostic_path.json
    lasso_sweep.py        builds /static/data/nor/lasso_alpha_path.json
                          + /static/data/nor/pi_decomposition.json
                          + /static/data/nor/pi_shuffled.json
    objection_queue.py    builds /static/data/nor/objection_queue.json
    rf_top20.py           builds /static/data/nor/rf_top20.json
    dissolution.py        builds /static/data/nor/dissolution_cloud.json
                          + /static/data/nor/bootstrap_ci.json
    ecdf_null.py          builds /static/data/nor/ecdf_null.json
    pipeline.py           orchestrator (CLI: `python -m precompute.pipeline`)
    verify.py             empirical-claim asserter (CLI: `python -m precompute.verify`)

Every module is deterministically seeded from `precompute.synthetic_dataset.SEED`.
Re-running the pipeline produces byte-identical JSON; a diff against a
prior run is a real signal that an upstream input changed.
"""

__version__ = "0.1.0"
