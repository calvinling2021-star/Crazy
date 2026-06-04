# Operational Readiness Checklist

> Actionable, gated checklist to take VCOP (codename) from "MVP runs" to "first verified→funded
> in production." Strategy rationale is in [`docs/ipo-os/23-operations.md`](../ipo-os/23-operations.md).
> Check items as done; **do not pass a 🔒 GATE until every item above it is checked.**

## Phase 0 — Foundation (Weeks 1–2)
- [ ] Incorporate **Delaware C-corp**; founder vesting + IP assignment signed by all contributors.
- [ ] Engage **fintech/consumer-finance regulatory counsel** (kickoff the three memos below).
- [ ] Engage **privacy counsel** (or same firm) for the consent flow + DPA templates.
- [ ] Stand up **SOC 2** tooling (Vanta or Drata); enable SSO + MFA, secrets manager, access reviews.
- [ ] Buy/secure domains + **GitHub org** + social handles for the chosen launch name (see `24`).
- [ ] Provision a Stripe **restricted, read-only** key; confirm the connector uses it (`STRIPE_SECRET_KEY`).

### 🔒 GATE A — "May we charge any referral fee?"
- [ ] **Memo 1: Finder / flat-fee structure** signed off (we never quote/negotiate terms, never take
      % of proceeds, never complete the application, never recommend one offer).
- [ ] **Aggregator contract** makes the partner the **funder-of-record** and owner of state
      **CFDL disclosure/registration** in every state we operate.
- [ ] "We don't quote/negotiate terms" rule baked into product copy + team training.

## Phase 1 — Deterministic spine + first partner (Weeks 3–12)
- [ ] Ship the **deterministic engine** (versioned, provenance on every figure, golden-file tests in CI).
- [ ] **Credit score v1** (entity-level inputs ONLY; explainable factors surfaced to the founder).
- [ ] **Disparate-impact test** on the score (business-financial inputs only; no protected-class proxies).
- [ ] **Memo 2: FCRA / CRA-boundary** concluding the entity score is not a consumer report for this use.
- [ ] **Memo 3: CFDL state allocation** — which states are clean to operate at launch.
- [ ] Sign **one lending aggregator** (see `aggregator-scorecard.md`); integrate pre-qual → offer API.
- [ ] Recruit **2–3 independent CPA panel firms** (license + E&O + independence attestation on file).
- [ ] Build the **read-only consent screen** (named scopes, read-only, retention, 1-click disconnect+delete).
- [ ] Stand up the **exception queue** + the **verified-data dispute process**.
- [ ] **SOC 2 Type I** audit-ready.

### 🔒 GATE B — "May the score influence a credit decision / go to a lender?"
- [ ] Score is **entity-level only** (no personal credit inputs).
- [ ] Disparate-impact memo on file.
- [ ] Consent + read-only scopes live; reproducibility test = **100%** in CI.
- [ ] CRA-boundary memo concluded; dispute process operational.

## Phase 2 — Prove the wedge (Weeks 12–26)
- [ ] **Private alpha: first verified→funded** end-to-end (north-star = # funded).
- [ ] Attestation sign-off (CPA) wired before any "audited/verified" claim ships.
- [ ] Add 2–3 more rails (Plaid bank first — unlocks burn/runway).
- [ ] **MCP server** live + listed (Claude Connectors / Cursor / Codex registries).
- [ ] Begin **SOC 2 Type II** observation window.
- [ ] Add **secondary aggregator** (avoid single-partner concentration).
- [ ] Expand only to states cleared by Memo 3.

## Phase 3 — Scale & harden (Weeks 26–52)
- [ ] **SOC 2 Type II** report issued.
- [ ] Multi-funder neutral panel mature (objective routing; no pay-for-placement; routing logged).
- [ ] Lean social / DevRel growth loops live (verified badge — opt-in, never spam-to-investors).
- [ ] Evidence pack: VCOP-verified data measurably improves funder approval / loss rates.

## Always-on guardrails (every release)
- [ ] No AI-produced number reaches the spine (AI = narrative/UX only, labeled).
- [ ] Every figure carries provenance; completeness claims state exactly what's connected.
- [ ] Absolute neutrality: never a counterparty; never trade on a user's data.
- [ ] Flat-fee / subscription / debt-referral revenue only — never % of loan, no equity success fees.

## Owners (fill in)
| Workstream | Owner | Status |
|---|---|---|
| Legal/compliance (memos, gates) | _fractional GC / reg counsel_ | |
| Deterministic engine + CI | _lead engineer_ | |
| Aggregator + CPA panel | _head of partnerships_ | |
| Security / SOC 2 | _fractional CISO_ | |
| Consent / data ops | _full-stack eng_ | |
| Launch (brand `24`, marketing `22`) | _founder_ | |

## Company funding milestones (gate the raise on evidence, not a deck)
- [ ] **Pre-seed ($1–2.5M):** insight + team + legal clarity → ship spine, sign aggregator, first funded.
- [ ] **Seed (~$4–8M):** verified→funded repeatability + signed aggregator + SOC 2 Type I + clean memos.
- [ ] **Series A:** cohort funnel conversion + multi-funder panel + Type II + approval/loss-rate lift.
