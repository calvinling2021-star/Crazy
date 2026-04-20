import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, message } = await req.json();
  if (!to || !message) return NextResponse.json({ error: "to and message required" }, { status: 400 });

  const integration = await prisma.integration.findUnique({ where: { provider: "whatsapp" } });
  if (!integration?.accessToken || !integration.metadata) {
    return NextResponse.json({ error: "WhatsApp not configured" }, { status: 400 });
  }

  const { accountSid, fromNumber } = JSON.parse(integration.metadata);
  const creds = Buffer.from(`${accountSid}:${integration.accessToken}`).toString("base64");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${to}`,
      Body: message,
    }),
  });
  const data = await res.json();
  if (data.error_code) return NextResponse.json({ error: data.message }, { status: 400 });
  return NextResponse.json({ success: true, sid: data.sid });
}
