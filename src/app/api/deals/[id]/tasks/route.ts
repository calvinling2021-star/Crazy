import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: dealId } = await params;
  const tasks = await prisma.dealTask.findMany({
    where: { dealId },
    include: { assignee: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: dealId } = await params;
  const body = await req.json();
  const task = await prisma.dealTask.create({
    data: {
      title: body.title,
      status: body.status ?? "OPEN",
      priority: body.priority ?? "MEDIUM",
      assigneeId: body.assigneeId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      dealId,
    },
    include: { assignee: { select: { id: true, name: true } } },
  });

  return NextResponse.json(task, { status: 201 });
}
