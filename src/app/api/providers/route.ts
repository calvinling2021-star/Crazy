import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const providers = await prisma.serviceProvider.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(providers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "ASSET_CEO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const provider = await prisma.serviceProvider.create({ data: body });
  return NextResponse.json(provider, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "ASSET_CEO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...data } = body;
  const provider = await prisma.serviceProvider.update({ where: { id }, data });
  return NextResponse.json(provider);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.serviceProvider.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
