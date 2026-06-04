# 10 — Growth, Agent-Native Distribution & Capital Linking

> Founder direction: *how do we grow; how do we get agents to recommend the product and get
> built into major platforms like Claude; and how do we link to as many capital providers as
> possible.* Grounded in deep research on the vibe-coder market, MCP/agent distribution, and
> capital connectivity (sources cited inline).

## 0. The shape of the opportunity (why this can grow fast)

- **Top of funnel is tens of millions of builders.** Cursor ~$2–3B ARR / 7M+ MAU; Lovable
  ~8M users, 100k+ new projects/day; Replit $10M→$100M ARR in 9 months. "Vibe coding" is a
  ~$4.7B market (2026), **63% of users are non-developers** — the fuzzy beginner. [Sacra;
  TechCrunch; Wikipedia]
- **But revenue is a power law:** ~70% of independent SaaS earn <$1k MRR, ~88% <$10k MRR.
  So: **free tier farms the entire top; the monetizable core is the minority crossing
  $1k–$10k MRR — almost all on Stripe/Lemon Squeezy (traceable rails).** [MicroConf;
  SaaSRanger]
- **The wave is accelerating:** Stripe Atlas 2025 — 56% more startups hit $100k revenue in
  their first 6 months vs 2024, ~11% faster, across 169 countries. [Stripe Atlas 2025]

Growth strategy = **farm the huge top cheaply (free, automated, viral), and convert the
revenue-crossing minority to paid + capital events.**

## 1. The day-one hook (activation before revenue)

The fuzzy beginner's pains are **invisible until expensive, deadline-driven, and blocking at
the capital moment** — the perfect wedge:
- **83(b) election** — must file with the IRS **within 30 days** of share purchase or face a
  large future tax bill. A silent killer.
- **BOI / beneficial-ownership** filings, wrong-entity-for-financing, mixing personal/
  business funds, contractor misclassification, undocumented advisor/option grants that
  detonate a future cap table. [Bain Capital Ventures; Mercury]

**The hook:** a **free Readiness Score + deadline alerts**, auto-detected from the builder's
existing rails (Stripe + incorporation data), surfaced **while revenue is still $0**. It
makes the product useful and trust-building on day one, long before a raise — and it is
*automatable* (these are deterministic checks, not AI guesses). This is the activation
event that earns the right to everything else.

## 2. Agent-native distribution (get recommended *and* invoked)

Two distinct motions — do both; they compound:

### 2a. Be **callable** by agents — ship an MCP server
MCP is now the neutral standard (donated to the Linux Foundation's Agentic AI Foundation,
Dec 2025; ~97M monthly SDK downloads; 10k+ servers; first-class in Claude, ChatGPT, Cursor,
Gemini, Copilot). [Anthropic; TechCrunch; Linux Foundation]
- **Publish an Vibe-Coder-Operation-Platform / Vibe Coder Operation Platform MCP server** exposing read-only, safe actions:
  "check my capital readiness," "what am I missing for a Series A," "what's my verified
  ARR," "which lenders do I qualify for," "file/track my 83(b)." Then **list it in Claude's
  Connectors Directory** (200+ integrations; Stripe is already there; Pro/Max/Team can add
  custom MCP servers).
- **Why it's a wedge:** the builder is *already in Claude/Cursor building*. If, inside that
  same agent, they can run "make me capital-ready," the product meets them at the exact
  moment of need with zero context switch. Be the **capability agents reach for** (the Stripe
  agent-toolkit playbook — infrastructure-as-distribution), not a destination they must visit.
- **Also ship an Agent Skill** (cross-platform now — OpenAI adopted the format) packaging
  "capital readiness" expertise Claude can load on demand.

### 2b. Be **recommended** in free-form answers — GEO/AEO
When no connector is installed, recommendation is won by **third-party consensus, not SEO**.
What actually drives LLM recommendations: presence on **G2/Capterra, Reddit, Wikipedia, and
curated "best-of" lists**, plus **original data** the model can't synthesize itself.
Traditional backlinks/keywords barely matter; Claude specifically favors well-evidenced
long-form with outbound source links. [Onely; DiscoveredLabs; Frase]
- **Tactics:** get on "best tools for startup fundraising / cap table / founders" lists;
  seed honest Reddit/Indie Hackers threads; earn G2/Capterra reviews; publish **proprietary
  data reports** ("State of Vibe-Coder Revenue," built from aggregated verified data — like
  TrustMRR's $1B-verified moment) that LLMs cite. Become Wikipedia-eligible over time.
- **Don't** chase ChatGPT-plugin-style proprietary stores (they failed); bet on the open
  protocol + being in the cited sources.

### 2c. Embed where building happens
The highest-intent channel is the **builder platforms' own marketplaces/templates** (Lovable
100k+ projects/day, Cursor, Replit, v0, Stripe Atlas). Ship **templates/integrations** so a
new project scaffolds with "capital readiness" wired in from the first commit.

## 3. The human growth channels (in effectiveness order for this audience)
1. **Indie Hackers** — wins by *specificity*: brutally honest posts about the exact pain pull
   in exactly the people with that pain.
2. **Build-in-public on X/LinkedIn** — dominant once an audience exists; share verified
   milestones (your own and, with consent, aggregate user wins).
3. **Product Hunt** — a top-5 launch ≈ 1–10k visits + hundreds of signups in 48h (spiky).
4. **Comparison/SEO content** — the durable engine: 60–80% of signups for mature indie tools
   come from content published months earlier. Doubles as GEO fuel (§2b).
5. **Platform marketplaces/templates** (§2c).

## 4. Viral loops (engineer these in)
- **Verified badge** (TrustMRR/SOC-2 pattern): users embed "Vibe-Coder-Operation-Platform verified
  $X ARR" on landing pages / build-in-public posts → free distribution + a pull signal that
  becomes a red flag to *lack* (works only if **investors/lenders come to expect it** — so
  seed the demand side, §5).
- **Readiness-score sharing** — a shareable, gamified score (with the deadline alerts) is
  inherently postable in build-in-public culture.
- **Referral** — builders refer builders; the audience is tightly networked (IH/X/Discord).
- **Data flywheel** — every connected builder improves lender-matching and the proprietary
  data reports that win GEO (§2b), which acquire more builders.

## 5. Linking to as many capital providers as possible

The asset the founder wants (a big directory of investors/banks/lenders + matching) splits
cleanly into an **easy debt side** and a **regulated equity side.**

### 5a. Lenders / debt — easy and the right place to start
- **One aggregator API connects many lenders.** Lendio Embedded ("single line of code,"
  multi-lender SMB marketplace) and **Lendflow Connect** (neutral network of **75+ lenders**,
  unified API) already did the BD. Plaid/Finicity supply the underwriting data. [Lendio;
  Lendflow]
- **Debt referral success fees are generally permissible** (loans aren't securities) — this
  is why Lendio's model works. **Route as much volume to the debt side as possible**;
  matched to the user's *verified* revenue ("you qualify for ~$X"). This is also the real
  forcing-function beachhead from `06` — lenders mandate verified data and pay for it.

### 5b. Investors / equity — valuable but regulated; structure carefully
- **Investor data** via **Crunchbase API** (most accessible, paid), Harmonic/PitchBook
  (licensed, sales-gated). AngelList/Visible networks are product features, **not resaleable
  APIs**; scraping Signal/Crunchbase is ToS-risky — don't build on it. [Crustdata; Sheetventure]
- **⚠️ The make-or-break landmine: transaction-based comp on equity = broker-dealer.** A fee
  **contingent on capital raised** triggers Exchange Act §15(a). There is **no federal
  "finder" safe harbor.** [Harris-Sliwoski; StartupGC]
  - **Safe design:** charge **flat subscription or flat per-intro fees** for equity intros,
    don't negotiate terms / handle funds / give advice — or operate under a registered
    structure (RIA / funding portal / partner with a registered broker-dealer), mirroring
    **AngelList's SEC no-action conditions** (no employee gets transaction-based comp).
  - **Commission/success fee** (the founder's later-stage model) is precedented at the
    capital event — **AngelList ~5% + 2.5% success, Wefunder ~7.5–7.9% success-only,
    Republic 6% cash + 2% equity** — but for *equity* it must run through the registered/
    no-action structure. Turn it on for **PE/IPO** only, with counsel and a BD partner.

### 5c. Stay neutral (the Carta firewall, again)
Be a **directory + readiness layer that surfaces options and lets the user choose** — never
steer for compensation, never broker on the core verified-data tenant, never trade on a
user's data to advantage a provider. Neutrality is what lets the verified artifact become a
**multi-acceptor standard** (the Plaid/credit-bureau/SOC-2 pattern) that many providers
trust — the real long-term moat.

## 6. Sequenced growth plan
1. **Now:** free Readiness Score + deadline alerts (§1) as the day-one hook; ship the **MCP
   server + Claude Connector** (§2a); seed Indie Hackers/build-in-public + comparison SEO
   (§3); embed templates on 1–2 builder platforms (§2c).
2. **Next:** GEO/AEO push (G2/Capterra/Reddit/Wikipedia + first proprietary data report,
   §2b); verified badge + readiness-score sharing loops (§4); **lender aggregator
   integration** (§5a) → first "verified → funded" conversions.
3. **Later:** investor directory via licensed data (§5b) under a flat-fee/neutral structure;
   stand up the **PE/IPO commission** tier through a registered/BD partner (§5b); become the
   multi-acceptor verified standard (§5c).

## 7. Metrics
- **Activation:** % of new builders who connect Stripe + get a Readiness Score (day-one hook).
- **Agent-sourced signups:** installs/invocations via MCP/Claude Connector; LLM-recommendation
  share of voice (track mentions in Claude/ChatGPT/Perplexity answers).
- **Free→paid** by channel and by the directory/tracker upgrade trigger (`09`).
- **Verified→funded:** lender match → term sheet rate (the forcing-function proof).
- **Viral coefficient:** badge embeds + referrals per active user.

> Not legal advice. The equity-referral / commission mechanics implicate broker-dealer and
> finder regulation — implement §5b only with securities counsel and, where needed, a
> registered broker-dealer or funding-portal partner.
