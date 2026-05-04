import { NextRequest, NextResponse } from "next/server";
import { tracks } from "@/data/tracks";
import { MusicNiche, TrackStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const niche = searchParams.get("niche") as MusicNiche | null;
  const status = searchParams.get("status") as TrackStatus | null;
  const sort = searchParams.get("sort") || "monthlyStreams";
  const limit = parseInt(searchParams.get("limit") || "50");

  let filtered = [...tracks];

  if (niche) {
    filtered = filtered.filter((t) => t.niche === niche);
  }

  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }

  filtered.sort((a, b) => {
    switch (sort) {
      case "revenue":
        return b.revenue - a.revenue;
      case "streams":
        return b.streams - a.streams;
      case "monthlyRevenue":
        return b.monthlyRevenue - a.monthlyRevenue;
      case "createdAt":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return b.monthlyStreams - a.monthlyStreams;
    }
  });

  return NextResponse.json({
    tracks: filtered.slice(0, limit),
    total: filtered.length,
  });
}
