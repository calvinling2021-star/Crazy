"""Deterministic offline tests for the simulator (no network)."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from polymarket.simulator import CopyTradingSimulator, SimConfig


def _trade(side, price, size, ts, market="m1", outcome="YES"):
    return {
        "side": side,
        "price": price,
        "size": size,
        "market": market,
        "outcome": outcome,
        "timestamp": ts.isoformat(),
    }


def test_winning_leader_makes_money_for_copier():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xLEADER".lower()

    # Leader buys YES at 0.40, the market eventually resolves YES.
    wallet_trades = {leader: [_trade("BUY", 0.40, 1000, t0)]}
    leader_pnls = {leader: 100_000.0}
    resolutions = {"m1": {"YES": 1.0, "NO": 0.0}}

    cfg = SimConfig(
        starting_capital_usd=1_000.0,
        sizing_mode="fixed_usd",
        fixed_usd=100.0,
        fee_bps=0.0,
        slippage_bps=0.0,
        min_leader_pnl_usd=0.0,
        per_leader_daily_cap_usd=10_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    summary = sim.run(wallet_trades, leader_pnls=leader_pnls, resolutions=resolutions)

    # $100 at 0.40 -> 250 shares -> resolves to $250.
    assert summary["num_copy_trades"] == 1
    assert summary["final_equity_usd"] == pytest.approx(900 + 250, rel=1e-6)
    assert summary["pnl_usd"] == pytest.approx(150.0, rel=1e-6)


def test_losing_leader_loses_money_for_copier():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xbad"
    wallet_trades = {leader: [_trade("BUY", 0.80, 1000, t0)]}
    resolutions = {"m1": {"YES": 0.0, "NO": 1.0}}
    cfg = SimConfig(
        starting_capital_usd=1_000.0,
        sizing_mode="fixed_usd",
        fixed_usd=200.0,
        fee_bps=0.0,
        slippage_bps=0.0,
        min_leader_pnl_usd=0.0,
        per_leader_daily_cap_usd=10_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    summary = sim.run(wallet_trades, leader_pnls={leader: 100_000.0}, resolutions=resolutions)
    assert summary["pnl_usd"] == pytest.approx(-200.0, rel=1e-6)


def test_min_leader_pnl_filter_skips_low_pnl_leaders():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    wallet_trades = {"0xsmall": [_trade("BUY", 0.50, 100, t0)]}
    cfg = SimConfig(
        starting_capital_usd=1_000.0,
        sizing_mode="fixed_usd",
        fixed_usd=100.0,
        min_leader_pnl_usd=5_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    summary = sim.run(wallet_trades, leader_pnls={"0xsmall": 1_000.0})
    assert summary["num_copy_trades"] == 0
    assert summary["final_equity_usd"] == pytest.approx(1_000.0)


def test_per_leader_daily_cap_enforced():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xspammer"
    trades = [_trade("BUY", 0.50, 1000, t0 + timedelta(minutes=i)) for i in range(20)]
    cfg = SimConfig(
        starting_capital_usd=100_000.0,
        sizing_mode="fixed_usd",
        fixed_usd=300.0,
        per_leader_daily_cap_usd=1_000.0,
        min_leader_pnl_usd=0.0,
        max_concurrent=100,
        max_position_usd=10_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    summary = sim.run({leader: trades}, leader_pnls={leader: 50_000.0})
    deployed = sum(t.notional_usd for t in sim.copy_trades if t.side == "BUY")
    assert deployed <= cfg.per_leader_daily_cap_usd + 1e-6


def test_sell_releases_position_and_cash():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xroundtrip"
    trades = [
        _trade("BUY", 0.40, 1000, t0),
        _trade("SELL", 0.60, 1000, t0 + timedelta(hours=1)),
    ]
    cfg = SimConfig(
        starting_capital_usd=1_000.0,
        sizing_mode="fixed_usd",
        fixed_usd=200.0,
        fee_bps=0.0,
        slippage_bps=0.0,
        min_leader_pnl_usd=0.0,
        per_leader_daily_cap_usd=10_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    summary = sim.run({leader: trades}, leader_pnls={leader: 50_000.0})
    # buy $200 @ 0.40 -> 500 shares; sell @ 0.60 -> $300 -> +$100 profit
    assert summary["num_copy_trades"] == 2
    assert summary["pnl_usd"] == pytest.approx(100.0, rel=1e-6)


def test_fraction_lead_sizing():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xwhale"
    trades = [_trade("BUY", 0.50, 10_000, t0)]  # leader notional = $5,000
    cfg = SimConfig(
        starting_capital_usd=10_000.0,
        sizing_mode="fraction_lead",
        fraction=0.02,  # copy 2%
        fee_bps=0.0,
        slippage_bps=0.0,
        min_leader_pnl_usd=0.0,
        max_position_usd=1_000.0,
        per_leader_daily_cap_usd=10_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    sim.run({leader: trades}, leader_pnls={leader: 50_000.0})
    assert sim.copy_trades[0].notional_usd == pytest.approx(100.0, rel=1e-6)  # 2% of $5k


def test_limit_mode_skips_when_unfilled():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xlimit"
    trades = [_trade("BUY", 0.40, 1000, t0 + timedelta(minutes=i)) for i in range(50)]
    cfg = SimConfig(
        starting_capital_usd=100_000.0,
        sizing_mode="fixed_usd",
        fixed_usd=100.0,
        execution_mode="limit",
        limit_fill_probability=0.0,
        min_leader_pnl_usd=0.0,
        per_leader_daily_cap_usd=1_000_000.0,
        max_position_usd=1_000_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    sim.run({leader: trades}, leader_pnls={leader: 50_000.0})
    assert len(sim.copy_trades) == 0
    assert sim.skipped_unfilled == 50


def test_limit_mode_fills_at_leader_price_no_slippage():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xlimit"
    trades = [_trade("BUY", 0.40, 1000, t0)]
    cfg = SimConfig(
        starting_capital_usd=10_000.0,
        sizing_mode="fixed_usd",
        fixed_usd=100.0,
        execution_mode="limit",
        limit_fill_probability=1.0,
        slippage_bps=500.0,  # would be very high in market mode
        fee_bps=0.0,
        min_leader_pnl_usd=0.0,
        per_leader_daily_cap_usd=10_000.0,
    )
    sim = CopyTradingSimulator(cfg)
    sim.run({leader: trades}, leader_pnls={leader: 50_000.0})
    assert len(sim.copy_trades) == 1
    assert sim.copy_trades[0].fill_price == pytest.approx(0.40)  # no slippage in limit mode


def test_normalises_invalid_rows():
    t0 = datetime(2025, 1, 1, tzinfo=timezone.utc)
    leader = "0xleader"
    rows = [
        {"side": "BUY", "price": 0.4, "size": 100, "market": "m1", "timestamp": t0.isoformat()},
        {"side": "BUY", "price": 1.5, "size": 100, "market": "m1", "timestamp": t0.isoformat()},  # bad price
        {"side": "DEPOSIT", "price": 0.5, "size": 100, "market": "m1", "timestamp": t0.isoformat()},  # bad side
        {"side": "BUY", "price": 0.4, "size": 0, "market": "m1", "timestamp": t0.isoformat()},  # bad size
        {"side": "BUY", "price": 0.4, "size": 100, "timestamp": t0.isoformat()},  # missing market
    ]
    cfg = SimConfig(
        sizing_mode="fixed_usd",
        fixed_usd=10.0,
        min_leader_pnl_usd=0.0,
        slippage_bps=0.0,
        fee_bps=0.0,
    )
    sim = CopyTradingSimulator(cfg)
    sim.run({leader: rows}, leader_pnls={leader: 100_000.0})
    assert sim.copy_trades and len(sim.copy_trades) == 1
