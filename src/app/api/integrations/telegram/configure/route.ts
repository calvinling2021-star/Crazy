import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { botToken } = await req.json();
  if (!botToken?.trim()) return NextResponse.json({ error: "Bot token required" }, { status: 400 });

  // Verify token with Telegram
  const verify = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const verifyData = await verify.json();
  if (!verifyData.ok) return NextResponse.json({ error: "Invalid bot token" }, { status: 400 });

  const botInfo = verifyData.result;
  await prisma.integration.upsert({
    where: { provider: "telegram" },
    update: { accessToken: botToken, accountEmail: `@${botInfo.username}`, metadata: JSON.stringify(botInfo) },
    create: { provider: "telegram", accessToken: botToken, accountEmail: `@${botInfo.username}`, metadata: JSON.stringify(botInfo) },
  });

  return NextResponse.json({ success: true, username: botInfo.username });
}
