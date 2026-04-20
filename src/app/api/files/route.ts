import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");

  const where =
    session.user.role === "ASSET_CEO"
      ? { userId: session.user.id, ...(dealId ? { dealId } : {}) }
      : dealId
      ? { dealId }
      : {};

  const files = await prisma.uploadedFile.findMany({
    where,
    include: { user: { select: { name: true } }, deal: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(files);
}
