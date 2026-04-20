import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { accountSid, authToken, fromNumber } = await req.json();
  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  // Verify Twilio credentials
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const verify = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  if (!verify.ok) return NextResponse.json({ error: "Invalid Twilio credentials" }, { status: 400 });
  const account = await verify.json();

  await prisma.integration.upsert({
    where: { provider: "whatsapp" },
    update: {
      accessToken: authToken,
      accountEmail: fromNumber,
      metadata: JSON.stringify({ accountSid, fromNumber, friendlyName: account.friendly_name }),
    },
    create: {
      provider: "whatsapp",
      accessToken: authToken,
      accountEmail: fromNumber,
      metadata: JSON.stringify({ accountSid, fromNumber, friendlyName: account.friendly_name }),
    },
  });

  return NextResponse.json({ success: true, account: account.friendly_name });
}
