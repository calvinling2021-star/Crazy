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
from statistics import NormalDist

from . import backtest

_Z = NormalDist().inv_cdf
_GAMMA = 0.5772156649015329          # Euler-Mascheroni
ANN = 252.0


def deflated_floor(n_eff: int, years: float) -> float:
    """Simplified noise floor (back-compat with strategy_screen.py):
    E[max SR] ~= sqrt(2 ln N) * SE,  SE = 1/sqrt(years)."""
    se = 1.0 / math.sqrt(max(years, 1e-9))
    return math.sqrt(2.0 * math.log(max(n_eff, 2))) * se


def deflated_gate(sharpe: float, years: float, n_eff: int):
    """Simplified gate (annual Sharpe in, deflated t out). Back-compat."""
    se = 1.0 / math.sqrt(max(years, 1e-9))
    floor = deflated_floor(n_eff, years)
    return ((sharpe - floor) / se > 1.96), (sharpe - floor) / se, floor


def _emax(n_eff: int) -> float:
    """Expected max of N std-normal trials (Bailey-Lopez de Prado benchmark):
    (1-g)*Z(1-1/N) + g*Z(1-1/(N e)). More accurate than sqrt(2 ln N)."""
    n = max(int(n_eff), 2)
    return (1 - _GAMMA) * _Z(1 - 1.0 / n) + _GAMMA * _Z(1 - 1.0 / (n * math.e))


def deflated_sharpe(returns, n_eff: int, ann=ANN) -> dict:
    """Full Deflated Sharpe Ratio with skew/kurtosis-corrected SE.

    Per-period moments + observation count (not 1/sqrt(years)):
      SE(SR) = sqrt((1 - skew*SR + (kurt-1)/4 * SR^2) / (n-1))  [Mertens/BLdP]
    Negatively-skewed, fat-tailed commodity returns -> larger SE -> lower t,
    so this is stricter than the simplified floor where it matters.
    """
    r = returns.dropna()
    n = int(r.shape[0])
    sd = float(r.std())
    if n < 30 or sd == 0:
        return {"insufficient": True}
    sr_pp = float(r.mean()) / sd
    skew = float(r.skew())
    kurt = float(r.kurt()) + 3.0                     # pandas .kurt is excess
    se = math.sqrt(max((1 - skew * sr_pp + (kurt - 1) / 4 * sr_pp ** 2) / (n - 1), 1e-12))
    t_raw = sr_pp / se
    emax = _emax(n_eff)
    t_defl = t_raw - emax
    return {
        "insufficient": False,
        "sharpe_ann": sr_pp * math.sqrt(ann),
        "skew": skew, "excess_kurt": kurt - 3.0,
        "t_raw": t_raw, "emax_floor": emax, "t_deflated": t_defl,
        "dsr_prob": NormalDist().cdf(t_defl), "passes": NormalDist().cdf(t_defl) > 0.95,
        "n_eff": int(n_eff), "n_obs": n,
    }


def marginal_ir(md, base_legs, **run_kw):
    """For each leg, Sharpe of (all legs) minus Sharpe of (all legs except it)."""
    full = backtest.run(md, legs_subset=base_legs, **run_kw)["metrics"]["sharpe"]
    out = {}
    for leg in base_legs:
        subset = [l for l in base_legs if l != leg]
        if not subset:
            continue
        s = backtest.run(md, legs_subset=subset, **run_kw)["metrics"]["sharpe"]
        out[leg] = {"combo_sharpe": full, "without_leg": s, "marginal": full - s}
    return out


def capacity_test(md, mults=(1.0, 3.0, 5.0), **run_kw):
    rows = []
    for mlt in mults:
        m = backtest.run(md, capacity_mult=mlt, **run_kw)["metrics"]
        rows.append({
            "capacity_mult": mlt, "sharpe": m["sharpe"],
            "ann_return": m["ann_return"], "max_drawdown": m["max_drawdown"],
        })
    return rows
