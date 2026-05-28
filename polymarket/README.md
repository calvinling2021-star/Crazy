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

## Tests

```bash
pytest polymarket/tests -v
```

Tests are fully offline and use synthetic trade rows.

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
