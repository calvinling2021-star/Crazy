# Polymarket Copy-Trading Simulator

A research / paper-trading tool that:

1. Pulls the **top-N profitable wallets** from Polymarket's public leaderboard.
2. Pages through each wallet's historical trades via the Data API.
3. Runs a deterministic **event-driven simulator** that mirrors each leader's
   fills into a virtual portfolio, applying configurable fees, slippage,
   latency, and risk caps.
4. Reports PnL, drawdown, per-leader contribution, and writes the trade
   log + equity curve to CSV.

This is **not a live trading bot**. Nothing here signs transactions or places
orders on Polymarket. Wiring it to a funded wallet would require a separate
signing layer (MetaMask / private-key + CLOB order signing) and a deliberate
decision about jurisdiction, KYC, and risk.

## Install

```bash
pip install -r polymarket/requirements.txt
```

## Run

```bash
# Full pipeline: fetch top-100 wallets, pull their trades, simulate $10k bank.
python -m polymarket.main \
  --top 100 \
  --window all \
  --capital 10000 \
  --sizing fraction_lead --fraction 0.01 \
  --fee-bps 20 --slippage-bps 50 \
  --max-position-usd 1000 --per-leader-daily-cap 2000 \
  --out polymarket/results

# Just print the leaderboard
python -m polymarket.main --leaderboard-only --top 100
```

Artifacts written to `--out`:

| file | description |
|---|---|
| `leaderboard.json` | ranked wallets with PnL/volume |
| `copy_trades.csv`  | every simulated fill (entry & exit) |
| `equity_curve.csv` | mark-to-market equity at each event |
| `summary.json`     | final PnL, return %, drawdown, per-leader stats |

## Sizing modes

| mode | meaning |
|---|---|
| `fixed_usd` | spend a flat $ amount per copied trade |
| `fraction_lead` | spend `fraction × leader_notional` (default 1%) |
| `kelly_pnl` | weight bank-roll across leaders by lifetime PnL |

## Risk knobs

| flag | default | purpose |
|---|---|---|
| `--max-position-usd` | 1000 | per-market exposure cap |
| `--max-concurrent` | 50 | simultaneous open positions cap |
| `--per-leader-daily-cap` | 2000 | $ deployed per leader per day |
| `--min-leader-pnl` | 5000 | drop signals from sub-threshold leaders |
| `--slippage-bps` | 50 | adverse price move modelled on entry/exit |
| `--fee-bps` | 20 | round-trip transaction cost |

## 12-month walk-forward backtest

**Don't trust naive backtests.** Picking "top 100 by lifetime PnL" and copying
their trades over the same period is look-ahead biased — those wallets sit on
the leaderboard *because of* the trades the simulator then copies. The
backtest avoids this:

  * **Selection window** (default: months 1–6): rank a candidate pool of
    wallets by their PnL *inside this window only*.
  * **Validation window** (default: months 7–12): copy the top-K wallets'
    trades from this window only, with real market resolutions.

### Recommended configs (from synthetic-data sweeps)

The default below is the balanced **moderate** tier — Sharpe 1.13, +14% annual,
worst-case drawdown ~6% on the pnl pool. Use the conservative tier for lower
drawdown, or the aggressive tier when drawdown tolerance is higher.

```bash
# MODERATE (default): fraction=2%, consensus>=2 / 24h
python -m polymarket.backtest \
  --candidate-pool 50 --top-k 50 \
  --min-consensus-leaders 2 --consensus-window-hours 24

# CONSERVATIVE: fraction=1%
python -m polymarket.backtest --fraction 0.01

# AGGRESSIVE: fraction=3% + conviction-weighted sizing
python -m polymarket.backtest --fraction 0.03 \
  --conviction-size-step 0.5 --conviction-size-max 3.0

# HONEST baseline — bypass lifetime-PnL leaderboard bias
python -m polymarket.backtest --pool-rank-by random

# Patient execution — fill at leader's price, skip if can't get filled
python -m polymarket.backtest --execution-mode limit --limit-fill-prob 0.6
```

### Signal-quality filters

| flag | what it does | found to help? |
|---|---|---|
| `--min-consensus-leaders N` | require N distinct leaders BUY same (market, outcome) within `--consensus-window-hours` | **yes — biggest improvement** |
| `--conviction-size-step s` | scale copy size by `1 + extra_leaders × s` when more than min agree | yes for return, neutral for Sharpe |
| `--min-tight-leaders K` | also require K leaders inside a tighter sub-window | **no — over-restrictive, kills signal volume** |
| `--leader-rank-metric roic` | rank candidate pool by PnL ÷ capital deployed (not raw PnL) | inconclusive on synthetic; expected to matter more on real data |
| `--min-price`, `--max-price` | skip trades at extreme prices | marginal |
| `--stop-loss-pct`, `--profit-take-pct` | exit on adverse/favourable mark moves | **no — prediction markets need to play out; cutting early hurts** |

### Pool source affects results

The `--pool-rank-by` flag controls how the candidate pool is seeded:

| flag | meaning | look-ahead bias |
|---|---|---|
| `pnl` (default) | top by lifetime PnL — Polymarket's leaderboard | strong (lifetime PnL includes the validation window) |
| `volume` | top by lifetime traded volume | weak (volume accrues regardless of P/L) |
| `random` | shuffled sample of the top-2N pool | weakest — measures whether the *selection step alone* has edge |

### Execution mode

| mode | behaviour | what it models |
|---|---|---|
| `market` (default) | always fills at `leader_price × (1 ± slippage_bps)` | market-taking — you cross the spread to mirror the leader fast |
| `limit` | fills at exactly `leader_price` with `--limit-fill-prob`; else skips | patient limit-order — no slippage but you miss trades |

Or run the whole pipeline on synthetic data (no network) to see the output
format:

```bash
python -m polymarket.backtest --synthetic --seed 42
```

### Findings on synthetic data (10 seeds, 6mo selection / 6mo validation, 70 bps friction)

Population: 200 wallets, skill ~ N(0, 0.08).

**Pool=50, narrow to top-K (pnl-ranked pool — biased toward profitable wallets):**

| top-K | 6mo ret% | annual% | Sharpe | worst DD% | +seeds |
|---|---|---|---|---|---|
| 5  | −0.34 | −0.68 | −0.02 | −2.1 | 5/10 |
| 10 | −0.08 | −0.16 |  0.01 | −2.2 | 4/10 |
| 15 | +0.23 | +0.46 |  0.29 | −3.1 | 6/10 |
| 30 | +1.98 | +3.99 |  0.82 | −4.0 | 6/10 |
| 50 | +2.94 | +5.96 |  1.16 | −4.6 | 7/10 |

**Pool source comparison (pool=50, top-15):**

| pool source | exec | 6mo ret% | annual% | Sharpe | worst DD% | +seeds |
|---|---|---|---|---|---|---|
| pnl     | market | +0.64 | +1.28 | 0.52 | −3.0 | 6/10 |
| pnl     | limit  | +0.50 | +1.00 | 0.58 | −2.4 | 6/10 |
| volume  | market | −0.45 | −0.89 | −0.13 | −5.96 | 4/10 |
| random  | market | +0.23 | +0.46 | 0.29 | −3.1 | 6/10 |
| random  | limit  | +0.26 | +0.53 | 0.36 | −1.8 | 7/10 |

### Pareto frontier — leverage vs Sharpe (pool=50/pnl, top-50, consensus≥2 / 24h)

| fraction | conviction | annual % | Sharpe | worst DD | +seeds |
|---|---|---|---|---|---|
| 1% | 0.0 | +7.3 | **1.16** | −2.8% | 8/10 |
| 1% | 1.0 | +10.6 | 1.00 | −5.9% | **10/10** |
| **2%** | **0.0** | **+14.0** | **1.13** | **−5.7%** | 9/10 |
| 2% | 0.5 | +17.0 | 0.96 | −9.5% | **10/10** |
| 3% | 0.0 | +20.4 | 1.09 | −8.7% | 9/10 |
| 3% | 1.0 | +29.1 | 0.91 | −13.8% | 9/10 |

Sharpe ceiling sits around 1.10–1.16 on this synthetic data; leverage beyond
that scales return and drawdown roughly proportionally.

### Honest baseline (random pool — no leaderboard look-ahead)

| fraction | annual % | Sharpe | worst DD |
|---|---|---|---|
| 1% | +3.2 | 0.26 | −3.8% |
| 2% | +7.0 | 0.36 | −6.8% |
| 3% | +11.5 | 0.46 | −9.9% |

### What worked and what didn't

1. **Consensus filter (≥2 leaders, 24h window) was the breakthrough.** Lifted
   Sharpe from ~−0.4 to ~1.1 on the pnl pool; from ~−0.2 to ~0.3 on the
   honest random pool. Two profitable wallets converging on a bet within a
   day is a genuine higher-conviction signal.
2. **Conviction-weighted sizing scales return ~50% per extra leader.** Hits
   10/10 positive seeds. Doesn't improve Sharpe — it's leverage on the
   consensus signal — but raises base-case return.
3. **Stop-loss and profit-take both hurt.** Prediction markets need to play
   out; mechanical stops just add fees and miss the convergence.
4. **Tight-window consensus** (require 2-in-1h on top of 2-in-24h) was
   over-restrictive and killed signal volume.
5. **RoIC ranking didn't differ from PnL ranking** in synthetic data — trade
   sizes too uniform. Expected to matter more on real Polymarket data.
6. **Look-ahead bias gap is wide.** Biased pool says +14% annual; honest
   random pool says +7% at the same risk. Real answer probably in between.

## Tests

```bash
pytest polymarket/tests -v
```

Seventeen tests, all offline:
  * 13 simulator tests (sizing, caps, settlement, limit-order execution, consensus
    filter, price gate, stop-loss, profit-take, bad-row filtering, …)
  * 4 backtest methodology tests (pipeline, selection step, window isolation,
    pool source)

## Architecture

```
polymarket/
  api.py          # Polymarket HTTP client (read-only, retries+backoff)
  leaderboard.py  # ranks the top-N profitable wallets
  simulator.py    # event-driven copy-trading simulator
  main.py         # CLI: leaderboard -> activity -> simulate -> report
  tests/          # offline unit tests
```

The leaderboard call hits `https://lb-api.polymarket.com/leaderboard`. Per-wallet
trade history comes from `https://data-api.polymarket.com/activity?user=…`.
Market resolution comes from `https://gamma-api.polymarket.com/markets/{id}`
(only used when settling open positions at end-of-sim).

## Going live (not implemented)

If you wanted to push this from simulation into actual auto-trading you would
need to add, at minimum:

1. **Wallet & signing** — Polygon wallet funded with USDC, EIP-712 signer for
   CLOB orders.
2. **Real-time stream** — replace activity-polling with the websocket feed at
   `wss://ws-subscriptions-clob.polymarket.com` so signals are not stale.
3. **Order routing** — translate copy intents into POST `/order` calls on
   `clob.polymarket.com`, with retry & cancel-on-stale logic.
4. **Compliance** — check that Polymarket is accessible from your jurisdiction
   and that automated trading is permitted under their ToS.

Doing any of that is out of scope for this repo; the simulator is the safe
research surface.
