# 11 — Built-In Everywhere: Cross-Platform MCP/Skill Distribution

> Founder direction: *build MCP + skill functions into Claude, Codex/OpenAI, Gemini and other
> platforms — and into Stripe and other software — so it's a built-in product that pulls users
> and traffic like Vercel and Supabase did as AI-vibe-coder infrastructure; built into Vercel
> and Supabase too.*

The research verdict: **this is the right play and it's mostly achievable — because of one
fact.** Build **one MCP server**; it is reusable across nearly every agent and most infra
marketplaces. Then do N lightweight *packaging* jobs, not N rebuilds. Distribution becomes
"be the capability every agent can call, and the default inside the tools builders already
use." [Stripe MCP; Supabase MCP; OpenAI Apps SDK; Gemini CLI]

## 1. The core asset: one MCP server, many surfaces

MCP is now the neutral standard (donated to the Linux Foundation, Dec 2025). One compliant
server works with **Claude (Desktop/Code), Cursor, Windsurf, VS Code/Copilot, Cline, Zed,
Replit, Gemini CLI, OpenAI Codex, and ChatGPT (Apps SDK extends MCP)** — only the per-client
config format differs. Stripe and Supabase both ship a single MCP server consumed by all of
these. **Build once, wrap many.**

### The tool/skill surface to expose (read-only, safe-by-default)
The Capital Trust Center MCP server should expose the builder's whole capital-readiness
journey as callable tools — so a founder *inside Claude/Cursor/ChatGPT, mid-build* can do
this without leaving the agent:

| Tool | What it does |
|---|---|
| `connect_revenue` | Start read-only OAuth to Stripe/App Store/etc. (the verified-revenue spine) |
| `get_readiness_score` | Return the live capital-readiness score + the top gaps |
| `check_deadlines` | 83(b) (30-day), BOI, cap-table hygiene alerts — the day-one hook (`10` §1) |
| `verify_revenue` | Verified MRR/ARR/retention with provenance (the trust artifact) |
| `get_cap_table` / `record_equity_event` | Read/append the auditable cap table (`07`) |
| `assemble_checklist` | For a named provider/stage, return the exact diligence list (`08`) |
| `prepare_item` | Auto-generate a specific diligence item from connected data |
| `match_capital` | Lenders/investors the builder qualifies for, by verified profile (`09`/`10`) |
| `track_process` | Update/read the capital pipeline (researching→closed) |

Bundle these with an **Agent Skill** (`SKILL.md`) — "make me capital-ready" — that the agent
loads on demand. Skills are increasingly portable across Claude Code, Cursor, Copilot, Codex,
and Gemini CLI, so the skill ships once too.

## 2. Per-platform packaging (and how gated each is)

| Surface | Mechanism | Self-serve? | Difficulty |
|---|---|---|---|
| **Cursor / Windsurf / Cline / Copilot / Gemini CLI / Codex** | Raw MCP server + config snippet | Fully self-serve | **Easy — do first** |
| **Your own Claude Code marketplace** | `.claude-plugin/marketplace.json` on a public repo | Fully self-serve | Easy |
| **Claude community marketplace** | Submit, auto-validated | Self-serve + auto-screen | Easy |
| **Gemini Extensions Gallery** | Public repo, unvetted | Fully self-serve | Easy |
| **ChatGPT App Directory** | Apps SDK (extends MCP) + submit + review | Self-serve + review | Medium |
| **Claude Connectors Directory / official plugin marketplace** | Submit + Anthropic review | Submit self-serve, inclusion discretionary | Medium–hard |
| **Stripe App Marketplace** | Stripe Apps + submit (~4-day review) | Self-serve + review | Medium |
| **Vercel native integration** | Form + Partner API + email approval | **BD-gated** | Hard |
| **Supabase official / AI-builder default** | Partner program / BD | **BD-gated** | Hard |
| **Baked into starter kits / templates / v0 / Lovable** | Editorial + BD + community PRs | Mixed | **Hard, highest payoff** |

**Claude note:** the official Claude Code marketplace *already* bundles `vercel`, `supabase`,
`stripe`, `firebase` under "Infrastructure / External integrations." That is exactly the slot
to win — self-publish day one, lobby for the official Infrastructure slot via BD.

**OpenAI note:** an "App" = your MCP server + chat-native UI via the **Apps SDK**; also plugs
into **AgentKit's Connector Registry** and **Codex**. So Claude + ChatGPT + Gemini + every IDE
agent are all reached from the one server plus thin wrappers.

## 3. Built into the dev-infra platforms (Stripe / Supabase / Vercel)

- **Stripe:** a product that reads Stripe revenue is a natural **Stripe App** — installs into
  users' Stripe dashboards; self-serve to list, editorial to be featured. Mirror Stripe's own
  **agent toolkit / hosted MCP** pattern. Strategic: builders' verified revenue already lives
  in Stripe — meet them there.
- **Supabase:** integrate via the Management API + OAuth; ship a Supabase integration and a
  starter template. The prize (BD-gated) is being a **default in the AI app builders Supabase
  powers** (Lovable's native backend, Bolt, v0).
- **Vercel:** list on the **Vercel Marketplace** (connectable/OAuth tier is more self-serve;
  *native* integration with in-dashboard provisioning/billing is BD-gated) and — the real
  distribution — get into **Vercel Templates + the Deploy Button + v0 output** so new projects
  scaffold capital-readiness from the first commit.

## 4. The infrastructure-as-distribution playbook (how Vercel & Supabase actually won)

Replicate these levers:
1. **Open-source a meaningful core + sharp positioning** — "the *X* for capital readiness."
   Supabase won as the inspectable, portable "open-source Firebase alternative."
2. **A generous free tier that's the no-brainer default** in side projects (Vercel/Supabase
   both). For us: free Readiness Score + verified revenue + deadline alerts (`10` §1).
3. **Ship the MCP server and publish it everywhere** (Part 2) — cheap, and makes you *callable*
   by every agent.
4. **Don't only sell to builders — become the default inside the tools they already use:**
   starter kits, framework templates, AI app builders, and infra marketplaces. *Distribution =
   being someone else's recommended option.* (Supabase rode Lovable/Bolt/v0; Clerk got
   pre-provisioned inside Stripe Projects.)
5. **Templates + one-click deploy + great DX docs** so you are the path of least resistance.

**Precedents that distributed by embedding across many surfaces at once:** Stripe (APIs +
Apps Marketplace + agent toolkit + ChatGPT Instant Checkout), Clerk (default in starter kits,
now provisioned inside Stripe Projects), Resend, Plaid. Common thread: lowest-friction drop-in
(SDK + now MCP) + ubiquity in tutorials/templates + being another platform's native option.

## 5. Why this is uniquely strong for *this* product
The builder is **already inside an agent (Claude/Cursor/Codex) and already on Stripe/
Supabase/Vercel** when the capital question arises. Being the callable "capital-readiness"
capability *in that exact context* — "ship app → take payments → check if you can raise/borrow,
without leaving the tool" — is a distribution position no incumbent (Carta, Ramp, Pilot) holds.
The MCP server is the wedge that turns "another finance SaaS" into **default vibe-coder
capital infrastructure.**

## 6. Sequenced rollout
1. **Now:** build the MCP server + the "capital readiness" skill. Blanket the **self-serve
   agent tier** (IDE/CLI configs + your own Claude marketplace + Gemini extension). Ship the
   **Stripe App**.
2. **Next:** ChatGPT App (Apps SDK) + submit to **Claude community + Connectors Directory**;
   Vercel Marketplace (OAuth tier) + a Vercel template with Deploy Button.
3. **Later (BD):** Vercel **native** integration, Supabase partnership / AI-builder default,
   Claude **official Infrastructure** slot, and inclusion in popular **starter kits / v0 /
   Lovable** scaffolding — the gated tier that converts you from *available* to *default*.

## 7. Metrics
- **MCP installs & tool invocations** per platform; agent-sourced signups.
- **Template/scaffold installs** (projects created with us wired in).
- **LLM-recommendation share of voice** (mentions when builders ask agents for capital help).
- **Marketplace placements** achieved (self-serve → featured → native/default).

> Engineering note: keep the MCP server **read-only and safe-by-default** — no money movement,
> scoped OAuth, every action logged (consistent with the spine guardrails in `01`/`05`). The
> distribution upside is huge, but a finance tool that an agent can invoke must never expose a
> write path that could move funds or leak another tenant's data.
