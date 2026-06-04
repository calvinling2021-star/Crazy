import { getFounderStateAsync } from "@/lib/cdp";
import { renderBadgeSvg } from "@/lib/cdp/badge";

export const dynamic = "force-dynamic";

// Embeddable "Verified by Attestly" badge — the growth loop. Renders from verified data.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("company") || undefined;
  const s = await getFounderStateAsync(id);
  const svg = renderBadgeSvg({
    mrr: s.metrics.mrr,
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
