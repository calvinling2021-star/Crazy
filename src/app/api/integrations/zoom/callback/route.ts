import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/dashboard/integrations?error=invalid_state", req.url));
  }
  cookieStore.delete("oauth_state");

  const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.ZOOM_REDIRECT_URI! }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/dashboard/integrations?error=token_exchange_failed", req.url));
  }

  const userRes = await fetch("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userRes.json();

  await prisma.integration.upsert({
    where: { provider: "zoom" },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      accountEmail: userInfo.email,
    },
    create: {
      provider: "zoom",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      accountEmail: userInfo.email,
    },
  });

  return NextResponse.redirect(new URL("/dashboard/integrations?connected=zoom", req.url));
}
