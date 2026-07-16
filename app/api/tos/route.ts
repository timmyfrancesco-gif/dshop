import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/db/schema";
import { constantTimeEqual, hasAdminSession } from "@/lib/adminSession";
import { renderDiscordMarkdown } from "@/lib/discordMarkdown";
import { serverError } from "@/lib/http";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";
const CATEGORIES = ["general", "owner1", "owner2"] as const;
type TosCategory = (typeof CATEGORIES)[number];

interface TosEntry {
  content: string;
  authorId: string | null;
  authorName: string | null;
  updatedAt: string;
}

// Same bearer-token pattern as /api/transcripts: the bot posts with
// ADMIN_TOKEN (server-to-server), the dashboard would use the admin session
// cookie if it ever needs to edit these directly.
function validateToken(req: NextRequest): boolean {
  if (hasAdminSession(req)) return true;
  const auth = req.headers.get("authorization");
  if (!auth || !ADMIN_TOKEN) return false;
  const token = auth.replace(/^Bearer\s+/i, "");
  return constantTimeEqual(token, ADMIN_TOKEN);
}

export async function GET() {
  try {
    const rows = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);
    const tos = ((rows[0]?.config as Record<string, unknown>)?.tos ?? {}) as Record<string, TosEntry>;

    const rendered: Record<TosCategory, { html: string; updatedAt: string | null; authorName: string | null }> = {
      general: { html: "", updatedAt: null, authorName: null },
      owner1: { html: "", updatedAt: null, authorName: null },
      owner2: { html: "", updatedAt: null, authorName: null },
    };
    for (const category of CATEGORIES) {
      const entry = tos[category];
      if (entry?.content) {
        rendered[category] = {
          html: renderDiscordMarkdown(entry.content),
          updatedAt: entry.updatedAt ?? null,
          authorName: entry.authorName ?? null,
        };
      }
    }

    return NextResponse.json({ tos: rendered });
  } catch (e) {
    return serverError("tos-get", e, "failed to load terms");
  }
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { category?: string; content?: string; authorId?: string; authorName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const category = body.category as TosCategory;
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `category must be one of: ${CATEGORIES.join(", ")}` }, { status: 400 });
  }
  if (typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }
  if (body.content.length > 20000) {
    return NextResponse.json({ error: "content too long (max 20000 characters)" }, { status: 400 });
  }

  try {
    const rows = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);
    const existing = (rows[0]?.config ?? {}) as Record<string, unknown>;
    const tos = { ...((existing.tos as Record<string, TosEntry>) ?? {}) };

    tos[category] = {
      content: body.content,
      authorId: body.authorId ?? null,
      authorName: body.authorName ?? null,
      updatedAt: new Date().toISOString(),
    };
    const merged = { ...existing, tos };

    if (rows.length === 0) {
      await db.insert(siteConfig).values({ id: 1, config: merged });
    } else {
      await db.update(siteConfig).set({ config: merged, updatedAt: new Date() }).where(eq(siteConfig.id, 1));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("tos-post", e, "failed to save terms");
  }
}
