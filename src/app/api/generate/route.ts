import { NextRequest, NextResponse } from "next/server";
import { MusicNiche } from "@/lib/types";

const NICHE_TITLE_PATTERNS: Record<MusicNiche, string[]> = {
  sleep: [
    "Deep Sleep {adj} {noun}",
    "{adj} Night {noun}",
    "Sleep {noun} Vol. {n}",
    "{noun} for Deep Sleep",
    "Dreamscape {adj} {noun}",
  ],
  meditation: [
    "{adj} Meditation {noun}",
    "Morning {noun} Session",
    "{noun} Healing {freq}Hz",
    "Mindful {adj} {noun}",
    "Inner Peace {noun}",
  ],
  focus: [
    "Deep Work {noun}",
    "{freq}Hz Focus {noun}",
    "{adj} Concentration {noun}",
    "Study {noun} Vol. {n}",
    "Brain Wave {noun}",
  ],
  lofi: [
    "{adj} Lofi {noun}",
    "Late Night Lofi {noun}",
    "Lofi {noun} Vol. {n}",
    "{adj} Chill {noun}",
    "{noun} Lofi Beats",
  ],
  ambient: [
    "{adj} {noun} Ambient",
    "Ambient {noun} Vol. {n}",
    "{noun} Drift",
    "Infinite {noun}",
    "{adj} Soundscape",
  ],
  nature: [
    "{adj} {noun} Sounds",
    "{noun} Nature Vol. {n}",
    "Pure {noun} Sounds",
    "{adj} {noun} Ambience",
    "Natural {noun}",
  ],
};

const WORDS = {
  adj: ["Deep", "Soft", "Gentle", "Pure", "Dark", "Warm", "Cold", "Still", "Vast", "Quiet"],
  noun: ["Waves", "Rain", "Forest", "Journey", "Drift", "Flow", "Space", "Mist", "Storm", "Garden"],
  freq: ["432", "528", "396", "639", "741", "852"],
  n: ["2", "3", "4", "5", "6"],
};

function generateTitle(niche: MusicNiche): string {
  const patterns = NICHE_TITLE_PATTERNS[niche];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  return pattern.replace(/\{(\w+)\}/g, (_, key) => {
    const pool = WORDS[key as keyof typeof WORDS];
    return pool ? pool[Math.floor(Math.random() * pool.length)] : key;
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, niche } = body as { prompt: string; niche: MusicNiche };

    if (!prompt || !niche) {
      return NextResponse.json({ error: "prompt and niche are required" }, { status: 400 });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const title = generateTitle(niche);

    // Simulate immediate job creation — client polls or uses optimistic UI
    return NextResponse.json({
      jobId,
      title,
      status: "generating",
      estimatedSeconds: 28,
      message: "Track generation started via Suno API",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
