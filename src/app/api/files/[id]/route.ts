import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/files";
import { downloadFromDrive, deleteFromDrive } from "@/lib/gdrive";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "ASSET_CEO" && file.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const disposition = req.nextUrl.searchParams.get("download") === "1"
    ? `attachment; filename="${file.filename}"`
    : `inline; filename="${file.filename}"`;

  try {
    let buffer: Buffer;
    const driveId = file.externalId?.startsWith("gdrive_") ? file.externalId.replace("gdrive_", "") : null;

    if (driveId) {
      buffer = await downloadFromDrive(driveId);
    } else {
      buffer = await readFile(path.join(UPLOAD_DIR, file.storedName));
    }

    return new Response(buffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": disposition,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "ASSET_CEO" && file.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const driveId = file.externalId?.startsWith("gdrive_") ? file.externalId.replace("gdrive_", "") : null;
  if (driveId) {
    await deleteFromDrive(driveId).catch(() => {});
  } else {
    try { await unlink(path.join(UPLOAD_DIR, file.storedName)); } catch { /* already gone */ }
  }

  await prisma.uploadedFile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
