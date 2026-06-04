import { assembleChecklist } from "@/lib/cdp";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const checklist = assembleChecklist(providerId);
  if (!checklist) return Response.json({ error: "unknown provider" }, { status: 404 });
  return Response.json(checklist);
}
