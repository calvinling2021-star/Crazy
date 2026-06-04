import { getFounderStateAsync } from "@/lib/cdp";
import { renderShareCardSvg } from "@/lib/cdp/og";

export const dynamic = "force-dynamic";

// 1200x630 social share card ("I'm a Verified Builder") — the build-in-public growth loop.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("company") || undefined;
  const s = await getFounderStateAsync(id);
  const svg = renderShareCardSvg({
    company: s.company.name,
    mrr: s.metrics.mrr,
    arr: s.metrics.arr,
    score: s.creditScore.score,
    band: s.creditScore.band,
  });
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
