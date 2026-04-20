import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: dealId } = await params;
  const rows = await prisma.dealProvider.findMany({
    where: { dealId },
    include: { provider: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rows.map((r) => r.provider));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "ASSET_CEO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: dealId } = await params;
  const { providerId } = await req.json();

  const row = await prisma.dealProvider.create({
    data: { dealId, providerId },
    include: { provider: true },
  });

  return NextResponse.json(row.provider, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role === "ASSET_CEO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: dealId } = await params;
  const { providerId } = await req.json();

  await prisma.dealProvider.delete({ where: { dealId_providerId: { dealId, providerId } } });
  return NextResponse.json({ success: true });
}
