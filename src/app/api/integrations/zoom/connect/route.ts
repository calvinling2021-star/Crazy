import { auth } from "@/auth";
import { generateState } from "@/lib/oauth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "PRINCIPAL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const state = generateState();
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 300 });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOOM_CLIENT_ID!,
    redirect_uri: process.env.ZOOM_REDIRECT_URI!,
    state,
  });

  return NextResponse.redirect(`https://zoom.us/oauth/authorize?${params}`);
}
