"""Portfolio construction: per-leg vol scaling, equal-risk combine, crash control.

Pipeline (all scaling decisions use LAGGED realised vol -> no look-ahead):
  1. For each leg, compute its raw return, then scale the leg to a target vol
     using trailing realised vol (so legs contribute equal risk).
  2. Combine legs with equal risk weight -> preliminary portfolio.
  3. Crash control / vol target: scale the whole book by
        min(cap, target_port_vol / trailing_realised_vol)
     so exposure is cut when factor vol spikes (Daniel-Moskowitz style),
     which the China factor-crash literature shows lifts OOS Sharpe.

Returns the *combined target weight panel* (so costs are computed on the actual
positions) plus the leg-scale diagnostics.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

ANN = 252.0


def _port_return(weights: pd.DataFrame, asset_ret: pd.DataFrame) -> pd.Series:
    """Return of holding `weights` (lagged 1 day) into `asset_ret`."""
    return (weights.shift(1) * asset_ret).sum(axis=1)


def _rolling_vol(ret: pd.Series, window: int = 60) -> pd.Series:
    return ret.rolling(window).std() * np.sqrt(ANN)


def combine(leg_weights: dict, asset_ret: pd.DataFrame,
            target_leg_vol: float = 0.10,
            target_port_vol: float = 0.10,
            vol_window: int = 60,
            crash_cap: float = 2.0):
    """Combine legs into one target-weight panel with vol scaling + crash control.

    Parameters
    ----------
    leg_weights : dict[name -> weight DataFrame]
    asset_ret   : near-contract daily returns (date x commodity)
    target_leg_vol / target_port_vol : annualized vol targets
    vol_window  : rolling window (days) for realised-vol scaling (lagged)
    crash_cap   : max leverage multiple the vol target may apply (crash control)
    """
    legs = list(leg_weights)
    rw = 1.0 / len(legs)                      # equal risk weight

    # 1) scale each leg to target vol using lagged trailing vol
    scaled = {}
    leg_scales = {}
    for name, w in leg_weights.items():
        r = _port_return(w, asset_ret)
        vol = _rolling_vol(r, vol_window).shift(1)        # lag -> no look-ahead
        s = (target_leg_vol / vol).clip(upper=crash_cap).fillna(0.0)
        leg_scales[name] = s
        scaled[name] = w.mul(s, axis=0) * rw

    # 2) preliminary combined weights and returns
    prelim = sum(scaled.values())
    prelim_ret = _port_return(prelim, asset_ret)

    # 3) crash control / portfolio vol target (lagged)
    pvol = _rolling_vol(prelim_ret, vol_window).shift(1)
    pscale = (target_port_vol / pvol).clip(upper=crash_cap).fillna(0.0)
    combined = prelim.mul(pscale, axis=0)

    diag = pd.DataFrame(leg_scales)
    diag["port_scale"] = pscale
    return combined, diag
