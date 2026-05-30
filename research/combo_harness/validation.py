"""Validation gates — the part you must never relax.

1. Deflated-Sharpe gate (Bailey & Lopez de Prado 2014): when you search N
   configurations, luck alone yields an expected max Sharpe of
       floor = sqrt(2 * ln N_eff) * SE(Sharpe),   SE ~ 1/sqrt(years).
   The strategy must clear this floor with a deflated t-stat > 1.96.
   (Identical logic to research/strategy_screen.py.)

2. Per-leg marginal IR: does each leg add risk-adjusted return over the rest?
   Drop legs that don't.

3. Capacity test: re-run at impact multipliers 1x / 3x / 5x and watch where
   the net Sharpe degrades — the binding constraint for a capped book.
"""
from __future__ import annotations

import math
import numpy as np

from . import backtest


def deflated_floor(n_eff: int, years: float) -> float:
    se = 1.0 / math.sqrt(max(years, 1e-9))
    return math.sqrt(2.0 * math.log(max(n_eff, 2))) * se


def deflated_gate(sharpe: float, years: float, n_eff: int):
    """Return (passes, deflated_t, floor) for a candidate Sharpe."""
    se = 1.0 / math.sqrt(max(years, 1e-9))
    floor = deflated_floor(n_eff, years)
    deflated_t = (sharpe - floor) / se
    return (deflated_t > 1.96), deflated_t, floor


def marginal_ir(near, far, base_legs, **run_kw):
    """For each leg, Sharpe of (all legs) minus Sharpe of (all legs except it)."""
    full = backtest.run(near, far, legs_subset=base_legs, **run_kw)["metrics"]["sharpe"]
    out = {}
    for leg in base_legs:
        subset = [l for l in base_legs if l != leg]
        if not subset:
            continue
        s = backtest.run(near, far, legs_subset=subset, **run_kw)["metrics"]["sharpe"]
        out[leg] = {"combo_sharpe": full, "without_leg": s, "marginal": full - s}
    return out


def capacity_test(near, far, mults=(1.0, 3.0, 5.0), **run_kw):
    rows = []
    for mlt in mults:
        m = backtest.run(near, far, capacity_mult=mlt, **run_kw)["metrics"]
        rows.append({
            "capacity_mult": mlt, "sharpe": m["sharpe"],
            "ann_return": m["ann_return"], "max_drawdown": m["max_drawdown"],
        })
    return rows
