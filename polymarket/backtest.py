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
import random as _random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

import pandas as pd
from tabulate import tabulate

from .api import PolymarketClient
from .leaderboard import fetch_top_profitable_wallets
from .simulator import CopyTradingSimulator, SimConfig, _normalise_trade, _parse_ts

log = logging.getLogger(__name__)


@dataclass
class BacktestConfig:
    candidate_pool: int = 50
    top_k: int = 15
    selection_months: int = 6
    validation_months: int = 6
    trades_per_wallet: int = 2000
    capital_usd: float = 10_000.0
    sim: SimConfig | None = None
    # Which Polymarket leaderboard ranking seeds the candidate pool.
    # 'pnl'    : current behaviour — top wallets by lifetime PnL. Practical for
    #            a live trader, but look-ahead biased in a backtest because
    #            "lifetime" includes the validation window.
    # 'volume' : top by lifetime traded volume. Volume is much less correlated
    #            with the validation-period outcome, so the bias is far weaker
    #            (volume accumulates regardless of whether trades won).
    # 'random' : shuffle the leaderboard output. Honest baseline for synthetic
    #            tests; for live data, not useful unless you have an alternate
    #            wallet enumeration.
    pool_rank_by: Literal["pnl", "volume", "random"] = "pnl"
    pool_random_seed: int = 0
    # How to rank wallets inside the candidate pool by selection-window
    # behaviour. 'pnl' = absolute selection PnL (default, current behaviour).
    # 'roic' = pnl / capital_deployed — favours efficient bettors over whales.
    # 'pnl_per_trade' = pnl / trade_count — favours high-edge-per-trade leaders.
    leader_rank_metric: Literal["pnl", "roic", "pnl_per_trade"] = "pnl"
    min_selection_trades: int = 5  # ignore wallets with fewer trades in selection window
    min_selection_capital_usd: float = 100.0  # min $ deployed to be eligible


def _estimate_wallet_stats(
    trades: list[dict[str, Any]],
    resolutions: dict[str, dict[str, float]],
    window_end: datetime,
) -> tuple[float, float, int]:
    """Returns (pnl, cost_basis, num_trades) over the trade set.

    pnl = proceeds - cost + mark-to-resolution of open positions.
    cost_basis = total $ deployed on BUYs; used to compute return-on-capital.
    """
    cost = 0.0
    proceeds = 0.0
    n_trades = 0
    positions: dict[tuple[str, str], tuple[float, float]] = {}
    for raw in trades:
        norm = _normalise_trade(raw, "x")
        if norm is None:
            continue
        n_trades += 1
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
            payoff = 0.5
        mark += sh * payoff
    return proceeds - cost + mark, cost, n_trades


def _estimate_wallet_pnl(trades, resolutions, window_end):
    return _estimate_wallet_stats(trades, resolutions, window_end)[0]


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

    log.info("seeding candidate pool: %d wallets, ranked by %s", cfg.candidate_pool, cfg.pool_rank_by)
    if cfg.pool_rank_by == "pnl":
        candidates = fetch_top_profitable_wallets(client, n=cfg.candidate_pool, window="all")
    elif cfg.pool_rank_by == "volume":
        # Pull a wider top-by-volume set, then slice. Volume-ranked pools have
        # weaker look-ahead bias because volume accrues regardless of P/L.
        from .leaderboard import _coerce_float
        raw = client.leaderboard(window="all", metric="volume", limit=cfg.candidate_pool)
        from .leaderboard import WalletRank
        candidates = [
            WalletRank(
                rank=i + 1,
                wallet=(row.get("proxyWallet") or row.get("address") or row.get("user") or "").lower(),
                name=row.get("name") or row.get("pseudonym"),
                pnl_usd=_coerce_float(row.get("pnl") or row.get("profit")),
                volume_usd=_coerce_float(row.get("volume")),
                positions=int(_coerce_float(row.get("positions"))),
                window="all",
            )
            for i, row in enumerate(raw)
            if row.get("proxyWallet") or row.get("address") or row.get("user")
        ][: cfg.candidate_pool]
    elif cfg.pool_rank_by == "random":
        candidates = fetch_top_profitable_wallets(client, n=cfg.candidate_pool * 2, window="all")
        rng = _random.Random(cfg.pool_random_seed)
        rng.shuffle(candidates)
        candidates = candidates[: cfg.candidate_pool]
    else:
        raise ValueError(f"unknown pool_rank_by: {cfg.pool_rank_by}")

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
    selection_score: dict[str, float] = {}
    for wallet, trades in trades_by_wallet.items():
        sel_trades = [t for t in trades if _parse_ts(t.get("timestamp") or t.get("ts") or t.get("time")) < val_start]
        if not sel_trades:
            continue
        pnl, cost, n = _estimate_wallet_stats(sel_trades, resolutions, val_start)
        if n < cfg.min_selection_trades or cost < cfg.min_selection_capital_usd:
            continue
        selection_pnl[wallet] = pnl
        if cfg.leader_rank_metric == "roic":
            selection_score[wallet] = pnl / max(cost, 1.0)
        elif cfg.leader_rank_metric == "pnl_per_trade":
            selection_score[wallet] = pnl / max(n, 1)
        else:
            selection_score[wallet] = pnl

    ranked = sorted(selection_score.items(), key=lambda kv: kv[1], reverse=True)
    top = {w: selection_pnl[w] for w, _ in ranked[: cfg.top_k]}
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


def run_rolling_backtest(
    client,
    cfg: BacktestConfig,
    selection_months: int = 6,
    validation_months: int = 1,
    n_windows: int = 6,
    step_months: int = 1,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Rolling walk-forward: run the backtest across multiple disjoint
    validation windows and aggregate the metrics. A single 6/6 split is one
    data point; rolling 6/1 over six months tells you whether the strategy
    is stable through time."""
    import statistics as _stats

    now = now or datetime.now(tz=timezone.utc)
    runs: list[dict[str, Any]] = []
    for i in range(n_windows):
        offset = timedelta(days=30 * step_months * i)
        window_cfg = BacktestConfig(
            candidate_pool=cfg.candidate_pool, top_k=cfg.top_k,
            selection_months=selection_months, validation_months=validation_months,
            trades_per_wallet=cfg.trades_per_wallet, capital_usd=cfg.capital_usd, sim=cfg.sim,
            pool_rank_by=cfg.pool_rank_by, pool_random_seed=cfg.pool_random_seed + i,
            leader_rank_metric=cfg.leader_rank_metric,
            min_selection_trades=cfg.min_selection_trades,
            min_selection_capital_usd=cfg.min_selection_capital_usd,
        )
        try:
            summary = run_walk_forward(client, window_cfg, now=now - offset)
            runs.append({
                "window_offset_months": step_months * i,
                "return_pct": summary["return_pct"],
                "sharpe_annualised": summary["sharpe_annualised"],
                "max_drawdown_pct": summary["max_drawdown_pct"],
                "win_rate_pct": summary["win_rate_pct"],
                "num_copy_trades": summary["num_copy_trades"],
                "selection_wallets": list(summary["selection_pnl"].keys()),
            })
        except Exception as exc:
            log.warning("rolling window %d failed: %s", i, exc)

    if not runs:
        return {"runs": [], "error": "no successful windows"}

    returns = [r["return_pct"] for r in runs]
    sharpes = [r["sharpe_annualised"] for r in runs]
    dds = [r["max_drawdown_pct"] for r in runs]
    # Wallet stability: average Jaccard similarity between consecutive selection sets.
    overlaps = []
    for a, b in zip(runs[:-1], runs[1:]):
        sa, sb = set(a["selection_wallets"]), set(b["selection_wallets"])
        if sa or sb:
            overlaps.append(len(sa & sb) / len(sa | sb))
    wallet_stability = _stats.mean(overlaps) if overlaps else 0.0

    return {
        "n_windows": len(runs),
        "selection_months": selection_months,
        "validation_months": validation_months,
        "step_months": step_months,
        "mean_return_pct": _stats.mean(returns),
        "stdev_return_pct": _stats.stdev(returns) if len(returns) > 1 else 0.0,
        "mean_sharpe": _stats.mean(sharpes),
        "mean_max_dd_pct": _stats.mean(dds),
        "worst_max_dd_pct": min(dds),
        "positive_windows": sum(1 for r in returns if r > 0),
        "wallet_set_stability": wallet_stability,  # 0 = full rotation each step, 1 = no rotation
        "runs": runs,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Walk-forward 12-month backtest")
    p.add_argument("--candidate-pool", type=int, default=50,
                   help="size of the leaderboard slice to consider (default 50)")
    p.add_argument("--top-k", type=int, default=15,
                   help="wallets to copy after re-ranking the pool by selection-window PnL (default 15)")
    p.add_argument("--pool-rank-by", default="pnl", choices=["pnl", "volume", "random"],
                   help="how to seed the candidate pool; 'volume' or 'random' weakens look-ahead bias")
    p.add_argument("--pool-random-seed", type=int, default=0)
    p.add_argument("--selection-months", type=int, default=6)
    p.add_argument("--validation-months", type=int, default=6)
    p.add_argument("--trades-per-wallet", type=int, default=2000)
    p.add_argument("--capital", type=float, default=10_000.0)
    p.add_argument("--sizing", default="fraction_lead", choices=["fixed_usd", "fraction_lead", "kelly_pnl"])
    p.add_argument("--fixed-usd", type=float, default=100.0)
    p.add_argument("--fraction", type=float, default=0.02)
    p.add_argument("--fee-bps", type=float, default=20.0)
    p.add_argument("--slippage-bps", type=float, default=50.0)
    p.add_argument("--execution-mode", default="market", choices=["market", "limit"],
                   help="'limit' fills at leader_price with `--limit-fill-prob`, else skips (no slippage)")
    p.add_argument("--limit-fill-prob", type=float, default=0.6)
    p.add_argument("--execution-seed", type=int, default=0)
    p.add_argument("--min-consensus-leaders", type=int, default=1,
                   help="only copy when N distinct leaders BUY same market+outcome within window")
    p.add_argument("--consensus-window-hours", type=float, default=24.0)
    p.add_argument("--min-price", type=float, default=0.05)
    p.add_argument("--max-price", type=float, default=0.95)
    p.add_argument("--stop-loss-pct", type=float, default=None,
                   help="close position if marked-to-last drops this % below cost basis (e.g. 0.25)")
    p.add_argument("--profit-take-pct", type=float, default=None,
                   help="close position if marked-to-last rises this % above cost basis (e.g. 0.40)")
    p.add_argument("--conviction-size-step", type=float, default=0.0,
                   help="scale copy size by (1 + extra_leaders * step) when more than min consensus agree")
    p.add_argument("--conviction-size-max", type=float, default=3.0)
    p.add_argument("--leader-rank-metric", default="pnl", choices=["pnl", "roic", "pnl_per_trade"],
                   help="how to rank candidate pool by selection-window behaviour")
    p.add_argument("--min-selection-trades", type=int, default=5)
    p.add_argument("--min-selection-capital", type=float, default=100.0)
    p.add_argument("--max-position-usd", type=float, default=1_000.0)
    p.add_argument("--max-concurrent", type=int, default=50)
    p.add_argument("--per-leader-daily-cap", type=float, default=2_000.0)
    p.add_argument("--rolling", action="store_true",
                   help="run a rolling walk-forward (multiple disjoint validation windows)")
    p.add_argument("--rolling-windows", type=int, default=6)
    p.add_argument("--rolling-step-months", type=int, default=1)
    p.add_argument("--rolling-val-months", type=int, default=1)
    p.add_argument("--rolling-sel-months", type=int, default=6)
    p.add_argument("--out", default="polymarket/results/backtest")
    p.add_argument("--synthetic", action="store_true", help="run on synthetic data (no network)")
    p.add_argument("--cache", default=None,
                   help="path to a JSON file produced by `polymarket.fetch` — replay without network")
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--log-level", default="INFO")
    return p.parse_args(argv)


def _print_rolling_summary(summary: dict[str, Any]) -> None:
    if not summary.get("runs"):
        print("\n=== Rolling backtest: no successful windows ===")
        return
    print(
        f"\n=== Rolling walk-forward: {summary['n_windows']} windows "
        f"({summary['selection_months']}mo sel / {summary['validation_months']}mo val, "
        f"step={summary['step_months']}mo) ==="
    )
    print(
        tabulate(
            [
                ["mean return %",         f"{summary['mean_return_pct']:>+8.2f}"],
                ["stdev return %",        f"{summary['stdev_return_pct']:>8.2f}"],
                ["mean Sharpe",           f"{summary['mean_sharpe']:>8.2f}"],
                ["mean max DD %",         f"{summary['mean_max_dd_pct']:>+8.2f}"],
                ["worst max DD %",        f"{summary['worst_max_dd_pct']:>+8.2f}"],
                ["positive windows",      f"{summary['positive_windows']}/{summary['n_windows']}"],
                ["wallet set stability",  f"{summary['wallet_set_stability']:>8.3f}"],
            ],
            tablefmt="github",
        )
    )
    rows = [
        [r["window_offset_months"], f"{r['return_pct']:>+6.2f}", f"{r['sharpe_annualised']:>+5.2f}",
         f"{r['max_drawdown_pct']:>+6.2f}", f"{r['win_rate_pct']:>5.1f}", r["num_copy_trades"]]
        for r in summary["runs"]
    ]
    print("\nPer-window detail:")
    print(tabulate(rows, headers=["mo offset", "ret %", "sharpe", "DD %", "win %", "trades"], tablefmt="github"))


def _print_summary(summary: dict[str, Any]) -> None:
    if "runs" in summary:
        _print_rolling_summary(summary)
        return
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
        execution_mode=args.execution_mode,
        limit_fill_probability=args.limit_fill_prob,
        execution_seed=args.execution_seed,
        min_consensus_leaders=args.min_consensus_leaders,
        consensus_window_seconds=int(args.consensus_window_hours * 3600),
        min_price=args.min_price,
        max_price=args.max_price,
        stop_loss_pct=args.stop_loss_pct,
        profit_take_pct=args.profit_take_pct,
        conviction_size_step=args.conviction_size_step,
        conviction_size_max=args.conviction_size_max,
        max_position_usd=args.max_position_usd,
        max_concurrent=args.max_concurrent,
        per_leader_daily_cap_usd=args.per_leader_daily_cap,
        min_leader_pnl_usd=0.0,  # selection already filters by PnL
    )
    cfg = BacktestConfig(
        pool_rank_by=args.pool_rank_by,
        pool_random_seed=args.pool_random_seed,
        leader_rank_metric=args.leader_rank_metric,
        min_selection_trades=args.min_selection_trades,
        min_selection_capital_usd=args.min_selection_capital,
        candidate_pool=args.candidate_pool,
        top_k=args.top_k,
        selection_months=args.selection_months,
        validation_months=args.validation_months,
        trades_per_wallet=args.trades_per_wallet,
        capital_usd=args.capital,
        sim=sim_cfg,
    )

    # Resolve client (synthetic / cache / live).
    if args.synthetic:
        from .synthetic import _generate_population, _FakeClient

        wallets, trades, markets = _generate_population(
            n_wallets=max(args.candidate_pool, 200), n_markets=400,
            horizon_days=30 * (cfg.selection_months + cfg.validation_months) + 30,
            seed=args.seed,
        )
        client = _FakeClient(wallets, trades, markets)
    elif args.cache:
        from .cache import load_cached_client
        client = load_cached_client(args.cache)
    else:
        client = PolymarketClient()

    try:
        if args.rolling:
            summary = run_rolling_backtest(
                client, cfg,
                selection_months=args.rolling_sel_months,
                validation_months=args.rolling_val_months,
                n_windows=args.rolling_windows,
                step_months=args.rolling_step_months,
            )
        else:
            summary = run_walk_forward(client, cfg)
    except RuntimeError as exc:
        if not args.synthetic and not args.cache:
            print(f"\nBacktest failed against live Polymarket API: {exc}", file=sys.stderr)
            print(
                "Hint: pre-fetch with `python -m polymarket.fetch --top 200 --out cache.json`,"
                " then re-run with `--cache cache.json`. Or use `--synthetic` to validate the pipeline.",
                file=sys.stderr,
            )
            return 2
        raise

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
