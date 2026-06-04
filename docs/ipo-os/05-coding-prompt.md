# 05 — Coding Prompt: Build "Revenue Truth" (A1 MVP)

This is a ready-to-use build prompt for a coding agent (e.g., Claude Code) to build the
**A1 Revenue Truth engine** — the deterministic, verified-revenue spine that every
stakeholder in the debate endorsed and that everything else (audit, data room, deck,
S-1) is generated from.

**Design law from the research:** the *numbers* are produced by **deterministic
reconciliation of read-only source data**, never by AI inference. AI is used only for
classification *suggestions* and natural-language explanation, always flagged for human
confirmation. This is what gives the "verified" claim SOC 2-grade credibility and keeps
you out of the Pipe/hallucination trap.

---

## The prompt (copy from here)

```
You are building "Revenue Truth," the core engine of Vibe Coder Operation Platform — a system that ingests an
AI startup's revenue from read-only payment/payout rails and produces ONE verified,
reconciled, ASC 606 / IFRS 15-aligned revenue ledger that an auditor or investor can
trust without redoing the work.

NON-NEGOTIABLE PRINCIPLES (encode these structurally, not as comments):
1. DETERMINISTIC NUMBERS. Every monetary figure is computed by explicit reconciliation
   of source records. No LLM/AI ever produces, estimates, or adjusts a number. AI may
   only (a) SUGGEST a classification and (b) generate human-readable explanations —
   both always marked "suggested, unconfirmed" until a human accepts.
2. READ-ONLY, SCOPED, REVOCABLE access to every rail. The system can never move money
   or write to a rail. Store only least-privilege, encrypted, revocable credentials.
3. PROVENANCE ON EVERYTHING. Every figure links to the source record(s) (rail txn id,
   payout id, bank txn id) that produce it. A figure with no provenance cannot exist.
4. NEVER SILENTLY PLUG A DIFFERENCE. Any unreconciled amount, timing gap, or ambiguous
   classification becomes an EXCEPTION in a queue for human review. No auto-resolution.
5. MULTI-TENANT ISOLATION. One startup's data is never reachable from another tenant.
6. NEVER TRADE ON CUSTOMER DATA. No code path may expose one tenant's financials to any
   counterparty, ranking, or marketplace. (Contractual + architectural firewall.)

SCOPE OF THIS MVP (build in this order):
- Rails for v1: STRIPE first, then APPLE APP STORE CONNECT. Architect the connector
  layer as a pluggable interface so GOOGLE PLAY/ADS, META, and up to ~10 total
  traceable channels (Shopify, PayPal, Paddle, Chargebee, AWS/Azure Marketplace,
  Amazon) can be added later. A channel QUALIFIES only if it exposes an
  API-accessible, third-party-attested PAYOUT report that can be reconciled to a bank
  deposit. Also build a BANK connector (use Plaid in sandbox) for deposit matching.

ARCHITECTURE:
- Connector interface: `RailConnector` with methods
  `fetch_transactions(period)`, `fetch_payouts(period)`, `fetch_fees(period)`,
  returning raw payloads + the provider's native ids. Read-only.
- Canonical model (the "Spine"): normalize every rail into a single
  `CanonicalTransaction` { id, tenant_id, rail, source_record_id (provenance),
  customer_ref, gross_amount, platform_fee, refund_amount, chargeback_amount,
  net_amount, currency, fx_rate, txn_date, recognition_start, recognition_end,
  product_ref, raw_payload_hash }. Preserve the original payload, immutably.
- `Payout` { id, rail, source_payout_id, gross, fees, net, expected_bank_amount,
  payout_date, status } and `BankDeposit` { id, source_bank_txn_id, amount, date }.
- Reconciliation engine (THE CORE): three-way match
  transactions → payout report → bank deposit. Every recognized dollar must trace
  txn→payout→bank. Emit a `ReconciliationResult` per payout with matched/unmatched
  detail. Unmatched > tolerance → Exception.
- Revenue recognition: apply ASC 606 / IFRS 15 per the tenant's `reporting_standard`
  flag. Compute deferred revenue and over-time recognition schedules for subscriptions
  (ratable), point-in-time for one-off, usage-based as delivered. The standard flag
  must drive real logic (collectibility threshold "probable" vs "more likely than not";
  contract-cost treatment; license point-in-time vs over-time) — not just a label.
- Principal/agent (gross vs net): DO NOT let the system decide silently. Compute BOTH
  gross and net; default to the per-stream conclusion stored in `RevenueStreamPolicy`;
  if no confirmed policy exists for a stream, raise an Exception requiring a human to
  set it (this is the documented accounting judgment). App-store revenue defaults to a
  GROSS suggestion with platform commission as expense, flagged for confirmation;
  ad revenue (Meta/Google) ALWAYS requires explicit human confirmation.
- Metrics (deterministic, from the ledger): gross revenue, platform fees, refunds,
  chargebacks, NET revenue, MRR, ARR, new/expansion/contraction/churned MRR, gross &
  net revenue retention, cohort retention, customer concentration. Each metric carries
  the set of source ids it was computed from.
- Completeness: maintain a `ConnectedRailInventory` per tenant. If the tenant has
  evidence of a revenue-bearing rail that is NOT connected (e.g., an iOS app exists but
  App Store isn't connected, or bank deposits exist with no matching connected rail),
  raise a COMPLETENESS exception — completeness cannot be asserted otherwise. The system
  must NOT claim "verified complete," only "verified across connected rails: [...]".
- Exception queue: typed exceptions (UNRECONCILED, TIMING, FX_MISMATCH, MISSING_RAIL,
  UNSET_GROSS_NET_POLICY, ANOMALY, UNVERIFIED_CHANNEL), each with severity, the source
  records involved, a suggested resolution, and an audit log of human actions.
- Anomaly flags (deterministic rules, not ML for v1): round-number/manual entries,
  sudden cohort shifts beyond a threshold, related-party patterns, negative net,
  unmatched bank deposits.
- Provenance/audit log: append-only, immutable record of every ingestion, computation,
  AI suggestion, human edit, and sign-off, with timestamps and actor. This log is a
  product feature (the auditor/investor trust artifact), not just infra.

API (REST or tRPC):
- `POST /tenants/:id/rails/:rail/connect` (store scoped read-only creds)
- `POST /tenants/:id/sync` (pull period, normalize, reconcile)
- `GET  /tenants/:id/ledger?period=` (canonical transactions + provenance)
- `GET  /tenants/:id/metrics?period=` (verified metrics with source ids)
- `GET  /tenants/:id/reconciliation?period=` (three-way results)
- `GET  /tenants/:id/exceptions` / `POST .../exceptions/:eid/resolve`
- `GET  /tenants/:id/revenue-streams` / `POST .../revenue-streams/:sid/policy`
   (set confirmed gross/net + recognition policy — the human judgment step)
- `GET  /tenants/:id/verification` (the signed "verified across rails X,Y as of DATE"
   artifact, with the completeness scope stated honestly)

TECH STACK (use unless the repo dictates otherwise):
- TypeScript, Node, Next.js (the repo is already Next.js) for API + a thin dashboard.
- Postgres (Prisma) for the Spine; money as integer minor units + currency, NEVER float.
- A typed connector package; Stripe + Apple connectors behind the `RailConnector`
  interface. Use official SDKs, read-only keys.
- Decimal-safe money math (e.g., dinero.js or bigint minor units). No floating point on
  money, ever.

DASHBOARD (minimal v1):
- Connect-a-rail flow (read-only consent, clear data-use statement).
- "Revenue Truth" view: verified NET revenue, MRR/ARR, retention — each figure
  click-through to its source transactions (provenance UI).
- Reconciliation view: txn→payout→bank tie-out with any breaks highlighted.
- Exception queue with resolve actions.
- A "Verification" page stating exactly which rails are connected and the honest
  completeness scope.

TESTS (required, this is financial software):
- Golden-path reconciliation: seed Stripe-like + Apple-like fixtures + matching bank
  deposits; assert three-way match and correct NET/MRR/ARR.
- Break cases: unmatched payout, partial refund, chargeback, FX, an annual prepay
  (deferred revenue release), a duplicated transaction, a missing-rail scenario — each
  must produce the correct typed exception, NOT a silently adjusted number.
- Standard toggle: same fixtures under ASC 606 vs IFRS 15 produce the documented
  differences (collectibility, contract-cost, license timing).
- Provenance: assert every returned metric carries non-empty source ids.
- Money: property tests that no computation introduces floating-point error.

DELIVERABLES:
- Running Next.js app + Postgres schema (Prisma migrations).
- Stripe + Apple connectors behind the interface; Plaid-sandbox bank connector.
- Reconciliation + recognition engine with the exception queue.
- Seed/fixture data and the full test suite, green.
- A short README: how to connect a rail, run a sync, read the verified ledger, and
  interpret exceptions — and an explicit statement of what "verified" does and does NOT
  assert (no completeness claim beyond connected rails; no AI-produced numbers).

OUT OF SCOPE for this MVP (stub interfaces only): audit workpaper generation (A2),
S-1/deck/legal generation (A3–A5), IPO/exit scoring (A6), growth (A7). Leave clean
extension points that read FROM the Spine.

Start by proposing the Prisma schema for the Spine and the `RailConnector` interface,
then implement the Stripe connector + three-way reconciliation + exception queue end to
end with tests before adding Apple. Ask me before introducing any dependency that could
touch money movement or write-access to a rail (there should be none).
```

---

## Why this prompt is shaped this way (traceability to the research)

- **"Deterministic numbers, AI only suggests"** directly answers the 14%-CFO-trust gap
  and the 200+ AI-hallucination sanctions — the verified figure must be reconciliation,
  not inference.
- **Three-way reconciliation to bank** is exactly the evidence an auditor said collapses
  existence/cash testing across the full population.
- **Mandatory human gross/net + estimate policy** answers the technical accountant: the
  principal/agent and variable-consideration judgments can't be silent.
- **Honest completeness scope** answers the auditor's "rails don't prove the population
  of rails is complete" — the product never overclaims.
- **"Never trade on customer data" firewall** is the Carta lesson baked into the
  architecture from line one.
- **No human back-office in the loop for the numbers** keeps SaaS margins — the Bench
  lesson.
- **Pluggable connectors up to ~10 traceable channels** and the **ASC 606/IFRS 15
  toggle** implement your locked decisions.

## Suggested follow-on build order (after A1 is green)
1. **Data room + verified metrics share link** (the fundraise wedge investors demand
   from seed) — fastest path to paid utility value.
2. **A2 Audit workpaper package** feeding the independent partner auditor.
3. **A6 Exit/Capital-Readiness scoring** (reframed per the debate) on verified data.
4. Then A3–A5 document generation (deck → S-1 → legal), all reading the Spine,
   "AI-prepared, human-reviewed, independently signed."
