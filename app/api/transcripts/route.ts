import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put, list } from "@vercel/blob";
import { constantTimeEqual, hasAdminSession } from "@/lib/adminSession";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// TEMP DIAGNOSTIC — remove after confirming the 401 root cause. Never logs
// full token values, only a fingerprint (first/last 4 chars + length).
function fingerprint(s: string): string {
  return s ? `${s.slice(0, 4)}...${s.slice(-4)} (${s.length} chars)` : "EMPTY";
}

// The bot posts transcripts with the bearer token (server-to-server); the
// dashboard reads them with the admin session cookie.
function validateToken(req: NextRequest): boolean {
  if (hasAdminSession(req)) return true;
  const auth = req.headers.get("authorization");
  const received = auth ? auth.replace(/^Bearer\s+/i, "") : "";
  console.log("[transcripts] ADMIN_TOKEN fingerprint:", fingerprint(ADMIN_TOKEN));
  console.log("[transcripts] received token fingerprint:", fingerprint(received));
  if (!auth || !ADMIN_TOKEN) return false;
  return constantTimeEqual(received, ADMIN_TOKEN);
}

function generateId(): string {
  return randomUUID().replace(/-/g, "");
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) return unauthorized();

  let body: {
    html?: string;
    // Alternative to `html`: a URL the caller already uploaded the HTML to
    // (e.g. its own Vercel Blob put()). Vercel Serverless Functions cap
    // inbound request bodies at ~4.5MB regardless of anything configured
    // here — transcripts with several inlined base64 images can exceed
    // that, so large ones should be pre-uploaded and passed as htmlUrl
    // instead of inlined in the request body. Fetched server-to-server
    // below, which has no such limit.
    htmlUrl?: string;
    ticketId: string;
    ticketName: string;
    category?: string;
    ownerId: string;
    ownerName: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if ((!body.html && !body.htmlUrl) || !body.ticketId || !body.ticketName || !body.ownerId || !body.ownerName) {
    return NextResponse.json(
      { error: "Missing required fields: html (or htmlUrl), ticketId, ticketName, ownerId, ownerName" },
      { status: 400 }
    );
  }

  let html = body.html ?? "";
  if (!html && body.htmlUrl) {
    try {
      const res = await fetch(body.htmlUrl);
      if (!res.ok) throw new Error(String(res.status));
      html = await res.text();
    } catch {
      return NextResponse.json({ error: "Could not fetch htmlUrl" }, { status: 400 });
    }
  }

  const id = generateId();
  const createdAt = new Date().toISOString();

  const meta = {
    id,
    ticketId: body.ticketId,
    ticketName: body.ticketName,
    category: body.category || "",
    ownerId: body.ownerId,
    ownerName: body.ownerName,
    createdAt,
  };

  try {
    await Promise.all([
      put(`transcripts/${id}.html`, html, {
        access: "public",
        addRandomSuffix: false,
        contentType: "text/html; charset=utf-8",
      }),
      put(`transcripts/${id}.json`, JSON.stringify(meta), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      }),
    ]);
  } catch {
    return NextResponse.json({ error: "Failed to store transcript" }, { status: 502 });
  }

  return NextResponse.json({
    id,
    url: `/transcript/${id}`,
  });
}

export async function GET(req: NextRequest) {
  if (!validateToken(req)) return unauthorized();

  // Page through all blobs — list() returns at most ~1000 per call.
  const allBlobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: "transcripts/", cursor, limit: 1000 });
    allBlobs.push(...result.blobs);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  const jsonBlobs = allBlobs.filter((b) => b.pathname.endsWith(".json"));

  const transcripts = await Promise.all(
    jsonBlobs.map(async (b) => {
      try {
        const res = await fetch(b.url);
        return (await res.json()) as {
          id: string;
          ticketId: string;
          ticketName: string;
          category: string;
          ownerId: string;
          ownerName: string;
          createdAt: string;
        };
      } catch {
        return null;
      }
    })
  );

  const valid = transcripts
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ transcripts: valid });
}
