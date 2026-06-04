# Vibe Coder Operation Platform — design docs

> **Product name: Vibe Coder Operation Platform (VCOP).** Name lineage: *formerly **IPO OS**,
> then **Capital Trust Center**, now **Vibe Coder Operation Platform***. The earlier names still
> appear in the historical debate docs below (esp. `06`, which is the naming debate itself) —
> read them as the same product under its prior working names. **Current direction is locked in
> [`19`](./19-locked-focus-decision-record.md); what's built + how to run is in
> [`20`](./20-mvp-build-and-run.md); brand/marketing/ops are in [`21`–`23`](./21-brand-visual-identity.md).**

> Original framing (historical): the AI-native operating system that takes AI builders
> from "having users" to audit-ready, funded, and capital-ready — AI does the heavy
> lifting, humans (auditor, attorney) reduced to review-and-sign-off.

## The one-sentence thesis

Most AI startups have **users and revenue but no path to the capital markets**.
Vibe Coder Operation Platform gives every AI startup an *always-on financial + legal back office* that is
cheap and addictive as a paid product — and turns the **best** of them into IPO
candidates faster and cheaper than any bank or law firm can.

## The three reshapes (your asks, sharpened)

1. **Narrow the ICP to "traceable-revenue" AI startups.**
   Only court companies whose revenue flows through a small set of verifiable rails
   — **Stripe, Apple App Store, Google Play / Google Ads, Meta**. Revenue you can
   pull read-only from an API is revenue you can *prove*. That single constraint
   collapses audit cost, audit time, and legal risk.

2. **Automate the audit.**
   AI agents pull source-of-truth data, build the reconciliations and workpapers,
   and hand the human auditor a clean exception list. The auditor reviews and signs;
   they do not assemble. (Realistic, compliance-aware version below.)

3. **Auto-generate the capital documents.**
   One verified data "spine" feeds the **pitch deck, S-1, and the legal stack**.
   Attorneys review and sign off instead of drafting from scratch. The system
   self-improves from every human edit.

## Files

| File | What's in it |
|------|--------------|
| [`00-business-model.md`](./00-business-model.md) | Positioning, ICP, the two-tier funnel (utility → IPO track), pricing, moat, why "traceable revenue" wins |
| [`01-agent-architecture.md`](./01-agent-architecture.md) | The agent roster, the single "revenue spine," human-in-the-loop boundaries, compliance guardrails |
| [`02-prompt-library.md`](./02-prompt-library.md) | Copy-paste **system prompts** for every agent (revenue truth, audit, S-1, deck, legal, IPO scoring, growth, self-improvement) |
| [`03-operation-plan.md`](./03-operation-plan.md) | 0→12-month phased rollout, GTM motion, the "must-have" hooks, metrics, risks & legal reality checks |
| [`04-stakeholder-debate.md`](./04-stakeholder-debate.md) | **Deep-research validation** — 10 stakeholders (founder, banker, attorney, auditor, regulator, VC, public investor, accountant, skeptic, competitor) debate the model with cited evidence; verdict + 6 forced pivots |
| [`05-coding-prompt.md`](./05-coding-prompt.md) | **Ready-to-use build prompt** for the A1 Revenue Truth MVP (deterministic verified-revenue engine), with the rationale tying each design choice to the research |
| [`06-positioning-debate.md`](./06-positioning-debate.md) | **Positioning & entry-point debate** (historical naming debate) — 10 stakeholders land on a neutral, lending-first positioning: enter via the **lending rail** (the real forcing function), Vanta/TrustMRR-grounded GTM, and how far "replace the CFO/CLO" can go |
| [`07-cap-table-and-expense.md`](./07-cap-table-and-expense.md) | **Auditable cap table + expense management** — Carta-style equity and Ramp/Brex-style spend built ON the verified spine, designed so every share, option, and dollar of spend is audit-traceable |
| [`08-diligence-catalog.md`](./08-diligence-catalog.md) | **Diligence catalog** — 184-item DB of what lenders/VC/PE/M&A request, tagged for auto-preparation (the automation backbone; data in `src/data/diligence/`) |
| [`09-vibe-coder-gtm-and-pricing.md`](./09-vibe-coder-gtm-and-pricing.md) | **ICP + pricing** — target the millions of "vibe coders"/Claude builders; capital-provider directory + process tracker; tiered subscription now, commission at PE/IPO |
| [`10-growth-and-distribution.md`](./10-growth-and-distribution.md) | **Growth** — day-one deadline-alert hook, agent-native distribution (MCP + Claude Connectors, GEO/AEO), viral loops, and linking to capital providers (debt-first; equity = broker-dealer caution) |
| [`11-cross-platform-distribution.md`](./11-cross-platform-distribution.md) | **Built-in everywhere** — one MCP server reused across Claude/Codex/Gemini/Cursor + Stripe/Supabase/Vercel marketplaces; the Vercel/Supabase infra-as-distribution playbook |
| [`12-capital-network-and-intros.md`](./12-capital-network-and-intros.md) | **Capital network** — continuous provider contact-data enrichment (reuses `pipeline/`) + premium warm-intro service with verified-data attach; two-sided monetization + broker-dealer guardrails |
| [`13-social-platform.md`](./13-social-platform.md) | **Vibe-coder social platform** — community/feed/verified leaderboard as the growth, retention, and badge-demand engine; cold-start and anti-spam-to-investors cautions |
| [`14-alpha-moment-provider-matching.md`](./14-alpha-moment-provider-matching.md) | **Alpha moment** — 71 named providers × 506 requirement mappings (`src/data/diligence/providers.json`): name a firm → exact checklist → % already prepared; reverse-match "firms you qualify for" |
| [`15-debt-and-credit-building.md`](./15-debt-and-credit-building.md) | **Debt-first + credit-building** — the bigger lending market; two-sided trust; an audit-based startup credit score from day one; "the key is seamless, not the fund" |
| [`16-three-alpha-moments.md`](./16-three-alpha-moments.md) | **The three alpha moments** — (1) instant paperwork-free growth loan off audited data; (2) meet many vibe coders (social); (3) be approached by investors with your DD report + business plan already done |
| [`17-reshape-review-debate.md`](./17-reshape-review-debate.md) | **Reshape review (10-agent debate)** — verdict: core thesis on track, but scope drifted into an everything-platform; ruthless-focus reshape (keep/sharpen/defer/cut) on the debt-wedge + spine |
| [`18-competitor-landscape.md`](./18-competitor-landscape.md) | **Competitor landscape** — who else in the world is building verified-data→capital, RBF/embedded lending, capital-readiness, diligence automation, and AI finance back office; differentiation & whitespace |
| [`19-locked-focus-decision-record.md`](./19-locked-focus-decision-record.md) | **LOCKED FOCUS (read this for current direction)** — narrow to the debt wedge; credit-from-day-one is the core moat; partner via lending aggregator; keep social lean; defer equity/IPO. Supersedes broader scope above. |
| [`20-mvp-build-and-run.md`](./20-mvp-build-and-run.md) | **MVP build & run** — the runnable vertical slice (`src/lib/cdp/`, `/capital` dashboard, `mcp/server.ts`); what's real vs stubbed; local run + hardening steps |
| [`21-brand-visual-identity.md`](./21-brand-visual-identity.md) | **Brand & visual identity** — positioning, voice, taglines, naming (VCOP/"Vibe", TrustScore), color/type tokens, logo SVG, UI aesthetic |
| [`22-marketing-gtm.md`](./22-marketing-gtm.md) | **Marketing & GTM** — "make you financeable" narrative, hooks, ranked channels, 8-week launch, growth loops, content engine, funnel & KPIs |
| [`23-operations.md`](./23-operations.md) | **Operations** — finder/flat-fee legal lane, FCRA/CRA boundary, aggregator + CPA panel ops, deterministic data pipeline, hiring, roadmap, company funding plan |
| [`24-product-naming.md`](./24-product-naming.md) | **Launch name (recommendation)** — VCOP is the codename; recommended launch brand **Attestly** (alts Capline/Attesta), sub-brands, tagline, due-diligence checklist. *Pending founder decision.* |

**Operational artifacts:** [`docs/ops/operational-readiness.md`](../ops/operational-readiness.md)
(gated go-live checklist) · [`docs/ops/aggregator-scorecard.md`](../ops/aggregator-scorecard.md)
(lending-partner selection).

## Read order
Start with `00`, skim `01` for the architecture, then `02` is the part you operate
day-to-day. **`04` is the validation** — read it before committing capital; it stress-
tests the model against real evidence and lists what must change. `03` is go-to-market.
`05` is what you hand a coding agent to start building.

## ⭐ Current direction (LOCKED) — see [`19`](./19-locked-focus-decision-record.md)
After the reshape debate (`17`) and competitor scan (`18`), scope is **narrowed to the debt
wedge**: *verified/audited spine → instant, paperwork-free growth debt for vibe coders*, with
**credit-from-day-one as the core moat**, **lending via an aggregator partner**, a **lean social/
badge** acquisition layer, and the **equity/IPO side deferred**. `19` is the authoritative
current plan; the docs below are the fuller design history.

## Earlier positioning (after debates `04` + `06`)
**Position as a neutral capital-readiness platform** (the working concept later named VCOP): the
AI-native finance + legal back office that keeps an AI startup *continuously, verifiably
capital-ready*, so it raises faster and cheaper from **anyone** — lenders, PE, banks, and
(eventually) public markets. Key decisions from the debates:

- **Name the recurring trust artifact, not the rare event.** "IPO" is the top rung of a
  ladder, not the brand (Vanta is a *trust* platform, not "SOC 2 OS").
- **Enter via the lending/borrower rail** ("Plaid for startup revenue") — the one place a
  capital provider will genuinely *refuse to fund without verified data*. VC is the
  weakest forcing function; treat it as accept-not-mandate.
- **Founder-free, capital-provider-paid** monetization (Plaid/credit-bureau model) +
  premium founder tiers during raises.
- **"AI does the work of a CFO + GC; a named human signs the last 20%"** — own the
  unclaimed *finance↔legal integrating layer*; never market "replace the CFO/CLO."
- **Hard neutrality firewall** — subscription/access fees only, never a deal counterparty
  (the Carta lesson) — the precondition for becoming a multi-acceptor *standard*.

**Everything rests on one spine: deterministic, audit-traceable verified data.** Build
`05` (Revenue Truth) first; `07` extends the same auditable spine to cap table + expense.
