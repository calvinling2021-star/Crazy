"""CLI entrypoint.

Usage:
    python -m polymarket.main --window all --top 100 --capital 10000 \
        --sizing fraction_lead --fraction 0.01 --out results/

The CLI does three things:
  1. Pull the top-N profitable wallets from Polymarket's leaderboard.
  2. Page through each wallet's recent trades.
  3. Run the copy-trading simulator and print a summary.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from tabulate import tabulate

from .api import PolymarketClient
from .leaderboard import fetch_top_profitable_wallets
from .simulator import CopyTradingSimulator, SimConfig


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Polymarket copy-trading simulator")
    p.add_argument("--top", type=int, default=100, help="Top N wallets by PnL to copy")
    p.add_argument("--window", default="all", choices=["1d", "7d", "30d", "all"])
    p.add_argument("--capital", type=float, default=10_000.0)
    p.add_argument(
        "--sizing",
        default="fraction_lead",
        choices=["fixed_usd", "fraction_lead", "kelly_pnl"],
    )
    p.add_argument("--fixed-usd", type=float, default=100.0)
    p.add_argument("--fraction", type=float, default=0.01)
    p.add_argument("--fee-bps", type=float, default=20.0)
    p.add_argument("--slippage-bps", type=float, default=50.0)
    p.add_argument("--max-position-usd", type=float, default=1_000.0)
    p.add_argument("--max-concurrent", type=int, default=50)
    p.add_argument("--per-leader-daily-cap", type=float, default=2_000.0)
    p.add_argument("--min-leader-pnl", type=float, default=5_000.0)
    p.add_argument("--trades-per-wallet", type=int, default=500)
    p.add_argument("--out", default="polymarket/results", help="output directory")
    p.add_argument("--leaderboard-only", action="store_true", help="just print the leaderboard")
    p.add_argument("--log-level", default="INFO")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    client = PolymarketClient()
    ranked = fetch_top_profitable_wallets(client, n=args.top, window=args.window)

    if not ranked:
        print("Leaderboard returned no wallets — Polymarket data API may be unreachable.", file=sys.stderr)
        return 2

    rows = [
        [r.rank, r.wallet[:10] + "…", r.name or "-", f"${r.pnl_usd:,.0f}", f"${r.volume_usd:,.0f}", r.positions]
        for r in ranked[:25]
    ]
    print("\nTop 25 profitable wallets (window=%s)" % args.window)
    print(tabulate(rows, headers=["#", "wallet", "name", "PnL", "volume", "open pos"], tablefmt="github"))

    (out_dir / "leaderboard.json").write_text(json.dumps([r.to_dict() for r in ranked], indent=2))
    print(f"\nleaderboard saved -> {out_dir / 'leaderboard.json'}")

    if args.leaderboard_only:
        return 0

    print(f"\nfetching trade history for {len(ranked)} wallets…")
    wallet_trades: dict[str, list] = {}
    leader_pnls: dict[str, float] = {}
    for i, r in enumerate(ranked, start=1):
        try:
            wallet_trades[r.wallet] = client.all_trades(r.wallet, hard_cap=args.trades_per_wallet)
            leader_pnls[r.wallet] = r.pnl_usd
        except Exception as exc:
            logging.warning("failed to fetch trades for %s: %s", r.wallet, exc)
            continue
        if i % 10 == 0:
            print(f"  …{i}/{len(ranked)} wallets")

    cfg = SimConfig(
        starting_capital_usd=args.capital,
        sizing_mode=args.sizing,
        fixed_usd=args.fixed_usd,
        fraction=args.fraction,
        fee_bps=args.fee_bps,
        slippage_bps=args.slippage_bps,
        max_position_usd=args.max_position_usd,
        max_concurrent=args.max_concurrent,
        per_leader_daily_cap_usd=args.per_leader_daily_cap,
        min_leader_pnl_usd=args.min_leader_pnl,
    )
    sim = CopyTradingSimulator(cfg)
    summary = sim.run(wallet_trades, leader_pnls=leader_pnls)

    trades_df = summary.pop("trades_df")
    equity_df = summary.pop("equity_df")
    per_leader = summary.pop("per_leader")

    print("\n=== Simulation summary ===")
    print(
        tabulate(
            [[k, f"{v:,.2f}" if isinstance(v, (int, float)) else v] for k, v in summary.items()],
            tablefmt="github",
        )
    )

    if per_leader:
        top_contrib = sorted(
            per_leader.items(),
            key=lambda kv: kv[1]["realised_proceeds_usd"] - kv[1]["deployed_usd"],
            reverse=True,
        )[:10]
        print("\nTop 10 leader contributions (proceeds − deployed):")
        print(
            tabulate(
                [
                    [
                        w[:10] + "…",
                        s["trades"],
                        f"${s['deployed_usd']:,.0f}",
                        f"${s['realised_proceeds_usd']:,.0f}",
                        f"${s['realised_proceeds_usd'] - s['deployed_usd']:,.0f}",
                        f"${s['leader_lifetime_pnl_usd']:,.0f}",
                    ]
                    for w, s in top_contrib
                ],
                headers=["wallet", "trades", "deployed", "proceeds", "net", "leader PnL"],
                tablefmt="github",
            )
        )

    trades_path = out_dir / "copy_trades.csv"
    equity_path = out_dir / "equity_curve.csv"
    summary_path = out_dir / "summary.json"
    trades_df.to_csv(trades_path, index=False)
    equity_df.to_csv(equity_path, index=False)
    summary_path.write_text(json.dumps({**summary, "per_leader": per_leader}, indent=2, default=str))
    print(f"\nartifacts saved to {out_dir}/")
    print(f"  - {trades_path.name}")
    print(f"  - {equity_path.name}")
    print(f"  - {summary_path.name}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
