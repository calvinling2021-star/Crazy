# 14 — The Alpha Moment: Name a Firm, See Your Exact Checklist

> Founder direction: *the user should be wowed when he tells us he's trying to get funding
> from a specific firm — we already have almost the exact things he needs. This is the alpha
> moment.*

This is now built. The platform holds a **named-provider requirements database** mapped to
the diligence catalog, so the instant a user names a firm, we return its **exact checklist**
and **how much is already prepared** from their verified data.

## What shipped (`src/data/diligence/`)
- **`catalog.json`** — now **200 diligence items** (added the non-obvious PE/M&A items:
  Section 382 NOL, R&W-insurance pack, chain-of-title, WARN Act, ERISA/Form 5500, deferred-
  revenue roll-forward, carve-out/TSA, SBOM, FTO, CIM, personal guarantee, SBA Form 413,
  grant registrations, etc.).
- **`providers.json`** — **71 named capital providers** with **506 requirement mappings**
  (every mapping references a real catalog item; validated zero dangling refs), each with
  eligibility, terms, fee model, provider-specific extras, and source URL.
- **`schema.sql` + `scripts/load_diligence.mjs`** — extended with `capital_provider`,
  `provider_requirement`, and `provider_extra` tables + loader. Run `npm install &&
  node scripts/load_diligence.mjs`.

### Coverage (71 providers)
accelerators 9 (YC, Techstars, 500, Antler, a16z Speedrun, AngelPad, SOSV, EF, Sequoia Arc) ·
VC 10 (Cooley template, a16z, Sequoia, Bessemer, First Round, Point Nine, NFX, Index, Accel,
Founder Collective) · crowdfunding/angel 5 (Wefunder, StartEngine, Republic, AngelList, Gust) ·
RBF 9 (Capchase, Founderpath, Pipe, Wayflyer, Lighter, Arc, Uncapped, Outfund, Re:cap) ·
startup banks 4 (Brex, Mercury, Ramp, Stripe Capital) · venture debt 5 (SVB/HSBC, Hercules,
TriplePoint, Trinity, WTI) · SMB lenders 5 (Lendio, Fundera, OnDeck, Bluevine, Fundbox) ·
bank 1 · SBA 2 (7(a), Microloan) · grants 3 (SBIR/STTR, Amber, FedEx) · growth-equity/PE 5
(Insight, General Atlantic, TA/Summit/JMI, Vista, Thoma Bravo) · QoE 1 (Big 4) · corporate VC
1 · checklist sources 11 (DealRoom 98, Bloomberg 174, technical/IP/HR/tax/SaaS/cyber-ESG/
insurance-RWI/commercial DD, VDR index).

## The alpha-moment flow

```
 User: "I'm raising from Y Combinator"  (or Capchase, or Insight Partners, …)
        │
        ▼
 1. Look up the provider → its required_item_ids (the exact checklist)
 2. Join against the user's prepared/verified items (from the spine: 05/07)
 3. Return:  ✅ ready (N)   🟡 auto-preparing (M)   📝 needs you (K)   + provider extras
        │
        ▼
 "You're 82% ready for YC's Series A diligence. We've already assembled your cap table,
  financials, IP assignments, and board consents. 3 items need your input (founder video,
  one-sentence description). Want me to generate the data room?"
```

The query is one join:
```sql
SELECT di.id, di.item, di.category, di.auto_preparable, di.human_signoff
FROM provider_requirement pr
JOIN diligence_item di ON di.id = pr.item_id
WHERE pr.provider_id = 'yc'
ORDER BY di.category;
-- then overlay the user's prepared/verified status to compute the % ready
SELECT extra FROM provider_extra WHERE provider_id = 'yc';  -- provider-specific extras
```

## Why this is the "wow"
- **It feels like we read the firm's mind.** Because we did the homework once (the research
  sweeps) and encoded it, the user experiences "you already have exactly what they want."
- **It's mostly already done.** The spine (`05`) + cap table/expense (`07`) auto-prepare the
  `full`/`partial` items, so the readiness % is high *before the user lifts a finger*.
- **It's specific, not generic.** "YC wants a founder video and your option-grant list with
  exercise prices" beats "prepare a data room." Specificity is the credibility (`10` §3).
- **It compresses the raise.** YC's own checklist exists to cut ~a week off closing; we make
  that automatic — and it powers the directory + tracker (`09`) and intros (`12`).

## Matching, not just lookup
Beyond "name a firm," the same data drives **reverse matching**: given a user's verified
profile (ARR/MRR, stage, sector, geography, VC-backed?), filter `capital_provider.eligibility`
to surface **"firms you qualify for right now"** — e.g., "$15k MRR, bootstrapped → Lighter
Capital, Founderpath, Pipe, Arc qualify; you're 90% ready for all four." This is the engine
behind `match_capital` (`11` tool surface) and the premium intros (`12`).

## Keeping it fresh & honest
- **Provenance:** every provider carries a `source_url`; many large VC/PE firms don't publish
  exact lists, so those use authoritative proxies (counsel templates, documented process) and
  are flagged `[proxy]` in `provider_extras`. Don't present a proxy as a published guarantee.
- **Re-verification:** accelerator/lender terms change; the continuous-enrichment agent (`12`)
  should re-verify provider records and append new providers/items over time (the catalog and
  providers files are versioned; just append + re-run the loader).
- **Expand breadth continuously** (the founder's standing ask): keep adding named providers and
  any new diligence items each research pass surfaces — the schema and queries are stable.

## Next build step
Wire `match_capital` + `assemble_checklist` (the `11` MCP tools) to these tables, overlay the
user's live prepared/verified status from the spine, and render the readiness % in the
directory/tracker UI (`09`). That turns this data layer into the visible alpha moment.
