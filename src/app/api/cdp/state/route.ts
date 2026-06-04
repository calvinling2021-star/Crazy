import { getFounderState } from "@/lib/cdp";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("company") || undefined;
  return Response.json(getFounderState(id));
}
