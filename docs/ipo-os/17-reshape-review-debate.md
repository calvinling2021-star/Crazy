# 17 — Reshape Review: Is the Product On Track?

> A 10-stakeholder debate reviewing everything designed so far (`00`–`16`) to judge whether
> the reshaped product is on the right track — and what to change. This is a critical review,
> not a victory lap. Verdict and the recommended reshape are at the end.

## The product as it stands today (so we're honest about scope)
Across the docs we have specified: a verified auditable revenue **spine**; **audit automation**;
**cap table + expense**; **S-1 / deck / legal** generators; a **184→200-item diligence catalog**;
a **71-provider requirements DB** (the alpha moment); a **debt-first lending** thesis with an
**audit-based credit score**; a **capital-provider contact network + premium intros**; a
**vibe-coder social platform**; **cross-platform MCP/skill distribution**; and **three alpha
moments**. That is a lot. The debate's central question: *is this one product, or ten?*

## The panel
| # | Persona | Lens |
|---|---|---|
| P1 | Focus-first seed VC | Would I fund *this* company? Is it too broad? |
| P2 | Pragmatic founder/operator | Can a small team build the MVP? |
| P3 | Vibe-coder user | What do I actually use? |
| P4 | Lender / credit-risk officer | Is the audit-based credit real & defensible? |
| P5 | Fintech/securities regulator-lawyer | The legal surface (lending, FCRA, broker-dealer, money) |
| P6 | Growth/distribution lead | Is MCP + social the right GTM? |
| P7 | Skeptic / short-seller | Where does it break? |
| P8 | Product strategist | The one wedge; what to cut/defer |
| P9 | Comparable operator (Vanta/Ramp archetype) | What would we tell you |
| P10 | Trust/architecture lead | Can the spine actually be built safely? |

---

## Round 1 — Is the core thesis sound? (mostly yes)
**P10 (architect):** The crown jewel is real: a **deterministic, auditable spine** (revenue →
payout → bank, plus cap table + spend), numbers verified not AI-guessed. Everything good flows
from it. That's a genuine, buildable asset and a moat.
**P4 (lender):** And **debt-first off audited data** is the right beachhead — eager supply,
recurring demand, the only party that *refuses to fund without verified data*. "Credit from day
one" is a strong, underserved idea.
**P3 (user):** As a builder I want exactly two things from this list: **deadline alerts/clean
books** and **an instant loan when I'm growing**. I do not care about S-1s or IPOs.
**P1 (VC):** The *thesis* is fundable. The *company you've described* is five companies. That's
the problem, not the thesis.

**R1 verdict:** Core thesis (verified spine → seamless debt for vibe coders) is **on track and
differentiated.** Hold that thought against Round 2.

---

## Round 2 — The scope-creep fight (the central issue)
**P8 (strategist):** You've specified Carta + Ramp + Pilot + Vanta + Plaid + AngelList + a
social network + an MCP infra play + a credit bureau + an IPO shop. **Nobody builds that.** Each
surface halves focus and the data shows it: the IPO/S-1 work (`04` itself concluded) serves <1%
of users; the social platform is a separate company with brutal cold-start; equity intros are a
regulated business. This is a roadmap masquerading as a product.
**P9 (operator):** Vanta won by owning **one** painful, recurring, verifiable job (SOC 2
readiness) for *years* before expanding. Your one job is obvious: **get a vibe coder instant,
paperwork-free growth capital off verified data.** Everything else is "later."
**P7 (skeptic):** The "do-everything" surface is the tell of a pitch deck, not a shipped product.
And every added surface **doubles the regulatory and trust load** (Round 3).
**P2 (founder):** The MVP is small and shippable: **connect Stripe → verified revenue +
readiness/deadline alerts (free) → one pre-qualified lender offer.** The other 14 docs are the
2–3 year roadmap, not v1.
**P6 (growth):** Counterpoint — the **agent-native distribution (MCP/Stripe app)** is *cheap* and
on-strategy; keep it. And a **light social badge/leaderboard** is a viral hook, not the full
social network. Distinguish "cheap on-wedge" from "second company."

**R2 verdict:** The **scope has drifted into an everything-platform.** The reshape is *ruthless
focus*: one wedge now, the rest sequenced as downstream — not parallel.

---

## Round 3 — The hardest risks
**P5 (lawyer):** You are stacking regulated activities. **(a) Credit scoring** can trigger FCRA/
consumer-reporting rules — frame the score as *informational to the founder*, not a furnished
consumer report, and get lending counsel. **(b) Routing loans** can need lending/broker licenses
by state; debt **referral** + flat/again-permissible success fees is the clean lane — don't
become the lender. **(c) Equity intros with success fees = broker-dealer** (`10`/`12`). **(d)
Moving money** = MTL/BaaS partner, never you. **Do not trip all of these at once.** Debt-referral
+ flat-fee + human-signed audit is the lane that stays legal.
**P7 (skeptic):** Trust is the entire company, and you're stacking trust-sensitive surfaces: hold
everyone's financials **and** score their credit **and** route them to lenders **and** run a
social feed **and** facilitate investor intros. One Carta-style conflict and it's over.
**Neutrality must be absolute**, and the more surfaces, the more conflict edges.
**P10 (architect):** Non-negotiable: the credit score and the DD report must be **deterministic
off audited data**, never AI-guessed. The moment the "verified" number is an inference, you're
**Pipe** ($7M real revenue on $47M burn). And the audit/legal generators stay **human-signed**
(14% CFO trust; legal-hallucination sanctions).
**P4 (lender):** Also: rails prove revenue *exists*; they don't prove **completeness** (off-rail
revenue, hidden debt). Underwrite conservatively and say what the data does/doesn't cover.

**R3 verdict:** The risks are survivable **only with focus + absolute neutrality + the
debt-referral/flat-fee legal lane + deterministic, human-signed outputs.** Breadth multiplies
every one of these risks.

---

## Round 4 — Sequencing / the reshape
**P8 (strategist):** Collapse to the wedge and sequence:
- **KEEP / SHARPEN (v1, now):** the **spine** (`05`), **free readiness + deadline alerts** (`10`),
  **audit-based eligibility → one-click debt** via aggregator + 2–3 lenders (`15`), and
  **cheap agent-native distribution** (MCP + Stripe app, `11`).
- **KEEP AS FEATURE (not product):** the **provider DD database / alpha moment** (`14`) — it's a
  thin, high-wow layer on the spine; the **verified badge** (a light slice of `13`).
- **DEFER (v2+, after the debt wedge proves out):** full **cap table/expense depth** (`07`),
  **capital network + premium intros** (`12`), **inbound-investor / DD-report-to-VCs** (A3 of `16`).
- **CUT / PARK (not now):** **S-1 / IPO generation** (`02`/`04` — <1% of users), the **full social
  network** (`13` — separate company), **PE/QoE depth** (`08` upper tiers), **equity success-fee
  intros** (regulated).
**P9 (operator):** Yes — and prove **"verified → funded"** with a handful of lenders before you
build the "credit bureau." Let usage earn the right to expand.
**P1 (VC):** A focused *"instant non-dilutive capital, off your real audited numbers, for AI
builders — no paperwork"* is fundable **today**. The everything-platform is not.
**P3 (user):** That version I'd tell every builder friend about. The IPO stuff, never.

---

## Consolidated verdict

**On the right track at the core; off track on scope.** The reshaping correctly found a sharp,
differentiated, fundable wedge — **the verified, auditable spine that gives vibe coders instant,
paperwork-free growth capital, with credit building from day one** — distributed agent-natively
and kept neutral. But the product has *accumulated* into an everything-platform (finance OS +
cap table + audit + IPO shop + credit bureau + lender marketplace + investor network + social
app + infra play). That breadth is the single biggest risk: it dilutes focus, multiplies
regulatory exposure, and stacks trust-sensitive conflicts.

**The reshape = ruthless focus.** Ship the debt wedge on the spine; make the alpha-moment DB and
the verified badge thin features on top; **defer** the network/inbound-investor layer until the
wedge proves; **cut/park** S-1/IPO, the full social network, equity intros, and PE/QoE depth.

### Keep / Sharpen / Defer / Cut
| Verdict | Components |
|---|---|
| **Keep & sharpen (v1)** | Verified spine (`05`); free readiness + deadline alerts (`10`); audit-based eligibility → one-click debt (`15`); agent-native distribution MCP + Stripe app (`11`) |
| **Keep as thin feature** | Alpha-moment provider DB (`14`); verified badge slice of social (`13`) |
| **Defer (v2, post-proof)** | Cap table/expense depth (`07`); capital network + premium intros (`12`); inbound-investor DD-report (A3, `16`) |
| **Cut / park** | S-1 / IPO generation (`02`/`04`); full social platform (`13`); PE/QoE upper tiers (`08`); equity success-fee intros |

### The one sentence to commit to
*"Connect your revenue; we keep your numbers audited and in order, and get you instant,
paperwork-free growth capital — building your credit from day one."*

### First 6 months (focus)
1. **Spine + free readiness/deadline alerts** (the day-one hook, deterministic).
2. **Audit-based eligibility → one-click debt** via a lender aggregator + 2–3 design-partner FIs;
   prove **verified → funded**.
3. **Agent-native distribution** (MCP server + Stripe app) — cheap, on-wedge.
4. **Thin verified badge** for the viral loop. Nothing else.

### Non-negotiables carried forward
Deterministic numbers (never AI-guessed); AI-prepared / **human-signed** audit & legal; **absolute
neutrality** (never a deal counterparty); **debt-referral + flat-fee** legal lane; conservative
completeness claims.

> Net: the compass points the right way; the backpack is overloaded. Drop everything that isn't
> the debt wedge + spine, prove it, then re-add — in the order above — only what usage earns.
