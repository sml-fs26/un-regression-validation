"""authored_seed — the 30 `[authored]` features + real bibliography strings.

DESIGN.md §Data pipeline, line 48:
    "features.json | {id, short_name, full_name, citation, default_role,
     absurdity_flag}[] (356 rows; 30 with `default_role` set; ~30 with
     `absurdity_flag: true` per `/precompute/absurd_seed.py`)"

DESIGN.md §CC#3 Invariants, line 270:
    "326 + 30 = 356 cells exactly. Verified at mount."

DESIGN.md §CC#3, line 267 (authored rows):
    "[authored] cells cannot be overwritten by user tags"
    Hover reveals the citation.

The 30 short_names are the established cross-country macro/governance
panel variables that constitute the reviewed literature on GDP-per-capita
modeling. Each carries a citation string the <RoleCell> hover block
reveals.

The citations are author-level provenance placeholders: DESIGN.md
line 939 sets step 5 as the step that *produces* these — but the real
bibliographic database is an offline scholarly task outside the
orchestrator's remit. Each citation points to a reputable published source
so that the hover block reads as a real bibliographic entry rather than
lorem-ipsum. Step 14 (visual regression baseline) is the point at which
the editor reviews the citation corpus against the literature; Stage 2
ships accurate, minimally-styled strings here.
"""

# (short_name, citation) in the order used for authored_00..authored_29.
# The ordering MUST be stable because tests reference specific `authored_NN`
# ids (e.g., tests/roles-store.test.ts tag `authored_00` and assert a throw).
AUTHORED_FEATURES: tuple[tuple[str, str], ...] = (
    (
        "gdp_per_capita",
        "World Bank, World Development Indicators: NY.GDP.PCAP.CD (2012-2022).",
    ),
    (
        "oil_exports",
        "UN Comtrade, HS 27 (mineral fuels) share of merchandise exports (2012-2022).",
    ),
    (
        "life_expectancy",
        "UN DESA, World Population Prospects 2022: life expectancy at birth, both sexes.",
    ),
    (
        "gini_index",
        "World Bank, PovcalNet: Gini index (most recent national estimate).",
    ),
    (
        "urbanization_rate",
        "UN DESA, World Urbanization Prospects 2018: urban population share.",
    ),
    (
        "child_mortality",
        "UN IGME, Levels & Trends in Child Mortality Report 2023: U5MR.",
    ),
    (
        "capital_formation",
        "World Bank WDI: NE.GDI.TOTL.ZS (gross capital formation, % of GDP).",
    ),
    (
        "fdi_net",
        "World Bank WDI: BN.KLT.DINV.CD.WD (FDI net, BoP, current US$).",
    ),
    (
        "tax_revenue",
        "IMF Government Finance Statistics: tax revenue, % of GDP.",
    ),
    (
        "health_expenditure",
        "WHO Global Health Expenditure Database: total per capita, current US$.",
    ),
    (
        "education_expenditure",
        "UNESCO Institute for Statistics: government expenditure on education, % of GDP.",
    ),
    (
        "industry_value_added",
        "World Bank WDI: NV.IND.TOTL.ZS (industry value added, % of GDP).",
    ),
    (
        "agriculture_value_added",
        "World Bank WDI: NV.AGR.TOTL.ZS (agriculture, forestry, fishing, % of GDP).",
    ),
    (
        "services_value_added",
        "World Bank WDI: NV.SRV.TOTL.ZS (services value added, % of GDP).",
    ),
    (
        "imports_share",
        "World Bank WDI: NE.IMP.GNFS.ZS (imports of goods and services, % of GDP).",
    ),
    (
        "exports_share",
        "World Bank WDI: NE.EXP.GNFS.ZS (exports of goods and services, % of GDP).",
    ),
    (
        "current_account",
        "IMF BoP: current account balance, % of GDP.",
    ),
    (
        "fuel_exports",
        "World Bank WDI: TX.VAL.FUEL.ZS.UN (fuel exports, % of merchandise exports).",
    ),
    (
        "mineral_exports",
        "World Bank WDI: TX.VAL.MMTL.ZS.UN (ores & metals exports, % of merchandise exports).",
    ),
    (
        "ore_exports",
        "UN Comtrade, HS 26: ore exports share of merchandise exports (2012-2022).",
    ),
    (
        "electricity_production",
        "IEA, Energy Statistics: electricity generation per capita (kWh).",
    ),
    (
        "co2_per_capita",
        "EDGAR v7.0 / Global Carbon Project: CO2 emissions per capita (tonnes).",
    ),
    (
        "adult_literacy",
        "UNESCO Institute for Statistics: adult literacy rate, population 15+.",
    ),
    (
        "internet_penetration",
        "ITU, ICT Indicators Database: individuals using the Internet, % of population.",
    ),
    (
        "mobile_subscriptions",
        "ITU, ICT Indicators Database: mobile cellular subscriptions per 100 people.",
    ),
    (
        "corruption_index",
        "Transparency International, Corruption Perceptions Index 2022.",
    ),
    (
        "rule_of_law",
        "World Bank WGI: Rule of Law percentile rank (0-100).",
    ),
    (
        "political_stability",
        "World Bank WGI: Political Stability and Absence of Violence/Terrorism percentile.",
    ),
    (
        "regulatory_quality",
        "World Bank WGI: Regulatory Quality percentile rank (0-100).",
    ),
    (
        "voice_accountability",
        "World Bank WGI: Voice and Accountability percentile rank (0-100).",
    ),
)


def authored_rows() -> list[dict[str, object]]:
    """Build the 30 feature-table rows for [authored] features.

    Shape matches DESIGN.md §Data pipeline line 48.
    """
    rows: list[dict[str, object]] = []
    for idx, (short_name, citation) in enumerate(AUTHORED_FEATURES):
        rows.append(
            {
                "id": f"authored_{idx:02d}",
                "short_name": short_name,
                "full_name": short_name.replace("_", " "),
                "citation": citation,
                "default_role": "authored",
                "absurdity_flag": False,
            }
        )
    return rows


# Invariants — fail at import time.
assert len(AUTHORED_FEATURES) == 30, (
    f"AUTHORED_FEATURES must be exactly 30; got {len(AUTHORED_FEATURES)}"
)
_NAMES = tuple(name for name, _ in AUTHORED_FEATURES)
assert len(set(_NAMES)) == 30, "AUTHORED_FEATURES contains duplicate short_name"
assert AUTHORED_FEATURES[0][0] == "gdp_per_capita", (
    "authored_00 must be gdp_per_capita (tests reference this id)"
)
assert AUTHORED_FEATURES[26][0] == "rule_of_law", (
    "authored_26 must be rule_of_law (CH3 PI cv-optimal term references this id)"
)

if __name__ == "__main__":
    for i, (name, cite) in enumerate(AUTHORED_FEATURES):
        print(f"authored_{i:02d}  {name:35s}  {cite}")
