import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR, ensureUploadDir, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/files";
import { isDriveEnabled, uploadToDrive } from "@/lib/gdrive";
import { writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const dealId = formData.get("dealId") as string | null;
  const source = (formData.get("source") as string) || "upload";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.has(mimeType) && !mimeType.startsWith("image/") && !mimeType.startsWith("text/")) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const storedName = `${crypto.randomUUID()}${ext}`;

  let externalId: string | undefined;

  if (isDriveEnabled()) {
    try {
      const { driveId } = await uploadToDrive(buffer, file.name, mimeType);
      externalId = `gdrive_${driveId}`;
    } catch (err) {
      return NextResponse.json({ error: `Drive upload failed: ${(err as Error).message}` }, { status: 500 });
    }
  } else {
    await ensureUploadDir();
    await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  }

  const record = await prisma.uploadedFile.create({
    data: { filename: file.name, storedName, mimeType, sizeBytes: file.size, source, dealId: dealId || null, userId: session.user.id, externalId },
    include: { user: { select: { name: true } }, deal: { select: { name: true } } },
  });

  return NextResponse.json(record, { status: 201 });
}
