import { NextResponse } from "next/server";
import { openDb } from "@/lib/sqlite";

interface ActivityRow {
  id: number;
  ceo_id: number;
  type: string;
  body: string | null;
  created_at: string;
  created_by: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ceoId = parseInt(id, 10);
  if (isNaN(ceoId)) {
    return NextResponse.json({ activities: [] });
  }

  const db = openDb(true);
  if (!db) return NextResponse.json({ activities: [] });

  try {
    const activities = db
      .prepare(
        "SELECT * FROM activities WHERE ceo_id=? ORDER BY created_at DESC LIMIT 50"
      )
      .all(ceoId) as ActivityRow[];
    db.close();
    return NextResponse.json({ activities });
  } catch (err) {
    db.close();
    return NextResponse.json({ activities: [], error: String(err) });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ceoId = parseInt(id, 10);
  if (isNaN(ceoId)) {
    return NextResponse.json({ error: "Invalid CEO id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    type?: string;
    body?: string;
    created_by?: string;
  };

  if (!body.type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const db = openDb(false);
  if (!db) {
    return NextResponse.json({ error: "Database not found" }, { status: 503 });
  }

  try {
    const result = db
      .prepare(
        "INSERT INTO activities (ceo_id, type, body, created_by) VALUES (?, ?, ?, ?)"
      )
      .run(ceoId, body.type, body.body ?? null, body.created_by ?? null);

    const activity = db
      .prepare("SELECT * FROM activities WHERE id=?")
      .get(result.lastInsertRowid) as ActivityRow;

    db.close();
    return NextResponse.json(activity);
  } catch (err) {
    db.close();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
