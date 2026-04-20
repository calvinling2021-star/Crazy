import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AGENTS } from "@/lib/agents";
import { NextRequest, NextResponse } from "next/server";

async function ensureConfigs() {
  for (const [agentType, cfg] of Object.entries(AGENTS)) {
    await prisma.agentConfig.upsert({
      where: { agentType },
      update: {},
      create: { agentType, label: cfg.label, description: cfg.description, systemPrompt: cfg.systemPrompt },
    });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureConfigs();
  const configs = await prisma.agentConfig.findMany({ orderBy: { agentType: "asc" } });
  return NextResponse.json(configs);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { agentType, label, description, systemPrompt } = body;

  const config = await prisma.agentConfig.upsert({
    where: { agentType },
    update: { label, description, systemPrompt },
    create: { agentType, label, description, systemPrompt },
  });

  return NextResponse.json(config);
}
