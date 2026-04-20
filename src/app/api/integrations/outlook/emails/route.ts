import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getValidOutlookToken } from "@/lib/oauth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integration = await prisma.integration.findUnique({ where: { provider: "outlook" } });
  if (!integration) return NextResponse.json({ error: "Outlook not connected" }, { status: 400 });

  const token = await getValidOutlookToken(integration);

  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/messages?$filter=hasAttachments eq true&$top=20&$select=id,subject,from,receivedDateTime,hasAttachments",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const messages = data.value ?? [];

  const details = await Promise.all(
    messages.map(async (m: { id: string; subject: string; from: { emailAddress: { address: string } }; receivedDateTime: string }) => {
      const attRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${m.id}/attachments?$select=id,name,contentType,size`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const attData = await attRes.json();
      const attachments = (attData.value ?? []).map((a: { id: string; name: string; contentType: string; size: number }) => ({
        attachmentId: a.id,
        filename: a.name,
        mimeType: a.contentType,
        size: a.size,
      }));
      return { messageId: m.id, subject: m.subject, from: m.from?.emailAddress?.address, date: m.receivedDateTime, attachments };
    })
  );

  return NextResponse.json(details);
}
