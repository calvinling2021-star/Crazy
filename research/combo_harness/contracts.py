"""Helper: enumerate per-product maturity codes for the free AkShare path.

AkShare's `futures_zh_daily_sina(symbol=...)` is per-contract, so you must hand
it concrete maturity codes (Sina style = UPPERCASE product + YYMM, e.g. RB2405,
M2409, MA2501). This module generates candidate codes for the universe so the
no-account path becomes one call; non-existent codes are skipped at fetch time.

Note: generating every month for every product over many years is a lot of HTTP
requests to Sina (and may rate-limit). Prefer `months=` restricted to a
product's actually-listed months, or use TqsdkSource (server-side enumeration).
"""
from __future__ import annotations

# Sina/AkShare uppercase product symbols for the deep-dive universe.
SINA_PRODUCTS = {
    "rb": "RB", "hc": "HC", "cu": "CU", "al": "AL", "zn": "ZN", "ru": "RU",
    "i": "I", "j": "J", "jm": "JM", "m": "M", "y": "Y", "p": "P", "a": "A",
    "c": "C", "MA": "MA", "TA": "TA", "SA": "SA", "FG": "FG",
}

# Months each product actually lists actively (keeps requests sane). Industrial
# metals/blacks list all 12; many ags cluster on 1/5/9 (or 1/5/9/+). Conservative
# supersets — non-existent codes are simply skipped on fetch.
ACTIVE_MONTHS = {
    "M": (1, 3, 5, 7, 8, 9, 11, 12), "Y": (1, 5, 9), "P": (1, 5, 9),
    "A": (1, 3, 5, 7, 9, 11), "C": (1, 3, 5, 7, 9, 11),
    "RU": (1, 5, 9), "FG": (1, 5, 9), "SA": (1, 5, 9), "MA": (1, 5, 9),
    "TA": (1, 5, 9),
}
ALL_MONTHS = tuple(range(1, 13))


def generate_contract_codes(products=None, start_year=2015, end_year=2024,
                            months=None) -> dict:
    """Return {SINA_PRODUCT -> [CODE, ...]} candidate maturity codes.

    Codes are 4-digit YYMM (e.g. RB2405). Restrict `start_year` to when the
    product actually traded to avoid dead requests.
    """
    products = list(products or SINA_PRODUCTS)
    out = {}
    for p in products:
        sym = SINA_PRODUCTS.get(p, p.upper())
        ms = months or ACTIVE_MONTHS.get(sym, ALL_MONTHS)
        codes = []
        for yy in range(start_year, end_year + 1):
            for mm in ms:
                codes.append(f"{sym}{yy % 100:02d}{mm:02d}")
        out[sym] = codes
    return out


if __name__ == "__main__":   # offline smoke test (no network)
    codes = generate_contract_codes(start_year=2023, end_year=2024)
    n = sum(len(v) for v in codes.values())
    print(f"products: {len(codes)}   total candidate codes: {n}")
    for sym in ("RB", "M", "MA"):
        print(f"  {sym}: {codes[sym][:4]} ... {codes[sym][-2:]}")
    assert codes["RB"][0] == "RB2301", codes["RB"][0]
    assert all(c.startswith("M") and len(c) == 5 for c in codes["M"])
    print("OK — contract-code generator produces Sina-style YYMM codes.")
