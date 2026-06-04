# 19 — Locked Focus: The Decision Record & Focused Roadmap

> Canonical direction after the reshape debate (`17`) and competitor scan (`18`). These
> decisions supersede the broader scope in `00`–`16` where they conflict. Everything here is a
> founder-confirmed choice.

## The four locked decisions
1. **Narrow to the debt wedge.** The product is: *verified/audited financial spine → instant,
   paperwork-free growth debt for vibe coders.* **Defer** the equity/IPO side (inbound-investor
   DD-report, S-1/IPO generation, equity success-fee intros, PE/QoE depth).
2. **Keep the social platform** for vibe coders — as the lean acquisition + community + verified-
   badge engine that *feeds* the wedge (not a separately-resourced second company).
3. **Credit-from-day-one is the core moat.** Build a portable, founder-owned startup credit
   score/history on the spine — the "FICO for startups" the competitor scan found unoccupied.
4. **Partner via a lending aggregator** (Lendflow / Parafin / Lendio) — many lenders behind one
   API; debt-referral economics; not a balance-sheet lender, not (yet) our own underwriting.

## The one sentence
*"Connect your revenue; we keep your numbers audited and build your credit from day one — so the
moment you need growth capital, it's one click, no paperwork."*

## Why this is the right shape (from `17` + `18`)
- The debate: core thesis on track, but scope had drifted to an everything-platform that
  multiplies regulatory + trust load. Focus is the fix.
- The competitors: every *broad* surface (cap table, data room, audit, IPO, social-as-product)
  has well-funded incumbents; the *narrow* wedge — **day-one credit off audited books, vertically
  integrated (books + lending), for the unserved vibe-coder cohort** — is genuine whitespace.
  Differentiation is strongest exactly where we're now focusing.

## Scope — v1 / feature / defer / cut

| Bucket | Components |
|---|---|
| **v1 — build now** | (a) Verified **spine** (`05`); (b) free **readiness + 83(b)/BOI/deadline alerts** (`10`); (c) **credit-from-day-one score** on the spine (the moat); (d) **instant debt** via aggregator partner (`15`); (e) agent-native **distribution** (MCP server + Stripe app, `11`); (f) **lean social/community + verified badge** (acquisition + retention, `13`) |
| **Keep as thin feature** | Alpha-moment **provider DB** (`14`) — used to show "you qualify for X / you're Y% ready" on the *debt* side first |
| **Defer (v2, post-proof)** | Cap table/expense **depth** (`07`); capital-provider **contact network + premium intros** (`12`); **inbound-investor / DD-report** (A3, `16`) |
| **Cut / park** | **S-1 / IPO generation** (`02`/`04`); **PE/QoE** upper tiers (`08`); **equity success-fee intros** (broker-dealer); heavy enterprise diligence |

## The core moat: credit-from-day-one (decision #3)
- **What:** a portable, founder-owned **startup credit score + history**, seeded the moment a
  founder connects Stripe/bank/ledger — grounded in **deterministic, audited data** (the spine),
  never AI-guessed.
- **Inputs:** verified revenue + growth, retention/NRR, runway, burn discipline, % revenue on
  traceable rails, reconciliation cleanliness, and **on-platform repayment history** (compounds
  with use).
- **Why it's the moat:** it's the unoccupied primitive (no startup credit bureau exists), and it
  only works if you *produce* the audited data and *underwrite* on it — the vertical integration
  Puzzle/Digits (books, no lending) and Capchase/Founderpath (lending, 3rd-party data) would each
  have to build.
- **Regulatory framing (do this carefully):** position the score as **informational to the
  founder** and as an input the *partner lenders* use — not as a furnished consumer report.
  FCRA/consumer-reporting, fair-lending, and data-privacy rules attach as soon as it influences
  credit decisions. **Build with lending counsel; keep the human/partner in the decision loop.**

## The lending rail: partner via aggregator (decision #4)
- **Integrate one of Lendflow (75+ lenders + scoring) / Parafin / Lendio Embedded** — fastest path
  to a live "instant offer," debt-referral economics, lowest capital/regulatory load.
- **Flow:** verified spine + credit score → pre-qualify against the aggregator's lender network →
  surface pre-approved offers in-product (and via the MCP `match_capital` tool) → auto-generate the
  loan package/KYC/covenant docs (`oth-005`) → one-click accept. **Paperwork-free because we are
  the source of truth.**
- **Later option (not now):** direct local-bank/FI partnerships accepting our verified package, and
  eventually our own balance sheet — only after "verified → funded" is proven.
- **Monetization:** lender-paid referral/origination (clean for debt) + the founder subscription
  (`09`). No equity success fees in v1.

## Keep social — but lean and in service of the wedge (decision #2)
Retained per founder call, scoped tight so it doesn't become a second company:
- **What it is in v1:** verified profiles + the **verified-revenue/credit badge**, a build-in-public
  feed, a verified-revenue leaderboard, and Q&A with the copilot in-feed (`13`).
- **Its job:** cheap top-of-funnel acquisition for the millions of vibe coders, retention, and
  manufacturing **badge demand** (the SOC-2-style pull). It feeds data into the spine and credit
  score.
- **Guardrails (from `13`/`17`):** expect a hard cold-start (seed with build-in-public power users
  + the free deadline/credit hooks first); keep it lean; protect any future provider side from
  spam. Do **not** over-resource it ahead of the debt wedge.

## First 6 months (focused execution)
1. **Spine + free readiness/deadline hooks** — deterministic, day-one value, connects the data.
2. **Credit-from-day-one score** on the spine (the moat) — with lending-counsel framing.
3. **Aggregator integration → instant pre-qualified debt offers** + auto-generated loan docs;
   prove **verified → funded** with real founders.
4. **Agent-native distribution** — MCP server (`match_capital`, `get_readiness_score`,
   `check_deadlines`) + Stripe app.
5. **Lean social + verified badge** — the viral acquisition loop.

## Metrics (the focused set)
- **Activation:** % of new builders who connect a rail + get a credit score (day-one).
- **Verified → funded:** pre-qual → offer → accepted → funded conversion and time-to-funds.
- **% offers with zero manual document upload** (the "paperwork-free" promise).
- **Agent-sourced signups** (MCP/Stripe app) and **badge embeds** (viral coefficient).
- **Credit-score → repayment performance** (proves the underwriting and compounds the moat).

## Non-negotiables (carried from `17`)
Deterministic numbers (never AI-guessed); AI-prepared / **human-signed** where attestation matters;
**absolute neutrality** (never a deal counterparty; never trade on a user's data); **debt-referral +
flat/subscription** legal lane (no equity success fees in v1); **conservative completeness claims**
(rails prove revenue exists, not that none is hidden).

## Immediate next build steps (when you're ready)
1. Scaffold the **MCP server** exposing `get_readiness_score` / `check_deadlines` /
   `match_capital` over the spine + provider DB (`14`).
2. Spec the **credit-score object** on the spine (inputs, deterministic computation, versioned
   history) — plus the lending-counsel checklist.
3. Pick the **aggregator** (Lendflow vs Parafin vs Lendio) and map the pre-qual → offer → docs flow.
