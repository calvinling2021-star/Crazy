"""Polymimic bootstrap: real Polymarket wallet candidate pool.

Source: https://github.com/twaite11/polymimic — an open-source copy-trading
project that pre-computed wallet PnL from Polymarket's Data API and committed
the aggregated results to their repo as CSVs.

What we use from it
-------------------
`polymarket/data/top_200_real_wallets.csv` is the top-200 wallets by total
PnL aggregated across all market_groups. Schema:

    user, total_pnl_usd, trade_count, market_groups_traded, primary_group

Range observed: $51K (#200) to $1.37M (#1). These are REAL Polymarket
addresses with REAL PnL — not synthetic.

What we CANNOT do with it
-------------------------
The polymimic repo only commits AGGREGATED PnL per (wallet, market_group),
not per-trade timestamps + prices. So we can't run a true copy-trading
backtest off this alone. What it gives us:

  * a real candidate pool to seed the simulator with;
  * calibration data for the synthetic skill / size distributions;
  * a way to show the user what the real PnL tail looks like.
"""
from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

DEFAULT_BOOTSTRAP = Path(__file__).parent.parent / "data" / "top_200_real_wallets.csv"


@dataclass
class RealWallet:
    wallet: str
    total_pnl_usd: float
    trade_count: int
    market_groups_traded: int
    primary_group: str


def load_real_wallets(path: Path | str = DEFAULT_BOOTSTRAP) -> list[RealWallet]:
    """Load the bootstrap CSV of real Polymarket whale wallets."""
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(
            f"{path} not found. Pull the branch — it should be at "
            f"polymarket/data/top_200_real_wallets.csv."
        )
    out: list[RealWallet] = []
    with path.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                out.append(
                    RealWallet(
                        wallet=row["user"].lower(),
                        total_pnl_usd=float(row["total_pnl_usd"]),
                        trade_count=int(row["trade_count"]),
                        market_groups_traded=int(row["market_groups_traded"]),
                        primary_group=row.get("primary_group", "other"),
                    )
                )
            except (KeyError, ValueError):
                continue
    return out


def distribution_summary(wallets: list[RealWallet]) -> dict[str, float | int | dict]:
    """Headline stats on the real-wallet distribution."""
    if not wallets:
        return {}
    pnls = sorted([w.total_pnl_usd for w in wallets])
    n = len(pnls)
    cats: dict[str, int] = {}
    for w in wallets:
        cats[w.primary_group] = cats.get(w.primary_group, 0) + 1
    return {
        "n": n,
        "top_pnl_usd": pnls[-1],
        "p99_pnl_usd": pnls[int(n * 0.99)],
        "p95_pnl_usd": pnls[int(n * 0.95)],
        "p50_pnl_usd": pnls[int(n * 0.50)],
        "p5_pnl_usd": pnls[int(n * 0.05)],
        "bottom_pnl_usd": pnls[0],
        "total_trade_count": sum(w.trade_count for w in wallets),
        "median_trade_count": sorted(w.trade_count for w in wallets)[n // 2],
        "primary_groups": dict(sorted(cats.items(), key=lambda kv: -kv[1])[:10]),
    }
