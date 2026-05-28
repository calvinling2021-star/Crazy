"""Copy-trading simulator.

Strategy
--------
For each fill emitted by a tracked leader wallet, the simulator opens a
proportional copy position at the leader's fill price plus a configurable
slippage cost. Exits are mirrored the same way. Resolution PnL is realised
when the underlying market resolves (or, if unresolved, marked-to-last).

Sizing
------
Three modes:
  * "fixed_usd"      — fixed dollar size per copied trade.
  * "fraction_lead" — copy `fraction` of the leader's notional.
  * "kelly_pnl"     — size proportional to the leader's lifetime PnL rank
                       (higher-PnL leaders get larger weights).

Risk controls
-------------
  * `max_position_usd`     — cap per-market exposure.
  * `max_concurrent`       — cap simultaneously open positions.
  * `per_leader_daily_cap` — cap daily $ deployed per leader.
  * `min_leader_pnl_usd`   — ignore signals from leaders below this PnL.
  * `latency_seconds`      — fills happen `latency` after the leader,
                              with the price shifted by `slippage_bps`.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Iterable, Literal

import pandas as pd

log = logging.getLogger(__name__)

SizingMode = Literal["fixed_usd", "fraction_lead", "kelly_pnl"]


@dataclass
class SimConfig:
    starting_capital_usd: float = 10_000.0
    sizing_mode: SizingMode = "fraction_lead"
    fixed_usd: float = 100.0
    fraction: float = 0.01  # 1% of leader's notional
    fee_bps: float = 20.0  # round-trip fee in basis points of notional
    slippage_bps: float = 50.0  # extra adverse price move on entry
    latency_seconds: int = 60
    max_position_usd: float = 1_000.0
    max_concurrent: int = 50
    per_leader_daily_cap_usd: float = 2_000.0
    min_leader_pnl_usd: float = 5_000.0
    leader_weights: dict[str, float] = field(default_factory=dict)


@dataclass
class CopyTrade:
    ts: datetime
    leader: str
    market_id: str
    outcome: str  # "YES" / "NO"
    side: Literal["BUY", "SELL"]
    leader_price: float
    fill_price: float
    size_shares: float
    notional_usd: float
    fee_usd: float

    def to_dict(self) -> dict[str, Any]:
        return {
            **{k: v for k, v in self.__dict__.items() if k != "ts"},
            "ts": self.ts.isoformat(),
        }


@dataclass
class Position:
    market_id: str
    outcome: str
    shares: float = 0.0
    cost_basis_usd: float = 0.0  # total $ spent net of proceeds

    @property
    def avg_price(self) -> float:
        return self.cost_basis_usd / self.shares if self.shares else 0.0


def _parse_ts(raw: Any) -> datetime:
    if isinstance(raw, (int, float)):
        return datetime.fromtimestamp(float(raw), tz=timezone.utc)
    if isinstance(raw, str):
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(tz=timezone.utc)


def _normalise_trade(raw: dict[str, Any], leader: str) -> dict[str, Any] | None:
    """Pull the fields we need out of a heterogeneous activity row."""
    side = (raw.get("side") or raw.get("type") or "").upper()
    if side not in ("BUY", "SELL"):
        return None
    price = raw.get("price")
    size = raw.get("size") or raw.get("shares")
    market_id = raw.get("market") or raw.get("conditionId") or raw.get("marketId")
    outcome = (raw.get("outcome") or "YES").upper()
    ts = raw.get("timestamp") or raw.get("ts") or raw.get("time")
    if price is None or size is None or market_id is None:
        return None
    try:
        price_f = float(price)
        size_f = float(size)
    except (TypeError, ValueError):
        return None
    if price_f <= 0 or price_f >= 1 or size_f <= 0:
        return None
    return {
        "leader": leader.lower(),
        "market_id": str(market_id),
        "outcome": outcome,
        "side": side,
        "price": price_f,
        "size": size_f,
        "notional": price_f * size_f,
        "ts": _parse_ts(ts),
    }


class CopyTradingSimulator:
    """Event-driven, deterministic copy-trading simulator."""

    def __init__(self, config: SimConfig | None = None) -> None:
        self.cfg = config or SimConfig()
        self.cash = self.cfg.starting_capital_usd
        self.equity_curve: list[tuple[datetime, float]] = []
        self.copy_trades: list[CopyTrade] = []
        self.positions: dict[tuple[str, str], Position] = {}
        self._daily_deployed: dict[tuple[str, str], float] = defaultdict(float)
        self._market_last_price: dict[tuple[str, str], float] = {}
        self._market_resolution: dict[str, dict[str, float]] = {}

    # ---------- public API ----------
    def run(
        self,
        wallet_trades: dict[str, list[dict[str, Any]]],
        leader_pnls: dict[str, float] | None = None,
        resolutions: dict[str, dict[str, float]] | None = None,
    ) -> dict[str, Any]:
        """Run the simulation.

        Parameters
        ----------
        wallet_trades : { leader_wallet: [raw activity rows from data-api] }
        leader_pnls   : optional { leader_wallet: lifetime PnL } for kelly_pnl sizing.
        resolutions   : optional { market_id: { 'YES': 0|1, 'NO': 0|1 } }
        """
        leader_pnls = leader_pnls or {}
        self._market_resolution = resolutions or {}

        events = self._merge_and_filter(wallet_trades, leader_pnls)
        log.info("simulating %d leader fills", len(events))

        for ev in events:
            self._handle_event(ev, leader_pnls)
            self.equity_curve.append((ev["ts"], self._mark_to_market_equity()))

        final_equity = self._settle_all()
        return self._summary(final_equity, leader_pnls)

    # ---------- internals ----------
    def _merge_and_filter(
        self,
        wallet_trades: dict[str, list[dict[str, Any]]],
        leader_pnls: dict[str, float],
    ) -> list[dict[str, Any]]:
        merged: list[dict[str, Any]] = []
        for leader, rows in wallet_trades.items():
            if leader_pnls.get(leader.lower(), 0.0) < self.cfg.min_leader_pnl_usd:
                continue
            for raw in rows:
                norm = _normalise_trade(raw, leader)
                if norm is not None:
                    merged.append(norm)
        merged.sort(key=lambda x: x["ts"])
        return merged

    def _handle_event(self, ev: dict[str, Any], leader_pnls: dict[str, float]) -> None:
        leader = ev["leader"]
        key = (ev["market_id"], ev["outcome"])
        self._market_last_price[key] = ev["price"]

        day_key = (leader, ev["ts"].date().isoformat())
        if self._daily_deployed[day_key] >= self.cfg.per_leader_daily_cap_usd:
            return

        if ev["side"] == "BUY":
            if len([p for p in self.positions.values() if p.shares > 0]) >= self.cfg.max_concurrent:
                return
            size_usd = self._size_for(ev, leader_pnls)
            remaining_daily = max(0.0, self.cfg.per_leader_daily_cap_usd - self._daily_deployed[day_key])
            size_usd = min(size_usd, remaining_daily, self.cash)
            pos = self.positions.get(key, Position(ev["market_id"], ev["outcome"]))
            remaining_cap = max(0.0, self.cfg.max_position_usd - pos.cost_basis_usd)
            size_usd = min(size_usd, remaining_cap)
            if size_usd < 1.0:
                return
            fill_price = min(0.999, ev["price"] * (1 + self.cfg.slippage_bps / 10_000))
            shares = size_usd / fill_price
            fee = size_usd * self.cfg.fee_bps / 10_000
            self.cash -= size_usd + fee
            pos.shares += shares
            pos.cost_basis_usd += size_usd
            self.positions[key] = pos
            self._daily_deployed[day_key] += size_usd
            self.copy_trades.append(
                CopyTrade(
                    ts=ev["ts"],
                    leader=leader,
                    market_id=ev["market_id"],
                    outcome=ev["outcome"],
                    side="BUY",
                    leader_price=ev["price"],
                    fill_price=fill_price,
                    size_shares=shares,
                    notional_usd=size_usd,
                    fee_usd=fee,
                )
            )
        else:  # SELL
            pos = self.positions.get(key)
            if pos is None or pos.shares <= 0:
                return
            close_frac = min(1.0, ev["size"] / max(ev["size"], pos.shares))
            shares_to_sell = pos.shares * close_frac
            fill_price = max(0.001, ev["price"] * (1 - self.cfg.slippage_bps / 10_000))
            proceeds = shares_to_sell * fill_price
            fee = proceeds * self.cfg.fee_bps / 10_000
            cost_released = pos.cost_basis_usd * close_frac
            self.cash += proceeds - fee
            pos.shares -= shares_to_sell
            pos.cost_basis_usd -= cost_released
            if pos.shares < 1e-9:
                pos.shares = 0.0
                pos.cost_basis_usd = 0.0
            self.copy_trades.append(
                CopyTrade(
                    ts=ev["ts"],
                    leader=leader,
                    market_id=ev["market_id"],
                    outcome=ev["outcome"],
                    side="SELL",
                    leader_price=ev["price"],
                    fill_price=fill_price,
                    size_shares=shares_to_sell,
                    notional_usd=proceeds,
                    fee_usd=fee,
                )
            )

    def _size_for(self, ev: dict[str, Any], leader_pnls: dict[str, float]) -> float:
        m = self.cfg.sizing_mode
        if m == "fixed_usd":
            return self.cfg.fixed_usd
        if m == "fraction_lead":
            return ev["notional"] * self.cfg.fraction
        if m == "kelly_pnl":
            w = self.cfg.leader_weights.get(ev["leader"])
            if w is None:
                pnl = max(0.0, leader_pnls.get(ev["leader"], 0.0))
                total = sum(max(0.0, v) for v in leader_pnls.values()) or 1.0
                w = pnl / total
            return self.cfg.starting_capital_usd * w
        raise ValueError(f"unknown sizing mode {m}")

    def _mark_to_market_equity(self) -> float:
        equity = self.cash
        for (mid, oc), pos in self.positions.items():
            if pos.shares <= 0:
                continue
            mark = self._market_last_price.get((mid, oc), pos.avg_price)
            equity += pos.shares * mark
        return equity

    def _settle_all(self) -> float:
        for (mid, oc), pos in list(self.positions.items()):
            if pos.shares <= 0:
                continue
            resolution = self._market_resolution.get(mid)
            payoff = resolution.get(oc) if resolution else None
            if payoff is None:
                payoff = self._market_last_price.get((mid, oc), pos.avg_price)
            self.cash += pos.shares * payoff
            pos.shares = 0.0
            pos.cost_basis_usd = 0.0
        return self.cash

    def _summary(self, final_equity: float, leader_pnls: dict[str, float]) -> dict[str, Any]:
        df = pd.DataFrame([t.to_dict() for t in self.copy_trades])
        per_leader: dict[str, dict[str, float]] = {}
        if not df.empty:
            for leader, grp in df.groupby("leader"):
                buys = grp[grp.side == "BUY"]["notional_usd"].sum()
                sells = grp[grp.side == "SELL"]["notional_usd"].sum()
                per_leader[leader] = {
                    "trades": int(len(grp)),
                    "deployed_usd": float(buys),
                    "realised_proceeds_usd": float(sells),
                    "leader_lifetime_pnl_usd": float(leader_pnls.get(leader, 0.0)),
                }

        eq = pd.DataFrame(self.equity_curve, columns=["ts", "equity"])
        if not eq.empty:
            eq["drawdown"] = eq["equity"] / eq["equity"].cummax() - 1
            max_dd = float(eq["drawdown"].min())
        else:
            max_dd = 0.0

        starting = self.cfg.starting_capital_usd
        return {
            "starting_capital_usd": starting,
            "final_equity_usd": final_equity,
            "pnl_usd": final_equity - starting,
            "return_pct": (final_equity / starting - 1) * 100 if starting else 0.0,
            "max_drawdown_pct": max_dd * 100,
            "num_copy_trades": len(self.copy_trades),
            "per_leader": per_leader,
            "trades_df": df,
            "equity_df": eq,
        }
