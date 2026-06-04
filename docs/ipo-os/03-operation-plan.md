# 03 — Operation Plan

A sequenced plan to build the product *while reshaping the model*, land the whole
AI-startup population on Tier 1, and graduate the best into the IPO Track.

## North-star + guardrail metrics

- **North star:** verified net revenue under management (Σ of all connected companies'
  verified revenue). It proves the moat and powers scoring.
- **Tier-1:** activation rate (rails connected → verified ARR view), free→paid,
  net revenue retention, "audit-ready" accounts.
- **Tier-2:** time-to-audit-ready, time-to-S-1-draft, **human-review-hours per
  document** (must fall every quarter), companies in IPO Track, filings.
- **Quality guardrail:** hallucination rate in generated docs → target **zero**
  unsourced financial facts. This is existential; track it like uptime.

## Phase 0 — Wedge & proof (Months 0–3)

Goal: prove "traceable revenue → audit-ready in days."

1. **Build A1 (Revenue Truth) first.** Stripe + Apple App Store + Google Play +
   Meta read-only connectors → canonical ledger → three-way reconciliation. This
   alone is a sellable product and the foundation of everything.
2. **Ship the free "Connect" tier:** connect rails → verified Revenue Truth dashboard
   + teaser IPO-readiness score. Use it to vacuum up AI startups and their data.
3. **Design partners:** 5–10 AI startups on the rails. Get to "verified ARR they trust
   more than their own spreadsheet." That testimonial is the wedge.
4. **Recruit 1–2 independent audit firms** as panel partners (you prepare, they sign).
   Validate the workpaper format with them *now*, before scaling.

Exit criteria: a design partner says "I'd be crazy not to use this," and a partner
auditor agrees the A2 workpaper package materially cuts their hours.

## Phase 1 — Tier-1 "Financial OS" as a must-have (Months 3–6)

Goal: make it indispensable; turn on revenue.

1. **A2 Audit Automation** workpaper package → first agent-assisted audit sign-off
   with a panel auditor. Headline: *audit in days at a fraction of the cost.*
2. **Tier-1 paid product:** reconciled books, investor data room, one-click board pack,
   "always audit-ready" guarantee. Price to be a no-brainer.
3. **A7 Growth** loops: activation nudges (connect every rail for 100% verified
   revenue), free→paid triggers (board meeting / raising soon), churn saves.
4. **The "IPO OS verified" badge** for decks/data rooms — start building the
   legitimacy network effect.

Exit criteria: healthy free→paid conversion, net revenue retention > 100%, a roster of
"audit-ready" accounts, growing verified-revenue-under-management.

## Phase 2 — Capital documents & the IPO Track (Months 6–9)

Goal: light up Tier 2 economics.

1. **A4 Pitch Deck** + **A3 S-1 Drafting** + **A5 Legal Stack**, all reading the same
   Spine so numbers never contradict across documents.
2. **A6 IPO Scoring** on the whole population → first IPO-Track leaderboard for the
   investment committee.
3. **Recruit securities-counsel panel** (you draft, they review & sign). Pitch the
   firms on leverage, not replacement.
4. **First IPO-Track engagements:** 2–3 top-scored companies; run A2→A3→A4→A5 with
   human auditor + attorney sign-off through to S-1 draft.

Exit criteria: a complete S-1 draft + audited financials produced mostly by agents,
with auditor and attorney review hours dramatically below market.

## Phase 3 — Self-improvement & scale (Months 9–12+)

1. **A8 Self-Improvement** in the loop: every human edit lowers next-run review time;
   ship the regression eval suite. Falling review-hours-per-doc is the compounding moat.
2. **Scale the panels** (more audit firms, more law firms) to handle volume.
3. **First filing(s)** from the IPO Track; turn them into the flagship proof.
4. **Open the platform** to more rails only if they preserve traceability; resist
   onboarding non-traceable revenue — it breaks the whole model's economics.

## GTM motion — how you attract *all* AI startups

- **Free verified-revenue dashboard is the top of funnel.** Founders connect rails to
  see their own truth; you gain their data and the relationship. (Self-serve, viral.)
- **The badge as social proof.** "IPO OS verified" on decks/data rooms makes *not*
  using it look like a red flag to investors → pull, not push.
- **Aspirational ladder.** Public readiness score + "path to the next level" makes it a
  status product, not just a utility. Founders share their score.
- **Distribution partners:** accelerators, AI-startup communities, the rails' own app
  marketplaces (Stripe App Marketplace, etc.), AI-founder media.
- **Land Tier-1 broadly, hand-pick Tier-2.** Most users live happily in Tier 1; the
  IPO Track is the halo that makes the whole thing aspirational.

## Make founders feel it's a *must* (the hooks)

1. **"Is my revenue real?" answered forever** — verified ARR they can hand any investor.
2. **No CFO/controller/GC needed** — the agents are the back office.
3. **Always audit-ready** — never scramble for a diligence or audit again.
4. **One-click board pack & data room** — recurring weekly/monthly value.
5. **A visible ladder to the capital markets** nobody else offers.

## Team & build order

- **First hire energy on:** rail connectors + reconciliation engine (A1), and a
  staff/partner with audit (CPA/PCAOB) credibility to validate A2 and run the auditor
  panel. These de-risk the whole thesis.
- Then: securities-counsel relationships for the panel; document-generation eng for
  A3–A5; growth for A7. A8 once you have enough human-edit data to learn from.

## Risks & reality checks (read before pitching investors)

| Risk | Mitigation |
|------|------------|
| **Hallucinated financials in audit/S-1** (existential) | "No fact without provenance" guardrail; A8 P0 on hallucinations; humans sign. Track unsourced-fact rate to zero. |
| **You can't remove the auditor/attorney of record** | Don't try. Model = reduce them to review-and-sign; own the *preparer* layer. Partner panels for the *attestor/filer* layer. |
| **Auditor independence rules** | The signing audit firm must be independent of IPO OS — use a partner panel, don't employ the signer. |
| **Securities-law liability** | Counsel owns filings; IPO OS is a drafting + diligence accelerator, clearly positioned as such. |
| **Platform/rail dependence** (your customers' and yours) | Multi-rail from day one; treat any single-rail concentration as a flagged risk in scoring and in the S-1. |
| **Most users never IPO** | Fine — Tier 1 is a standalone business; the IPO Track is the halo, not the volume. |
| **Data security / financial PII** | Read-only scoped revocable creds, tenant isolation, least privilege, immutable provenance log. |
| **Adverse selection on free tier** | The data is the asset regardless; scoring filters who gets high-touch. |

## Locked decisions (from founder)

1. **Channels:** support **up to 10 traceable channels**; governing rule is
   traceability to a third-party payout report + bank deposit, not the specific brand.
   Build order: **Stripe + Apple first**, then Google, Meta, then the next six.
2. **Panels:** **pure-partner** — never employ the signing auditor/attorney. Platform
   owns prep; independent firms own opinion/filing. Keeps independence + liability clean.
3. **Standards:** support **both US GAAP/SEC and IFRS** — US-first for go-to-market,
   IFRS in the data model from day one so non-US AI startups aren't a re-architecture.
4. **Pricing:** run **both** flat-SaaS and revenue-banded for Tier 1 (A/B by segment);
   IPO Track on engagement fee + success fee/warrants.

## Still to validate (post-research)

- Which Tier-1 pricing structure wins by segment.
- Panel economics: referral model, SLAs, and how partners price agent-prepped work.
- IFRS rollout timing vs US-only depth.
