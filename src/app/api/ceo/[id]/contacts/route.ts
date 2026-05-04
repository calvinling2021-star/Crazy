import { NextResponse } from "next/server";
import { openDb } from "@/lib/sqlite";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ceoId = parseInt(id, 10);
  if (isNaN(ceoId)) {
    return NextResponse.json({ error: "Invalid CEO id" }, { status: 400 });
  }

  const body = (await request.json()) as { channel?: string; value?: string };
  const { channel, value } = body;
  if (
    !channel ||
    !value ||
    !["email", "linkedin"].includes(channel) ||
    !value.trim()
  ) {
    return NextResponse.json(
      { error: "channel (email|linkedin) and value are required" },
      { status: 400 }
    );
  }
  const trimmed = value.trim();

  const db = openDb(false);
  if (!db) {
    return NextResponse.json({ error: "Database not found" }, { status: 503 });
  }

  try {
    const existing = db
      .prepare(
        "SELECT id FROM contacts WHERE ceo_id=? AND channel=? AND value=?"
      )
      .get(ceoId, channel, trimmed) as { id: number } | undefined;

    let contactId: number;
    if (existing) {
      db.prepare(
        "UPDATE contacts SET source='manual', score=100 WHERE id=?"
      ).run(existing.id);
      contactId = existing.id;
    } else {
      const result = db
        .prepare(
          "INSERT INTO contacts (ceo_id, channel, value, source, score) VALUES (?, ?, ?, 'manual', 100)"
        )
        .run(ceoId, channel, trimmed);
      contactId = result.lastInsertRowid as number;
    }

    db.close();
    return NextResponse.json({
      id: contactId,
      ceo_id: ceoId,
      channel,
      value: trimmed,
      source: "manual",
      score: 100,
    });
  } catch (err) {
    db.close();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
