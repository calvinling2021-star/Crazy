# IPO OS — Business Model Reshape, Agent Prompts & Operation Plan

> Working design docs for repositioning **IPO OS**: the AI-native operating system
> that takes AI startups from "having fans and users" to **audit-ready, raise-ready,
> and IPO-ready** — with AI agents doing the heavy lifting and humans (auditor,
> attorney) reduced to review-and-sign-off.

## The one-sentence thesis

Most AI startups have **users and revenue but no path to the capital markets**.
IPO OS gives every AI startup an *always-on financial + legal back office* that is
cheap and addictive as a paid product — and turns the **best** of them into IPO
candidates faster and cheaper than any bank or law firm can.

## The three reshapes (your asks, sharpened)

1. **Narrow the ICP to "traceable-revenue" AI startups.**
   Only court companies whose revenue flows through a small set of verifiable rails
   — **Stripe, Apple App Store, Google Play / Google Ads, Meta**. Revenue you can
   pull read-only from an API is revenue you can *prove*. That single constraint
   collapses audit cost, audit time, and legal risk.

2. **Automate the audit.**
   AI agents pull source-of-truth data, build the reconciliations and workpapers,
   and hand the human auditor a clean exception list. The auditor reviews and signs;
   they do not assemble. (Realistic, compliance-aware version below.)

3. **Auto-generate the capital documents.**
   One verified data "spine" feeds the **pitch deck, S-1, and the legal stack**.
   Attorneys review and sign off instead of drafting from scratch. The system
   self-improves from every human edit.

## Files

| File | What's in it |
|------|--------------|
| [`00-business-model.md`](./00-business-model.md) | Positioning, ICP, the two-tier funnel (utility → IPO track), pricing, moat, why "traceable revenue" wins |
| [`01-agent-architecture.md`](./01-agent-architecture.md) | The agent roster, the single "revenue spine," human-in-the-loop boundaries, compliance guardrails |
| [`02-prompt-library.md`](./02-prompt-library.md) | Copy-paste **system prompts** for every agent (revenue truth, audit, S-1, deck, legal, IPO scoring, growth, self-improvement) |
| [`03-operation-plan.md`](./03-operation-plan.md) | 0→12-month phased rollout, GTM motion, the "must-have" hooks, metrics, risks & legal reality checks |
| [`04-stakeholder-debate.md`](./04-stakeholder-debate.md) | **Deep-research validation** — 10 stakeholders (founder, banker, attorney, auditor, regulator, VC, public investor, accountant, skeptic, competitor) debate the model with cited evidence; verdict + 6 forced pivots |
| [`05-coding-prompt.md`](./05-coding-prompt.md) | **Ready-to-use build prompt** for the A1 Revenue Truth MVP (deterministic verified-revenue engine), with the rationale tying each design choice to the research |

## Read order
Start with `00`, skim `01` for the architecture, then `02` is the part you operate
day-to-day. **`04` is the validation** — read it before committing capital; it stress-
tests the model against real evidence and lists what must change. `03` is go-to-market.
`05` is what you hand a coding agent to start building.

## Headline finding from the research debate (`04`)
The model is **viable, but not as "IPO in a box."** The durable, fundable business is a
**Vanta-for-startup-finance**: deterministic verified revenue → continuously audit-ready
books → fundraise/diligence-ready data room, sold as a *present-tense utility*. The
"IPO" is a **brand halo + on-ramp**, realized mostly as private liquidity / exit-
readiness, because the real barrier for small AI startups is **aftermarket demand, not
process cost** — software can't manufacture a buyer base. Six forced pivots are listed
at the end of `04`. **Build `05` (Revenue Truth) first** — every stakeholder endorsed it.
