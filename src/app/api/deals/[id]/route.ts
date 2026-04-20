import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      uploadedFiles: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      dealProviders: {
        include: { provider: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "ASSET_CEO" && deal.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(deal);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "ASSET_CEO" && existing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, status, description, sector, stage } = body;
  const deal = await prisma.deal.update({
    where: { id },
    data: { name, status, description, sector, stage },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json(deal);
}
