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

```bash
# Default config — pool=50 (top by lifetime PnL), narrow to top-15
python -m polymarket.backtest \
  --capital 10000 --sizing fraction_lead --fraction 0.01 \
  --fee-bps 20 --slippage-bps 50

# Honest baseline — bypass the lifetime-PnL leaderboard bias
python -m polymarket.backtest --pool-rank-by random

# Patient limit-order execution (no slippage, 60% fill rate)
python -m polymarket.backtest --execution-mode limit --limit-fill-prob 0.6
```

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

**Takeaways from synthetic data:**

1. The look-ahead bias is real. Earlier naive runs printed +17% annual at top-50 —
   that was because "top-50 by lifetime PnL" used trades from the validation
   window itself. Once we control for it, honest synthetic expectation is closer
   to **0–6% annual** depending on pool source and selection breadth.
2. Counter-intuitively, **broader selection often beats narrower** — top-50 of a
   pool of 50 outperforms top-15 in most configurations. The selection-window
   PnL is too noisy a skill signal over 6 months.
3. Limit-mode execution improves Sharpe and cuts drawdown but reduces trade
   count by ~50%; net return is similar.
4. Single-seed runs are wildly misleading — across 10 seeds, individual results
   range from −21% to +8% on the same config.
5. **Synthetic ≠ real.** Wallet-skill distribution is a guess. Run against
   real Polymarket data to know.

## Tests

```bash
pytest polymarket/tests -v
```

Thirteen tests, all offline:
  * 9 simulator tests (sizing, caps, settlement, limit-order execution, bad-row filtering, …)
  * 4 backtest methodology tests (pipeline, selection step, window isolation, pool source)

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
