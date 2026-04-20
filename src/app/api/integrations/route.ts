import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const PROVIDERS = ["gmail", "outlook", "zoom", "telegram", "whatsapp", "wechat", "wps"];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.integration.findMany({
    where: { provider: { in: PROVIDERS } },
    select: { provider: true, accountEmail: true, updatedAt: true, expiresAt: true },
  });

  const map = Object.fromEntries(existing.map((i) => [i.provider, i]));

  const integrations = PROVIDERS.map((p) => ({
    provider: p,
    connected: !!map[p],
    accountEmail: map[p]?.accountEmail ?? null,
    updatedAt: map[p]?.updatedAt ?? null,
  }));

  return NextResponse.json(integrations);
}
