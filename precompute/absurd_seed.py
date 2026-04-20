"""absurd_seed — the 30 absurd-feature identifiers.

DESIGN.md §CH1, line 392 (verbatim provenance):

    "Approximately 30 features carry `absurdity_flag: true` (seeded by
     the author list committed in /precompute/absurd_seed.py:
     `iso3_alphabetical_rank`, `un_member_letters`, `name_numerology_score`,
     `scrabble_letter_value`, `capital_vowel_count`, etc. — the same
     queue CH3/CH4 will draw from)."

DESIGN.md §Data pipeline, line 48:
    "features.json | ... ~30 with `absurdity_flag: true` per
     /precompute/absurd_seed.py."

The five names in DESIGN.md line 392 appear FIRST in this list (positions 0-4)
so their `id` (absurd_00..absurd_04) is stable across re-runs — site fixtures
(scripts/gen-features-fixture.mjs) and Playwright tests
(tests/pi-decomposition.test.ts, tests-e2e/pi-cell.spec.ts) reference
specific `absurd_XX` ids by index.
"""

# 30 absurd feature short_names. Positions 0-4 are the five verbatim
# from DESIGN.md line 392 and MUST remain in that order. Positions 5-29
# are step-5's extension of the author's "etc." to reach the ~30 target.
ABSURD_FEATURES: tuple[str, ...] = (
    # DESIGN.md line 392 verbatim (positions 0-4)
    "iso3_alphabetical_rank",
    "un_member_letters",
    "name_numerology_score",
    "scrabble_letter_value",
    "capital_vowel_count",
    # Step-5 extension — plausibly-absurd features completing the ~30 pool
    "flag_stripe_count",
    "flag_color_count",
    "anthem_word_count",
    "capital_name_length",
    "country_name_length",
    "vowels_in_name",
    "consonants_in_name",
    "iso2_vowel_count",
    "iso3_vowel_count",
    "currency_symbol_length",
    "capital_syllable_count",
    "country_name_syllables",
    "isbn_country_code",
    "calling_code_first_digit",
    "tld_length",
    "capital_latitude_sign",
    "capital_longitude_sign",
    "iso_alphabetical_index",
    "flag_has_yellow",
    "flag_has_red",
    "flag_has_blue",
    "flag_has_green",
    "capital_first_letter",
    "anthem_tempo_bucket",
    "currency_letter_count",
)

# Invariants — fail at import time so a typo is caught at pipeline start.
assert len(ABSURD_FEATURES) == 30, (
    f"ABSURD_FEATURES must be exactly 30; got {len(ABSURD_FEATURES)}"
)
assert len(set(ABSURD_FEATURES)) == 30, "ABSURD_FEATURES contains duplicates"
assert ABSURD_FEATURES[0] == "iso3_alphabetical_rank", (
    "absurd_00 must be iso3_alphabetical_rank per DESIGN.md line 392"
)
assert ABSURD_FEATURES[4] == "capital_vowel_count", (
    "absurd_04 must be capital_vowel_count per DESIGN.md line 392"
)


def absurd_id(index: int) -> str:
    """Return the canonical `absurd_NN` feature id for position `index`."""
    if not 0 <= index < len(ABSURD_FEATURES):
        raise IndexError(f"absurd index {index} out of range [0, 30)")
    return f"absurd_{index:02d}"


def absurd_rows() -> list[dict[str, object]]:
    """Build the 30 feature-table rows for the absurd features.

    Shape matches DESIGN.md §Data pipeline line 48:
      {id, short_name, full_name, citation, default_role, absurdity_flag}
    """
    rows: list[dict[str, object]] = []
    for idx, short in enumerate(ABSURD_FEATURES):
        rows.append(
            {
                "id": f"absurd_{idx:02d}",
                "short_name": short,
                "full_name": short.replace("_", " "),
                "citation": None,
                "default_role": None,
                "absurdity_flag": True,
            }
        )
    return rows


if __name__ == "__main__":
    # CLI self-check — prints the list so a reviewer can eyeball the order.
    for i, name in enumerate(ABSURD_FEATURES):
        print(f"absurd_{i:02d}  {name}")
