import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AGENTS, AgentType } from "@/lib/agents";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { agentType, message, sessionId } = body as {
    agentType: AgentType;
    message: string;
    sessionId: string;
  };

  if (!AGENTS[agentType]) {
    return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
  }

  const history = await prisma.agentMessage.findMany({
    where: { sessionId, userId: session.user.id, agentType },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  await prisma.agentMessage.create({
    data: { agentType, role: "user", content: message, sessionId, userId: session.user.id },
  });

  const dbConfig = await prisma.agentConfig.findUnique({ where: { agentType } });
  const systemPrompt = dbConfig?.systemPrompt ?? AGENTS[agentType].systemPrompt;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  await prisma.agentMessage.create({
    data: { agentType, role: "assistant", content: reply, sessionId, userId: session.user.id },
  });

  return NextResponse.json({ reply });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentType = searchParams.get("agentType");
  const sessionId = searchParams.get("sessionId");

  if (!agentType || !sessionId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const messages = await prisma.agentMessage.findMany({
    where: { sessionId, userId: session.user.id, agentType },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}
