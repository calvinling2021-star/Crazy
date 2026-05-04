import { NextResponse } from "next/server";
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
  ceo_title: string | null;
  ceo_conf: number | null;
  notes: string | null;
}

interface ContactRow {
  id: number;
  ceo_id: number;
  channel: "email" | "linkedin";
  value: string;
  source: string;
  score: number | null;
}

export async function GET() {
  const db = openDb(true);
  if (!db) {
    return NextResponse.json({
      prospects: [],
      error:
        "Database not found. Run ./run.sh daily --max-cap 25000000 first.",
    });
  }

  try {
    const prospects = db
      .prepare(
        `SELECT
          c.cik, c.ticker, c.name, c.market_cap, c.exchange,
          COALESCE(SUM(s.score_delta), 0) AS delinquency_score,
          GROUP_CONCAT(DISTINCT s.signal_type)  AS signal_types,
          ceo.id         AS ceo_id,
          ceo.name       AS ceo_name,
          ceo.title      AS ceo_title,
          ceo.confidence AS ceo_conf,
          ceo.notes      AS notes
        FROM companies c
        LEFT JOIN signals s   ON s.cik   = c.cik
        LEFT JOIN ceos   ceo  ON ceo.cik = c.cik AND ceo.is_current = 1
        WHERE c.market_cap IS NOT NULL AND c.market_cap < 25000000
        GROUP BY c.cik
        HAVING delinquency_score >= 40
        ORDER BY delinquency_score DESC`
      )
      .all() as ProspectRow[];

    const ceoIds = prospects
      .filter((p) => p.ceo_id != null)
      .map((p) => p.ceo_id as number);

    let contacts: ContactRow[] = [];
    if (ceoIds.length > 0) {
      contacts = db
        .prepare(
          `SELECT id, ceo_id, channel, value, source, score
           FROM contacts
           WHERE ceo_id IN (${ceoIds.map(() => "?").join(",")})
           ORDER BY
             CASE source WHEN 'manual' THEN 3 WHEN 'hunter' THEN 2 ELSE 1 END DESC,
             COALESCE(score, 0) DESC`
        )
        .all(...ceoIds) as ContactRow[];
    }

    const byId: Record<number, ContactRow[]> = {};
    for (const c of contacts) {
      (byId[c.ceo_id] ??= []).push(c);
    }

    const result = prospects.map((p) => ({
      ...p,
      contacts: p.ceo_id != null ? (byId[p.ceo_id] ?? []) : [],
    }));

    db.close();
    return NextResponse.json({ prospects: result });
  } catch (err) {
    db.close();
    return NextResponse.json(
      { prospects: [], error: String(err) },
      { status: 500 }
    );
  }
}
