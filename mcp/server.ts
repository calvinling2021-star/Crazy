// Vibe Coder Operation Platform — MCP server (docs/ipo-os/11 + 19).
// One server, reusable across Claude, Codex, Gemini, Cursor, Windsurf, etc.
// Run: npm run mcp   (stdio transport). All tools are read-only and deterministic.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getFounderState,
  getCreditScore,
  getReadiness,
  getVerifiedMetrics,
  getCapitalMatch,
  assembleChecklist,
  listProviders,
} from "../src/lib/cdp/index";

const server = new McpServer({ name: "vibe-coder-operation-platform", version: "0.1.0" });

const wrap = (obj: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
});

server.tool(
  "get_credit_score",
  "Get the founder's deterministic 'credit-from-day-one' score, band, factors, and indicative capacity.",
  {},
  async () => wrap(getCreditScore())
);

server.tool(
  "check_deadlines",
  "Get time-sensitive readiness alerts auto-detected from connected data (83(b), BOI, cap-table hygiene, rail completeness).",
  {},
  async () => wrap(getReadiness())
);

server.tool(
  "verify_revenue",
  "Get verified revenue metrics (MRR, ARR, growth, NRR/GRR, runway, reconciliation) computed deterministically from rails.",
  {},
  async () => wrap(getVerifiedMetrics())
);

server.tool(
  "match_capital",
  "Get the debt providers the founder qualifies for, readiness per provider, and instant indicative offers (no paperwork).",
  {},
  async () => wrap(getCapitalMatch())
);

server.tool(
  "get_readiness_score",
  "Get the full founder state: company, verified metrics, credit score, readiness alerts, and capital match.",
  {},
  async () => wrap(getFounderState())
);

server.tool(
  "assemble_checklist",
  "Name a provider id (e.g. 'yc', 'capchase', 'founderpath') to get its exact diligence checklist and how much is already prepared.",
  { providerId: z.string().describe("provider id from list_providers") },
  async ({ providerId }) => {
    const c = assembleChecklist(providerId);
    return wrap(c ?? { error: "unknown provider", hint: "call list_providers for valid ids" });
  }
);

server.tool(
  "list_providers",
  "List known capital providers (id, name, type) the platform can prepare for.",
  {},
  async () => wrap(listProviders())
);

const transport = new StdioServerTransport();
await server.connect(transport);
// eslint-disable-next-line no-console
console.error("[vibe-coder-operation-platform] MCP server running on stdio");
