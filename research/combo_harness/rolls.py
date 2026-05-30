"""Roll / back-adjustment engine + sanity verification (source-agnostic).

This is the most important — and most error-prone — part of the pipeline. A bad
roll silently fabricates or hides alpha. So we build the continuous series
ourselves from individual-maturity contracts and verify it loudly.

Input
-----
contracts : dict[product -> dict[contract_code -> DataFrame]]
    Each per-contract DataFrame is indexed by trading date with columns:
      'settle' (settlement price; falls back to 'close'), 'volume', 'oi'.
    Contract codes end in YYMM (e.g. 'cu2405', 'SR901') so maturity order can
    be parsed. Provide an explicit `expiry` map to override parsing.

Output (per product, combined into panels)
------------------------------------------
near  : back-adjusted continuous FRONT price (return-correct, no roll gaps)
far   : back-adjusted continuous SECOND price (return-correct)
basis : RAW log(front_settle / second_settle) on the contemporaneously chosen
        contracts (the true term-structure slope — NOT derived from the
        back-adjusted prices, which would be wrong).

Front selection follows the Chinese "主力合约" convention: among active,
non-delivery-month contracts, the one with the largest open interest is the
front; the next later-expiry liquid contract is the second.
"""
from __future__ import annotations

import re
import numpy as np
import pandas as pd

_YYMM = re.compile(r"(\d{3,4})$")


def parse_yymm(code: str) -> int:
    """Parse trailing YYMM (or YMM) into a sortable integer; 3-digit -> 2YMM."""
    m = _YYMM.search(code)
    if not m:
        raise ValueError(f"cannot parse maturity from contract code {code!r}")
    digits = m.group(1)
    if len(digits) == 3:                 # CZCE style e.g. SR901 -> 1901 (assume 201x+)
        digits = "2" + digits
    yy, mm = int(digits[:2]), int(digits[2:])
    year = 2000 + yy
    return year * 100 + mm


def _settle(df: pd.DataFrame) -> pd.Series:
    s = df["settle"] if "settle" in df else df["close"]
    return s.astype(float)


def build_product(contract_frames: dict, oi_min: float = 1.0,
                  jump_cap: float = 0.25):
    """Build near/far back-adjusted prices + raw basis for ONE product.

    Returns (near, far, basis, report) where near/far/basis are pd.Series on a
    shared date index and `report` holds roll diagnostics + flagged days.
    """
    codes = sorted(contract_frames, key=parse_yymm)
    if len(codes) < 2:
        raise ValueError("need >=2 contracts to form a term structure")

    settle = pd.DataFrame({c: _settle(contract_frames[c]) for c in codes}).sort_index()
    oi = pd.DataFrame({c: contract_frames[c].get("oi", pd.Series(dtype=float))
                       for c in codes}).reindex_like(settle)
    expiry = {c: parse_yymm(c) for c in codes}
    dates = settle.index

    near_c, far_c = [], []                       # chosen contract per date
    for t in dates:
        row_oi = oi.loc[t].dropna()
        row_px = settle.loc[t].dropna()
        active = [c for c in row_px.index
                  if (row_oi.get(c, 0) >= oi_min) and (c in row_px.index)]
        active = sorted(active, key=lambda c: expiry[c])
        if not active:
            near_c.append(None); far_c.append(None); continue
        # front = max-OI among active (Chinese main-contract convention)
        front = max(active, key=lambda c: row_oi.get(c, 0.0))
        # second = next later-expiry liquid contract after `front`
        later = [c for c in active if expiry[c] > expiry[front]]
        second = later[0] if later else front
        near_c.append(front); far_c.append(second)

    near_c = pd.Series(near_c, index=dates)
    far_c = pd.Series(far_c, index=dates)

    def _continuous(chosen: pd.Series) -> tuple[pd.Series, int, list]:
        ret = pd.Series(0.0, index=dates)
        rolls, flags = 0, []
        prev = None
        for i, t in enumerate(dates):
            c = chosen.iloc[i]
            if c is None:
                continue
            if prev is None:
                prev = c; continue
            tp = dates[i - 1]
            if c == prev:
                r = settle.at[t, c] / settle.at[tp, c] - 1.0
            else:
                rolls += 1
                # back-adjust: earn the OLD contract's return across the roll day
                if prev in settle.columns and not np.isnan(settle.at[t, prev]) \
                        and not np.isnan(settle.at[tp, prev]):
                    r = settle.at[t, prev] / settle.at[tp, prev] - 1.0
                else:
                    r = settle.at[t, c] / settle.at[tp, c] - 1.0 \
                        if not np.isnan(settle.at[tp, c]) else 0.0
            if not np.isfinite(r):
                r = 0.0
            if abs(r) > jump_cap:                # sanity: flag implausible jumps
                flags.append((t, c, float(r)))
                r = float(np.sign(r) * jump_cap)
            ret.iloc[i] = r
            prev = c
        price = 100.0 * (1.0 + ret).cumprod()
        return price, rolls, flags

    near_px, near_rolls, near_flags = _continuous(near_c)
    far_px, far_rolls, far_flags = _continuous(far_c)

    # RAW basis from the contemporaneously chosen contracts (true curve slope)
    basis = pd.Series(np.nan, index=dates)
    for i, t in enumerate(dates):
        nc, fc = near_c.iloc[i], far_c.iloc[i]
        if nc and fc and nc != fc:
            pn, pf = settle.at[t, nc], settle.at[t, fc]
            if np.isfinite(pn) and np.isfinite(pf) and pf > 0:
                basis.iloc[i] = np.log(pn / pf)
    basis = basis.ffill()

    report = {
        "near_rolls": near_rolls, "far_rolls": far_rolls,
        "jump_flags": near_flags + far_flags,
        "n_days": int(len(dates)),
        "basis_coverage": float(basis.notna().mean()),
    }
    return near_px, far_px, basis, report


def build_continuous(contracts: dict, **kw):
    """Build near/far/basis PANELS (date x product) across all products.

    Returns (near_df, far_df, basis_df, reports_by_product).
    """
    near, far, basis, reports = {}, {}, {}, {}
    for product, frames in contracts.items():
        n, f, b, rep = build_product(frames, **kw)
        near[product], far[product], basis[product] = n, f, b
        reports[product] = rep
    near_df = pd.DataFrame(near).sort_index()
    far_df = pd.DataFrame(far).reindex_like(near_df)
    basis_df = pd.DataFrame(basis).reindex_like(near_df)
    return near_df, far_df, basis_df, reports


def verify(reports: dict, max_jump_flags: int = 5) -> list:
    """Turn roll reports into a list of human-readable warnings (empty == clean)."""
    warns = []
    for product, rep in reports.items():
        if len(rep["jump_flags"]) > max_jump_flags:
            warns.append(f"{product}: {len(rep['jump_flags'])} price-jump flags "
                         f"(possible bad roll/back-adjust): {rep['jump_flags'][:3]}...")
        if rep["basis_coverage"] < 0.8:
            warns.append(f"{product}: basis coverage only "
                         f"{rep['basis_coverage']:.0%} (thin 2nd contract?)")
        if rep["near_rolls"] == 0:
            warns.append(f"{product}: zero rolls detected — check maturity parsing")
    return warns
