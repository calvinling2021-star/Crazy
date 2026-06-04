# 08 — Diligence Catalog (the automation backbone)

> A structured database of **184 distinct due-diligence items** that capital providers —
> lenders, VCs, PE/growth, M&A acquirers, and (at the top) public-market/listing — request
> from a startup. It is the machine-readable spine that lets the Capital Trust Center
> **auto-assemble the right checklist for any raise and auto-prepare each item** from the
> connected data feeds and platform modules.

## Why this exists

Deals die on **disorganized, contradictory, or unverifiable documentation** — 68% of
failed deals cite it; the #1 financial killer is contradictory financials and the #1 legal
killer is a cap table that doesn't reconcile. The catalog turns "assemble a data room in a
fire drill" into "the data room is already built, verified, and current." It is the
product surface of the whole thesis: *raise capital faster and cheaper because you are
permanently diligence-ready.*

## What's in it

Built by merging real diligence/underwriting checklists from three deep-research sweeps
(lender/venture-debt/RBF, VC seed→growth, PE/M&A + Quality-of-Earnings) and deduping shared
items into single rows tagged with every provider that requests them.

- **184 items**, **22 categories** (Financial, Quality of Earnings, Working Capital/Net
  Debt, Revenue/Metrics, Cap Table/Equity, Corporate/Legal, IP, Contracts, Tax, HR,
  Collateral/UCC, KYC/AML, Insurance, Compliance, etc.).
- Coverage by requester: **lender 104 · VC 108 · PE 154 · M&A 144 · IPO 19**.
- Automation coverage: **55 full · 99 partial · 30 manual**; **20** require licensed-human
  sign-off.

### Each item carries the fields that drive automation
| Field | Purpose |
|---|---|
| `capital_sources` | Which providers request it → assemble the right checklist per raise |
| `stages` | Financing stage tags (`seed`, `series_a`, `venture_debt`, `rbf`, `buyout`, …) |
| `data_source` | Where the data lives (`revenue_rails`, `bank_feed`, `accounting_gl`, `cap_table`, `expense`, `legal_docs`, …) → the connector/auto-prep path |
| `produced_by` | Which module/agent generates it (`revenue_truth`, `cap_table`, `expense`, `audit_automation`, `legal_stack`, `data_room`) |
| `auto_preparable` | `full` / `partial` / `manual` — how much is auto-generated vs needs human input |
| `human_signoff` | Whether an auditor/attorney must review & sign before release |

## Files
```
src/data/diligence/
├── types.ts        # TypeScript types (the controlled vocabularies)
├── catalog.json    # the 184-item source of truth
└── schema.sql      # normalized SQLite schema (item + 5 join tables)
scripts/load_diligence.mjs   # idempotent loader: catalog.json -> SQLite
```
Materialize the DB:
```bash
npm install            # better-sqlite3 is already a dependency
node scripts/load_diligence.mjs           # -> pipeline/data/diligence.db
node scripts/load_diligence.mjs --out /tmp/diligence.db
```

## How the platform uses it

1. **Assemble** — user picks a goal (e.g., "raise a Series A" or "venture-debt facility").
   Query the catalog for every item where `capital_sources` ∋ the provider and `stages` ∋
   the stage. That is the checklist.
   ```sql
   SELECT di.id, di.item, di.category, di.auto_preparable
   FROM diligence_item di
   JOIN item_capital_source ics ON ics.item_id = di.id AND ics.capital_source = 'vc'
   JOIN item_stage st ON st.item_id = di.id AND st.stage = 'series_a'
   ORDER BY di.category, di.id;
   ```
2. **Auto-prepare** — for each `full`/`partial` item, the module named in `produced_by`
   generates it from connected feeds (e.g., `revenue_truth` produces the ARR bridge from the
   verified spine; `cap_table` produces the fully-diluted cap table; `expense` produces
   AR/AP aging and burn).
3. **Route exceptions** — `manual` items and anything `human_signoff = true` go to the
   user (or the independent partner auditor/attorney) — never auto-released.
4. **Track readiness** — % of the active checklist auto-prepared, verified, and signed = a
   live "capital-readiness" score per provider type.

## The strategic punchline (from the automation distribution)
**~84% of items are `full` or `partial` auto-preparable** (55 + 99 of 184). The biggest
`full`-auto clusters are exactly the high-pain ones — verified revenue/metrics, cap table,
financials, AR/AP, burn — which the platform's own `revenue_truth` + `cap_table` +
`expense` modules already produce from source data. The `partial` cluster is mostly the
QoE/working-capital normalization work (the hardest for companies to do alone), where the
audit-automation engine adds the most value. The `manual`/`human_signoff` residue is the
genuinely human layer (legal judgment, attestation) — consistent with the "AI does the
work, a named human signs" positioning.

> Maintenance: the catalog is versioned (`version`, `generated`). Add channels/providers or
> new items by appending rows to `catalog.json` and re-running the loader — the schema and
> queries are stable.
