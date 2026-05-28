"""12-month walk-forward backtest.

Methodology
-----------
A naive "copy the top-100 PnL wallets over the same 12 months they were
profitable" is look-ahead biased — the wallets ARE on the leaderboard
*because of* the trades the simulator then copies. To validate whether the
strategy itself has edge, the backtest splits the 12 months in two:

  SELECTION  (months 1..N): rank a candidate pool of wallets by *their* PnL
                            estimated from trades inside this window only.
  VALIDATION (months N+1..12): copy the top-K wallets' trades from this
                               period only, with real resolutions.

The selection-window PnL estimate uses realised proceeds − cost on closed
positions plus mark-to-resolution on positions still open at the validation
boundary.

The candidate pool is seeded from the current public leaderboard, which is
itself survivor-biased. That bias is documented but cannot be removed without
historical leaderboard snapshots, which Polymarket does not publish.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from tabulate import tabulate

from .api import PolymarketClient
from .leaderboard import fetch_top_profitable_wallets
from .simulator import CopyTradingSimulator, SimConfig, _normalise_trade, _parse_ts

log = logging.getLogger(__name__)


@dataclass
class BacktestConfig:
    candidate_pool: int = 200
    top_k: int = 100
    selection_months: int = 6
    validation_months: int = 6
    trades_per_wallet: int = 2000
    capital_usd: float = 10_000.0
    sim: SimConfig | None = None


def _estimate_wallet_pnl(
    trades: list[dict[str, Any]],
    resolutions: dict[str, dict[str, float]],
    window_end: datetime,
) -> float:
    """Crude in-window PnL: proceeds - cost + mark-to-resolution of open positions."""
    cost = 0.0
    proceeds = 0.0
    positions: dict[tuple[str, str], tuple[float, float]] = {}  # (shares, cost)
    for raw in trades:
        norm = _normalise_trade(raw, "x")
        if norm is None:
            continue
        key = (norm["market_id"], norm["outcome"])
        sh, c = positions.get(key, (0.0, 0.0))
        if norm["side"] == "BUY":
            cost += norm["notional"]
            positions[key] = (sh + norm["size"], c + norm["notional"])
        else:
            close_sh = min(sh, norm["size"])
            sell_proceeds = close_sh * norm["price"]
            proceeds += sell_proceeds
            new_sh = sh - close_sh
            new_c = c * (new_sh / sh) if sh > 0 else 0.0
            positions[key] = (new_sh, new_c)
    mark = 0.0
    for (mid, oc), (sh, _c) in positions.items():
        if sh <= 0:
            continue
        payoff = resolutions.get(mid, {}).get(oc)
        if payoff is None:
            payoff = 0.5  # neutral assumption for unresolved
        mark += sh * payoff
    return proceeds - cost + mark


def fetch_resolutions(
    client: PolymarketClient,
    market_ids: set[str],
    progress_every: int = 25,
) -> dict[str, dict[str, float]]:
    """Pull resolution outcomes for a set of market ids from gamma."""
    out: dict[str, dict[str, float]] = {}
    for i, mid in enumerate(sorted(market_ids), start=1):
        try:
            m = client.market(mid)
        except Exception as exc:
            log.warning("market %s lookup failed: %s", mid, exc)
            continue
        outcomes = m.get("outcomes") or []
        outcome_prices = m.get("outcomePrices") or m.get("resolvedOutcomePrices")
        if isinstance(outcomes, str):
            try:
                outcomes = json.loads(outcomes)
            except Exception:
                outcomes = []
        if isinstance(outcome_prices, str):
            try:
                outcome_prices = json.loads(outcome_prices)
            except Exception:
                outcome_prices = None
        if not m.get("closed") and not m.get("resolved"):
            continue
        if not outcomes or not outcome_prices:
            continue
        try:
            out[mid] = {str(o).upper(): float(p) for o, p in zip(outcomes, outcome_prices)}
        except Exception:
            continue
        if i % progress_every == 0:
            log.info("resolutions: %d/%d", i, len(market_ids))
    return out


def run_walk_forward(
    client: PolymarketClient,
    cfg: BacktestConfig,
    now: datetime | None = None,
) -> dict[str, Any]:
    now = now or datetime.now(tz=timezone.utc)
    val_end = now
    val_start = val_end - timedelta(days=30 * cfg.validation_months)
    sel_start = val_start - timedelta(days=30 * cfg.selection_months)
    log.info(
        "windows: selection=[%s..%s] validation=[%s..%s]",
        sel_start.date(), val_start.date(), val_start.date(), val_end.date(),
    )

    log.info("seeding candidate pool: top %d by lifetime PnL", cfg.candidate_pool)
    candidates = fetch_top_profitable_wallets(client, n=cfg.candidate_pool, window="all")

    trades_by_wallet: dict[str, list[dict[str, Any]]] = {}
    for i, c in enumerate(candidates, start=1):
        try:
            trades = client.all_trades(c.wallet, hard_cap=cfg.trades_per_wallet)
        except Exception as exc:
            log.warning("activity fetch failed for %s: %s", c.wallet, exc)
            continue
        in_window = [t for t in trades if sel_start <= _parse_ts(t.get("timestamp") or t.get("ts") or t.get("time")) <= val_end]
        trades_by_wallet[c.wallet] = in_window
        if i % 20 == 0:
            log.info("candidates: %d/%d fetched", i, len(candidates))

    # Resolutions across both windows (used for selection-PnL marking and validation settlement)
    market_ids: set[str] = set()
    for trs in trades_by_wallet.values():
        for t in trs:
            mid = t.get("market") or t.get("conditionId") or t.get("marketId")
            if mid:
                market_ids.add(str(mid))
    log.info("fetching resolutions for %d unique markets", len(market_ids))
    resolutions = fetch_resolutions(client, market_ids)

    selection_pnl: dict[str, float] = {}
    for wallet, trades in trades_by_wallet.items():
        sel_trades = [t for t in trades if _parse_ts(t.get("timestamp") or t.get("ts") or t.get("time")) < val_start]
        if not sel_trades:
            continue
        selection_pnl[wallet] = _estimate_wallet_pnl(sel_trades, resolutions, val_start)

    ranked = sorted(selection_pnl.items(), key=lambda kv: kv[1], reverse=True)
    top = dict(ranked[: cfg.top_k])
    log.info(
        "selected top %d wallets by selection-window PnL "
        "(top=$%.0f, median=$%.0f, bottom=$%.0f)",
        len(top),
        ranked[0][1] if ranked else 0.0,
        ranked[len(ranked) // 2][1] if ranked else 0.0,
        ranked[min(len(ranked) - 1, cfg.top_k - 1)][1] if ranked else 0.0,
    )

    validation_trades = {w: trades_by_wallet[w] for w in top}

    sim_cfg = cfg.sim or SimConfig(starting_capital_usd=cfg.capital_usd, min_leader_pnl_usd=0.0)
    sim = CopyTradingSimulator(sim_cfg)
    summary = sim.run(
        validation_trades,
        leader_pnls=top,
        resolutions=resolutions,
        start_ts=val_start,
        end_ts=val_end,
    )
    summary["selection_window"] = (sel_start.isoformat(), val_start.isoformat())
    summary["validation_window"] = (val_start.isoformat(), val_end.isoformat())
    summary["selection_pnl"] = top
    summary["candidate_pool_size"] = len(candidates)
    summary["wallets_with_window_trades"] = len(trades_by_wallet)
    return summary


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Walk-forward 12-month backtest")
    p.add_argument("--candidate-pool", type=int, default=200)
    p.add_argument("--top-k", type=int, default=100)
    p.add_argument("--selection-months", type=int, default=6)
    p.add_argument("--validation-months", type=int, default=6)
    p.add_argument("--trades-per-wallet", type=int, default=2000)
    p.add_argument("--capital", type=float, default=10_000.0)
    p.add_argument("--sizing", default="fraction_lead", choices=["fixed_usd", "fraction_lead", "kelly_pnl"])
    p.add_argument("--fixed-usd", type=float, default=100.0)
    p.add_argument("--fraction", type=float, default=0.01)
    p.add_argument("--fee-bps", type=float, default=20.0)
    p.add_argument("--slippage-bps", type=float, default=50.0)
    p.add_argument("--max-position-usd", type=float, default=1_000.0)
    p.add_argument("--max-concurrent", type=int, default=50)
    p.add_argument("--per-leader-daily-cap", type=float, default=2_000.0)
    p.add_argument("--out", default="polymarket/results/backtest")
    p.add_argument("--synthetic", action="store_true", help="run on synthetic data (no network)")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--log-level", default="INFO")
    return p.parse_args(argv)


def _print_summary(summary: dict[str, Any]) -> None:
    headline = {
        k: summary[k]
        for k in (
            "starting_capital_usd",
            "final_equity_usd",
            "pnl_usd",
            "return_pct",
            "sharpe_annualised",
            "max_drawdown_pct",
            "win_rate_pct",
            "num_copy_trades",
            "candidate_pool_size",
            "wallets_with_window_trades",
        )
        if k in summary
    }
    print("\n=== Walk-forward backtest ===")
    print(f"selection window:  {summary.get('selection_window')}")
    print(f"validation window: {summary.get('validation_window')}")
    print(
        tabulate(
            [[k, f"{v:,.2f}" if isinstance(v, (int, float)) else v] for k, v in headline.items()],
            tablefmt="github",
        )
    )
    monthly = summary.get("monthly_df")
    if isinstance(monthly, pd.DataFrame) and not monthly.empty:
        print("\nMonthly PnL during validation window:")
        rows = [[str(idx), f"${row.equity:,.0f}", f"${row.pnl_usd:,.0f}"] for idx, row in monthly.iterrows()]
        print(tabulate(rows, headers=["month", "equity", "Δ pnl"], tablefmt="github"))

    per_leader = summary.get("per_leader", {})
    if per_leader:
        rows = sorted(
            (
                (
                    w[:10] + "…",
                    s["trades"],
                    f"${s['deployed_usd']:,.0f}",
                    f"${s['realised_proceeds_usd']:,.0f}",
                    f"${s['realised_proceeds_usd'] - s['deployed_usd']:,.0f}",
                )
                for w, s in per_leader.items()
            ),
            key=lambda r: float(r[4].replace("$", "").replace(",", "")),
            reverse=True,
        )
        print("\nTop 10 leader contributions in validation window:")
        print(
            tabulate(
                rows[:10],
                headers=["wallet", "trades", "deployed", "proceeds", "net"],
                tablefmt="github",
            )
        )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    sim_cfg = SimConfig(
        starting_capital_usd=args.capital,
        sizing_mode=args.sizing,
        fixed_usd=args.fixed_usd,
        fraction=args.fraction,
        fee_bps=args.fee_bps,
        slippage_bps=args.slippage_bps,
        max_position_usd=args.max_position_usd,
        max_concurrent=args.max_concurrent,
        per_leader_daily_cap_usd=args.per_leader_daily_cap,
        min_leader_pnl_usd=0.0,  # selection already filters by PnL
    )
    cfg = BacktestConfig(
        candidate_pool=args.candidate_pool,
        top_k=args.top_k,
        selection_months=args.selection_months,
        validation_months=args.validation_months,
        trades_per_wallet=args.trades_per_wallet,
        capital_usd=args.capital,
        sim=sim_cfg,
    )

    if args.synthetic:
        from .synthetic import run_synthetic_backtest

        summary = run_synthetic_backtest(cfg, seed=args.seed)
    else:
        client = PolymarketClient()
        try:
            summary = run_walk_forward(client, cfg)
        except RuntimeError as exc:
            print(f"\nBacktest failed against live Polymarket API: {exc}", file=sys.stderr)
            print("Re-run with --synthetic to see the full pipeline on offline data.", file=sys.stderr)
            return 2

    _print_summary(summary)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    if isinstance(summary.get("trades_df"), pd.DataFrame):
        summary["trades_df"].to_csv(out_dir / "copy_trades.csv", index=False)
    if isinstance(summary.get("equity_df"), pd.DataFrame):
        summary["equity_df"].to_csv(out_dir / "equity_curve.csv", index=False)
    if isinstance(summary.get("monthly_df"), pd.DataFrame):
        summary["monthly_df"].to_csv(out_dir / "monthly_pnl.csv")
    serialisable = {
        k: v for k, v in summary.items() if not isinstance(v, pd.DataFrame)
    }
    (out_dir / "summary.json").write_text(json.dumps(serialisable, indent=2, default=str))
    print(f"\nartifacts -> {out_dir}/")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
