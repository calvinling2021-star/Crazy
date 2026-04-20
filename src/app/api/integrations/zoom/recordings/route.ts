import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getValidZoomToken } from "@/lib/oauth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integration = await prisma.integration.findUnique({ where: { provider: "zoom" } });
  if (!integration) return NextResponse.json({ error: "Zoom not connected" }, { status: 400 });

  const token = await getValidZoomToken(integration);
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const to = new Date().toISOString().split("T")[0];

  const res = await fetch(
    `https://api.zoom.us/v2/users/me/recordings?from=${from}&to=${to}&page_size=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const meetings = data.meetings ?? [];

  const recordings = meetings.flatMap((m: {
    id: string; topic: string; start_time: string; duration: number;
    recording_files: { id: string; file_type: string; file_size: number; download_url: string; recording_type: string }[];
  }) =>
    (m.recording_files ?? []).map((f) => ({
      meetingId: m.id,
      topic: m.topic,
      startTime: m.start_time,
      duration: m.duration,
      fileId: f.id,
      fileType: f.file_type,
      fileSize: f.file_size,
      downloadUrl: f.download_url,
      recordingType: f.recording_type,
    }))
  );

  return NextResponse.json(recordings);
}
