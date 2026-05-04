import { openDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

interface ProspectRow {
  cik: string;
  ticker: string;
  name: string;
  market_cap: number;
  exchange: string | null;
  delinquency_score: number;
  signal_types: string | null;
  ceo_id: number | null;
  ceo_name: string | null;
  outreach_stage: string | null;
}

interface ContactRow {
  ceo_id: number;
  channel: string;
  value: string;
  source: string;
  score: number | null;
}

function personalisedOpener(signalTypes: string | null, companyName: string, ticker: string): string {
  const sigs = (signalTypes ?? "").split(",").map((s) => s.trim());
  if (sigs.includes("strategic_alternatives"))
    return `We saw ${companyName}'s strategic alternatives announcement and wanted to reach out directly.`;
  if (sigs.some((s) => s.startsWith("NT-")))
    return `We noticed ${ticker}'s recent filing extension and wanted to connect.`;
  if (sigs.includes("going_concern"))
    return `We noted the going concern disclosure in ${ticker}'s most recent 10-K.`;
  if (sigs.includes("deficiency"))
    return `We saw ${ticker}'s exchange deficiency notice and thought we might be able to help.`;
  return `We follow micro-cap public companies navigating financial transitions and came across ${companyName}.`;
}

function csvCell(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function bestEmail(contacts: ContactRow[], ceoId: number): string {
  const ch = contacts.filter((c) => c.ceo_id === ceoId && c.channel === "email");
  if (!ch.length) return "";
  ch.sort((a, b) => {
    const rank = (s: string) => (s === "manual" ? 3 : s === "hunter" ? 2 : 1);
    return rank(b.source) - rank(a.source) || (b.score ?? 0) - (a.score ?? 0);
  });
  return ch[0].value;
}

function bestLinkedin(contacts: ContactRow[], ceoId: number): string {
  const ch = contacts
    .filter((c) => c.ceo_id === ceoId && c.channel === "linkedin")
    .sort((a, b) => {
      const rank = (s: string) => (s === "manual" ? 3 : 1);
      return rank(b.source) - rank(a.source) || (b.score ?? 0) - (a.score ?? 0);
    });
  return ch.length ? ch[0].value : "";
}

export async function GET() {
  const db = openDb(true);
  if (!db) {
    return new Response("Database not found. Run ./run.sh daily first.", {
      status: 503,
    });
  }

  try {
    const prospects = db
      .prepare(
        `SELECT
          c.cik, c.ticker, c.name, c.market_cap, c.exchange,
          COALESCE(SUM(s.score_delta), 0) AS delinquency_score,
          GROUP_CONCAT(DISTINCT s.signal_type) AS signal_types,
          ceo.id           AS ceo_id,
          ceo.name         AS ceo_name,
          ceo.outreach_stage AS outreach_stage
        FROM companies c
        LEFT JOIN signals s   ON s.cik   = c.cik
        LEFT JOIN ceos   ceo  ON ceo.cik = c.cik AND ceo.is_current = 1
        WHERE c.market_cap IS NOT NULL AND c.market_cap < 25000000
        GROUP BY c.cik
        HAVING delinquency_score >= 40
        ORDER BY delinquency_score DESC`
      )
      .all() as ProspectRow[];

    const ceoIds = prospects.filter((p) => p.ceo_id).map((p) => p.ceo_id as number);
    let contacts: ContactRow[] = [];
    if (ceoIds.length) {
      contacts = db
        .prepare(
          `SELECT ceo_id, channel, value, source, score FROM contacts
           WHERE ceo_id IN (${ceoIds.map(() => "?").join(",")})
           ORDER BY CASE source WHEN 'manual' THEN 3 WHEN 'hunter' THEN 2 ELSE 1 END DESC,
                    COALESCE(score,0) DESC`
        )
        .all(...ceoIds) as ContactRow[];
    }

    db.close();

    const header = [
      "First Name",
      "Last Name",
      "Email",
      "Company",
      "Ticker",
      "Market Cap ($)",
      "Delinquency Score",
      "Signals",
      "LinkedIn",
      "Outreach Stage",
      "Personalised Opener",
    ].map(csvCell).join(",");

    const rows = prospects.map((p) => {
      const nameParts = (p.ceo_name ?? "").split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");
      const email = p.ceo_id ? bestEmail(contacts, p.ceo_id) : "";
      const linkedin = p.ceo_id ? bestLinkedin(contacts, p.ceo_id) : "";
      const opener = personalisedOpener(p.signal_types, p.name, p.ticker);
      return [
        firstName,
        lastName,
        email,
        p.name,
        p.ticker,
        p.market_cap,
        p.delinquency_score,
        (p.signal_types ?? "").replace(/,/g, " | "),
        linkedin,
        p.outreach_stage ?? "new",
        opener,
      ].map(csvCell).join(",");
    });

    const csv = [header, ...rows].join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="outreach_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    db.close();
    return new Response(String(err), { status: 500 });
  }
}
