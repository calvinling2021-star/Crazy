# 23 — Operations Plan (VCOP)

> **Thesis:** prove *"verified financials → funded debt"* for AI builders **without ever becoming a
> regulated lender, broker-of-record, or credit bureau.** Everything flows from four
> non-negotiables: deterministic numbers, human-signed attestation, absolute neutrality, and a
> debt-referral / flat-fee legal lane.

## 1. Company setup, legal & regulatory
- **Delaware C-corp** (`VCOP, Inc.`); standard founder vesting + IP assignment day one (the
  deterministic spine is a trade secret). **No lending SPV / "VCOP Capital" entity** — a separate
  vehicle is the moment you look like a lender.
- **(a) Lending / broker-dealer / finder.** Operate as a **flat-fee finder/referral partner**, never
  lend, never take a participation, never negotiate terms. Commercial-loan brokering is unlicensed in
  most states (~9 license it); **pure flat-fee referral that doesn't negotiate terms is generally
  permitted.** Bright-line rules (in product + training): VCOP never (1) quotes/negotiates
  rate/points/term/prepayment, (2) takes a cut of proceeds, (3) collects the application, (4)
  recommends one offer over another. [c-loans; eCapital; Focus Law LA]
- **(b) Commercial-financing disclosure laws (CFDLs).** ~9 states (CA, CT, FL, GA, KS, MO, NY, UT,
  VA) require APR-style disclosures on commercial financing incl. RBF. **Push the disclosure +
  registration obligation onto the aggregator/funder-of-record (contractually), confirm per state.**
  [ABA survey; Nexi]
- **(c) FCRA / fair lending / "is the score a consumer report?"** (highest stakes). A score about
  the **business entity**, from the business's own rails, is **not** a consumer report. **Do not
  cross the line:** keep the VCOP score **entity-level only** — no personal-credit inputs, never
  furnished to decide about an individual; if a partner needs personal credit/PG, **the aggregator
  pulls it under their own permissible purpose.** ECOA/Reg B adverse-action sits with the funder, but
  since the score *influences* surfacing, **test the deterministic model for disparate impact** and
  document business-financial-only inputs. [FTC FCRA; NACM]
- **(d) Data privacy / consent.** Read-only by design: explicit Plaid-style consent (named scopes,
  read-only, retention, one-click disconnect+delete), least-privilege OAuth (never write/move-money),
  GDPR/CCPA policy + DPAs (EU deferred until lawful-basis story exists).
- **(e) Security / SOC 2.** Start SOC 2 day one (Vanta/Drata): Type I in ~2–4 months → 3-month
  observation → Type II; budget ~$30–75k year one. Day-one hygiene: SSO+MFA, encryption, secrets mgmt,
  access reviews, IR runbook. [Drata; soc2auditors]
- **Counsel sequencing:** (1) fintech/consumer-finance regulatory counsel week 1 — finder/flat-fee,
  CFDL allocation, FCRA/CRA-boundary memo; (2) privacy counsel; (3) securities counsel (confirm
  flat-fee ≠ broker-dealer); (4) fractional CISO / SOC 2 firm.
- **Gates.** *Before charging any referral fee:* finder structure blessed; aggregator owns
  funder-of-record + state disclosures; "never quote terms" rule in product. *Before the score
  influences a credit decision:* entity-level only; disparate-impact memo; consent + read-only live;
  CRA-boundary memo; dispute process operational.

## 2. Partnerships & vendor ops
- **Lending aggregator (load-bearing):** lead with **Lendflow** (embedded-lending *infrastructure* +
  marketplace breadth + neutrality), **Lendio** secondary for offer depth, **Parafin** optional
  balance-sheet supply *only as one funder among many*. Must be funder-of-record + own state
  disclosures, expose a pre-qual/offer API an MCP agent can drive, and consume VCOP's verified package
  to improve underwriting. **Commercial: flat per-funded-referral or flat platform fee — never % of
  loan.** SLAs on pre-qual latency, offer decision, uptime, webhooks, breach notice, audit rights.
- **Rail connectors:** Stripe (revenue) + Plaid (bank) + a few high-signal rails; read-only scopes;
  connector abstraction so adding rails is config.
- **Audit/attestation panel:** independent CPA firms that human-sign attestations — VCOP is **never**
  the attestor. Operate neutrally (objective admission, round-robin/customer-choice, no VCOP stake,
  published conflict policy).
- **KYC/identity:** Persona or Alloy (KYB for the business, optional KYC for the principal); where
  possible let the **aggregator's KYC be system-of-record** so VCOP isn't making identity-based credit
  calls.
- **Neutral-panel rule:** no counterparty pays for placement/ranking; ranking by objective
  borrower-fit only; log every routing decision.

## 3. Underwriting & data ops
```
Read-only ingest (Stripe/Plaid/…) → Deterministic spine (rules, NO AI in the numbers)
  → Entity credit score (explainable, entity-level inputs) → Aggregator pre-qual (hand over package)
  → Offers surfaced (neutral panel) → Docs executed with the FUNDER off-platform (VCOP never counterparty)
```
- **Deterministic spine = core invariant.** All figures computed by versioned, testable, reproducible
  rules — never an LLM. AI only for narrative/UX, labeled, never fed back into a number. Every figure
  carries provenance (source rail, record IDs, transform version, timestamp); golden-file tested in CI.
- **Human-in-the-loop:** CPA attestation sign-off; anomaly/exception review; score-publish gate for
  first cohort/edge cases; pre-referral consent+scope check.
- **Exceptions:** typed queue (missing data, conflicts, suspected fraud, restatement) blocks downstream
  publication; SLA per type; full audit trail.
- **Auditable:** immutable append-only event log for every ingest/transform/score-change/sign-off/
  referral; reproducibility test in CI; **conservative completeness claims** ("verified across connected
  Stripe + bank Jan–Jun; PayPal not connected").

## 4. Team & hiring (priority order)
1. Lead engineer — data spine *(now)*. 2. Compliance/regulatory lead or strong fractional GC *(now)*.
3. Full-stack/connectors engineer *(now)*. 4. Head of Partnerships/BD *(0–3mo — supply or the wedge is
dead)*. 5. Data/underwriting analyst (human-in-loop) *(0–3mo)*. 6. Security/platform + SOC2 owner
*(0–6mo)*. 7. Founding designer/PM *(0–6mo)*. 8. Customer Ops / Trust & Safety *(3–6mo)*. 9.
Growth/DevRel (MCP ecosystem) *(6–9mo)*. 10. Founding AE/CS *(6–12mo, once verified→funded proven)*.
**Outsource/fractional:** finance (fractional CFO + bookkeeper), legal (regulatory/privacy/securities
on retainer), compliance tooling (Vanta/Drata + fractional CISO), CPA attestation (the panel).

## 5. Tooling
Eng: GitHub + Actions CI (reproducibility tests as gates), Linear, AWS/GCP single-region, IaC, feature
flags. Data: event log / warehouse (BigQuery or Postgres+dbt), deterministic engine as a versioned
service w/ golden-file tests, lineage tracking. MCP: typed read-only server. Support: Plain/Intercom +
status page. Comms: Slack + Notion (runbooks/RACI/IR). Analytics: PostHog + KPI dashboard. Billing:
**Stripe Billing, flat-fee SKUs only** (never % of loan). Security: Vanta/Drata, secrets manager,
SSO+MFA, Persona/Alloy.

## 6. Customer ops
- **Onboarding:** sign up (agent or web) → consent + connect rails (explicit, read-only, named scopes,
  disconnect/delete visible) → deterministic spine computes financials w/ provenance → entity score
  (fully explainable) → optional CPA attestation → opt-in neutral pre-qual → offers from panel →
  transact with funder off-platform.
- **Support:** tiered self-serve/agent → async → human ops; fast lane for funding-blocking issues;
  public status page.
- **Trust & safety:** KYB/KYC at connect; detect synthetic/inflated revenue (circular Stripe flows,
  wash txns, unverifiable spikes); **if any social "share my verified metrics" ships → opt-in only,
  rate-limited, verified-recipient, no scraping, never unsolicited to investors.**
- **Verified-data dispute process:** flag → trace to source via provenance log → re-sync/annotate →
  **re-run deterministic spine (reproducible)** → CPA re-signs if attested → notify with the diff +
  audit trail. FCRA-style rigor even though entity scores aren't consumer reports (right posture +
  future-proof).

## 7. Metrics & cadence
- **North-star:** **# of "verified → funded" outcomes** (and $ funded).
- **Dashboard:** funnel (signup→connect→score→pre-qual→offers→funded); trust/quality (attestation rate,
  **deterministic reproducibility = 100%**, dispute rate + time-to-resolve, exception-queue age);
  partner health (latency, offer/approval rate, SLA); risk/compliance (% referrals w/ valid consent +
  read-only = 100%, disparate-impact status, SOC2 control pass); business (flat-fee revenue, CAC,
  agent-channel activation).
- **Rhythm:** weekly (funnel + exceptions + partner SLA + compliance check-in); monthly (north-star +
  cohort conversion + risk register + partner review + finance close); quarterly (regulatory counsel
  review of new CFDLs/FCRA posture, model fairness re-test, SOC2 progress, roadmap reset).
- **Risk register (top 8):** 1 reclassified as lender/broker → flat-fee finder + never quote terms +
  aggregator funder-of-record + memo. 2 score deemed consumer report/VCOP a CRA → entity-only, no
  personal credit, CRA-boundary memo. 3 neutrality breach → no pay-for-placement, log routing. 4
  AI-guessed number leaks → deterministic-only + golden-file CI gate. 5 state CFDL non-compliance →
  obligation on funder + per-state gating. 6 data breach → least-privilege + SOC2 + IR. 7 aggregator
  concentration → multi-funder panel + secondary. 8 fraudulent revenue funded → KYB/KYC + anomaly gate
  + conservative claims + human sign-off.

## 8. Roadmap + funding plan
- **0–30d (foundation & legality):** DE C-corp + IP; engage regulatory + privacy counsel (finder /
  FCRA-CRA / CFDL memos); Vanta/Drata; read-only consent flow + Stripe connector; open Lendflow talks.
  *Gate: legal structure blessed before any fee.*
- **30–90d (spine + first partner):** ship deterministic engine (reproducible, provenance, golden-file
  CI); entity score v1 + disparate-impact test; sign one aggregator (funder-of-record + disclosures on
  them); 2–3 CPA panel firms; SOC2 Type I audit-ready; **private alpha: first verified→funded.** *Gate:
  score-influence prerequisites all true.*
- **90–180d (prove the wedge):** repeatable cohort of **verified→funded**; attestation + dispute live;
  +2–3 rails; MCP distribution live; SOC2 Type II observation begins; add Lendio; expand to clean-CFDL
  states.
- **180–365d (scale & harden):** SOC2 Type II report; mature multi-funder panel; lean social/DevRel;
  improving funder-approval rates prove the audited-data underwriting lift. *Still no balance sheet, no
  equity product, no IPO.*
- **Company's own raise:** bootstrap / **pre-seed $1–2.5M** now (insight + team + legal clarity); **seed
  ~$4–8M** on the 90–180d milestone (verified→funded repeatability + signed aggregator + SOC2 Type I +
  clean memos — the evidence is the raise, not a deck); **Series A** on the 180–365d milestone
  (cohort conversion + multi-funder panel + Type II + proof VCOP data improves approval/loss rates).
  Raising *equity for the company* is fine; *offering equity products / becoming a counterparty* is the
  line we don't cross.

> Sources: C-Loans & eCapital (referral/finder licensing) · Focus Law LA & Mayer Brown (finder vs
> broker) · FTC FCRA & NACM (consumer-report boundary) · ABA Business Lawyer & Nexi (state CFDLs) ·
> Drata & soc2auditors (SOC 2 timeline/cost).
