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
| `data.py` | Sources return a `MarketData(near, far, basis)` bundle. `SyntheticSource` (offline), `TqsdkSource` (free w/ account), `AkShareSource` (free, **no account**). |
| `rolls.py` | **Roll / back-adjustment engine** — builds continuous near/far + **raw basis** from individual maturities (Chinese max-OI front convention) with loud sanity asserts. The #1-risk component. |
| `signals.py` | The five legs: TS-mom, XS-mom, carry, basis-momentum, curve-momentum. Carry/curve use the **raw basis** (correct term-structure slope); momentum/basis-mom use back-adjusted returns. Look-ahead-safe. |
| `portfolio.py` | Per-leg vol scaling → equal-risk combine → **crash control / vol target** (Daniel-Moskowitz style, lagged). |
| `costs.py` | Turnover cost + **capacity (impact) multiplier**. |
| `backtest.py` | Engine (weights lagged 1 day, cost time-aligned) + metrics + **rebalance frequency**. |
| `validation.py` | Simplified deflated floor **and** the **full skew/kurtosis-corrected Deflated Sharpe Ratio**, **per-leg marginal IR**, **capacity test**. |
| `run_backtest.py` | Wires it together, prints the report. |
| `selftest_rolls.py` | Offline proof the roll engine produces sane near/far/basis (`python -m research.combo_harness.selftest_rolls`). |

### The `near` / `far` / `basis` contract
`near`/`far` are **back-adjusted continuous** prices (return-correct, no roll
gaps). `basis` is the **raw** `log(front/second)` on the contemporaneously
chosen contracts — *not* `log(near/far)` of the adjusted series, which would be
wrong once the two legs roll on different days. Carry & curve-momentum key off
`basis`; momentum & basis-momentum key off returns.

## Getting real data (free paths)

Two free options — both feed the **same roll engine**, so downstream is identical:

**A) AkShare — no account, start today**
```python
import akshare as ak  # pip install akshare
from research.combo_harness.data import AkShareSource
from research.combo_harness import backtest, validation
# you supply the maturity codes per product (AkShare is per-contract):
src = AkShareSource(contract_lists={"rb": ["RB2310","RB2401","RB2405", ...], ...})
md = src.load()                         # builds near/far/basis via rolls.py
res = backtest.run(md, legs_subset=["ts_mom","xs_mom","carry","basis_mom","curve_mom"])
print(res["metrics"]); print(validation.deflated_sharpe(res["net"], n_eff=56))
```

**B) tqsdk — free (sim or live) account, cleanest + same lib you trade on**
```python
from research.combo_harness.data import TqsdkSource
md = TqsdkSource(auth=("phone","password"), start="2010-01-01").load()
```
`TqsdkSource` auto-enumerates all maturities (incl. expired → no survivorship),
downloads daily, and back-adjusts via `rolls.build_continuous`.

See `../data_sourcing_for_validation.md` for the full sourcing guide. Verify the
roll first: `python -m research.combo_harness.selftest_rolls`.

## The three validation gates (do not skip)

1. **Deflated-Sharpe gate** — clear the data-snooping noise floor at deflated
   t > 1.96. Be honest about `N_eff` (how many configs you really tried); the
   harness shows the bar at several N_eff so you can't fool yourself.
2. **Marginal IR** — every leg must add Sharpe over the rest; drop the ones
   that don't (the synthetic demo flags `xs_mom`).
3. **Capacity test** — re-run at impact ×1/×3/×5; find where net Sharpe breaks
   for your AUM. For a capacity-constrained book this is the binding constraint.

## Known simplifications (todo before risking capital)

- **The synthetic source injects its own signal — its Sharpe is circular and is
  NOT evidence of edge.** It exists only to exercise the plumbing. Real evidence
  requires `TqsdkSource`/`AkShareSource` + point-in-time data. Never cite a
  synthetic Sharpe.
- **Two deflated metrics are reported:** the *simplified* floor (`√(2·ln N)·SE`,
  matches `strategy_screen.py`) and the **full skew/kurtosis-corrected DSR**
  (`validation.deflated_sharpe`, per-period moments, observation count). Trust
  the full DSR; the simplified floor is a conservative cross-check.
- **Vol-targeting vs. rebalance:** leg vol-scales are computed on daily (un-held)
  returns, so the realised vol target drifts once weights are frozen for
  `rebalance_days`. Compute realised vol on the actually-held series to fix.
- Back-adjustment/roll handling is assumed upstream of `near`/`far`; **verify it
  — a bad roll fabricates or hides alpha** (the panel's #1 operational risk).
- `DEFAULT_UNIVERSE` is a fixed currently-liquid list → **survivorship bias** on
  real data unless you build point-in-time contract membership.
- Cost model is representative, not venue-exact; add real commission + slippage
  + per-contract impact curves, and per-exchange position limits + night-session
  margin (China specifics).
- Consider rebalance bands (trade only when target drifts past a threshold) to
  cut turnover further than the simple `rebalance_days` schedule.
