import { prisma } from "./prisma";

// ── Token refresh helpers ─────────────────────────────────────────────────────

export async function getValidGmailToken(integration: {
  id: string; accessToken: string | null; refreshToken: string | null; expiresAt: Date | null;
}): Promise<string> {
  if (integration.accessToken && integration.expiresAt && integration.expiresAt > new Date(Date.now() + 60_000)) {
    return integration.accessToken;
  }
  if (!integration.refreshToken) throw new Error("Gmail refresh token missing — reconnect Gmail");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Gmail token refresh failed");
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      // Only update refreshToken if Google returns a new one (rare)
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    },
  });
  return data.access_token;
}

export async function getValidOutlookToken(integration: {
  id: string; accessToken: string | null; refreshToken: string | null; expiresAt: Date | null;
}): Promise<string> {
  if (integration.accessToken && integration.expiresAt && integration.expiresAt > new Date(Date.now() + 60_000)) {
    return integration.accessToken;
  }
  if (!integration.refreshToken) throw new Error("Outlook refresh token missing — reconnect Outlook");
  const res = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: integration.refreshToken,
      grant_type: "refresh_token",
      scope: "https://graph.microsoft.com/Mail.Read offline_access openid email",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Outlook token refresh failed");
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    },
  });
  return data.access_token;
}

export async function getValidZoomToken(integration: {
  id: string; accessToken: string | null; refreshToken: string | null; expiresAt: Date | null;
}): Promise<string> {
  if (integration.accessToken && integration.expiresAt && integration.expiresAt > new Date(Date.now() + 60_000)) {
    return integration.accessToken;
  }
  if (!integration.refreshToken) throw new Error("Zoom refresh token missing — reconnect Zoom");
  const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: integration.refreshToken }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Zoom token refresh failed");
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
    },
  });
  return data.access_token;
}

// ── OAuth state cookie helpers ────────────────────────────────────────────────

export function generateState(): string {
  return crypto.randomUUID();
}
