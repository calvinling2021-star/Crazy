# Deep Dive — Pick 1 (Commodity Multi-Factor Combo) + a Capacity-Aware Re-Rank

**Prepared:** 2026‑05‑30
**Builds on:** `strategies_to_dive_into.md`
**Your constraints (used to re-rank):** can trade Chinese commodity futures ✅ · can trade 50ETF/300ETF options ✅ · can short A-shares ✅ · **capacity-constrained** ⚠️

This note (a) validates the individual signal legs of the commodity combo against the specific papers, (b) surfaces the two findings that change *how* you should build it — **factor crashes** and a **behavioral (retail) alpha source** — and (c) **re-ranks the three picks for a capacity-constrained book**, because your ability to short A-shares and trade options materially shifts the optimal allocation away from thin commodity markets.

---

## 1. Per-leg evidence (validated, with sample periods)

| Signal leg | What the paper reports | Sample | Source |
|---|---|---|---|
| **Carry / basis** (long backwardated, short contango, monthly) | +8%/yr, **Sharpe 0.43** | to 2020 | *An anatomy of commodity futures returns in China* (Pacific-Basin Fin. J. 2020) |
| **Cross-sectional momentum** (4-month, monthly rebal) | 22.31% L/S excess, **Sharpe 1.11** | to 2020 | *An anatomy…* (2020) |
| **Time-series momentum** (daily, crash-aware) | **Sharpe 0.75** vs 0.07 for naïve TSMOM | 2010–2018, 24 commodities | *Revisiting TS momentum in China* (2023) |
| **Curve momentum** (along the futures curve, diversified) | **Sharpe 1.28, positive *after* transaction costs** | recent | *Curve Momentum in China*, Zheng (J. Futures Markets 2024) |
| **Basis-momentum** ("efficient" version) | Sharpe improvement **+0.13 (t = 2.76)**; premium *materialized* and basis +30% during COVID | incl. 2020–22 | Boons-Prado (2019) + China COVID study |
| **Combo** (momentum + basis + basis-momentum + value + hedging pressure, **ex-precious-metals**) | **Sharpe 1.67** | recent | *Commodity momentum: a tale of countries and sectors* (J. Commodity Markets 2023) |

**Reading of the evidence:** no single leg is spectacular (carry 0.43, momentum ~1.1, curve ~1.28). The **diversification into the combo (1.67)** is the actual edge — exactly what the 1,000-strategy screen independently found (all 10 survivors were the *combo*, never a single signal). The two highest-value, least-crowded legs are **curve momentum** (net-of-cost positive on its own) and **basis-momentum** (orthogonal to plain momentum; strengthened post-COVID).

---

## 2. The finding that changes the build — factor *crashes*

*The Fortune and Crash of Common Risk Factors in Chinese Commodity Markets* (Li, Liu & Zhao, *J. Commodity Markets* 2023; 9 anomalies, 2005–2020) is the most important methodological input:

- Term-structure and momentum factors **crash hard during high-stress, high-volatility regimes** (the classic momentum-crash pathology).
- Applying a **Daniel–Moskowitz-style crash-control augmentation** (dynamic volatility scaling / de-risking when factor vol spikes) lifts out-of-sample Sharpe **from 0.75 → 1.08 (term structure)** and **0.66 → 0.77 (momentum)**.

**Implication for you:** build the combo **vol-targeted with explicit crash control from day one**, not as an afterthought. This is *why* the top survivor in the screen (`Commodity multi-factor combo · vol-scaled · t=2.50`) was the only one to clear the strict bar — vol-scaling is doing real work, not cosmetics. Concretely: scale each leg to constant risk, cap portfolio vol (~10%), and cut gross exposure when realized factor vol exceeds a threshold.

---

## 3. The alpha source — behavioral, retail-driven (good news *and* a ceiling)

Chinese commodity futures are **95.6% individual-investor participants, contributing ~74% of volume** (vs. ~80% institutional in the US). The momentum/curve-momentum premium is explicitly tied to **retail herding**.

**Why this is good:** a *behavioral* premium sourced from a structurally retail market is **less likely to be fully arbitraged away** than a pure risk premium — retail keeps supplying it. That supports persistence.

**Why it's also a warning:**
- Post-publication **alpha decay is real (~50% of anomaly alpha fades after publication)**, and crowding in commodity factors predicts underperformance. Curve-momentum and basis-momentum are *less* published/crowded → prefer them over plain momentum.
- The herding alpha concentrates in **speculative, retail-heavy contracts**, which are not always the most liquid — creating direct tension with your capacity constraint (Section 4).

---

## 4. Capacity — the constraint that re-orders your picks

**The honest state of evidence:** academic work explicitly notes that **futures-risk-premia capacity in China is "understudied/absent."** The one direct reference is *Investable Commodity Premia in China* (Fuertes et al., *J. Banking & Finance* 2021), which builds **liquidity-screened ("investable")** versions of the premia — the right template, but capacity ceilings for a sizable book are genuinely uncertain.

**What this means at your size (capacity-constrained):**
- Individual flagship contracts are deep (DCE soybean meal is the world's largest ag-futures contract; rebar, iron ore, hot-rolled coil, soybean oil, palm oil, methanol, PTA, copper are liquid). **Contract-level liquidity is fine.**
- But the *factor strategy* needs the **full cross-section including thinner contracts**, and the behavioral alpha leans on speculative names — so **strategy capacity is well below contract capacity**, and market impact bites as you scale.
- **Conclusion:** the commodity combo is your **highest Sharpe-per-dollar engine but a capped one.** Treat it as the alpha core sized to liquidity, not the capital sink.

### Capacity-aware re-rank (given you can short A-shares + trade options)

| Role | Strategy | Why, given your constraints |
|---|---|---|
| **Alpha core (capped)** | Commodity multi-factor combo (vol-scaled, crash-controlled, ~15–20 most-liquid contracts) | Highest risk-adjusted edge, but **cap notional** to stay under impact; concentrate in liquid names. |
| **Capital workhorse (scales)** | **CH‑4 A-share value + quality LONG-SHORT** | You **can short A-shares** → the long-short version is now viable and **absorbs far more capital** than commodities. This rises from "diversifier" to co-core. |
| **Diversifying carry (scales)** | **50ETF/300ETF variance-risk-premium** (hedged, capped) | You **can trade options**; VRP scales reasonably, is uncorrelated, and adds a third return stream. |

**Net change vs. the original memo:** because you're capacity-constrained *and* can short A-shares, the **CH‑4 long-short equity sleeve moves up to share the core** with commodities rather than sitting behind it. Commodities give the best Sharpe; A-share long-short gives the capacity. Run them together.

---

## 5. Refined build spec for the commodity combo (incorporating §2–4)

- **Universe:** ~15–20 *most-liquid* contracts across SHFE/DCE/CZCE/INE (rebar, hot-rolled coil, iron ore, copper, soybean meal/oil, palm oil, methanol, PTA, soda ash, etc.), **ex-precious-metals**. Liquidity-screen like Fuertes et al. — drop a contract if your target size > X% of ADV.
- **Legs (equal risk):** XS-momentum (4-mo) + carry/basis + **basis-momentum** + **curve momentum**; optionally hedging-pressure. De-emphasize plain TS-momentum (most crowded/decayed).
- **Risk engine:** vol-scale each leg to constant risk; **crash control** (cut gross when factor vol spikes, Daniel-Moskowitz style); portfolio target ~10% vol.
- **Rebalance:** monthly for carry/curve, with the momentum legs no faster than ~20-day holds (the screen killed fast variants on cost).
- **Costs:** model rolls explicitly + ~4–6 bp round trip + **impact as a function of your size** (this is the binding constraint, not commission).

**Validation gates before sizing:** (1) deflated-Sharpe clears the noise floor on *your* walk-forward; (2) each leg adds marginal IR (kill redundant legs); (3) backtest the crash-control overlay across 2015–16 and 2021–22 stress; (4) capacity test — re-run with realistic impact at 1×, 3×, 5× target AUM and watch where net Sharpe degrades.

---

## 6. Updated reading list (priority order for your dive)

1. **Fuertes et al., *Investable Commodity Premia in China*** (J. Banking & Finance 2021) — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0378426621000856) · the capacity/liquidity-screening template. **Read first.**
2. **Li, Liu & Zhao, *The Fortune and Crash of Common Risk Factors in Chinese Commodity Markets*** (J. Commodity Markets 2023) — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S2405851323000521) · the crash-control augmentation.
3. **Zheng, *Curve Momentum in China*** (J. Futures Markets 2024) — [Wiley](https://onlinelibrary.wiley.com/doi/10.1002/fut.70093) · best single under-crowded leg (Sharpe 1.28 net of costs).
4. ***An anatomy of commodity futures returns in China*** (Pacific-Basin Fin. J. 2020) — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0927538X20301086) · the carry/momentum factor structure (0.43 / 1.11).
5. ***Commodity momentum: a tale of countries and sectors*** (J. Commodity Markets 2023) — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S2405851323000053) · the ex-precious combo (Sharpe 1.67).
6. **Boons & Porras Prado, *Basis-Momentum*** (J. Finance 2019) — [PDF](https://4nations.org/papers/boonsprado17.pdf) · the original mechanism for the orthogonal leg.
7. **Zheng, *Evaluating Trend-Based Strategies in Chinese Commodity Futures*** (J. Futures Markets 2025) — [Wiley](https://onlinelibrary.wiley.com/doi/10.1002/fut.70033) · 64 commodities, 2003–2023, trend robustness.
8. **Li, Wu & Lei, *Factor Momentum in China's Commodity Markets*** (SSRN 2024) — [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5190280) · whether factor-timing adds value (watch for overfitting).

---

## 7. One-paragraph answer

Dive into the **commodity multi-factor combo** as your alpha core — but build it **vol-scaled with explicit crash control** (the factor-crash paper shows this lifts OOS Sharpe ~0.3 and is why the screen's only strict survivor was vol-scaled), concentrate in the **15–20 most-liquid contracts** (capacity in China is understudied and binds before contract liquidity does), and lean on the **less-crowded curve-momentum and basis-momentum legs**. Because you're capacity-constrained *and* can short A-shares, promote the **CH‑4 value/quality long-short** to co-core (it carries the capital the commodity book can't), and add the **options VRP** as a scalable, uncorrelated carry sleeve. Read Fuertes (capacity) and Li-Liu-Zhao (crash control) first.
