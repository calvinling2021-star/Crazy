import { prisma } from "./prisma";
import { getValidGmailToken } from "./oauth";

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export function isDriveEnabled() {
  return process.env.GOOGLE_DRIVE_STORAGE === "true";
}

export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ driveId: string; webViewLink: string }> {
  const integration = await prisma.integration.findUnique({ where: { provider: "gmail" } });
  if (!integration) throw new Error("Google Drive not connected — connect Gmail first");
  const token = await getValidGmailToken(integration);

  const metadata: Record<string, unknown> = { name: filename, mimeType };
  if (FOLDER_ID) metadata.parents = [FOLDER_ID];

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
  );
  if (!res.ok) throw new Error(`Drive upload failed: ${await res.text()}`);
  const data = await res.json();
  return { driveId: data.id, webViewLink: data.webViewLink };
}

export async function downloadFromDrive(driveId: string): Promise<Buffer> {
  const integration = await prisma.integration.findUnique({ where: { provider: "gmail" } });
  if (!integration) throw new Error("Google Drive not connected");
  const token = await getValidGmailToken(integration);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive download failed: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function deleteFromDrive(driveId: string): Promise<void> {
  const integration = await prisma.integration.findUnique({ where: { provider: "gmail" } });
  if (!integration) return;
  const token = await getValidGmailToken(integration);
  await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
