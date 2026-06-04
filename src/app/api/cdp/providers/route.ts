import { listProviders } from "@/lib/cdp";

export function GET() {
  return Response.json({ providers: listProviders() });
}
