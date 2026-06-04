# 00 — Business Model Reshape

> **⚠️ Positioning update (supersedes the "IPO OS" framing below).** After the
> validation debates in [`04`](./04-stakeholder-debate.md) and
> [`06`](./06-positioning-debate.md), the product is repositioned from **"IPO OS"** to a
> neutral **Capital Trust Center**: the AI-native finance + legal back office that keeps
> an AI startup *continuously, verifiably capital-ready* so it raises faster and cheaper
> from **anyone** (lenders, PE, banks, and — at the top of the ladder — public markets).
> Key changes to read this doc through:
> - **"IPO Track" → "Capital-Readiness Ladder."** IPO is the top rung, not the brand.
> - **Enter via the lending/borrower rail** ("Plaid for startup revenue") — the one place a
>   capital provider genuinely *refuses to fund without verified data*. VC is the weakest
>   forcing function (accept-not-mandate).
> - **Founder-free, capital-provider-paid** monetization (Plaid/credit-bureau model).
> - **Hard neutrality firewall** — subscription/access fees only, never a deal counterparty.
>
> The sections below remain valid on the *mechanics* (traceable revenue, the spine,
> agents); mentally substitute "Capital Trust Center" for "IPO OS" and "Capital-Readiness
> Ladder" for "IPO Track" throughout. The definitive positioning is in `06`.

## 1. The strategic insight you already have (made explicit)

There is a large, fast-growing population of AI startups that:

- have **real users and real fans** (distribution),
- are generating **real revenue** through a handful of payment rails,
- but have **no access to capital markets** — no banker will call them, no audit
  firm will take them cheaply, no law firm will draft an S-1 on spec, and the
  founders have never seen the inside of the IPO machine.

They are *stuck below the line*. IPO OS is the elevator. The wedge is not "we help
you IPO" (too rare, too far away for most). The wedge is: **"plug in your Stripe /
App Store / Google / Meta accounts and we run your financial back office so you're
permanently audit-ready, raise-ready, and — if you're good enough — IPO-ready."**

That is a *utility every AI startup needs every month*, with an *aspirational
top-end* (the IPO track) that makes it a status product, not just a tool.

## 2. Why "traceable revenue" is the whole game

The reason auditing and going public is slow and expensive is **evidence
gathering**: proving that revenue is real, complete, and recognized correctly.
For a generic company that means invoices, contracts, bank statements, sampling,
confirmations — months of human work.

For an AI startup whose money comes through **Stripe, Apple, Google, or Meta**,
the evidence is *already a structured, API-accessible, third-party-attested
ledger*. Apple and Google literally remit you a reconciled payout report. Stripe
is a system of record. Meta/Google ad-driven revenue is reported by the platform.

So the design constraint **"we only onboard companies whose revenue is traceable
to these rails"** is not a limitation — it is the moat:

- **Audit becomes reconciliation, not investigation.** Source rail → payout →
  bank deposit → revenue ledger, all machine-matchable.
- **Completeness assertion is near-free.** You can prove there's no hidden revenue
  because you control the rails it could flow through.
- **Cutoff and revenue recognition (ASC 606)** are mechanical when the rail tells
  you the transaction date, refund, and chargeback.
- **Fraud surface shrinks.** Hard to fake a third-party platform payout.

> **Positioning line:** *"If your revenue runs on Stripe, Apple, Google, or Meta,
> we can make you audit-ready in days, not quarters."*

### ICP filter (who you let in)
- B2B or B2C **AI software** company (SaaS, API, app, agent product).
- ≥ ~80% of revenue through **traceable rails** — Stripe, Apple, Google, Meta are the
  flagship four, and the platform supports **up to ~10 traceable channels** total
  (e.g., add Shopify, PayPal, Paddle, Chargebee, AWS/Azure Marketplace, Amazon) as
  long as each provides API-accessible, third-party-attested payout data. The
  governing rule is *traceability*, not the specific brand: if we can pull a
  reconciled, source-of-truth ledger read-only, the channel qualifies.
- Read-only API/OAuth access grantable to all revenue + payout accounts.
- (For the IPO track) trailing revenue, growth rate, and margin above a bar — see
  the IPO Scoring agent in `02`.

> **Decision (locked):** support **up to 10 traceable channels**. Resist any channel
> whose revenue can't be reconciled to a third-party payout report + bank deposit —
> non-traceable revenue breaks the audit economics that are the whole moat.

## 3. The two-tier funnel

```
            ┌─────────────────────────────────────────────┐
   ALL AI   │  TIER 1 — "Financial OS" (paid SaaS, broad)  │  ← must-have utility,
   STARTUPS │  audit-ready books, live revenue truth,      │     the cash engine
   (fans +  │  data room, cap table, board pack            │
   users)   └───────────────────────┬─────────────────────┘
                                     │ auto-scored, top decile graduates
                                     ▼
            ┌─────────────────────────────────────────────┐
   THE BEST │  TIER 2 — "IPO Track" (high-touch + agents)  │  ← status + big upside,
            │  audit sign-off, S-1, deck, legal stack,     │     the moat & margin
            │  attorney/auditor review-and-sign            │
            └─────────────────────────────────────────────┘
```

### Tier 1 — the must-have (land)
Goal: **every** qualifying AI startup feels it would be irresponsible *not* to run
on IPO OS. Sell it as the financial operating system, not as "IPO software":

- **Revenue Truth** — one live, reconciled view of all rail revenue, MRR/ARR,
  refunds, chargebacks, net revenue, cohort retention — verified, not founder-typed.
- **Always audit-ready** — books continuously reconciled to ASC 606; an audit can
  start any day because the workpapers already exist.
- **Investor-ready data room** — auto-maintained metrics, cap table, KPIs.
- **Board pack in one click** — monthly board deck generated from the spine.

Make it cheap and sticky. This is the wedge that gets you *all* the AI startups.

### Tier 2 — the IPO track (expand)
For companies the scoring agent ranks as ready: the agents generate the audit
workpapers, S-1, pitch deck, and legal documents; the human auditor and attorney
**review and sign**. This is where IPO OS captures banker/lawyer-scale value at
software cost.

## 4. Why founders will feel it's a *must*

- **Removes the thing they hate and fear** (finance, audit, legal, fundraising
  paperwork) without hiring a CFO/controller/GC.
- **Turns "are my numbers real?" into a settled fact** — they can show any investor
  a verified revenue truth link instead of a hand-built spreadsheet.
- **Gives them an aspirational ladder** — a public IPO-readiness score and a visible
  path "to the next level" that no competitor offers.
- **Network effect of legitimacy** — once the best startups wear the "IPO OS
  verified" badge, being *outside* the system looks like a red flag to investors.

## 5. Pricing shape (illustrative, tune later)

| Tier | Who | Price shape | Logic |
|------|-----|-------------|-------|
| **Connect (free)** | Any AI startup | $0 | Connect rails, see a basic Revenue Truth dashboard + IPO-readiness teaser score. Pure acquisition / data flywheel. |
| **Financial OS** | Qualifying startups | Monthly SaaS (per-seat or revenue-banded) | Full reconciled books, data room, board pack, "audit-ready" guarantee. The cash engine. |
| **Audit-Ready+** | Pre-raise | Higher monthly + per-audit fee | Agent-built workpapers + managed human auditor sign-off. Undercut traditional audit fees massively. |
| **IPO Track** | Top-scored | Engagement fee + success fee / warrants | S-1, deck, full legal stack, managed attorney + auditor review through to filing. Banker-scale economics. |

The free tier exists to **vacuum up the entire AI-startup population and their
revenue data**, which both fuels the scoring model (who are the best IPO targets?)
and makes the paid product obviously valuable.

> **Decision (locked):** run **both pricing models in parallel** — flat per-seat SaaS
> *and* revenue-banded — and let the market sort them. Tier 1 is likely best as a
> flat/banded SaaS (predictable, utility framing); the IPO Track runs on engagement
> fee **+ success fee and/or warrants**. A/B the two Tier-1 structures by segment.

## 6. The moat

1. **The verified revenue spine** — once a company's truth lives in IPO OS,
   everything (audit, deck, S-1, board pack) is generated *consistently* from it,
   and ripping it out means losing audit-readiness.
2. **The proprietary IPO-readiness dataset** — you see real, verified financials of
   thousands of AI startups across the same rails. Nobody else has this. It makes
   your scoring (and your deal selection for the IPO track) better than any bank's.
3. **Compounding self-improvement** — every auditor and attorney edit trains the
   generators (see Self-Improvement agent), so doc quality rises and human review
   time falls over time — widening the cost advantage.
4. **Legitimacy network effect** — "IPO OS verified" becomes a trust signal.

## 7. Honest constraints (so the model survives contact with reality)

- **You cannot remove the auditor or the attorney of record.** Securities law and
  PCAOB independence rules require licensed, *independent* humans to sign. The model
  is *reduce them to review-and-sign*, not eliminate them — exactly your framing.
  Keep the AI on the *preparer* side, never the *independent attestor* side.
- **The audit firm must be independent of IPO OS** to sign a public-company audit.
  **Decision (locked): pure-partner panels** — IPO OS never employs the signing
  auditor or attorney. The agents feed a panel of independent audit firms and law
  firms; the platform owns the *prep*, the panel owns the *opinion/filing*. This also
  keeps you off the hook for malpractice/independence liability and sidesteps the
  attorney fee-sharing problem (ABA Model Rule 5.4) — partners bill the client
  directly; IPO OS charges a software/prep fee, not a cut of the legal fee.
- **S-1 / securities work is the practice of law.** Attorneys must own final
  filings. IPO OS is a drafting + diligence accelerator for the law firm, not a
  replacement — pitch it to founders *and* to the firms as leverage.
- **Don't overpromise "automatic IPO."** Most Tier-1 users will never IPO and
  that's fine — Tier 1 is a great business on its own. The IPO track is the halo.
