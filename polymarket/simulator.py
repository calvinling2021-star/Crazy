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
import random
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Iterable, Literal

import pandas as pd

log = logging.getLogger(__name__)

SizingMode = Literal["fixed_usd", "fraction_lead", "kelly_pnl"]
ExecutionMode = Literal["market", "limit"]


@dataclass
class SimConfig:
    starting_capital_usd: float = 10_000.0
    sizing_mode: SizingMode = "fraction_lead"
    fixed_usd: float = 100.0
    fraction: float = 0.01  # 1% of leader's notional
    fee_bps: float = 20.0  # round-trip fee in basis points of notional
    slippage_bps: float = 50.0  # market-mode: adverse price move on entry/exit
    latency_seconds: int = 60
    max_position_usd: float = 1_000.0
    max_concurrent: int = 50
    per_leader_daily_cap_usd: float = 2_000.0
    min_leader_pnl_usd: float = 5_000.0
    leader_weights: dict[str, float] = field(default_factory=dict)
    # Execution model:
    #   "market": fill always, at leader_price * (1 +/- slippage_bps).
    #   "limit":  fill at leader_price (no slippage) with prob `limit_fill_probability`;
    #             otherwise skip the trade. Models patient limit-order execution.
    execution_mode: ExecutionMode = "market"
    limit_fill_probability: float = 0.6
    execution_seed: int = 0
    # Signal-quality filters:
    min_consensus_leaders: int = 1  # require N distinct leaders BUY same (mkt,outcome) inside window
    consensus_window_seconds: int = 24 * 3600
    # Multi-window consensus: also require K leaders inside a tighter window.
    # When >0, an event is emitted only if BOTH the outer (consensus_window_seconds,
    # min_consensus_leaders) AND inner (tight_window_seconds, min_tight_leaders)
    # thresholds are met. Models "many independent traders converging fast."
    tight_window_seconds: int = 3600
    min_tight_leaders: int = 0
    max_signal_age_seconds: int | None = None  # skip copies older than this since leader fill (no-op here; pre-filter event input)
    min_price: float = 0.05  # skip extreme prices (no edge to extract)
    max_price: float = 0.95
    # Conviction sizing: when more leaders agree than the minimum, scale up.
    # multiplier = min(conviction_size_max, 1 + extra_leaders * conviction_size_step)
    conviction_size_step: float = 0.0
    conviction_size_max: float = 3.0
    # Exit logic independent of leader:
    stop_loss_pct: float | None = None      # e.g. 0.25 → close if mark drops 25% below cost basis
    profit_take_pct: float | None = None    # e.g. 0.40 → close if mark rises 40% above cost basis


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
        self._rng = random.Random(self.cfg.execution_seed)
        self.skipped_unfilled = 0

    # ---------- public API ----------
    def run(
        self,
        wallet_trades: dict[str, list[dict[str, Any]]],
        leader_pnls: dict[str, float] | None = None,
        resolutions: dict[str, dict[str, float]] | None = None,
        start_ts: datetime | None = None,
        end_ts: datetime | None = None,
    ) -> dict[str, Any]:
        """Run the simulation.

        Parameters
        ----------
        wallet_trades : { leader_wallet: [raw activity rows from data-api] }
        leader_pnls   : optional { leader_wallet: lifetime PnL } for kelly_pnl sizing.
        resolutions   : optional { market_id: { 'YES': 0|1, 'NO': 0|1 } }
        start_ts/end_ts : restrict to events in this window (UTC). Used by the
                          walk-forward backtest to isolate the validation window.
        """
        leader_pnls = leader_pnls or {}
        self._market_resolution = resolutions or {}

        events = self._merge_and_filter(wallet_trades, leader_pnls)
        if start_ts is not None:
            events = [e for e in events if e["ts"] >= start_ts]
        if end_ts is not None:
            events = [e for e in events if e["ts"] <= end_ts]
        events = self._price_gate(events)
        if self.cfg.min_consensus_leaders > 1:
            events = self._consensus_filter(events)
        log.info("simulating %d leader fills (after filters)", len(events))

        for ev in events:
            # Update mark FIRST so SL/TP sees the fresh price, then check
            # exits, then run the leader's BUY/SELL.
            self._market_last_price[(ev["market_id"], ev["outcome"])] = ev["price"]
            self._check_exits(ev["ts"])
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
            if self.cfg.execution_mode == "limit":
                if self._rng.random() > self.cfg.limit_fill_probability:
                    self.skipped_unfilled += 1
                    return
                fill_price = ev["price"]
            else:
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
            if self.cfg.execution_mode == "limit":
                if self._rng.random() > self.cfg.limit_fill_probability:
                    self.skipped_unfilled += 1
                    return
                fill_price = ev["price"]
            else:
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

    def _price_gate(self, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        lo, hi = self.cfg.min_price, self.cfg.max_price
        if lo <= 0 and hi >= 1:
            return events
        return [e for e in events if lo <= e["price"] <= hi]

    def _consensus_filter(self, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Causally emit an event only once N distinct leaders have BUY'd the
        same (market, outcome) within `consensus_window_seconds`. Sells pass
        through unchanged so we can still mirror exits. When `min_tight_leaders`
        is set, also require K leaders inside `tight_window_seconds`."""
        window = self.cfg.consensus_window_seconds
        need = self.cfg.min_consensus_leaders
        tight_window = self.cfg.tight_window_seconds
        tight_need = self.cfg.min_tight_leaders
        kept: list[dict[str, Any]] = []
        recent: dict[tuple[str, str], list[tuple[float, str]]] = defaultdict(list)
        for ev in events:
            if ev["side"] != "BUY":
                kept.append(ev)
                continue
            key = (ev["market_id"], ev["outcome"])
            ts = ev["ts"].timestamp()
            buf = recent[key]
            cutoff = ts - window
            while buf and buf[0][0] < cutoff:
                buf.pop(0)
            buf.append((ts, ev["leader"]))
            distinct = len({lead for _, lead in buf})
            if distinct < need:
                continue
            if tight_need > 0:
                tight_cutoff = ts - tight_window
                tight_distinct = len({lead for t, lead in buf if t >= tight_cutoff})
                if tight_distinct < tight_need:
                    continue
            kept.append({**ev, "n_consensus_leaders": distinct})
        return kept

    def _check_exits(self, ts: datetime) -> None:
        sl, tp = self.cfg.stop_loss_pct, self.cfg.profit_take_pct
        if sl is None and tp is None:
            return
        for key, pos in list(self.positions.items()):
            if pos.shares <= 0 or pos.avg_price <= 0:
                continue
            mark = self._market_last_price.get(key)
            if mark is None:
                continue
            ret = (mark - pos.avg_price) / pos.avg_price
            if tp is not None and ret >= tp:
                self._close_position(key, pos, mark, ts, reason="profit_take")
            elif sl is not None and ret <= -sl:
                self._close_position(key, pos, mark, ts, reason="stop_loss")

    def _close_position(
        self,
        key: tuple[str, str],
        pos: Position,
        mark: float,
        ts: datetime,
        reason: str,
    ) -> None:
        fill_price = max(0.001, mark * (1 - self.cfg.slippage_bps / 10_000))
        proceeds = pos.shares * fill_price
        fee = proceeds * self.cfg.fee_bps / 10_000
        self.cash += proceeds - fee
        self.copy_trades.append(
            CopyTrade(
                ts=ts,
                leader=reason,
                market_id=key[0],
                outcome=key[1],
                side="SELL",
                leader_price=mark,
                fill_price=fill_price,
                size_shares=pos.shares,
                notional_usd=proceeds,
                fee_usd=fee,
            )
        )
        pos.shares = 0.0
        pos.cost_basis_usd = 0.0

    def _size_for(self, ev: dict[str, Any], leader_pnls: dict[str, float]) -> float:
        m = self.cfg.sizing_mode
        if m == "fixed_usd":
            base = self.cfg.fixed_usd
        elif m == "fraction_lead":
            base = ev["notional"] * self.cfg.fraction
        elif m == "kelly_pnl":
            w = self.cfg.leader_weights.get(ev["leader"])
            if w is None:
                pnl = max(0.0, leader_pnls.get(ev["leader"], 0.0))
                total = sum(max(0.0, v) for v in leader_pnls.values()) or 1.0
                w = pnl / total
            base = self.cfg.starting_capital_usd * w
        else:
            raise ValueError(f"unknown sizing mode {m}")
        if self.cfg.conviction_size_step > 0:
            n = int(ev.get("n_consensus_leaders", 1))
            extra = max(0, n - self.cfg.min_consensus_leaders)
            mult = min(self.cfg.conviction_size_max, 1.0 + extra * self.cfg.conviction_size_step)
            base *= mult
        return base

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
        max_dd = 0.0
        sharpe = 0.0
        monthly = pd.DataFrame()
        if not eq.empty:
            eq["drawdown"] = eq["equity"] / eq["equity"].cummax() - 1
            max_dd = float(eq["drawdown"].min())
            daily = (
                eq.assign(date=pd.to_datetime(eq["ts"]).dt.tz_convert("UTC").dt.date)
                .groupby("date")["equity"].last()
            )
            rets = daily.pct_change().dropna()
            if len(rets) > 1 and rets.std() > 0:
                sharpe = float(rets.mean() / rets.std() * (252**0.5))
            ts_utc = pd.to_datetime(eq["ts"]).dt.tz_convert("UTC").dt.tz_localize(None)
            monthly = (
                ts_utc.dt.to_period("M").to_frame("month")
                .assign(equity=eq["equity"].values)
                .groupby("month")["equity"].last()
                .to_frame()
            )
            monthly["pnl_usd"] = monthly["equity"].diff()
            first_eq = float(eq["equity"].iloc[0])
            monthly.loc[monthly.index[0], "pnl_usd"] = monthly["equity"].iloc[0] - first_eq

        # Win rate: per (market, outcome), did proceeds exceed buys?
        win_rate = 0.0
        if not df.empty:
            by_mkt = (
                df.assign(signed=lambda x: x.apply(lambda r: r["notional_usd"] if r["side"] == "SELL" else -r["notional_usd"], axis=1))
                .groupby(["market_id", "outcome"])["signed"].sum()
            )
            closed = by_mkt[by_mkt.abs() > 1e-6]
            if len(closed):
                win_rate = float((closed > 0).sum()) / float(len(closed)) * 100

        starting = self.cfg.starting_capital_usd
        return {
            "starting_capital_usd": starting,
            "final_equity_usd": final_equity,
            "pnl_usd": final_equity - starting,
            "return_pct": (final_equity / starting - 1) * 100 if starting else 0.0,
            "max_drawdown_pct": max_dd * 100,
            "sharpe_annualised": sharpe,
            "win_rate_pct": win_rate,
            "num_copy_trades": len(self.copy_trades),
            "per_leader": per_leader,
            "trades_df": df,
            "equity_df": eq,
            "monthly_df": monthly,
        }
