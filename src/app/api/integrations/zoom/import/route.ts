import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getValidZoomToken } from "@/lib/oauth";
import { UPLOAD_DIR, ensureUploadDir } from "@/lib/files";
import { writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId, downloadUrl, filename, fileType, dealId } = await req.json();

  const externalId = `zoom_${fileId}`;
  const existing = await prisma.uploadedFile.findFirst({ where: { externalId } });
  if (existing) return NextResponse.json(existing);

  const integration = await prisma.integration.findUnique({ where: { provider: "zoom" } });
  if (!integration) return NextResponse.json({ error: "Zoom not connected" }, { status: 400 });

  const token = await getValidZoomToken(integration);
  const fileRes = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  await ensureUploadDir();
  const ext = fileType ? `.${fileType.toLowerCase()}` : "";
  const storedName = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  const mimeTypes: Record<string, string> = { MP4: "video/mp4", M4A: "audio/mp4", TXT: "text/plain", VTT: "text/vtt", TRANSCRIPT: "application/json" };
  const record = await prisma.uploadedFile.create({
    data: {
      filename: filename || `zoom_${fileId}${ext}`,
      storedName,
      mimeType: mimeTypes[fileType?.toUpperCase()] ?? "application/octet-stream",
      sizeBytes: buffer.length,
      source: "zoom",
      externalId,
      dealId: dealId || null,
      userId: session.user.id,
    },
    include: { user: { select: { name: true } }, deal: { select: { name: true } } },
  });
  return NextResponse.json(record, { status: 201 });
}
