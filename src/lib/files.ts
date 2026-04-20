import path from "path";
import { mkdir } from "fs/promises";

// Vercel's filesystem is read-only except for /tmp (ephemeral per instance).
// Local/dev uses ./data/uploads. Persistent storage should go through Google Drive.
export const UPLOAD_DIR = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "data", "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.wps-office.doc",
  "application/vnd.wps-office.xls",
  "application/vnd.wps-office.ppt",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "video/mp4",
  "video/quicktime",
  "application/zip",
  "application/octet-stream",
]);
