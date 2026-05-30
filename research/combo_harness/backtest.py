"""Backtest engine + performance metrics.

A run takes the data panels, builds the legs, combines them, charges costs, and
returns a daily net-return series plus a metrics dict. Look-ahead safety: every
weight is lagged one day before being multiplied by that day's return.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from . import signals, portfolio, costs
from .data import returns_from_prices

ANN = 252.0


def _metrics(net: pd.Series, gross: pd.Series, weights: pd.DataFrame) -> dict:
    net = net.dropna()
    ann_ret = net.mean() * ANN
    ann_vol = net.std() * np.sqrt(ANN)
    sharpe = ann_ret / ann_vol if ann_vol > 0 else 0.0
    curve = (1.0 + net).cumprod()
    dd = (curve / curve.cummax() - 1.0).min()
    avg_turnover = costs.turnover(weights).reindex(net.index).mean()
    return {
        "ann_return": float(ann_ret),
        "ann_vol": float(ann_vol),
        "sharpe": float(sharpe),
        "max_drawdown": float(dd),
        "avg_daily_turnover": float(avg_turnover),
        "ann_turnover_x": float(avg_turnover * ANN),
        "n_days": int(net.shape[0]),
        "years": float(net.shape[0] / ANN),
        "gross_sharpe": float((gross.mean() * ANN) / (gross.std() * np.sqrt(ANN)))
        if gross.std() > 0 else 0.0,
    }


def _apply_rebalance(weights: pd.DataFrame, rebalance_days: int) -> pd.DataFrame:
    """Hold weights constant between rebalance dates (every `rebalance_days`)."""
    if rebalance_days <= 1:
        return weights
    mask = np.zeros(weights.shape[0], dtype=bool)
    mask[::rebalance_days] = True
    held = weights.where(pd.Series(mask, index=weights.index), other=np.nan)
    return held.ffill().fillna(0.0)


def run(md, params=None, capacity_mult=1.0,
        target_leg_vol=0.10, target_port_vol=0.10, vol_window=60,
        crash_cap=2.0, legs_subset=None, rebalance_days=5):
    """Run one backtest configuration on a MarketData bundle `md`.

    Returns dict with: net return series, gross series, weights, metrics, diag.
    `legs_subset` (list of leg names) lets you backtest a subset for marginal-IR.
    `rebalance_days` holds weights between rebalances (realistic turnover).
    """
    near_ret = returns_from_prices(md.near)
    far_ret = returns_from_prices(md.far)

    leg_w = signals.all_legs(md, near_ret, far_ret, params)
    if legs_subset is not None:
        leg_w = {k: v for k, v in leg_w.items() if k in legs_subset}

    combined, diag = portfolio.combine(
        leg_w, near_ret,
        target_leg_vol=target_leg_vol, target_port_vol=target_port_vol,
        vol_window=vol_window, crash_cap=crash_cap,
    )
    combined = _apply_rebalance(combined, rebalance_days)

    # PnL on day t comes from the position decided at t-1 (combined.shift(1)).
    # The trade that established that position (turnover at t-1) must be charged
    # on the same day its position starts earning -> shift the cost by 1 too,
    # so cost and PnL are time-aligned (fixes a one-day cost/PnL misalignment).
    gross = (combined.shift(1) * near_ret).sum(axis=1)
    cost = costs.cost_series(combined, capacity_mult=capacity_mult).shift(1).fillna(0.0)
    net = gross - cost

    m = _metrics(net, gross, combined)
    m["capacity_mult"] = float(capacity_mult)
    return {
        "net": net, "gross": gross, "cost": cost,
        "weights": combined, "diag": diag, "metrics": m,
        "legs": list(leg_w),
    }
