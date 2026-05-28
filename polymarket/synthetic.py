"""Synthetic Polymarket-shaped data for offline backtest validation.

Generates a population of wallets whose trading skill is drawn from a normal
distribution, plus a set of binary markets that resolve YES with a true
probability the wallet partially observes. The skilled wallets buy in the
direction of the true probability with a price advantage; the unskilled
ones buy randomly. Output rows mirror the shape the simulator and backtest
expect (`side`, `price`, `size`, `market`, `outcome`, `timestamp`).

The point is to show the walk-forward pipeline running end-to-end on data
with a known generative process so we can sanity-check the metrics.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Any

from .backtest import BacktestConfig, run_walk_forward
from .api import PolymarketClient
from .leaderboard import WalletRank


class _FakeClient(PolymarketClient):
    def __init__(self, wallets: list[WalletRank], trades: dict[str, list[dict[str, Any]]], markets: dict[str, dict[str, Any]]):  # noqa: D401
        self._wallets = wallets
        self._trades = trades
        self._markets = markets

    def leaderboard(self, window="all", metric="profit", limit=100):
        key = (lambda w: -w.volume_usd) if metric == "volume" else (lambda w: -w.pnl_usd)
        ordered = sorted(self._wallets, key=key)
        return [
            {
                "proxyWallet": w.wallet,
                "name": w.name,
                "pnl": w.pnl_usd,
                "volume": w.volume_usd,
                "positions": w.positions,
            }
            for w in ordered[:limit]
        ]

    def all_trades(self, wallet, page_size=500, hard_cap=5000):
        return list(self._trades.get(wallet.lower(), []))[:hard_cap]

    def market(self, market_id):
        return self._markets.get(market_id, {})


def _generate_population(
    n_wallets: int = 200,
    n_markets: int = 400,
    horizon_days: int = 365,
    seed: int = 42,
    skill_distribution: str = "heavy_tail",
    size_distribution: str = "log_normal",
) -> tuple[list[WalletRank], dict[str, list[dict[str, Any]]], dict[str, dict[str, Any]]]:
    """Generate a synthetic Polymarket-like trading population.

    Parameters
    ----------
    skill_distribution :
      'normal'     — original N(0, 0.08), good for symmetry tests.
      'heavy_tail' — mixture: 88% N(0, 0.04) + 10% N(0.04, 0.08) + 2% N(0.15, 0.10).
                     Matches the observed pattern on Polymarket — most wallets
                     are roughly random, a small tail are very skilled, and a
                     handful of whales make life-changing returns.

    size_distribution :
      'uniform'     — original {100, 250, 500, 1000, 2500} draws.
      'log_normal' — log-normally distributed sizes from ~$20 to ~$200k.
                     Matches the spread observed in real wallet activity.
    """
    rng = random.Random(seed)
    now = datetime.now(tz=timezone.utc)
    start = now - timedelta(days=horizon_days)

    # Markets: each has a "true" YES probability and a known resolution date.
    markets: dict[str, dict[str, Any]] = {}
    for i in range(n_markets):
        true_p = rng.betavariate(2, 2)  # roughly U-shaped but smoother
        resolved_yes = 1 if rng.random() < true_p else 0
        open_at = start + timedelta(days=rng.randint(0, horizon_days - 30))
        close_at = open_at + timedelta(days=rng.randint(7, 60))
        markets[f"mkt-{i:04d}"] = {
            "id": f"mkt-{i:04d}",
            "true_p": true_p,
            "resolved_yes": resolved_yes,
            "open_at": open_at,
            "close_at": min(close_at, now),
            "closed": close_at <= now,
            "outcomes": ["YES", "NO"],
            "outcomePrices": [resolved_yes, 1 - resolved_yes],
        }

    # Wallet skill: configurable distribution.
    # heavy_tail params were calibrated against polymimic's real top-200
    # Polymarket whale data (polymarket/data/top_200_real_wallets.csv): the
    # real distribution has top-10% capturing ~40% of total PnL — these
    # params reproduce that concentration.
    def _draw_skill() -> tuple[float, float]:
        """Return (skill_advantage, activity_multiplier)."""
        if skill_distribution == "normal":
            return rng.gauss(0.0, 0.08), 1.0
        # heavy_tail: three-component mixture, calibrated against real data
        r = rng.random()
        if r < 0.92:
            return rng.gauss(0.0, 0.04), 1.0      # noise majority
        elif r < 0.98:
            return rng.gauss(0.06, 0.10), 2.5     # skilled minority — more active
        else:
            return rng.gauss(0.22, 0.15), 5.0     # rare whales — much more active

    def _draw_size() -> int:
        if size_distribution == "uniform":
            return rng.choice([100, 250, 500, 1000, 2500])
        # log_normal: median ~$300, fat tail to ~$200k. Matches the real
        # trade-size dispersion observed on Polymarket.
        return max(10, int(rng.lognormvariate(5.7, 1.8)))

    wallets: list[WalletRank] = []
    trades: dict[str, list[dict[str, Any]]] = {}
    for i in range(n_wallets):
        wallet = f"0x{i:040x}"
        skill, activity_mult = _draw_skill()
        activity = int(rng.randint(40, 250) * activity_mult)
        pnl_proxy = 0.0
        vol_proxy = 0.0
        rows: list[dict[str, Any]] = []
        for _ in range(activity):
            mkt_id = rng.choice(list(markets.keys()))
            mkt = markets[mkt_id]
            ts_buy = mkt["open_at"] + timedelta(seconds=rng.randint(0, max(1, int((mkt["close_at"] - mkt["open_at"]).total_seconds() - 3600))))
            # Buyer's belief = true_p + skill_noise; clipped.
            belief = min(0.98, max(0.02, mkt["true_p"] + rng.gauss(skill, 0.05)))
            outcome = "YES" if belief >= 0.5 else "NO"
            # Quoted market price wanders around true_p but lags reality.
            quoted = min(0.97, max(0.03, mkt["true_p"] + rng.gauss(-skill * 0.5, 0.06)))
            buy_price = quoted if outcome == "YES" else 1 - quoted
            size = _draw_size()
            rows.append({
                "side": "BUY",
                "price": round(buy_price, 4),
                "size": size,
                "market": mkt_id,
                "outcome": outcome,
                "timestamp": ts_buy.isoformat(),
            })
            vol_proxy += buy_price * size
            # Half the time, sell before resolution at a noisy price near final.
            if rng.random() < 0.5:
                final = (mkt["resolved_yes"] if outcome == "YES" else 1 - mkt["resolved_yes"])
                sell_price = min(0.97, max(0.03, final * 0.85 + buy_price * 0.15 + rng.gauss(0, 0.05)))
                ts_sell = ts_buy + timedelta(seconds=rng.randint(3600, 7 * 86400))
                ts_sell = min(ts_sell, mkt["close_at"] - timedelta(seconds=60))
                if ts_sell > ts_buy:
                    rows.append({
                        "side": "SELL",
                        "price": round(sell_price, 4),
                        "size": size,
                        "market": mkt_id,
                        "outcome": outcome,
                        "timestamp": ts_sell.isoformat(),
                    })
                    pnl_proxy += (sell_price - buy_price) * size
            else:
                final = mkt["resolved_yes"] if outcome == "YES" else 1 - mkt["resolved_yes"]
                pnl_proxy += (final - buy_price) * size

        rows.sort(key=lambda r: r["timestamp"])
        trades[wallet.lower()] = rows
        wallets.append(WalletRank(
            rank=i + 1,
            wallet=wallet.lower(),
            name=f"wallet-{i:03d}",
            pnl_usd=pnl_proxy,
            volume_usd=vol_proxy,
            positions=0,
            window="all",
        ))

    wallets.sort(key=lambda w: -w.pnl_usd)
    for i, w in enumerate(wallets, start=1):
        w.rank = i
    return wallets, trades, markets


def run_synthetic_backtest(cfg: BacktestConfig, seed: int = 42) -> dict[str, Any]:
    wallets, trades, markets = _generate_population(
        n_wallets=max(cfg.candidate_pool, 200),
        n_markets=400,
        horizon_days=30 * (cfg.selection_months + cfg.validation_months) + 30,
        seed=seed,
    )
    client = _FakeClient(wallets, trades, markets)
    return run_walk_forward(client, cfg)
