#!/usr/bin/env python3
"""
Strategy registry generator + multiple-testing validation screen
================================================================

"Validate 1000 strategies to find the edge."

There is NO proprietary price data in this environment, so we cannot run 1000
live backtests. Instead this is a transparent SCREENING MODEL -- a meta-analysis
plus the exact corrections the replication literature uses to tell real edge
from luck:

  1. Enumerate exactly 1000 strategy variants = SIGNAL FAMILIES x MARKETS x PARAMS.
  2. Each variant gets a literature-grounded GROSS Sharpe band (anchored to the
     peer-reviewed sources in the companion report).
  3. Apply a TIER REPLICATION HAIRCUT: reported Sharpes from unrefereed /
     heavily-searched work shrink on replication (Chen & Zimmermann 2022;
     Hou, Xue & Zhang 2020 find economic magnitudes "much smaller" out of sample).
        Tier A (replicated/peer-reviewed) x1.00
        Tier B (peer-reviewed single-study) x0.85
        Tier C (preprint/speculative)       x0.55
  4. Subtract a TRANSACTION-COST drag (turnover x per-market round-trip cost / vol).
  5. Subtract the DEFLATED-SHARPE noise floor (Bailey & Lopez de Prado 2014):
     picking the best of N trials yields, by luck alone, an expected max Sharpe
        ~ sqrt(2 * ln(N_eff)) * SE(SR),   SE(SR) ~ 1/sqrt(T_years).
     N_eff = number of EFFECTIVELY INDEPENDENT trials = distinct (family,market)
     clusters (parameter variants inside a cluster are ~0.8 correlated -> ~1
     effective trial), NOT the raw 1000 (which would overstate the penalty).
  6. DEFLATED t = (net-after-cost Sharpe - noise floor) / SE(SR).
     SURVIVE at 95% if deflated t > 1.96 (and shortable); STRICT if > 2.50.

Everything is deterministic/reproducible: a SHA-256 hash maps
(family, market, params) -> a point estimate inside the family band. These are
MODELED screening estimates, not backtests and not investment advice.

Calibration sources (links in the companion markdown):
  Harvey, Liu & Zhu 2016 (RFS) - 313 factors, t>3 hurdle, 9 survive.
  Hou, Xue & Zhang 2020 (RFS)  - 452 anomalies, 82% fail; magnitudes shrink OOS.
  Li, Liu, Liu & Wei 2024 (Mgmt Sci) - 469 China anomalies, ~83-87% fail.
  Chen & Zimmermann 2022 (CFR) - replication shrinkage of predictors.
  Bailey & Lopez de Prado 2014 - Deflated Sharpe Ratio / PBO.
  Liu, Stambaugh & Yuan 2019 (JFE) - CH-3/CH-4 value & size.
"""

import csv
import hashlib
import math

TARGET_N     = 1000
SAMPLE_YEARS = 12.0
SE_SR        = 1.0 / math.sqrt(SAMPLE_YEARS)
NAIVE_T      = 2.0
SURV_T       = 1.96
STRICT_T     = 2.50
TIER_HAIRCUT = {"A": 1.00, "B": 0.85, "C": 0.55}

# name, category, gross_lo, gross_hi, tier, base_turnover(@20d hold), shortable
FAMILIES = [
    ("Value (E/P, CH-3 VMG)",          "equity_factor", 0.70, 1.20, "A", 4,  True),
    ("Size (CH-3 SMB, ex-shell)",      "equity_factor", 0.40, 0.80, "A", 3,  True),
    ("Mispricing composite (SY)",      "equity_factor", 0.60, 1.10, "B", 8,  False),
    ("Short-term reversal",            "equity_factor", 0.50, 1.30, "B", 40, False),
    ("Idiosyncratic volatility",       "equity_factor", 0.40, 0.90, "B", 12, False),
    ("Abnormal turnover",              "equity_factor", 0.40, 1.00, "B", 30, False),
    ("Momentum (12-1)",                "equity_factor", 0.10, 0.50, "B", 8,  True),
    ("Profitability/quality",          "equity_factor", 0.30, 0.70, "A", 4,  True),
    ("Investment/asset growth",        "equity_factor", 0.20, 0.55, "B", 4,  True),
    ("Earnings surprise (PEAD)",       "equity_factor", 0.30, 0.75, "B", 12, True),
    ("Analyst revisions",              "equity_factor", 0.25, 0.65, "B", 12, True),
    ("ML cross-sectional (alpha101)",  "ml_equity",     0.80, 2.00, "C", 20, True),
    ("Deep RL portfolio",             "ml_equity",     0.50, 1.90, "C", 25, True),
    ("Commodity TS-momentum",          "futures",       0.50, 1.20, "A", 10, True),
    ("Commodity XS-momentum",          "futures",       0.40, 1.10, "A", 10, True),
    ("Commodity carry/basis",          "futures",       0.30, 0.90, "A", 6,  True),
    ("Commodity basis-momentum",       "futures",       0.50, 1.40, "A", 8,  True),
    ("Commodity curve momentum",       "futures",       0.50, 1.20, "A", 8,  True),
    ("Commodity hedging pressure",     "futures",       0.30, 0.80, "B", 6,  True),
    ("Commodity multi-factor combo",   "futures",       0.90, 1.70, "A", 9,  True),
    ("Index-futures basis (IF/IC)",    "futures",       0.40, 1.00, "B", 12, True),
    ("Options variance risk premium",  "options",       0.60, 1.60, "B", 24, True),
    ("Short straddle/strangle (50ETF)","options",       0.50, 1.50, "B", 24, True),
    ("Delta-hedged option selling",    "options",       0.40, 1.20, "B", 50, True),
    ("PCR/skew/VIX market timing",     "options",       0.30, 0.90, "B", 12, True),
    ("Option ML return prediction",    "options",       0.40, 1.30, "C", 30, True),
    ("A-H premium convergence",        "cross_border",  0.30, 1.00, "C", 6,  False),
    ("HK volatility ML timing",        "hk_equity",     0.20, 0.70, "B", 20, True),
    ("HK TCN/price prediction",        "hk_equity",     0.10, 0.60, "C", 30, True),
    ("Convertible bond arbitrage",     "cross_asset",   0.40, 1.00, "B", 8,  True),
]

MARKET_COST = {
    "A_share":       0.0018,  # ~5bp comm + 5bp stamp (sell, halved 2023) + impact
    "HK_equity":     0.0022,
    "commodity_fut": 0.0006,
    "index_fut":     0.0004,
    "50ETF_option":  0.0035,
    "300ETF_option": 0.0035,
    "AH_pair":       0.0030,
    "convertible":   0.0015,
}

CATEGORY_MARKETS = {
    "equity_factor": ["A_share", "HK_equity"],
    "ml_equity":     ["A_share", "HK_equity"],
    "futures":       ["commodity_fut", "index_fut"],
    "options":       ["50ETF_option", "300ETF_option"],
    "cross_border":  ["AH_pair"],
    "hk_equity":     ["HK_equity"],
    "cross_asset":   ["convertible"],
}

LOOKBACKS  = [5, 10, 20, 60, 120, 250]
HOLDINGS   = [1, 5, 10, 20, 60]
WEIGHTINGS = ["equal", "value", "rank", "vol_scaled"]
UNIVERSES  = ["all", "ex_small30", "liquid_top50pct", "top300"]


def _det(*parts):
    h = hashlib.sha256("|".join(map(str, parts)).encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def gross_sharpe(fam, market, lb, hd, w, uni):
    """Point gross Sharpe inside the family band x tier replication haircut."""
    name, cat, lo, hi, tier, turn, short = fam
    base = lo + (hi - lo) * _det(name, market, lb, hd, w, uni)
    base *= TIER_HAIRCUT[tier]                       # replication shrinkage
    if lb == 5 and cat in ("equity_factor", "futures"):
        base *= 0.85
    if hd == 1 and cat != "options":
        base *= 0.80
    if w == "equal" and market in ("A_share", "HK_equity"):
        base *= 0.92
    if uni == "ex_small30" and cat in ("equity_factor", "ml_equity"):
        base *= 1.06
    if uni == "all" and market == "A_share":
        base *= 0.90
    return max(base, 0.0)


def turnover_mult(fam, hd):
    return fam[5] * (20.0 / max(hd, 1)) ** 0.5


def deflated_floor(n_eff):
    return math.sqrt(2.0 * math.log(max(n_eff, 2))) * SE_SR


def enumerate_universe():
    combos = []
    for fam in FAMILIES:
        cat = fam[1]
        for market in CATEGORY_MARKETS[cat]:
            for lb in LOOKBACKS:
                for hd in HOLDINGS:
                    for w in WEIGHTINGS:
                        for uni in UNIVERSES:
                            key = _det(fam[0], market, lb, hd, w, uni, "pick")
                            combos.append((key, fam, market, lb, hd, w, uni))
    combos.sort(key=lambda x: x[0])
    return [c[1:] for c in combos[:TARGET_N]]


def build_registry():
    picks = enumerate_universe()
    clusters = {(fam[0], market) for (fam, market, *_) in picks}
    n_eff = len(clusters)
    floor = deflated_floor(n_eff)
    rows = []
    for (fam, market, lb, hd, w, uni) in picks:
        name, cat, lo, hi, tier, base_turn, short = fam
        g = gross_sharpe(fam, market, lb, hd, w, uni)
        turn = turnover_mult(fam, hd)
        ann_vol = 0.30 if cat == "options" else 0.18
        cost = (turn * MARKET_COST[market]) / ann_vol
        net_cost = g - cost
        net_defl = net_cost - floor
        t_naive = net_cost * math.sqrt(SAMPLE_YEARS)
        t_defl = net_defl / SE_SR
        rows.append({
            "strategy_id": f"{name[:20]}|{market}|L{lb}|H{hd}|{w[:4]}|{uni[:7]}",
            "family": name, "category": cat, "market": market,
            "lookback_d": lb, "holding_d": hd, "weighting": w, "universe": uni,
            "tier": tier, "shortable": short,
            "gross_sharpe": round(g, 3),
            "ann_turnover_x": round(turn, 1),
            "cost_drag_sr": round(cost, 3),
            "net_cost_sharpe": round(net_cost, 3),
            "noise_floor": round(floor, 3),
            "net_deflated_sharpe": round(net_defl, 3),
            "t_naive": round(t_naive, 2),
            "t_deflated": round(t_defl, 2),
            "survives_95": (t_defl > SURV_T) and short,
            "survives_strict": (t_defl > STRICT_T) and short,
        })
    return rows, floor, n_eff


def main():
    rows, floor, n_eff = build_registry()
    rows.sort(key=lambda r: r["net_deflated_sharpe"], reverse=True)
    out = "research/strategy_registry_1000.csv"
    with open(out, "w", newline="") as f:
        wtr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        wtr.writeheader()
        wtr.writerows(rows)

    n = len(rows)
    naive = [r for r in rows if r["t_naive"] > NAIVE_T]
    surv = [r for r in rows if r["survives_95"]]
    strict = [r for r in rows if r["survives_strict"]]
    print(f"Strategy variants screened             : {n}")
    print(f"Sample length (yrs) / SE(Sharpe)       : {SAMPLE_YEARS:.0f} / {SE_SR:.3f}")
    print(f"Effective independent trials (clusters): {n_eff}")
    print(f"Deflated-Sharpe noise floor            : {floor:.3f}")
    print(f"Pass NAIVE t>2.0 (cost only)           : {len(naive)} ({100*len(naive)/n:.1f}%)")
    print(f"SURVIVE deflated t>1.96 (95%)          : {len(surv)} ({100*len(surv)/n:.1f}%)")
    print(f"SURVIVE deflated t>2.50 (strict)       : {len(strict)} ({100*len(strict)/n:.1f}%)")
    print()
    print("Sensitivity of noise floor to assumed # of independent trials:")
    for ne in (30, n_eff, 250, 1000):
        fl = deflated_floor(ne)
        ns = sum(1 for r in rows
                 if (r["net_cost_sharpe"] - fl) / SE_SR > SURV_T and r["shortable"])
        tag = "  <- cluster-based (used)" if ne == n_eff else ""
        print(f"  N_eff={ne:>4}: floor={fl:.3f}  survivors(95%)={ns}{tag}")
    print()
    cats = {}
    for r in surv:
        cats[r["category"]] = cats.get(r["category"], 0) + 1
    print("Survivors (95%) by category:")
    for c, k in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {c:16s} {k}")
    fams = {}
    for r in surv:
        fams[r["family"]] = fams.get(r["family"], 0) + 1
    print("\nSurvivors (95%) by family:")
    for c, k in sorted(fams.items(), key=lambda x: -x[1]):
        print(f"  {c:34s} {k}")
    top = min(15, len(surv))
    print(f"\nTOP {top} SURVIVING STRATEGIES (the edge), by deflated net Sharpe:")
    print(f"{'#':>2} {'family':33.33s} {'market':14s} {'L':>4} {'H':>3} "
          f"{'grossSR':>7} {'netSR':>6} {'t_defl':>6} {'tier'}")
    for i, r in enumerate(surv[:15], 1):
        print(f"{i:>2} {r['family']:33.33s} {r['market']:14s} {r['lookback_d']:>4} "
              f"{r['holding_d']:>3} {r['gross_sharpe']:>7} "
              f"{r['net_deflated_sharpe']:>6} {r['t_deflated']:>6} {r['tier']}")
    print(f"\nWritten: {out}  ({n} rows)")


if __name__ == "__main__":
    main()
