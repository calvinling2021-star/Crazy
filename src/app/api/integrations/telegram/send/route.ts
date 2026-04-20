import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_DIR } from "@/lib/files";
import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId, message, fileId } = await req.json();
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  const integration = await prisma.integration.findUnique({ where: { provider: "telegram" } });
  if (!integration?.accessToken) return NextResponse.json({ error: "Telegram not configured" }, { status: 400 });

  const token = integration.accessToken;

  if (fileId) {
    const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
    const buffer = await readFile(path.join(UPLOAD_DIR, file.storedName));
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("document", new Blob([buffer], { type: file.mimeType }), file.filename);
    if (message) formData.append("caption", message);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: "POST", body: formData });
    const data = await res.json();
    if (!data.ok) return NextResponse.json({ error: data.description }, { status: 400 });
  } else {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
    });
    const data = await res.json();
    if (!data.ok) return NextResponse.json({ error: data.description }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
