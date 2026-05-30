"""Transaction-cost and capacity (market-impact) model.

Cost is charged on traded notional = sum_i |w[i,t] - w[i,t-1]| (one-way turnover
per day, both opening and closing legs included across days).

`capacity_mult` represents impact growing with AUM: at small size impact is
negligible (mult ~1), at large size you pay multiples of the base cost. Use it
in the capacity test (run the same strategy at mult = 1, 3, 5).
"""
from __future__ import annotations

import numpy as np
import pandas as pd


# Representative round-trip costs (fraction of notional) per market segment.
# Chinese commodity futures: ~4-6 bp all-in for liquid contracts.
BASE_ROUNDTRIP = 0.0006     # 6 bps round trip
PER_SIDE = BASE_ROUNDTRIP / 2.0


def turnover(weights: pd.DataFrame) -> pd.Series:
    """One-way daily turnover = sum_i |Δw_i| (gross notional traded)."""
    return weights.diff().abs().sum(axis=1).fillna(weights.abs().sum(axis=1))


def cost_series(weights: pd.DataFrame, capacity_mult: float = 1.0,
                per_side: float = PER_SIDE) -> pd.Series:
    """Daily return drag from trading `weights`."""
    return turnover(weights) * per_side * float(capacity_mult)
