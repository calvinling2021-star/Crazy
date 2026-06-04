# 09 — Vibe-Coder ICP, Capital Directory & Pricing

> Founder direction: *focus on clients just getting started (who feel fuzzy), build the
> user base among the millions of "vibe coders" / Claude builders; give them a directory of
> investors, banks, and lenders plus a way to track the capital process; monetize with
> tiered subscriptions now and commission only at later stages (PE/IPO). The edge is the
> rise of vibe coders.*

This doc locks that ICP and pricing. It is consistent with — not a replacement for — the
positioning in [`06`](./06-positioning-debate.md): the Vibe Coder Operation Platform now has a
**top-of-funnel land motion (vibe coders, day one)** and a **monetization motion (capital
events, later)**. They are one funnel.

## 1. The ICP: the fuzzy beginner / vibe coder

**Who:** the explosion of people building real software businesses with AI tools (Claude
Code, Cursor, Lovable, Bolt, Replit, v0). They ship product fast and often get to real,
**traceable revenue (Stripe / app stores)** — but have **zero finance, legal, or
fundraising capability** and feel fuzzy about all of it. They have never seen a cap table,
a data room, or a term sheet.

**Why them, why now (the edge):** AI collapsed the cost of *building*, so the bottleneck
moved to everything *around* the product — incorporating, books, taxes, raising money. A
generation of capable builders is hitting that wall for the first time, in huge numbers,
all at once. Being their **AI-native finance + legal + capital back office from line one of
code** is the wedge no incumbent is built for (Carta/Ramp/Pilot target funded, later-stage
companies). *We meet them at "I just got my first Stripe payment," not at "I'm raising a
Series A."*

**The promise to them:** *"Connect Stripe; we keep your money, equity, and legal
house in order automatically, show you exactly who funds companies like yours, and get you
ready to raise the moment you want to — so the boring stuff never blocks you."*

## 2. Reconciling with the forcing-function insight (this matters)

The `06` debate concluded the **forcing function** (a capital provider that *refuses to
fund without verified data*) is strongest with lenders and weakest with early VC. Targeting
beginners does **not** contradict that — it sequences it:

```
  LAND (now)                         HABIT/DATA MOAT                MONETIZE-DEEP (later)
  millions of vibe coders   ──▶   verified track record    ──▶   they need capital
  feel fuzzy, just starting       accrues from day one            (loan, then round, then PE/IPO)
  → cheap subscription            (the moat compounds)            → directory + tracker convert,
                                                                    lender forcing function bites,
                                                                    commission at PE/IPO
```

Landing beginners early is what *creates* the verified-history asset that makes the capital
moment valuable. The subscription funds the land motion; the capital events (lender-paid
verified deal flow, then PE/IPO commission) fund the deep monetization. **Don't wait for
the raise to acquire the user — acquire at first commit, monetize across their whole
journey.**

## 3. The new core features the founder asked for

### 3a. Capital-Provider Directory (investors · banks · lenders)
A curated, searchable directory of capital providers with contact/intro info, filterable by
what they actually fund:
- **Lenders / RBF / venture debt** (Stripe Capital, Capchase, Founderpath, Wayflyer, Arc,
  banks) — matched to the user's *verified* revenue profile ("you qualify for ~$X based on
  your verified MRR").
- **VCs / angels** — by stage, check size, sector (AI), geography, and thesis.
- **PE / growth** — for the later rungs.
Each provider entry: focus, stage, typical check/facility, requirements, and the **exact
diligence items they'll ask for** (powered by the 184-item catalog in
[`08`](./08-diligence-catalog.md)). The magic: *the directory knows what each provider
wants, and the platform has already auto-prepared most of it.*

> **Neutrality firewall still applies (the Carta lesson).** The directory is information +
> warm-readiness, **not** brokering. Monetize via subscription/access, not a cut of any
> investment, until/unless the entity is properly structured (broker-dealer/finder rules —
> see `10` and counsel). Never trade on a user's data to advantage a provider.

### 3b. Capital Process Tracker
A CRM-style pipeline for the user's raise/borrow: provider → stage (researching → contacted
→ meeting → diligence → term sheet → closed), with the **diligence checklist auto-attached**
per provider, each item showing prepared / verified / signed status and the live
readiness %. It turns "fuzzy" into a concrete, trackable to-do list with most boxes already
ticked by the agents.

## 4. Pricing: tiered subscription now, commission later

Run **tiered subscriptions to test willingness-to-pay** across the funnel, with
commission reserved for late-stage capital events. Illustrative ladder (A/B the exact
numbers — see test plan):

| Tier | Who | Price (test) | What they get |
|---|---|---|---|
| **Free / "Builder"** | Every vibe coder, day one | $0 | Connect Stripe → verified revenue dashboard; basic incorporation/cap-table; capital-provider directory (browse); readiness teaser. *Acquisition + data flywheel.* |
| **Starter** | Building, pre-raise | ~$19–29/mo | Auto books + AR/AP/burn; auto cap table + 83(b)/option tracking; data-room lite; process tracker; "what you'd qualify for." |
| **Growth** | Actively raising/borrowing | ~$99–149/mo | Full verified data room; all 184 diligence items auto-prepared; lender-matching + warm directory intros; QoE-lite; multi-provider tracker. |
| **Scale** | Series A+ / audit-ready | ~$399–699/mo | Audit-ready workpapers for an independent partner; cap-table + ICFR evidence; attorney-ready legal stack; priority partner network. |
| **Capital events** | PE / M&A / IPO | **Commission / success fee** (+ retainer) | Managed readiness through a transaction; partner auditors/attorneys; success fee or warrants **only at close**, later-stage only. |

**Success-fee benchmarks** (precedented at the capital event): AngelList ~5% + 2.5% success;
Wefunder ~7.5–7.9% success-only; Republic 6% cash + 2% equity. A 5–8% fee at close is market
— but for **equity** it must run through a registered/no-action structure (broker-dealer
caution, see [`10`](./10-growth-and-distribution.md) §5). Debt referral fees are lower-risk;
lead there. **Day-one hook (free):** 83(b)/BOI/cap-table **deadline alerts** auto-detected
from the user's rails — invisible-until-expensive pains that make the product must-have at $0
revenue (detailed in `10` §1).

**Why this shape:**
- **Low entry / free** is mandatory for a high-volume, price-sensitive solo-builder
  audience (the land motion). The data they connect is the moat regardless of whether they
  pay yet.
- **Subscription carries the base** (most users never raise — like `04` concluded) and is
  the thing to *test* now across tiers/segments.
- **Commission only at PE/IPO** aligns with where dollar value is large, diligence is
  standardized, and a success fee is normal — and avoids broker-dealer issues at the
  small-check early stages (keep early stuff subscription/SaaS, not transaction-based).

## 5. Test plan (validate the model)
1. **Free → Starter conversion** by acquisition channel (which vibe-coder channels convert).
2. **Two Starter prices** ($19 vs $29) and **two Growth prices** ($99 vs $149) by cohort.
3. **Directory/tracker as the upgrade trigger** — does "see who'd fund you + track it" pull
   free→paid better than the back-office features alone?
4. **Lender-match → funded** rate (the real forcing-function test from `06`): do verified
   users get term sheets faster? If yes, stand up the lender-paid verified-deal-flow line.
5. **Hold commission for PE/IPO** until volume justifies the partner + legal structure.

## 6. What this changes elsewhere
- ICP in `00`/`06`: add the **vibe-coder top-of-funnel** explicitly; lenders remain the
  first *monetized forcing function*, PE/IPO the commission tier.
- Build order (`05`/`07`): unchanged — Revenue Truth + cap table + expense are exactly the
  free/Starter back office. Add the **directory + process tracker** as the conversion
  surface (they sit on top of the catalog in `08`).
- Growth + capital-provider linking + agent-native distribution: see
  [`10`](./10-growth-and-distribution.md).

> Not investment/legal advice. Transaction-based comp (commission/success fees) and operating
> an investor/lender directory that routes deals can implicate broker-dealer/finder
> regulation — structure with securities counsel before turning on commission.
