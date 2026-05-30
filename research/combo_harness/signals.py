"""The five signal legs of the commodity multi-factor combo.

Each leg returns a *target weight* panel (index = date, columns = commodity),
computed using ONLY trailing data as of each date (no look-ahead). The backtest
lags these weights by one day before applying returns.

Conventions
-----------
- Cross-sectional legs (XS-mom, carry, basis-mom, curve-mom) are made
  dollar-neutral and scaled to gross leverage 1 (sum of |w| == 1) each day.
- The time-series leg (TS-mom) takes a +/- unit per commodity, scaled to
  gross 1 across the cross-section.
- All legs go long the top tertile of the signal and short the bottom tertile
  (robust, low-turnover vs. extreme quantiles).
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def _cum_return(near_ret: pd.DataFrame, lookback: int) -> pd.DataFrame:
    """Trailing `lookback`-day cumulative return, vectorized (log-sum-exp)."""
    return np.expm1(np.log1p(near_ret).rolling(lookback).sum())


def _xsection_long_short(score: pd.DataFrame, frac: float = 1 / 3) -> pd.DataFrame:
    """Long top `frac`, short bottom `frac` each day; dollar-neutral, gross=1.

    Vectorized via cross-sectional percentile ranks. Long and short sleeves are
    each scaled to 0.5 gross so the book is dollar-neutral with total gross 1.
    """
    valid = score.notna()
    n = valid.sum(axis=1)
    rank = score.rank(axis=1, pct=True)                 # 0..1 across commodities
    longs = rank.ge(1.0 - frac) & valid
    shorts = rank.le(frac) & valid
    nl = longs.sum(axis=1).replace(0, np.nan)
    ns = shorts.sum(axis=1).replace(0, np.nan)
    w = longs.div(nl, axis=0).mul(0.5) - shorts.div(ns, axis=0).mul(0.5)
    # rows with too few names -> flat
    w = w.where(n.ge(4), 0.0).fillna(0.0)
    return w


def ts_momentum(near_ret: pd.DataFrame, lookback: int = 60) -> pd.DataFrame:
    """Time-series momentum: sign of trailing `lookback`-day cumulative return."""
    cum = _cum_return(near_ret, lookback)
    sign = np.sign(cum)
    gross = sign.abs().sum(axis=1).replace(0.0, np.nan)
    return sign.div(gross, axis=0).fillna(0.0)


def xs_momentum(near_ret: pd.DataFrame, lookback: int = 80) -> pd.DataFrame:
    """Cross-sectional momentum on trailing `lookback`-day return (~4 months)."""
    cum = _cum_return(near_ret, lookback)
    return _xsection_long_short(cum)


def carry(near: pd.DataFrame, far: pd.DataFrame, smooth: int = 5) -> pd.DataFrame:
    """Carry/basis: annualized log(near/far); long backwardation, short contango."""
    basis = np.log(near / far)
    basis = basis.rolling(smooth).mean()      # de-noise
    return _xsection_long_short(basis)


def basis_momentum(near_ret: pd.DataFrame, far_ret: pd.DataFrame,
                   lookback: int = 60) -> pd.DataFrame:
    """Boons-Prado basis-momentum: trailing cumulative (near - far) return."""
    spread = near_ret - far_ret
    cum = spread.rolling(lookback).sum()
    return _xsection_long_short(cum)


def curve_momentum(near: pd.DataFrame, far: pd.DataFrame,
                   lookback: int = 60) -> pd.DataFrame:
    """Curve momentum: momentum of the calendar spread (basis) itself."""
    basis = np.log(near / far)
    chg = basis - basis.shift(lookback)        # trend in the curve slope
    return _xsection_long_short(chg)


def all_legs(near, far, near_ret, far_ret, params=None):
    """Build all five leg-weight panels. `params` overrides lookbacks."""
    p = {
        "ts_lookback": 60,
        "xs_lookback": 80,
        "carry_smooth": 5,
        "bmom_lookback": 60,
        "curve_lookback": 60,
    }
    if params:
        p.update(params)
    return {
        "ts_mom": ts_momentum(near_ret, p["ts_lookback"]),
        "xs_mom": xs_momentum(near_ret, p["xs_lookback"]),
        "carry": carry(near, far, p["carry_smooth"]),
        "basis_mom": basis_momentum(near_ret, far_ret, p["bmom_lookback"]),
        "curve_mom": curve_momentum(near, far, p["curve_lookback"]),
    }
