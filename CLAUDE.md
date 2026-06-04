# CLAUDE.md — project context for Claude Code

> Read this first, then `docs/ipo-os/README.md`, `19-locked-focus-decision-record.md`, and
> `20-mvp-build-and-run.md`. Those docs are the durable memory of the design + decisions.

## What this project is (current, locked direction)
**Capital Trust Center** — an AI-native platform that connects a "vibe coder" / early founder's
revenue rails (read-only), keeps **verified, auditable financials**, builds a **credit score from
day one**, and gets them **instant, paperwork-free growth debt** — "the key is seamless, not the
fund." Distributed agent-natively (MCP). Equity/IPO and a full social network are **deferred/cut**
(see `docs/ipo-os/19`). The repo also contains an unrelated legacy Next.js site ("Molecule
Capital") + a Python deal-sourcing `pipeline/` — leave those unless asked.

## Locked decisions (docs/ipo-os/17–19)
1. Narrow to the **debt wedge** (verified spine → instant paperwork-free growth debt).
2. **Credit-from-day-one** is the core moat (deterministic, off audited data).
3. **Partner via a lending aggregator** (Lendflow / Parafin / Lendio) — not a balance-sheet lender.
4. Keep social **lean** (acquisition + verified badge); defer equity/IPO; cut S-1/PE/equity-intros.
Non-negotiables: deterministic numbers (never AI-guessed), human-signed where attestation matters,
absolute neutrality (never a deal counterparty), debt-referral/flat-fee legal lane.

## What's built (runnable MVP)
- `src/lib/cdp/` — deterministic core (no external deps): `spine.ts` (verified metrics),
  `creditScore.ts` (the moat), `readiness.ts` (83(b)/BOI/cap-table alerts), `aggregator.ts`
  (`LendingAggregator` + `MockAggregator`), `capital.ts` (provider matching + alpha-moment
  checklist), `demo.ts` (a demo company so it runs with zero setup), `index.ts` (entry point).
- `src/app/capital/` — the dashboard (credit score, instant offers, deadline alerts, "name a firm").
- `src/app/api/cdp/*` — JSON endpoints (state / checklist / providers).
- `mcp/server.ts` — MCP server (`npm run mcp`): get_credit_score, check_deadlines, verify_revenue,
  match_capital, get_readiness_score, assemble_checklist, list_providers.
- `src/data/diligence/` — 200-item diligence `catalog.json` + 71-provider `providers.json`
  (named firms → exact required items) + `schema.sql` + `scripts/load_diligence.mjs`.

## Run
```bash
npm install
npm run dev                      # http://localhost:3000/capital  (no DB needed)
npm run mcp                      # the MCP server (stdio)
npx -y tsx scripts/cdp_smoke.ts  # smoke test the core (no install needed)
```

## What's stubbed (replace for real testing)
- `demo.ts` → live **read-only Stripe (+ Plaid bank)** ingestion into the same `Company` shape.
- `MockAggregator` → a real **Lendflow/Parafin/Lendio** adapter behind the `LendingAggregator` interface.
- No auth/multi-tenant yet. Credit-score weights + FCRA/fair-lending framing need lending counsel.

## Immediate next steps (pick up here)
1. Real Stripe read-only connector replacing `demo.ts`.
2. Aggregator adapter (sandbox) so offers are live.
3. Auth + per-tenant scoping.
4. Lock/version credit-score weights; counsel review.

## Git
Active branch: `claude/ipo-os-business-model-KKTms`. Commit + push there. Don't push to other
branches without explicit permission.
