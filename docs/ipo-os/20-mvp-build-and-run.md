# 20 — MVP Build & Run (the focused debt wedge, shippable)

A runnable vertical slice of the locked focus (`19`): **verified spine → credit-from-day-one →
instant, paperwork-free debt + alpha-moment checklists**, with a dashboard and an MCP server.
All outputs are **deterministic from verified data** (no AI-guessed numbers).

## What's built
```
src/lib/cdp/                 # the core (no external deps; pure TS + JSON)
  types.ts                   # domain types
  demo.ts                    # a believable "vibe coder" demo company (runs with zero setup)
  connectors.ts              # RailConnector + live read-only Stripe + loadCompany() demo fallback
  spine.ts                   # deterministic verified metrics (MRR/ARR/NRR/runway/reconciliation)
  creditScore.ts             # the moat: Standing score + factors + how-to-improve guidance
  readiness.ts               # day-one hook: 83(b)/BOI/cap-table deadline alerts
  aggregator.ts              # LendingAggregator interface + MockAggregator (swap for Lendflow/Parafin/Lendio)
  capital.ts                 # provider matching + the alpha-moment checklist (reads catalog.json/providers.json)
  badge.ts / og.ts           # Verified-by-Attestly badge + 1200x630 social share card (growth loop)
  index.ts                   # entry point (sync + async *Async loaders)
src/app/attestly/page.tsx    # Attestly landing page (brand, OG share image)
src/app/capital/page.tsx     # dashboard (Standing, Line offers + draw, alerts, "name a firm", badge embed)
src/app/capital/connect/     # read-only onboarding/consent screen
src/app/capital/standing/    # Standing detail + ranked how-to-improve
src/app/api/cdp/*            # state / checklist / providers JSON endpoints
src/app/api/badge, api/og    # embeddable badge SVG + social share card SVG
mcp/server.ts                # Attestly MCP server (one server, many agents) — npm run mcp
scripts/cdp_smoke.ts         # assertion smoke test — npm test
```

## Run it locally
```bash
npm install
npm run dev          # http://localhost:3000/attestly (landing) · /capital (dashboard)
npm run build && npm run start
npm test             # core assertions + diligence-data validation
npm run validate:data  # validate catalog.json/providers.json (refs, enums, unique ids)
```
The app reads `src/data/diligence/{catalog.json,providers.json}` directly — **no database needed**
for the demo. Set a restricted, read-only `STRIPE_SECRET_KEY` in `.env` to switch to live data.

### Smoke-test the core without a full install
```bash
npx -y tsx scripts/cdp_smoke.ts
```
Expected: credit score ~70 (Strong), four indicative offers (Founderpath/Pipe/Wayflyer/Arc),
83(b) alerts firing, ~17 qualifying providers, YC ~69% / Capchase ~95% ready.

### Run the MCP server (agent-native distribution)
```bash
npm run mcp          # stdio MCP server "vibe-coder-operation-platform"
```
Tools exposed: `get_credit_score`, `improve_standing`, `check_deadlines`, `verify_revenue`,
`match_capital`, `get_readiness_score`, `assemble_checklist` (name a provider id), `list_providers`.
Add it to Claude/Cursor/etc. as a stdio MCP server pointing at `npm run mcp` (or
`tsx /abs/path/mcp/server.ts`).

## How the demo maps to the three alpha moments (`16`)
1. **Instant, paperwork-free debt** — the dashboard's offer cards + `match_capital`: the
   audited data *is* the application.
2. **(deferred / lean)** social — not in this slice; the verified badge is the hook to add next.
3. **Alpha moment / be-ready** — "name a firm" → exact checklist + % prepared (`assemble_checklist`).

## What's real vs stubbed (be honest in the demo)
- **Real & deterministic:** metrics, credit score + factors, readiness/deadline logic, provider
  eligibility matching, and the 71-provider × 200-item checklist mapping.
- **Stubbed for the demo:** the connected company is `demo.ts` (swap for live read-only rail
  connectors); offers come from `MockAggregator` (swap for a real Lendflow/Parafin/Lendio
  adapter behind the same interface); no auth/multi-tenant yet.

## Immediate next steps to harden for real testing
1. **Rail connectors:** replace `demo.ts` with read-only Stripe (+ bank via Plaid) ingestion
   feeding the same `Company` shape; keep the spine deterministic.
2. **Aggregator adapter:** implement `LendingAggregator` against Lendflow/Parafin/Lendio
   sandbox; map pre-qual → real indicative offers.
3. **Credit-score governance:** lock the factor weights, version every score, and run the
   FCRA/fair-lending framing past lending counsel before any real credit decision uses it.
4. **Auth + tenancy:** one founder = one connected tenant; scope all data per tenant.

> Non-negotiables carried from `17`/`19`: deterministic numbers, human-signed where attestation
> matters, absolute neutrality (never a deal counterparty), debt-referral/flat-fee legal lane,
> conservative completeness claims.
