import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function validateToken(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, "");
  const expected = process.env.NEXT_PUBLIC_ADMIN_TOKEN;
  return Boolean(expected && token === expected);
}

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 10; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) return unauthorized();

  let body: {
    html: string;
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

  if (!body.html || !body.ticketId || !body.ticketName || !body.ownerId || !body.ownerName) {
    return NextResponse.json(
      { error: "Missing required fields: html, ticketId, ticketName, ownerId, ownerName" },
      { status: 400 }
    );
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

  await Promise.all([
    put(`transcripts/${id}.html`, body.html, {
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

  return NextResponse.json({
    id,
    url: `/transcript/${id}`,
  });
}

export async function GET(req: NextRequest) {
  if (!validateToken(req)) return unauthorized();

  const result = await list({ prefix: "transcripts/" });

  const jsonBlobs = result.blobs.filter((b) => b.pathname.endsWith(".json"));

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
