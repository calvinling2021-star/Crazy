import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getValidGmailToken } from "@/lib/oauth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integration = await prisma.integration.findUnique({ where: { provider: "gmail" } });
  if (!integration) return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });

  const token = await getValidGmailToken(integration);

  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=has:attachment",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const listData = await listRes.json();
  const messages = listData.messages ?? [];

  const details = await Promise.all(
    messages.map(async (m: { id: string }) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const headers: { name: string; value: string }[] = data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
      const attachments = (data.payload?.parts ?? [])
        .filter((p: { filename?: string }) => p.filename)
        .map((p: { filename: string; mimeType: string; body: { size: number; attachmentId: string } }) => ({
          filename: p.filename,
          mimeType: p.mimeType,
          size: p.body?.size,
          attachmentId: p.body?.attachmentId,
        }));
      return { messageId: m.id, subject: get("Subject"), from: get("From"), date: get("Date"), attachments };
    })
  );

  return NextResponse.json(details);
}
