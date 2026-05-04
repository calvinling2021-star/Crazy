import { NextResponse } from "next/server";
import { openDb } from "@/lib/sqlite";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contactId = parseInt(id, 10);
  if (isNaN(contactId)) {
    return NextResponse.json({ error: "Invalid contact id" }, { status: 400 });
  }

  const db = openDb(false);
  if (!db) {
    return NextResponse.json({ error: "Database not found" }, { status: 503 });
  }

  try {
    db.prepare("DELETE FROM contacts WHERE id=?").run(contactId);
    db.close();
    return NextResponse.json({ ok: true });
  } catch (err) {
    db.close();
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
