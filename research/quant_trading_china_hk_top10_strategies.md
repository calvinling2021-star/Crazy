# Automated / Quant Trading in Chinese & Hong Kong Markets — Validated Research Review and Top‑10 Alpha Strategies

**Prepared:** 2026‑05‑30
**Scope:** Mainland China A‑shares, Hong Kong (HKEX) equities, China ETF/index options (50ETF, 300ETF), Chinese commodity futures, and cross‑border (A/H) strategies.
**Goal:** Surface the most up‑to‑date, *legitimate* research, validate each paper's methodology, and rank the top 10 strategies by demonstrated, credible alpha.

> ⚠️ **Read this first — how to interpret the rankings.** "Best alpha" in a paper is *not* the same as "best strategy to deploy." Headline Sharpe ratios in trading papers are routinely inflated by look‑ahead bias, survivorship, unrealistic fill assumptions, and data‑snooping (testing thousands of factor combinations and reporting the winner). This review **deliberately ranks peer‑reviewed, replicated, cost‑aware results above flashy preprint numbers.** Where a paper reports a Sharpe of 2.0+ with <5% drawdown, that is treated as a *red flag to investigate*, not a badge of quality. Nothing here is investment advice; all figures are *in‑sample or backtested research results*, not live track records.

---

## 1. Methodology — how each paper was validated

Each source was scored against a standard backtest‑integrity checklist:

| Validation criterion | Why it matters |
|---|---|
| **Peer‑reviewed vs. preprint** | arXiv/SSRN preprints are unrefereed; journal papers have survived referee scrutiny. |
| **Out‑of‑sample / walk‑forward** | In‑sample fit is nearly meaningless; OOS is the minimum bar. |
| **Transaction costs & slippage** | China A‑shares have ~0.05% commission + 0.05% stamp duty (sell‑side, halved in Aug 2023) + meaningful impact; ignoring costs can flip a profitable strategy to a loss. |
| **Look‑ahead / survivorship bias** | Using restated fundamentals, delisted‑stock exclusion, or future data inflates returns. |
| **Data‑snooping / multiple‑testing control** | "Factor zoo" mining inflates t‑stats; credible work uses higher hurdles (t > 3) or Bonferroni/FDR controls. |
| **Sample length & regime coverage** | Must span bull (2014–15), crash (2015–16, 2018), and recent (2021–24) regimes. |
| **Replication by independent authors** | The strongest signal of legitimacy. |

**Credibility tiering used below:**
- **Tier A (High):** Peer‑reviewed, replicated, cost‑aware, multiple market regimes.
- **Tier B (Moderate):** Peer‑reviewed but single‑study, or strong preprint with realistic costs.
- **Tier C (Speculative):** Unrefereed preprint and/or metrics that are statistically implausible (likely overfit).

---

## 2. The research landscape (what was found and validated)

### 2.1 Foundational factor models — the credibility anchor
The **Liu, Stambaugh & Yuan "Size and Value in China" (CH‑3 / CH‑4) model** (*Journal of Financial Economics*, 2019; NBER w24458) is the gold‑standard reference for Chinese cross‑sectional alpha. Key validated facts:
- Monthly data **Jan 2000 – Dec 2016**.
- Replaces book‑to‑market with **earnings‑price (E/P)** as the value proxy, and **excludes the smallest 30% of firms** (shell‑company / reverse‑merger contamination — a genuine A‑share microstructure quirk).
- Value factor (VMG) **alpha ≈ 140 bps/month (~16.8%/yr), t = 7.94** — an unusually robust, replicated result.
- CH‑3 dominates a naïve Fama‑French‑in‑China replication, which leaves a ~17%/yr alpha on the E/P factor.

This is **Tier A** and the benchmark against which the machine‑learning papers should be judged. (Sources: Wharton/NBER PDFs.)

**Replication evidence:** *Replicating and Digesting Anomalies in the Chinese A‑Share Market* (*Management Science*, 2024) and *Taming the Factor Zoo: New Evidence from China* (Wiley, 2021) both confirm that the **CH‑3/CH‑4 four‑factor model subsumes most of 100+ anomalies**, and that the improvement from additional mined anomalies is *limited*. This is the single most important validation result in the whole field: **most "new alpha factors" in China do not survive once you control for size, value, and mispricing.**

### 2.2 Mispricing & short‑term reversal — the strongest *raw* anomaly
Multiple peer‑reviewed studies (*Pacific‑Basin Finance Journal*: "Anomalies in the China A‑share market," "Mispricing and anomalies in China") confirm:
- **Short‑term reversal, abnormal turnover, and idiosyncratic volatility** are the most economically significant anomalies in A‑shares — far stronger than in the US, driven by ~80% retail participation and speculative turnover.
- Anomalies concentrate in the **short leg (overpriced stocks)**, consistent with short‑sale constraints. This makes much of the paper alpha **hard to harvest** (you often can't short the cheap‑to‑borrow names).

### 2.3 Machine‑learning / deep‑learning A‑share strategies — high numbers, low validation
Two 2025–26 arXiv preprints dominate the "highest Sharpe" search results:
- **Du (2025), "ML‑Enhanced Multi‑Factor Quantitative Trading" (arXiv 2507.07107):** 500–1000 factors (alpha101 extensions + microstructure), walk‑forward train 2010–20 / val 2020–21 / **OOS test 2021–24**, reported **20.4% ann. return, Sharpe ≈ 2.01.**
- **(2024) "Deep Learning Enhanced Multi‑Day Turnover" (arXiv 2506.06356):** train 2010–20, test 2021–24, **15.2% ann. return, Sharpe ≈ 1.87, max drawdown < 5%,** 50–100 positions, ≤9‑day holding.

**Validation verdict — Tier C.** Both are **single‑author, non‑peer‑reviewed** preprints (lead author a USTC graduate student). The metrics are *statistically suspicious*: a Sharpe near 1.9–2.0 with **max drawdown under 5%** over a turbulent 2021–24 A‑share period is implausible for a long‑only‑ish equity strategy without aggressive look‑ahead or cost omission. Treat the *methodology* (cross‑sectional ML + bias correction) as a reasonable template but the *numbers* as upper‑bound, likely‑overfit. **Do not rank these #1 despite having the highest reported alpha.**

### 2.4 Commodity futures — the most cleanly validated tradable alpha
Chinese commodity futures are the *best* category for credible, cost‑aware alpha because they're liquid, shortable, and lightly retail‑arbitraged on the factor level:
- **"An anatomy of commodity futures returns in China"** (*Pacific‑Basin Finance J.*, 2020) and **"Commodity momentum: A tale of countries and sectors"** (*J. Commodity Markets*, 2023): a **combined factor portfolio (momentum + basis + basis‑momentum + value + hedging pressure, ex‑precious‑metals) reaches Sharpe ≈ 1.67.**
- **Time‑series momentum** in China commodities (peer‑reviewed, *J. Futures Markets* 2019; deep‑learning extension 2024): LSTM TSM with Sharpe‑in‑the‑loss‑function improves risk‑adjusted returns; single‑signal momentum L/S ≈ Sharpe 1.11, baseline ≈ 0.38–0.43 for carry.
- **"Curve Momentum in China"** (*J. Futures Markets*, 2024) and **"Evaluating Trend‑Based Strategies in Chinese Commodity Futures"** (*J. Futures Markets*, 2025): curve momentum delivers excess returns "comparable to or exceeding traditional futures factors," with an investor‑herding mechanism.

These are **Tier A/B** — peer‑reviewed, shortable, and the multi‑signal combination is the most realistic deployable alpha in the entire review.

### 2.5 China ETF/index options — volatility risk premium
- **"Volatility‑based strategy on Chinese equity index ETF options"** (arXiv 2403.00474): trades 50ETF/300ETF options off a volatility forecast vs. implied.
- Peer‑reviewed evidence (*Review of Economics & Finance*; *Management System Engineering* 2025) confirms a **persistent variance risk premium**: ~62–63% of delta‑hedged call/put gains are negative, i.e., **option buyers systematically overpay for variance** → short‑volatility / delta‑hedged short‑straddle strategies earn a premium. Put‑call ratio, skew, and the China VIX have **statistically significant return predictability**, and a simple options‑signal market‑timing overlay improves annualized return and cuts risk.

**Validation verdict — Tier B.** The VRP is real and replicated, but short‑vol strategies carry severe **tail risk** (the Sharpe looks great until a gap‑down wipes out months of premium). Any reported Sharpe must be read alongside max drawdown / left‑tail, which these papers under‑emphasize.

### 2.6 Hong Kong (HKEX) — thinner academic alpha, more microstructure
- **HKIMR (HK Monetary Authority) report on Algorithmic & HFT in HK equities** (SSRN 4269748): institutional/market‑impact study, not a tradable‑alpha paper, but the authoritative reference on HK algo‑trading structure.
- **Yan et al. (2024), QFE** "ML‑based volatility quantitative investment strategies" (Hong Kong focus): 3 GARCH‑family × 6 ML models = 18 combinations forecasting next‑day volatility for trade timing. Peer‑reviewed (**Tier B**) but the HK‑specific return/Sharpe figures are not fully disclosed in accessible text.
- **"Increasing the Hong Kong Stock Market Predictability: A Temporal Convolutional Network Approach"** (*Computational Economics*, 2024): peer‑reviewed predictability study.

### 2.7 Cross‑border A/H — structurally attractive, practically hard
The **A‑H premium** (A‑shares persistently trade at a double‑digit premium to the same company's H‑shares) is a textbook "Siamese‑twin" mispricing. Classic dual‑listing arbitrage work (de Jong, Rosenthal & van Dijk, *Review of Finance* 2009) finds **risk‑adjusted abnormal returns up to ~10%/yr after costs** — but with **high idiosyncratic volatility, no convergence guarantee, and capital/short‑sale frictions** (you generally cannot short A‑shares to capture convergence; Stock Connect is one‑directional for shorting). **Tier B in theory, Tier C in practice** for most participants.

---

## 3. TOP 10 STRATEGIES — ranked by *credible, deployable* alpha

Ranking weights **validation quality** alongside raw alpha. A strategy with Sharpe 1.4 that is peer‑reviewed, shortable, and cost‑aware outranks a Sharpe‑2.0 unrefereed preprint.

| # | Strategy | Market / Instrument | Reported alpha (as published) | Sample / OOS | Credibility | Key caveat |
|---|---|---|---|---|---|---|
| **1** | **Multi‑signal commodity factor combo** (momentum + basis + basis‑momentum + value + hedging pressure, ex‑precious metals) | China commodity futures (~40 contracts) | **Sharpe ≈ 1.67**; basis/spot signal ~+1.73%/mo (Sharpe ~1.40) | 2008–2019, peer‑reviewed | **A** | Capacity‑limited; needs roll/cost management |
| **2** | **CH‑3 / CH‑4 value (E/P) + size factor** | China A‑shares | VMG **~16.8%/yr alpha, t = 7.94** | 2000–2016, replicated (Mgmt Science 2024) | **A** | Long‑short value; long‑only capture weaker |
| **3** | **Curve / term‑structure momentum** | China commodity futures | Excess return ≥ traditional futures factors; TS‑momentum factor OOS Sharpe ~1.08 | peer‑reviewed (JFM 2024/2025) | **A** | Herding‑driven; crowding risk |
| **4** | **Variance‑risk‑premium / short‑volatility (delta‑hedged short straddle)** | SSE 50ETF & CSI 300ETF options | ~62% of delta‑hedged option gains negative → systematic seller premium | 2015–2022, peer‑reviewed | **B** | Severe left‑tail; needs tail hedge & strict sizing |
| **5** | **Time‑series momentum (LSTM, Sharpe‑in‑loss)** | China commodity futures | Single‑signal L/S Sharpe ~1.11; DL improves risk‑adjusted return | peer‑reviewed + 2024 DL ext. | **B** | DL adds overfit risk vs. linear TSM |
| **6** | **Mispricing / short‑term reversal + turnover + idio‑vol composite** | China A‑shares | Strongest raw anomalies in A‑shares; alpha concentrated in short leg | peer‑reviewed (Pacific‑Basin) | **B** | Short‑sale constrained → hard to harvest fully |
| **7** | **Options‑signal market timing** (put‑call ratio, skew, China VIX) | 50ETF/300ETF options + underlying | "Economically & statistically significant" return predictability; improves ann. return, cuts risk | peer‑reviewed | **B** | Signal decay; regime‑dependent |
| **8** | **Cross‑sectional ML multi‑factor (alpha101 + microstructure)** | China A‑shares | **20.4%/yr, Sharpe ≈ 2.01** | train 2010–20 / OOS 2021–24 | **C** | Unrefereed, single author; metrics likely optimistic |
| **9** | **Deep‑learning multi‑day‑turnover stock selection** | China A‑shares | **15.2%/yr, Sharpe ≈ 1.87, maxDD < 5%** | train 2010–20 / OOS 2021–24 | **C** | <5% DD implausible → suspected cost/look‑ahead issues |
| **10** | **A‑H premium convergence / dual‑listing arbitrage** | A‑shares vs. H‑shares (Stock Connect) | Risk‑adj. abnormal return up to ~10%/yr after costs | classic + ongoing | **C (practice)** | No convergence guarantee; short‑side frictions |

### Why the ordering is *not* by headline Sharpe
The two highest‑Sharpe results (#8, #9 — the ML/DL A‑share preprints) are ranked **8th and 9th**, not 1st and 2nd, precisely because their numbers fail the validation checklist (unrefereed, single‑author, implausibly low drawdown). The top of the table is held by **peer‑reviewed commodity‑futures factor strategies and the replicated CH‑3 value factor** — lower headline Sharpe, far higher confidence.

---

## 4. Credible vs. likely‑overfit — explicit call

**Most credible (would survive independent replication):**
- CH‑3/CH‑4 value & size factor (replicated in *Management Science* 2024).
- Multi‑signal commodity‑futures factor combination (multiple peer‑reviewed groups, shortable market, cost‑aware).
- Variance risk premium in 50ETF options (mechanism is structural, replicated).

**Likely overfit / over‑optimistic (treat numbers as upper bounds):**
- Both single‑author A‑share ML/DL preprints (arXiv 2507.07107, 2506.06356) — Sharpe ~1.9–2.0 with <5% drawdown is the classic signature of look‑ahead bias, omitted transaction costs, or selection over many model runs.
- Any "factor zoo" anomaly not subsumed by CH‑4 — the replication literature shows the marginal anomaly adds little.
- A‑H arbitrage *as a standalone profit engine* — structurally real, practically capped by short‑sale and convergence‑horizon risk.

---

## 5. Practical takeaways for building an automated system

1. **Anchor on commodity‑futures multi‑factor + CH‑4 equity factors.** These are the only categories with replicated, shortable, cost‑survivable alpha. Build the core book here.
2. **Use the options VRP as a *carry sleeve*, not a core engine,** and always pair short‑vol with explicit tail hedges and hard position limits — the Sharpe is a mirage without left‑tail control.
3. **Treat ML/DL stock‑selection papers as feature‑engineering inspiration, not performance promises.** If you replicate them, impose **realistic A‑share costs** (commission + 0.05% sell‑side stamp duty + impact), proper **point‑in‑time fundamentals**, and **delisted‑stock inclusion** — expect reported Sharpe to roughly halve.
4. **Re‑derive every metric yourself with a higher significance hurdle (t > 3)** and walk‑forward OOS before risking capital. The China factor‑zoo literature is explicit that most mined factors evaporate under CH‑4 controls.
5. **Hong Kong is better treated as an execution/microstructure venue** (and the short leg for A/H ideas) than as a source of independent published alpha — the academic alpha literature there is thin.

---

## 6. Source list

**A‑share factor models & anomalies (Tier A/B)**
- Liu, Stambaugh & Yuan, *Size and Value in China* — [NBER w24458 PDF](https://www.nber.org/system/files/working_papers/w24458/w24458.pdf) · [Wharton PDF](https://faculty.wharton.upenn.edu/wp-content/uploads/2018/03/Size-and-Value-in-China.pdf) · [ScienceDirect (JFE)](https://www.sciencedirect.com/science/article/pii/S0304405X19300625)
- *Replicating and Digesting Anomalies in the Chinese A‑Share Market* — [Management Science](https://pubsonline.informs.org/doi/10.1287/mnsc.2023.4904)
- *Taming the Factor Zoo: New Evidence from China* — [Wiley](https://onlinelibrary.wiley.com/doi/10.1155/2021/9592906)
- *Anomalies in the China A‑share market* — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0927538X21001141)
- *Mispricing and anomalies in China* — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0927538X2300104X)
- *Mispricing Factors* (Stambaugh & Yuan, RFS) — [Oxford Academic](https://academic.oup.com/rfs/article/30/4/1270/2965095)

**Machine learning / deep learning A‑share (Tier C)**
- Du, *ML‑Enhanced Multi‑Factor Quantitative Trading* — [arXiv 2507.07107](https://arxiv.org/abs/2507.07107)
- *Deep Learning Enhanced Multi‑Day Turnover Quantitative Trading Algorithm for Chinese A‑Share Market* — [arXiv 2506.06356](https://arxiv.org/abs/2506.06356)
- *A Deep Reinforcement Learning Framework for Dynamic Portfolio Optimization: Evidence from China's Stock Market* — [arXiv 2412.18563](https://arxiv.org/pdf/2412.18563)

**Commodity futures (Tier A/B)**
- *Curve Momentum in China* — [J. Futures Markets / Wiley](https://onlinelibrary.wiley.com/doi/10.1002/fut.70093)
- *Evaluating Trend‑Based Strategies in Chinese Commodity Futures Markets* — [J. Futures Markets / Wiley](https://onlinelibrary.wiley.com/doi/10.1002/fut.70033)
- *An anatomy of commodity futures returns in China* — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0927538X20301086)
- *Commodity momentum: A tale of countries and sectors* — [ScienceDirect (J. Commodity Markets)](https://www.sciencedirect.com/science/article/abs/pii/S2405851323000053)
- *Momentum and reversal strategies in Chinese commodity futures markets* — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S1057521918305696)
- *Understanding the complexity of futures markets investing in China (deep learning)* — [Springer / Annals of Operations Research](https://link.springer.com/article/10.1007/s10479-024-06277-x)

**Options / volatility (Tier B)**
- *Volatility‑based strategy on Chinese equity index ETF options* — [arXiv 2403.00474](https://arxiv.org/abs/2403.00474)
- *Asymmetry in option implied volatility and yield: Evidence from China's ETF options market* — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0927538X24001379)
- *Asymmetric information of variance risk premium in the Chinese market* — [Springer](https://link.springer.com/article/10.1007/s44176-025-00044-3)
- *Implied volatility information of Chinese SSE 50 ETF options* — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1059056022001939)
- *The Chinese equity index options market* — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S1566014119302341)
- *Research on Minimum Variance Delta Hedging Strategy of CSI 300ETF Options* — [STEMM Press PDF](http://www.stemmpress.com/uploadfile/202503/4e0dee7c2305fc6.pdf)

**Hong Kong (Tier B)**
- HKIMR, *Algorithmic and High‑Frequency Trading in Hong Kong's Equity Market* — [SSRN 4269748](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4269748) · [AOF PDF](https://www.aof.org.hk/docs/default-source/hkimr/applied-research-report/ahftrep.pdf)
- Yan et al., *Machine learning‑based analysis of volatility quantitative strategies* — [AIMS Press QFE PDF](https://www.aimspress.com/aimspress-data/qfe/2024/2/PDF/QFE-08-02-014.pdf)
- *Increasing the Hong Kong Stock Market Predictability: A Temporal Convolutional Network Approach* — [Springer / Computational Economics](https://link.springer.com/article/10.1007/s10614-024-10547-y)

**Cross‑border A/H (Tier B/C)**
- de Jong, Rosenthal & van Dijk, *The Risk and Return of Arbitrage in Dual‑Listed Companies* — [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=525282) · [RePEc](https://ideas.repec.org/r/oup/revfin/v13y2009i3p495-520.html)
- *The AH premium: A tale of "siamese twin" stocks* — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0927539825000210)

---

*Disclaimer: This is a research synthesis of published academic/practitioner work for educational purposes. All performance figures are backtested or in‑sample results reported by the cited authors, not live trading results, and do not constitute investment advice. Reported metrics — especially from unrefereed preprints — should be independently re‑validated before any capital is deployed.*
