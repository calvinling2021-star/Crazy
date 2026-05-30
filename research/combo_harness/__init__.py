"""
Commodity multi-factor combo — backtest harness
================================================

A research-grade, look-ahead-safe backtest for the diversified Chinese
commodity-futures multi-factor combo (Pick 1) from the companion research docs.

Design goals
------------
- **Same code, two data sources.** Develop offline against `SyntheticSource`
  (no account, no network), then flip to `TqsdkSource` once your domestic
  CTP/tqsdk account is live — the rest of the pipeline is unchanged.
- **No look-ahead.** Signals at day t use only data through t-1; weights are
  lagged one day before being multiplied by realised returns.
- **Honest accounting.** Transaction costs + a capacity (impact) multiplier are
  subtracted from returns; the validation step applies the *deflated* Sharpe
  gate (the same data-snooping correction as `strategy_screen.py`).

Modules
-------
- data.py        : DataSource abstraction (Synthetic + tqsdk adapter)
- signals.py     : the five legs (TS-mom, XS-mom, carry, basis-mom, curve-mom)
- portfolio.py   : per-leg vol scaling, equal-risk combine, crash control
- costs.py       : turnover cost + capacity/impact multiplier
- backtest.py    : engine + performance metrics
- validation.py  : deflated-Sharpe gate, per-leg marginal IR, capacity test
- run_backtest.py : CLI that wires it together and prints a report

Nothing here is investment advice. Synthetic results exist only to prove the
pipeline; real conclusions require real data + your own walk-forward.
"""
