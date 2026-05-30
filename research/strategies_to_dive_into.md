# Which Strategies to Dive Into — A Prioritized Research Roadmap

**Prepared:** 2026‑05‑30
**Builds on:** `quant_trading_china_hk_top10_strategies.md` · `validating_1000_strategies_edge.md` · `strategy_registry_1000.csv`

This is an opinionated shortlist. Of the 1,000 screened variants, **10 (1.0%) survived** costs + replication shrinkage + data-snooping deflation, and **all 10 were the Tier‑A diversified commodity‑futures multi‑factor combo.** That single fact drives the ranking below. I add two *diversifiers* (a credible equity core and a small uncorrelated carry sleeve) because a one-strategy book is fragile — but the conviction ordering is unambiguous.

> Assumptions (tell me if any are wrong and I'll re-rank): you can trade Chinese commodity & index futures and 50ETF/300ETF options; you can run a daily-to-monthly rebalanced systematic book; capital is institutional-ish but capacity-sensitive (commodity futures cap out fast). None of this is investment advice.

---

## 🥇 PICK 1 — Diversified commodity‑futures multi‑factor combo  *(highest conviction — start here)*

**Why this one.** It is the *only* family that survived the 1,000-strategy screen, and it took **all 10** survivor slots. It wins on the three things that matter after haircuts: **Tier‑A replicated alpha** (peer-reviewed combined-factor Sharpe ≈ 1.67), the **lowest transaction cost** (~4–6 bp), and **full shortability**. The edge is *diversification across orthogonal signals* — no single signal survived; the combo did.

**The spec to build.**
- **Universe:** ~30–40 liquid Chinese commodity futures (SHFE/DCE/CZCE/INE), **excluding precious metals** (the peer-reviewed combos exclude them — they dilute the premium).
- **Signals (equal-risk blend):** time-series momentum + cross-sectional momentum + carry/basis + **basis-momentum** + **curve momentum**. (Basis-momentum and curve momentum are the highest-value, least-crowded legs.)
- **Construction:** rank → quintile long/short → **vol-scaled** weights, target ~10% portfolio vol.
- **Rebalance/hold:** the survivors clustered at **medium-to-long lookbacks with 10–60d holds** — *not* daily churn. Start with 20–60d holds.
- **Roll management:** explicit, scheduled contract rolls — this is where naive backtests leak alpha.

**Dive-in validation gates (must pass before sizing):**
1. Walk-forward 2010→2024 with **realistic roll costs + slippage**; require **deflated** Sharpe to clear the noise floor (the screen's own logic).
2. Confirm each signal leg adds *marginal* IR over the others (orthogonality) — if basis-momentum is just momentum in disguise, drop it.
3. Stress 2015–16 and 2021–22 commodity regimes separately.

**Main risk:** capacity (these markets are thin; the alpha decays with size) and crowding in the momentum leg. **Biggest upside:** basis-momentum + curve momentum are genuinely under-exploited in China.

---

## 🥈 PICK 2 — CH‑4 A‑share value + quality core  *(diversifier, different asset class)*

**Why this one.** It's the **most replicated result in all of Chinese quant** (Liu‑Stambaugh‑Yuan CH‑3/CH‑4; value VMG alpha ≈ 16.8%/yr, t = 7.94; confirmed in *Management Science* 2024). It didn't clear the screen's *long-short* 95% bar at the cluster floor, but it **reappears under the generous N_eff assumption (14 survivors)** and is a legitimate **long-only** engine. It's low-turnover and **uncorrelated to commodities** — exactly what a second sleeve should be.

**The spec to build.**
- **Universe:** A-shares **excluding the smallest 30%** (the shell-stock fix — this is not optional in China; it's the single most important universe choice).
- **Signals:** **earnings-to-price (E/P) value** + **profitability/quality**, combined; optionally tilt with the size factor.
- **Construction:** long-only or 130/30 where shorting is feasible; **value-weighted**, low turnover (quarterly).
- **Hold:** quarterly rebalance — the survivors that clear costs are always the *slow* ones.

**Dive-in validation gates:**
1. Rebuild the CH‑4 factors yourself with **point-in-time fundamentals** (no restated data) and **delisted-stock inclusion**.
2. Confirm value/quality alpha survives after the 0.05% sell-side stamp duty + impact.
3. Check it really is uncorrelated to Pick 1 (it should be).

**Main risk:** value has multi-year drawdowns; this is a *patient* sleeve. **Why include it anyway:** it diversifies the commodity book and rests on the strongest evidence base in the entire review.

---

## 🥉 PICK 3 — 50ETF/300ETF variance‑risk‑premium carry sleeve  *(small, hedged satellite)*

**Why this one.** Structurally real and replicated: ~62% of delta-hedged option gains in China are negative → option *buyers* systematically overpay for variance, so disciplined *sellers* earn a premium. It's **uncorrelated** to both picks above. It did **not** survive the screen as a standalone (Tier B + high cost + tail risk), which is exactly why it belongs as a *small, capped, hedged* sleeve — not a core engine.

**The spec to build.**
- **Instrument:** SSE 50ETF and CSI 300ETF options.
- **Trade:** systematic short straddle/strangle or delta-hedged short vol, **only when implied > forecast realized** (use a GARCH/realized-vol filter; don't sell vol unconditionally).
- **Overlay:** PCR / skew / China-VIX timing to *stand aside* in high-risk regimes.
- **Hard rules:** explicit tail hedge (cheap far OTM puts), strict per-trade and portfolio vega limits, position sizing that assumes a gap-down.

**Dive-in validation gates:**
1. Backtest **with the left tail modeled** — report max drawdown and worst single-day, not just Sharpe (the Sharpe is a mirage without this).
2. Confirm the implied-vs-realized filter actually adds value vs. always-short.
3. Size so a 2015-style crash is survivable.

**Main risk:** this strategy "works until it doesn't." Treat it as a carry sleeve capped at a small fraction of risk budget.

---

## 🚫 Explicitly skip (for now) — and why

| Strategy | Why skip |
|---|---|
| **ML/DL A-share stock selection** (the Sharpe ~2.0 preprints) | Highest *reported* alpha, **lowest credibility**; vanished under the replication haircut. Mine them for *features*, not for promises. |
| **Short-term reversal / abnormal turnover** | High *gross* alpha but dies on turnover costs and is short-sale constrained in China. |
| **A‑H premium convergence** | Structurally real, practically capped — no convergence guarantee, can't short A-shares via Connect, FX friction. |
| **HK ML volatility / TCN prediction** | Thin published alpha; HK is better used as an execution venue than an alpha source. |
| **Single-signal commodity factors** | None survived alone — only the *combo* did. Don't trade them standalone. |

---

## Suggested sequence

1. **Weeks 1–4:** Build Pick 1 (commodity combo) end-to-end with roll costs → this is where the real, defensible edge is.
2. **Weeks 3–6 (parallel):** Stand up Pick 2 (CH‑4 value/quality) as the diversifying core; it's low-effort given the well-documented factor construction.
3. **Later, small:** Add Pick 3 (options VRP) only after the tail-risk controls are built and tested.
4. **Always:** run every candidate back through `strategy_screen.py` with *your own* walk-forward Sharpe in place of the literature band — never relax the deflated‑t > 1.96 gate.

**One-line answer:** dive into the **commodity-futures multi-factor combo** first (that's the edge), pair it with the **CH‑4 value/quality** core for diversification, and add a **small, hedged options-VRP** sleeve last.
