# Validating 1,000 Strategies — A Multiple-Testing Screen to Find the Real Edge

**Prepared:** 2026‑05‑30
**Companion to:** `quant_trading_china_hk_top10_strategies.md`
**Artifacts:** `strategy_screen.py` (generator) · `strategy_registry_1000.csv` (1,000 scored variants)

> **Every number below is emitted by `strategy_screen.py` and matches `strategy_registry_1000.csv` exactly.** Re-run `python3 research/strategy_screen.py` to reproduce all figures. These are **modeled screening estimates, not backtests, and not investment advice.**

---

## 0. What "validate 1,000 strategies" honestly means here

You cannot validate 1,000 strategies by *trusting* 1,000 backtests — that is the trap the literature warns about. When you test 1,000 things, the best-looking ones are mostly **luck**. Harvey, Liu & Zhu (2016): of 313 published "factors," only **9 survive** a proper multiple-testing correction. Hou, Xue & Zhang (2020): **82%** of 452 anomalies fail, and survivors have "much smaller" magnitudes out of sample. For China, Li, Liu, Liu & Wei (2024, *Management Science*): of **469** A-share anomalies, **~83–87% fail** after risk adjustment.

There is **no proprietary price data in this environment**, so this is a transparent **screening model** — a meta-analysis plus the exact corrections those papers use:

```
gross Sharpe (literature band)
   × tier replication haircut         (A 1.00 / B 0.85 / C 0.55  — preprints shrink OOS)
   − transaction-cost drag            (turnover × per-market round-trip cost ÷ vol)
   − Deflated-Sharpe noise floor       (√(2·ln N_eff) × SE(Sharpe))
   = NET deflated Sharpe
   → deflated t = net ÷ SE(Sharpe);  SURVIVES if t > 1.96 (95%) and shortable
```

The edge is **what is left after you subtract costs, replication shrinkage, and the statistical noise that searching 1,000 strategies manufactures.**

---

## 1. The strategy universe (how we reach exactly 1,000)

A deterministic 1,000-variant sample of the cross-product of **documented signal families × markets × parameterizations**:

| Dimension | Values | Count |
|---|---|---|
| **Signal families** | equity factors, ML/DL equity, commodity futures, options, HK equity, A/H, convertibles | 30 |
| **Markets** | A-shares, HK equities, commodity futures, index futures, 50ETF & 300ETF options, A/H pairs, convertibles | 8 |
| **Lookback windows** | 5, 10, 20, 60, 120, 250 days | 6 |
| **Holding periods** | 1, 5, 10, 20, 60 days | 5 |
| **Weighting** | equal, value, rank, vol-scaled | 4 |
| **Universe filter** | all, ex-smallest-30%, liquid top-50%, top-300 | 4 |

These knobs are exactly what practitioners grid-search — which is *why* they generate data-snooping bias. Each of the **1,000** sampled variants is one row in `strategy_registry_1000.csv`.

---

## 2. Two corrections that separate edge from noise

### 2a. Tier replication haircut (applied to gross Sharpe)
Multiple-testing deflation alone is *not enough*: it subtracts the same floor from everyone and so does not penalize **unreliable** sources. The replication literature is explicit that reported Sharpes from unrefereed / heavily-searched work **shrink** out of sample (Hou-Xue-Zhang: magnitudes "much smaller"; Chen-Zimmermann document replication shrinkage). So gross Sharpe is scaled by tier *before* any other step:

| Tier | Meaning | Haircut |
|---|---|---:|
| A | replicated / peer-reviewed | ×1.00 |
| B | peer-reviewed single-study | ×0.85 |
| C | preprint / speculative (e.g. the single-author ML/DL A-share papers) | ×0.55 |

This is the step that correctly demotes the **highest-*reported*-Sharpe** strategies (the ML/DL preprints, raw band up to 2.0) below the replicated commodity factors — and, as Section 4 shows, removes them from the survivor set entirely.

### 2b. Effective number of independent trials (for the noise floor)
Treating all 1,000 variants as independent would overstate the penalty — most are parameter tweaks of ~30 ideas and are highly correlated. The defensible count is **distinct (family × market) clusters** (variants within a cluster ≈ 0.8 correlated ≈ one effective trial). The screen finds **56 clusters → noise floor 0.819** annual Sharpe. Sensitivity is reported so the result is not an artefact:

| Assumed independent trials `N_eff` | Noise floor | Survivors @95% |
|---:|---:|---:|
| 30 (one per family) | 0.753 | 14 |
| **56 (cluster-based — used)** | **0.819** | **10** |
| 250 | 0.959 | 1 |
| 1,000 (fully independent) | 1.073 | 0 |

**Read this as the core lesson:** the number of strategies that look like real edge depends almost entirely on how many things you (admit you) tried. Under the honest middle assumption, **10 of 1,000 survive**; under full independence, **none**.

---

## 3. The funnel — results across all 1,000 strategies

| Stage | Surviving | % |
|---|---:|---:|
| **Total screened** | 1,000 | 100% |
| Pass naïve **t > 2.0** (cost only, the discredited bar) | 306 | 30.6% |
| **SURVIVE deflated t > 1.96 (95%, cluster floor + tier haircut)** | **10** | **1.0%** |
| Survive strict deflated **t > 2.50** | 1 | 0.1% |

The 306-vs-10 collapse *is* the multiple-testing correction working: **~97% of strategies that pass the naïve bar are wiped out** once you account for searching 1,000 of them — squarely consistent with Harvey-Liu-Zhu (9/313 survive) and the China A-share replication evidence. Only **1** strategy clears the strict t > 2.50 bar, so even the survivors are *marginal*: "worth a real costed backtest," not "guaranteed alpha."

---

## 4. The edge — the 10 surviving strategies (verbatim from the registry)

| # | Family | Market | Lookback | Hold | Weighting / Universe | Gross SR | Net deflated SR | Deflated t | Tier |
|---:|---|---|---:|---:|---|---:|---:|---:|:--:|
| 1 | Commodity multi-factor combo | Commodity futures | 250d | 60d | vol-scaled / all | 1.559 | **0.723** | 2.50 | A |
| 2 | Commodity multi-factor combo | Index futures | 10d | 10d | equal / all | 1.554 | 0.706 | 2.45 | A |
| 3 | Commodity multi-factor combo | Commodity futures | 20d | 60d | equal / top300 | 1.524 | 0.688 | 2.38 | A |
| 4 | Commodity multi-factor combo | Commodity futures | 250d | 10d | vol-scaled / all | 1.543 | 0.682 | 2.36 | A |
| 5 | Commodity multi-factor combo | Commodity futures | 120d | 5d | equal / liquid-top50% | 1.559 | 0.680 | 2.35 | A |
| 6 | Commodity multi-factor combo | Commodity futures | 60d | 20d | equal / all | 1.506 | 0.657 | 2.28 | A |
| 7 | Commodity multi-factor combo | Index futures | 250d | 10d | equal / ex-small30 | 1.459 | 0.612 | 2.12 | A |
| 8 | Commodity multi-factor combo | Index futures | 60d | 20d | vol-scaled / ex-small30 | 1.416 | 0.577 | 2.00 | A |
| 9 | Commodity multi-factor combo | Index futures | 60d | 5d | equal / all | 1.432 | 0.573 | 1.99 | A |
| 10 | Commodity multi-factor combo | Index futures | 10d | 10d | rank / ex-small30 | 1.414 | 0.566 | 1.96 | A |

**All 10 survivors are the Tier-A "Commodity multi-factor combo" family** (momentum + basis + basis-momentum + carry + curve), split across the two futures markets (commodity futures and equity-index futures). 

- **By category:** futures = 10; everything else = 0.
- **By family:** Commodity multi-factor combo = 10.
- The **single strict (t > 2.50) survivor** is #1 — the vol-scaled commodity-futures combo. Everything else is borderline (t between 1.96 and 2.50).
- Lookbacks and holds span the grid, but the survivors cluster in **commodity/index futures** because they win on the three properties that matter *after* the haircuts: **Tier-A replicated alpha, the lowest transaction cost (~4–6 bp), and full shortability.**

**What did NOT survive, and why it matters:**
- **ML/DL A-share equity** (the highest *reported* Sharpe, ~2.0): demoted by the ×0.55 Tier-C replication haircut plus turnover — **none survive**. This is the single most important validation outcome: the flashiest numbers are the least real.
- **A-share / HK equity factors** (value/quality, Tier A): credible, but their net deflated Sharpe sits just under the 95% bar at this floor. They reappear only under the more generous `N_eff = 30` assumption (14 survivors). They remain the legitimate *long-only* core even though no single-name long-short variant clears this particular bar.
- **Single-signal commodity factors, options, A/H, convertibles, HK ML:** none survive — only the *diversified* commodity combo has enough gross Sharpe to clear the floor after costs; single signals, options (high cost + Tier B), and short-constrained ideas fall short.

---

## 5. What this proves about "better alpha"

1. **More backtests ≠ more alpha.** Screening 1,000 strategies did **not** find a better edge than the companion report's top pick — it found the *same* edge (commodity multi-factor) and **quantified that ~99% of the rest are illusions** once costs, replication shrinkage, and data-snooping are accounted for.
2. **The genuinely better-alpha frontier is the diversified commodity-futures multi-factor combo** — the only family where Tier-A evidence, low cost, and shortability line up. It owns **all 10** survivor slots.
3. **The highest *reported* Sharpes (ML/DL equity) are the least real** and vanish once you apply a replication haircut. Chasing them is negative expected value.
4. **Even the survivors are marginal:** net deflated Sharpe ≈ 0.57–0.72, deflated t ≈ 2.0–2.5, and only **1** clears t > 2.50. The honest conclusion is not "here are 10 money machines" but "these 10 are the only ones of 1,000 even worth a real, costed, out-of-sample backtest."

> **Bottom line:** Of 1,000 plausible strategies, **10 (1.0%)** survive transaction costs, replication shrinkage, and the data-snooping correction at 95% confidence — and **all 10 are the diversified commodity-futures multi-factor combo**. That, and only that, is the edge. The exercise's real value is showing how few survive, and why.

---

## 6. Reproduce / extend

```bash
python3 research/strategy_screen.py        # regenerate registry + funnel + survivor table
# output: research/strategy_registry_1000.csv  (1,000 rows, all fields)
```

To turn this screen into *actual* validation, replace the literature-grounded `gross_sharpe()` band with **your own walk-forward backtest Sharpe** per (family, market, params), keep the tier, cost, and Deflated-Sharpe haircuts, and re-run. **Never relax the survival logic** (deflated t > 1.96 against a cluster-based noise floor).

**Caveats (read before using any number):**
- Gross-Sharpe bands are *calibrated from the cited literature, not re-estimated from raw data here.*
- The tier haircut (×1.00 / ×0.85 / ×0.55) is a modeling choice grounded in replication-shrinkage evidence, not a measured constant.
- The cost model uses representative (not venue-exact) frictions.
- The noise floor assumes ~independence across clusters; correlated clusters would raise it (this screen is, if anything, slightly generous).
- All figures are modeled screening estimates, not live results, and not investment advice.

---

## 7. Sources (multiple-testing & replication methodology)

- Harvey, Liu & Zhu, *…and the Cross-Section of Expected Returns* (RFS 2016) — [Duke PDF](https://people.duke.edu/~charvey/Research/Published_Papers/P118_and_the_cross.PDF) · [NBER w20592](https://www.nber.org/papers/w20592)
- Hou, Xue & Zhang, *Replicating Anomalies* (RFS 2020) — [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3275496) · [NBER w23394](https://www.nber.org/system/files/working_papers/w23394/w23394.pdf)
- Li, Liu, Liu & Wei, *Replicating and Digesting Anomalies in the Chinese A-Share Market* (Management Science 2024) — [INFORMS](https://pubsonline.informs.org/doi/10.1287/mnsc.2023.4904)
- Chen & Zimmermann, *Open Source Cross-Sectional Asset Pricing* (Critical Finance Review 2022) — [openassetpricing.com](https://www.openassetpricing.com/) · [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3604626)
- Bailey & López de Prado, *The Deflated Sharpe Ratio* (2014) — [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2460551) · [PDF](https://www.davidhbailey.com/dhbpapers/deflated-sharpe.pdf)
- Bailey, Borwein, López de Prado & Zhu, *The Probability of Backtest Overfitting* — [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2326253)
- Liu, Stambaugh & Yuan, *Size and Value in China* (JFE 2019) — [NBER w24458](https://www.nber.org/system/files/working_papers/w24458/w24458.pdf)

*(Strategy-level alpha sources — commodity, options, equity-factor papers — are in the companion report `quant_trading_china_hk_top10_strategies.md`.)*
