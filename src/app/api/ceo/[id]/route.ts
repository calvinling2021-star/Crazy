import { NextResponse } from "next/server";
import { openDb } from "@/lib/sqlite";

const CONTACT_STAGES = new Set([
  "emailed",
  "replied",
  "call_scheduled",
  "call_done",
  "proposal_sent",
  "term_sent",
]);

const ALLOWED = new Set([
  "outreach_stage",
  "assigned_to",
  "follow_up_at",
  "notes",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ceoId = parseInt(id, 10);
  if (isNaN(ceoId)) {
    return NextResponse.json({ error: "Invalid CEO id" }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const updates = Object.entries(body).filter(([k]) => ALLOWED.has(k));
  if (!updates.length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const db = openDb(false);
  if (!db) {
    return NextResponse.json({ error: "Database not found" }, { status: 503 });
  }

  try {
    const sets = updates.map(([k]) => `${k}=?`).join(", ");
    const vals = [...updates.map(([, v]) => v), ceoId];
    db.prepare(`UPDATE ceos SET ${sets} WHERE id=?`).run(...vals);

    // Stamp last_contacted_at whenever the stage enters an active outreach phase
    const newStage = body.outreach_stage as string | undefined;
    if (newStage && CONTACT_STAGES.has(newStage)) {
      db.prepare(
        "UPDATE ceos SET last_contacted_at=CURRENT_TIMESTAMP WHERE id=?"
      ).run(ceoId);
    }

    db.close();
    return NextResponse.json({ ok: true });
  } catch (err) {
    db.close();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
