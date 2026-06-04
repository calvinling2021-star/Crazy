# 07 — Auditable Cap Table + Expense Management

> Brief from the founder: *build in Carta-style cap-table management and full expense/spend
> management — but the goal is to make it **auditable**.*

This is the right expansion. The two records that **kill fundraises** are exactly these:
"cap tables that don't reconcile to board consents" and "contradictory financials" — and
spend is the largest unverified line in most startups' books. Building both **on the same
verified, provenance-tracked spine** as Revenue Truth (A1) is what turns them from
liabilities into the Capital Trust Center's strongest proof. Carta and Ramp/Brex own these
*separately*; nobody owns them **reconciled into one continuously auditable record** — that
cross-domain tie is the defensible white space (see `06`).

## The governing principle: auditable-by-construction

Auditability is not a report you generate at year-end. It is a property you **build into the
data model from the first write**. Five structural rules (the same ones from `01`, applied
to equity and spend):

1. **Append-only, immutable event log.** Nothing is ever edited or deleted in place. A
   correction is a new, linked, reason-coded *reversing event*. The current state (a
   shareholder's holdings, a department's spend) is a **projection** of the event log, never
   a directly-mutated row. This is what lets an auditor reconstruct any balance as of any
   date.
2. **Provenance on every entry.** Every share, option, and dollar of spend links to its
   source authorization (a signed board consent id, an approved expense policy + approval
   chain, a rail transaction id) and to its downstream accounting entry. No equity or
   expense exists without a traceable origin.
3. **Double-entry discipline.** Equity events and expense events post to a real
   double-entry general ledger so everything balances and ties to the financial statements
   the auditor signs. Money as integer minor units, never float.
4. **Segregation of duties + approval controls, evidenced.** Who can issue equity, who
   approves spend, and who can change policy are distinct roles, and every approval is
   logged as control evidence (the SOX/ICFR artifact an IPO-grade audit demands).
5. **Reconciliation + exception queue.** Cap table ↔ board consents, spend ↔ bank ↔ GL,
   stock-comp expense ↔ cap table — all continuously reconciled; any break is a typed
   exception for human review, never silently adjusted.

> Net effect: an auditor (or a lender's underwriter, or an acquirer's QoE team) can pull a
> **point-in-time, fully-sourced reconstruction** of equity and spend on demand — which is
> precisely the evidence that collapses audit and diligence time.

---

## Module 1 — Cap Table (Carta-style, auditable)

### What it manages
Shares (common/preferred by class & series), SAFEs and convertible notes, option pools and
grants (ISO/NSO/RSU), vesting schedules, exercises, transfers, repurchases, conversions,
secondary transactions, 409A valuations, and the resulting fully-diluted ownership.

### Event-sourced data model (the spine extension)
Every change is an immutable `EquityEvent` with provenance:

```
EquityEvent {
  id, tenant_id, type, effective_date, recorded_at,
  security_class, holder_ref, quantity, price_per_share, consideration,
  authorization_ref,        // REQUIRED: signed board consent / stockholder approval id
  document_ref,             // the executed instrument (stock cert, SAFE, grant agreement)
  vesting_schedule_ref,     // for grants
  reversing_of,             // if a correction, points to the event being corrected
  actor, reason_code, prior_state_hash
}
```
Event types: `AUTHORIZE_SHARES`, `ISSUE`, `GRANT_OPTION`, `VEST`, `EXERCISE`,
`SAFE_ISSUE`, `NOTE_ISSUE`, `CONVERT` (SAFE/note → equity, with the exact conversion math
recorded), `TRANSFER`, `REPURCHASE`, `CANCEL`, `409A_SET`, `SECONDARY`.

Current cap table = deterministic projection of the event log. Fully-diluted, as-converted,
and waterfall views are computed, each carrying the set of event ids that produced them.

### What makes it auditable (and fundraise-proof)
- **Every equity event ties to its authorization.** An issuance with no signed board consent
  → `UNAUTHORIZED_EQUITY` exception. This single rule eliminates the #1 legal deal-killer
  (cap table that doesn't reconcile to consents) by construction.
- **As-of reconstruction.** Reproduce the exact cap table on any historical date for
  diligence or the S-1's "Principal Stockholders" table — straight from the event log.
- **Conversion math is recorded, not recomputed.** SAFE/note conversions store the inputs
  (cap, discount, MFN, round price) and the resulting shares as a permanent event, so an
  auditor re-performs rather than reverse-engineers.
- **Stock-based compensation feeds the books automatically.** Each grant + 409A drives an
  **ASC 718 / IFRS 2** expense schedule that posts to the GL — so equity and the income
  statement reconcile (a classic audit pain solved at the source).
- **409A independence.** The 409A valuation is performed by an **independent partner**
  (neutrality firewall), referenced by id; the platform never marks its own customers'
  fair value.

### Cross-domain reconciliation (the moat)
Cap table ↔ board consents ↔ stock-comp expense ↔ financial statements ↔ the data room's
"Principal Stockholders" exhibit — all one reconciled record. This is what neither Carta
(equity only) nor the FP&A tools (no equity) can produce.

### Neutrality firewall (the Carta lesson, hard-coded)
The platform holds everyone's cap tables — so it **must never broker secondaries or trade on
this data.** Any liquidity/secondary feature is a separate, explicitly opt-in, walled
product or a partner's; the core cap-table tenant is never monetized as a deal participant.
(This is the exact conflict that cost Carta a $250M-ARR business — see `04`/`06`.)

---

## Module 2 — Expense / Spend Management (Ramp/Brex-style, auditable)

### What it manages
Corporate cards (issued via a **partner BaaS/issuer** — you orchestrate, you are not the
bank), reimbursements, bill pay / AP, approval workflows, receipts, GL coding, and budgets —
all reconciled to the bank and to the books.

### Event-sourced data model
Every spend action is an immutable, provenance-tagged event that lands in the same canonical
ledger as revenue:

```
SpendTransaction {
  id, tenant_id, source_record_id,    // card-network / issuer txn id (provenance)
  amount, currency, merchant, mcc, txn_date,
  card_ref / vendor_ref, requester, approval_chain_ref,  // who approved, per policy
  policy_evaluation,                  // which rule allowed it (control evidence)
  receipt_ref, gl_account, cost_center, project_ref,
  bank_settlement_ref,                // matched bank debit
  exceptions[]                        // missing receipt, out-of-policy, unmatched, etc.
}
```

### What makes it auditable
- **Every dollar reconciles three ways** — card/issuer record → bank settlement → GL entry —
  the same full-population reconciliation that makes revenue audit-grade (`05`). Unmatched →
  exception, never plugged.
- **Policy + approval as control evidence.** Each transaction records *which policy rule
  permitted it* and *who approved it*. That is the operating-effectiveness evidence an
  IPO-grade (SOX/ICFR) audit requires — generated continuously, not reconstructed.
- **Receipts and coding at the source.** Missing receipt or GL code → typed exception on the
  transaction; the close is clean because nothing posts un-evidenced.
- **Segregation of duties enforced.** Requester ≠ approver ≠ policy-admin; violations are
  flagged. This is a control auditors test directly.
- **Immutable + correction-by-reversal**, same as equity — no silent edits to spend history.

### Monetization note (and the regulatory line)
The Ramp/Brex model is **interchange-funded**, so card/spend can be **free** to the
customer — a powerful acquisition wedge and a reason founders connect everything. But issuing
cards makes you a regulated money-movement participant: **use a partner issuer/BaaS**
(orchestrate, don't become the bank), consistent with the pure-partner / neutrality posture.
Keep platform revenue on **subscription/access**, with interchange as a partner-shared
acquisition subsidy — never let spend economics compromise the neutrality of the verified
record.

---

## How both modules reinforce the Capital Trust Center

| Capital event | What the auditable cap table + spend deliver |
|---|---|
| **Venture-debt / RBF draw** | Verified revenue *and* a clean, current burn/runway from reconciled spend → faster underwriting (the beachhead in `06`) |
| **VC / PE round** | As-of cap table tied to consents + verified financials → kills the #1 legal and #1 financial deal-killers; 8→3 week diligence |
| **Audit** | Equity, stock-comp, and spend already reconciled with control evidence → auditor reviews exceptions and signs (`02` A2) |
| **Listing / S-1** | "Principal Stockholders" and financials generated from the same spine, fully sourced |

## Build sequencing (extends `05`)
1. **Revenue Truth (A1)** — the spine + reconciliation engine + exception queue (`05`).
2. **Expense/Spend** — reuses the *exact* reconciliation + provenance + exception
   machinery (card/issuer → bank → GL); fastest reuse, immediate audit-readiness value, and
   the interchange-funded free wedge.
3. **Cap Table** — the event-sourced equity ledger + consent-tie + ASC 718 posting; highest
   diligence/legal value and the cross-domain reconciliation moat.
4. **Unified close + controls evidence** — one double-entry GL fed by revenue + spend +
   stock-comp, producing continuously audit-ready financials and the ICFR evidence pack.

### Coding-prompt addendum (append to `05`)
```
Extend the spine with two event-sourced, append-only modules that post to a shared
double-entry GL:

CAP TABLE: EquityEvent log (issue, grant, vest, exercise, SAFE/note issue+convert,
transfer, repurchase, cancel, 409A, secondary). Current cap table, fully-diluted, and
waterfall are projections of the log. HARD RULE: every dilutive/issuance event REQUIRES an
authorization_ref to a signed board/stockholder consent or it raises UNAUTHORIZED_EQUITY.
Record conversion math as stored inputs+outputs. Generate ASC 718 / IFRS 2 stock-comp
schedules that post to the GL. 409A is referenced from an independent partner, never
computed by us. Provide as-of reconstruction for any date.

EXPENSE/SPEND: SpendTransaction log from a partner card issuer (read-only txn feed) +
reimbursements + AP. Three-way reconcile issuer/card txn -> bank settlement -> GL entry,
full population, exceptions never plugged. Record policy_evaluation + approval_chain_ref on
every txn as control evidence; enforce segregation of duties (requester != approver !=
policy admin). Require receipt_ref + gl_account or raise typed exceptions.

SHARED: append-only/immutable with correction-by-reversal only; provenance + actor +
reason_code on every event; everything ties to the double-entry GL so cap table, stock-comp,
spend, and revenue all reconcile to the financial statements. Produce a continuous
ICFR/controls-evidence pack. Do NOT build any secondary-trading/brokerage on cap-table data,
and do NOT become the card issuer/bank — use a partner. Tests must cover: as-of cap table
reconstruction, SAFE-to-equity conversion math, unauthorized-issuance exception, stock-comp
posting, three-way spend reconciliation, out-of-policy + missing-receipt exceptions, and
segregation-of-duties violations.
```

> Not legal/accounting advice. 409A, equity issuance, money-movement/card issuance, and ICFR
> attestation each require the appropriate independent partner (valuation firm, counsel,
> BaaS/issuer, audit firm) per the pure-partner model.
