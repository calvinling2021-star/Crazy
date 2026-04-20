import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deals =
    session.user.role === "ASSET_CEO"
      ? await prisma.deal.findMany({
          where: { ownerId: session.user.id },
          include: { owner: { select: { name: true, email: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : await prisma.deal.findMany({
          include: { owner: { select: { name: true, email: true } } },
          orderBy: { updatedAt: "desc" },
        });

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const deal = await prisma.deal.create({
    data: {
      name: body.name,
      status: body.status ?? "ACTIVE",
      description: body.description,
      sector: body.sector,
      stage: body.stage,
      ownerId: session.user.id,
    },
    include: { owner: { select: { name: true, email: true } } },
  });

  return NextResponse.json(deal, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;

  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "ASSET_CEO" && existing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deal = await prisma.deal.update({ where: { id }, data });
  return NextResponse.json(deal);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "ASSET_CEO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.deal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
