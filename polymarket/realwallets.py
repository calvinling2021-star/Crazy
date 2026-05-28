"""CLI: inspect the real Polymarket wallet bootstrap dataset.

  python -m polymarket.realwallets             # show distribution
  python -m polymarket.realwallets --calibrate # compare to synthetic
"""
from __future__ import annotations

import argparse
import statistics
import sys

from tabulate import tabulate

from .sources.polymimic import distribution_summary, load_real_wallets


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--path", default=None, help="override bootstrap CSV path")
    p.add_argument("--calibrate", action="store_true",
                   help="compare real distribution to current synthetic generator")
    p.add_argument("--top", type=int, default=20, help="how many top wallets to print")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    wallets = load_real_wallets(args.path) if args.path else load_real_wallets()
    summary = distribution_summary(wallets)

    print(f"\n=== Real Polymarket wallet bootstrap ({summary['n']} wallets) ===")
    print(
        tabulate(
            [
                ["#1 PnL",        f"${summary['top_pnl_usd']:>14,.0f}"],
                ["p99 PnL",       f"${summary['p99_pnl_usd']:>14,.0f}"],
                ["p95 PnL",       f"${summary['p95_pnl_usd']:>14,.0f}"],
                ["median PnL",    f"${summary['p50_pnl_usd']:>14,.0f}"],
                ["p5 PnL",        f"${summary['p5_pnl_usd']:>14,.0f}"],
                ["#200 PnL",      f"${summary['bottom_pnl_usd']:>14,.0f}"],
                ["median trades", f"{summary['median_trade_count']:>15,d}"],
                ["total trades",  f"{summary['total_trade_count']:>15,d}"],
            ],
            tablefmt="github",
        )
    )

    print("\nTop primary market_groups:")
    print(tabulate(list(summary["primary_groups"].items()), headers=["group", "count"], tablefmt="github"))

    print(f"\nTop {args.top} wallets:")
    rows = [
        [i + 1, w.wallet[:10] + "…", f"${w.total_pnl_usd:>10,.0f}", w.trade_count,
         w.market_groups_traded, w.primary_group]
        for i, w in enumerate(wallets[: args.top])
    ]
    print(tabulate(rows, headers=["#", "wallet", "pnl", "trades", "groups", "primary"], tablefmt="github"))

    if args.calibrate:
        from .synthetic import _generate_population

        print("\n=== Synthetic calibration (seed=42, 1000 wallets, heavy_tail) ===")
        synth_wallets, _, _ = _generate_population(
            n_wallets=1000, n_markets=400, horizon_days=400, seed=42,
        )
        synth_pnls = sorted([w.pnl_usd for w in synth_wallets[:200]])
        real_pnls = sorted([w.total_pnl_usd for w in wallets])
        rows = []
        for label, idx in [("#1", -1), ("p95", -10), ("median", 100), ("p5", 10), ("#200", 0)]:
            rows.append([label, f"${real_pnls[idx]:>12,.0f}", f"${synth_pnls[idx]:>12,.0f}",
                         f"{synth_pnls[idx] / max(abs(real_pnls[idx]), 1):>6.2f}x"])
        print(tabulate(rows, headers=["pctile", "real PnL", "synthetic PnL", "synth/real"], tablefmt="github"))

        real_total = sum(real_pnls)
        synth_total = sum(synth_pnls)
        real_top10_share = sum(real_pnls[-20:]) / real_total if real_total else 0
        synth_top10_share = sum(synth_pnls[-20:]) / synth_total if synth_total else 0
        print(f"\nReal:      top-10% wallets earn {real_top10_share:.1%} of total PnL")
        print(f"Synthetic: top-10% wallets earn {synth_top10_share:.1%} of total PnL")
        print("(if these differ a lot, the synthetic heavy-tail params need tuning)")

    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
