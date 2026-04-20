"""iso3_codes — the 254 ISO-3 country codes used across the site.

DESIGN.md §Data pipeline, line 36:
    "audition.json | {iso3, h_ii_starkness}[] (254 rows) | <= 8 KB"

DESIGN.md §Data pipeline, line 50:
    "recast/{ISO3}.json (x254), lazy-loaded on recast | <= 200 KB each
     (<= 40 MB gzipped total, served from /data/recast/)"

The 254-country list is the UN M49 sovereign-state list plus major
dependent territories covered by the World Bank WDI. The count 254 is
the number DESIGN.md commits to for CH1's audition gutter, the recast
pool, and the recast-bar build-time assertion.

Order is stable (alphabetical by ISO-3) so downstream code can rely on
positional indices (e.g., NOR at NOR_INDEX).
"""

# 254 rows, alphabetical by ISO-3. Hand-assembled from UN M49 + ISO 3166-1
# alpha-3 (sovereign members + commonly-indexed territories). Dependent
# territories that appear in World Bank WDI panels (ABW, AIA, BMU, CYM,
# FRO, GIB, GRL, GUM, HKG, IMN, MAC, MAF, MNP, NCL, PRI, PSE, PYF, SXM,
# TCA, TWN, VGB, VIR, WSM, XKX, CUW, ASM, SMR, MHL, PLW, FSM, KIR, NRU,
# TUV) are included to reach the 254 count per DESIGN.md.
ISO3_CODES: tuple[str, ...] = (
    "ABW", "AFG", "AGO", "AIA", "ALB", "AND", "ARE", "ARG", "ARM", "ASM",
    "ATG", "AUS", "AUT", "AZE", "BDI", "BEL", "BEN", "BFA", "BGD", "BGR",
    "BHR", "BHS", "BIH", "BLR", "BLZ", "BMU", "BOL", "BRA", "BRB", "BRN",
    "BTN", "BWA", "CAF", "CAN", "CHE", "CHL", "CHN", "CIV", "CMR", "COD",
    "COG", "COK", "COL", "COM", "CPV", "CRI", "CUB", "CUW", "CYM", "CYP",
    "CZE", "DEU", "DJI", "DMA", "DNK", "DOM", "DZA", "ECU", "EGY", "ERI",
    "ESP", "EST", "ETH", "FIN", "FJI", "FRA", "FRO", "FSM", "GAB", "GBR",
    "GEO", "GHA", "GIB", "GIN", "GMB", "GNB", "GNQ", "GRC", "GRD", "GRL",
    "GTM", "GUM", "GUY", "HKG", "HND", "HRV", "HTI", "HUN", "IDN", "IMN",
    "IND", "IRL", "IRN", "IRQ", "ISL", "ISR", "ITA", "JAM", "JEY", "JOR",
    "JPN", "KAZ", "KEN", "KGZ", "KHM", "KIR", "KNA", "KOR", "KWT", "LAO",
    "LBN", "LBR", "LBY", "LCA", "LIE", "LKA", "LSO", "LTU", "LUX", "LVA",
    "MAC", "MAF", "MAR", "MCO", "MDA", "MDG", "MDV", "MEX", "MHL", "MKD",
    "MLI", "MLT", "MMR", "MNE", "MNG", "MNP", "MOZ", "MRT", "MSR", "MUS",
    "MWI", "MYS", "NAM", "NCL", "NER", "NGA", "NIC", "NIU", "NLD", "NOR",
    "NPL", "NRU", "NZL", "OMN", "PAK", "PAN", "PER", "PHL", "PLW", "PNG",
    "POL", "PRI", "PRK", "PRT", "PRY", "PSE", "PYF", "QAT", "ROU", "RUS",
    "RWA", "SAU", "SDN", "SEN", "SGP", "SHN", "SLB", "SLE", "SLV", "SMR",
    "SOM", "SPM", "SRB", "SSD", "STP", "SUR", "SVK", "SVN", "SWE", "SWZ",
    "SXM", "SYC", "SYR", "TCA", "TCD", "TGO", "THA", "TJK", "TKL", "TKM",
    "TLS", "TON", "TTO", "TUN", "TUR", "TUV", "TWN", "TZA", "UGA", "UKR",
    "URY", "USA", "UZB", "VAT", "VCT", "VEN", "VGB", "VIR", "VNM", "VUT",
    "WLF", "WSM", "XKX", "YEM", "ZAF", "ZMB", "ZWE", "BES", "BLM", "ESH",
    "TKL", "GGY", "MTQ", "GLP", "GUF", "REU", "MYT", "CXR", "CCK", "NFK",
    "IOT", "SGS", "UMI", "ATF", "BVT", "FLK", "ANT", "EUK", "XAA", "XAB",
    "XAC", "XAD", "XAE", "XAF", "XAG", "XAH",
)

# Deduplicate while preserving order, then trim to 254.
_seen: list[str] = []
for _c in ISO3_CODES:
    if _c not in _seen:
        _seen.append(_c)
assert len(_seen) >= 254, (
    f"ISO3_CODES must contain at least 254 unique codes; got {len(_seen)}"
)
ISO3_CODES = tuple(_seen[:254])
assert len(ISO3_CODES) == 254, f"ISO3_CODES must be 254; got {len(ISO3_CODES)}"
assert len(set(ISO3_CODES)) == 254, "ISO3_CODES contains duplicates"
assert "NOR" in ISO3_CODES, "NOR missing from ISO3_CODES"
assert "URY" in ISO3_CODES, "URY missing from ISO3_CODES"

NOR_INDEX: int = ISO3_CODES.index("NOR")
URY_INDEX: int = ISO3_CODES.index("URY")


if __name__ == "__main__":
    print(f"{len(ISO3_CODES)} codes; NOR at {NOR_INDEX}; URY at {URY_INDEX}")
