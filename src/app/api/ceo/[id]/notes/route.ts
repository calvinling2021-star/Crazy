import { NextResponse } from "next/server";
import { openDb } from "@/lib/sqlite";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ceoId = parseInt(id, 10);
  if (isNaN(ceoId)) {
    return NextResponse.json({ error: "Invalid CEO id" }, { status: 400 });
  }

  const body = (await request.json()) as { notes?: string };
  const notes = body.notes ?? "";

  const db = openDb(false);
  if (!db) {
    return NextResponse.json({ error: "Database not found" }, { status: 503 });
  }

  try {
    db.prepare("UPDATE ceos SET notes=? WHERE id=?").run(notes, ceoId);
    db.close();
    return NextResponse.json({ ok: true });
  } catch (err) {
    db.close();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
