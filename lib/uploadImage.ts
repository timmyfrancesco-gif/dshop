"use client";

import { upload } from "@vercel/blob/client";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Uploads an image straight from the browser to Vercel Blob, bypassing our
 * own serverless function entirely for the file bytes — Vercel Serverless
 * Functions cap request bodies at ~4.5MB regardless of any limit we set in
 * code, so a route that reads the file via FormData can never reliably
 * support the 20MB we want to allow. /api/upload only issues the client a
 * short-lived upload token; the bytes go directly to Blob storage.
 */
export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "only PNG, JPG, WebP, and GIF are allowed" };
  }
  if (file.size === 0 || file.size > MAX_SIZE) {
    return { error: "file must be between 1 byte and 20MB" };
  }
  try {
    const ext = EXT_BY_TYPE[file.type] ?? "png";
    const blob = await upload(`logos/${crypto.randomUUID()}.${ext}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      contentType: file.type,
    });
    return { url: blob.url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "upload failed" };
  }
}
