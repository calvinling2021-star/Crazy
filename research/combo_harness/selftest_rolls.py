"""Offline self-test for the roll engine (no account, no network).

Generates synthetic INDIVIDUAL-maturity contracts (with realistic OI humps so
the max-OI front rolls forward monthly), runs build_continuous, and asserts the
output is sane. Proves the roll/back-adjustment logic before real data exists.

    python -m research.combo_harness.selftest_rolls
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import rolls


def make_product(seed=0, n_days=1000, k_basis=-0.04):
    """One product: a spot path + a strip of monthly contracts with OI humps.

    k_basis < 0  -> contango (far > front)  -> log(front/far) < 0
    k_basis > 0  -> backwardation
    """
    rng = np.random.default_rng(seed)
    dates = pd.bdate_range("2018-01-02", periods=n_days)
    spot = 100.0 * np.exp(np.cumsum(0.0002 + 0.012 * rng.standard_normal(n_days)))
    spot = pd.Series(spot, index=dates)

    # monthly maturities covering the window + buffer
    matur = pd.period_range(dates[0], dates[-1] + pd.Timedelta(days=200), freq="M")
    frames = {}
    yy0 = dates[0].year
    for p in matur:
        expiry = pd.Timestamp(p.year, p.month, 15)
        code = f"X{p.year % 100:02d}{p.month:02d}"          # e.g. X1903
        live = dates[(dates >= expiry - pd.Timedelta(days=190)) & (dates <= expiry)]
        if len(live) < 20:
            continue
        ttm_years = (expiry - live).days / 365.0
        px = spot.loc[live].values * np.exp(k_basis * ttm_years) \
            * (1.0 + 0.001 * rng.standard_normal(len(live)))
        dte = (expiry - live).days.values
        oi = 50000.0 * np.exp(-((dte - 35.0) / 40.0) ** 2) + 100.0   # hump ~35d out
        vol = oi * (0.5 + 0.5 * rng.random(len(live)))
        frames[code] = pd.DataFrame(
            {"settle": px, "oi": oi, "volume": vol}, index=live)
    return frames


def main():
    contracts = {f"P{i}": make_product(seed=i, k_basis=(-0.04 if i % 2 else 0.03))
                 for i in range(6)}
    near, far, basis, reports = rolls.build_continuous(contracts, oi_min=100.0)
    warns = rolls.verify(reports)

    print("=== ROLL ENGINE SELF-TEST ===")
    print(f"products: {list(near.columns)}   dates: {near.shape[0]}")
    nret = near.pct_change()
    print(f"near continuous: ann_vol≈{nret.std().mean()*np.sqrt(252)*100:.1f}%  "
          f"max|daily ret|={nret.abs().max().max()*100:.1f}%")
    print("rolls/product:", {p: r["near_rolls"] for p, r in reports.items()})
    print("basis sign by product (neg=contango, pos=backwardation):",
          {p: round(float(basis[p].dropna().mean()), 3) for p in basis.columns})
    print("verify warnings:", warns if warns else "NONE (clean)")

    # ---- assertions ----
    assert near.shape[1] == 6, "all products present"
    assert nret.abs().max().max() < 0.30, "no absurd jumps in continuous series"
    assert all(r["near_rolls"] >= 20 for r in reports.values()), "monthly-ish rolls"
    assert all(r["basis_coverage"] > 0.8 for r in reports.values()), "basis covered"
    # basis = log(front/far) = k_basis * (ttm_front - ttm_far); front is nearer
    # (smaller ttm), so basis sign == -sign(k_basis):
    #   k_basis>0 (far>front, contango)      -> basis < 0
    #   k_basis<0 (far<front, backwardation)  -> basis > 0
    for i, p in enumerate(basis.columns):
        mb = float(basis[p].dropna().mean())
        if i % 2:    # k_basis = -0.04 -> backwardation -> positive basis
            assert mb > 0, f"{p} expected backwardation (pos basis), got {mb}"
        else:        # k_basis = +0.03 -> contango -> negative basis
            assert mb < 0, f"{p} expected contango (neg basis), got {mb}"
    print("\nALL ASSERTIONS PASSED — roll engine produces sane near/far/basis.")


if __name__ == "__main__":
    main()
