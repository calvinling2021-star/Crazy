import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getValidOutlookToken } from "@/lib/oauth";
import { UPLOAD_DIR, ensureUploadDir } from "@/lib/files";
import { writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId, attachmentId, filename, mimeType, dealId } = await req.json();

  const externalId = `outlook_${messageId}_${attachmentId}`;
  const existing = await prisma.uploadedFile.findFirst({ where: { externalId } });
  if (existing) return NextResponse.json(existing);

  const integration = await prisma.integration.findUnique({ where: { provider: "outlook" } });
  if (!integration) return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });

  const token = await getValidOutlookToken(integration);
  const attRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments/${attachmentId}/$value`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const buffer = Buffer.from(await attRes.arrayBuffer());

  await ensureUploadDir();
  const ext = path.extname(filename) || "";
  const storedName = `${crypto.randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  const record = await prisma.uploadedFile.create({
    data: { filename, storedName, mimeType, sizeBytes: buffer.length, source: "outlook", externalId, dealId: dealId || null, userId: session.user.id },
    include: { user: { select: { name: true } }, deal: { select: { name: true } } },
  });
  return NextResponse.json(record, { status: 201 });
}
