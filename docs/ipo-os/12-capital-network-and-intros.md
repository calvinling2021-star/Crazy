# 12 — Capital Network: Provider Contact Data & Premium Intros

> Founder direction: *another agent that continuously gathers contact information from capital
> providers to link users to them as a premium service.*

This turns the **Capital-Provider Directory** (`09` §3a) from a static list into a **live,
enriched, two-sided network** — and into a premium revenue line. There is already a
contact-discovery engine in this repo to build on (`pipeline/`: universe → officers →
enrich emails/LinkedIn → score). We repoint it from "target companies" to "capital
providers and their decision-makers."

## 1. What it is

A continuously-refreshed database of **capital providers** (VCs, angels, accelerators,
lenders, banks, RBF, PE, family offices, grant programs) and the **right human contact** at
each (partner/principal who writes the relevant check, or the credit/BD contact), matched to
each user's *verified* profile — and a **premium service that links the user to the right
provider at the right moment**.

## 2. The continuous enrichment agent (the "constantly gather" part)

A scheduled pipeline (extend `pipeline/`) that keeps the network fresh:

```
 SOURCES (refreshed continuously)            ENRICH                     MATCH & SERVE
 ┌───────────────────────────────┐    ┌──────────────────┐     ┌───────────────────────┐
 │ Crunchbase API (funds, people)│    │ resolve decision-│     │ rank providers by fit │
 │ Public fund sites / team pages│───▶│ maker per thesis │────▶│ for THIS user's       │
 │ Lender sites / help centers   │    │ verify email/    │     │ verified profile      │
 │ News: new funds, fresh raises │    │ LinkedIn (reuse  │     │ (stage, sector, MRR,  │
 │ Form D / SEC filings          │    │ enrich.py)       │     │ geography, check size)│
 │ Accelerator cohort pages      │    │ freshness/decay  │     │ → premium intro       │
 └───────────────────────────────┘    └──────────────────┘     └───────────────────────┘
```

- **Reuse what exists:** `enrich.py` (email/LinkedIn resolution), `domains.py`, `feeds.py`,
  `officers.py`, `db.py`, `verify.py` already do discovery + enrichment + verification for
  people at companies. Repoint the "universe" to capital providers.
- **Freshness is the product.** Funds raise new vehicles, partners move firms, lenders change
  criteria. A staleness score per record triggers re-crawl. "Who's actively deploying *now*"
  (fresh-fund / fresh-raise signals) is the highest-value, most perishable data.
- **Decision-maker, not just firm.** Match the *thesis* (AI, stage, check size, geography) to
  the *specific partner* who leads those deals — that's what makes an intro land.

### Data model (extends the diligence DB in `08`)
```
capital_provider { id, name, type, stage_focus, sectors[], check_size_range,
                   geography, eligibility{min_mrr, min_tenure, ...}, fee_model,
                   thesis_notes, status(active/dormant), last_verified }
provider_contact { id, provider_id, name, role, focus_area, email, linkedin,
                   confidence_score, source, last_verified, opt_out }
provider_requirement { provider_id, diligence_item_id }   -- links to 08 catalog → alpha moment
```
The `provider_requirement` join is what powers the **alpha moment** (`14`): name a firm → we
already have their checklist and most of it prepared.

## 3. Matching → the premium service

Free users see the **directory + "you'd qualify for ~$X / these N funds match your thesis."**
Premium unlocks the **link**:

| Premium feature | What the user gets |
|---|---|
| **Contact reveal** | The right decision-maker's verified contact at matched providers |
| **Warm/managed intro** | We facilitate the intro with a verified-data one-pager attached |
| **Outreach assist** | AI-drafted, founder-approved outreach + the auto-built data room link |
| **Provider-side deal flow** | (debt-first) Providers pay to receive verified, pre-qualified, opt-in leads |

The verified-data attachment is the differentiator: an intro that arrives with **"verified
$X ARR, cap table clean, diligence 80% ready"** converts far better than a cold email — and
it's only possible because of the spine (`05`) + catalog (`08`).

## 4. Two-sided monetization (and the legal guardrail)

- **User-paid premium** (subscription/credits): contact access, intros, outreach assist.
  Founder-side, flat-fee → clean.
- **Provider-paid verified deal flow:** lenders/RBF pay for pre-qualified, opt-in, verified
  borrowers — the Plaid/credit-bureau pattern. **Debt referral success fees are permissible**
  (loans aren't securities); push volume here.
- **⚠️ Equity line is regulated.** Charging a fee **contingent on an equity raise** = broker-
  dealer (Exchange Act §15(a); no finder safe harbor). Keep equity intros **flat-fee /
  subscription**, don't negotiate terms or handle funds, or run under a registered/no-action
  structure (AngelList template). Reserve **success/commission for PE/IPO** through a BD
  partner (consistent with `09`/`10`).
- **Contact-data compliance:** GDPR/CCPA lawful basis, CAN-SPAM/PECR for outreach, honor
  opt-outs (`provider_contact.opt_out`), and source data from licensed feeds (Crunchbase API)
  or public/first-party — **not ToS-violating scraping** (Signal/Crunchbase scraping is
  fragile and prohibited).

## 5. Neutrality (the Carta firewall, restated)
We are a **directory + readiness + intro utility**, never a deal counterparty. Surface options,
let users choose, never steer for compensation, never trade a user's verified data to advantage
a provider without explicit opt-in. Neutrality is what lets both sides trust the network and is
the precondition for becoming the standard intro layer.

## 6. Why this is defensible
The contact list alone is commoditized (Crunchbase exists). The moat is the **join**: provider
contacts × *verified* user data × *exact* per-provider requirements × an auto-built data room.
Nobody can make the intro as warm or the user as ready. The continuous-enrichment agent keeps
the "who's deploying now" edge fresh.

> Not legal advice. Operating an investor/lender intro service with any transaction-based
> equity comp implicates broker-dealer/finder law and contact-data privacy law — implement the
> premium intro and provider-paid lines with securities counsel and a privacy review.
