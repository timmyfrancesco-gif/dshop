import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { serverError } from "@/lib/http";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/**
 * Issues short-lived client upload tokens for Vercel Blob instead of
 * receiving files directly — Vercel Serverless Functions cap request bodies
 * at ~4.5MB regardless of any limit set here, so a route reading the file
 * itself could never reliably support uploads up to 20MB. The browser
 * uploads straight to Blob storage; this route only authorizes it.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: MAX_SIZE,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (e) {
    return serverError("upload", e, "upload failed");
  }
}
