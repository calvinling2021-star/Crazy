# Commodity Multi-Factor Combo — Backtest Harness

A research-grade, **look-ahead-safe** backtest for Pick 1 (the diversified
Chinese commodity-futures multi-factor combo). Same code runs on **synthetic
data offline** and on **real tqsdk data** once your domestic CTP account is live.

> Synthetic numbers prove the *pipeline*, not the *strategy*. Real conclusions
> need real data + your own walk-forward. Not investment advice.

## Quick start (offline, no account)

```bash
pip install numpy pandas
python -m research.combo_harness.run_backtest          # synthetic data
python -m research.combo_harness.run_backtest --n-trials 30   # change deflation N_eff
```

Example output (synthetic, seed 7): combo **net Sharpe ≈ 1.26** (gross 1.42),
single legs ≈ 0.2–1.2, the marginal-IR step flags a redundant leg, and the
deflated-Sharpe gate shows how the bar rises with the number of configs searched.

## What each piece does

| File | Role |
|---|---|
| `data.py` | `SyntheticSource` (offline) and `TqsdkSource` (real). Returns aligned **near** + **far** price panels. |
| `signals.py` | The five legs: TS-momentum, XS-momentum, carry/basis, basis-momentum, curve-momentum. Each returns a look-ahead-safe weight panel. |
| `portfolio.py` | Per-leg vol scaling → equal-risk combine → **crash control / vol target** (Daniel-Moskowitz style, lagged). |
| `costs.py` | Turnover cost + **capacity (impact) multiplier**. |
| `backtest.py` | Engine (weights lagged 1 day) + metrics (Sharpe, maxDD, turnover) + **rebalance frequency**. |
| `validation.py` | **Deflated-Sharpe gate**, **per-leg marginal IR**, **capacity test**. The part you never relax. |
| `run_backtest.py` | Wires it together, prints the report. |

## Going live (real data)

1. Get a domestic futures account with **CTP API enabled** (see
   `../api_access_commodity_futures.md`), `pip install tqsdk`.
2. In `data.py`, fill in `TqsdkSource.load()`:
   - `near` = main continuous contract per product (`KQ.m@EXCHANGE.product`),
   - `far` = next maturity / deferred continuous, aligned + back-adjusted on roll.
3. Run `python -m research.combo_harness.run_backtest --source tqsdk`.
   **Everything downstream is unchanged** — that's the point of the abstraction.

## The three validation gates (do not skip)

1. **Deflated-Sharpe gate** — clear the data-snooping noise floor at deflated
   t > 1.96. Be honest about `N_eff` (how many configs you really tried); the
   harness shows the bar at several N_eff so you can't fool yourself.
2. **Marginal IR** — every leg must add Sharpe over the rest; drop the ones
   that don't (the synthetic demo flags `xs_mom`).
3. **Capacity test** — re-run at impact ×1/×3/×5; find where net Sharpe breaks
   for your AUM. For a capacity-constrained book this is the binding constraint.

## Known simplifications (todo before risking capital)

- Back-adjustment/roll handling is assumed upstream of `near`/`far`; verify it.
- Cost model is representative, not venue-exact; add real commission + slippage
  + per-contract impact curves.
- Add per-exchange position limits and night-session margin (China specifics).
- Consider rebalance bands (trade only when target drifts past a threshold) to
  cut turnover further than the simple `rebalance_days` schedule.
