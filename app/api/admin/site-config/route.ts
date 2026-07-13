import { NextRequest, NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface StorefrontConfig {
  storeName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  description?: string;
  discordInvite?: string;
  shopUrl?: string;
  currency?: string;
  bannerText?: string;
  bannerEnabled?: boolean;
  mainPaypalEmail?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HTTPS_URL = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && v.length <= 2048;
  } catch {
    return false;
  }
};

function sanitize(body: Record<string, unknown>): StorefrontConfig | { error: string } {
  const out: StorefrontConfig = {};
  const s = (v: unknown) => (typeof v === "string" ? v : undefined);

  if ("storeName" in body) {
    const v = s(body.storeName)?.trim();
    if (!v || v.length > 60) return { error: "invalid store name" };
    out.storeName = v;
  }
  if ("logoUrl" in body) {
    const v = s(body.logoUrl) ?? "";
    if (v !== "" && !HTTPS_URL(v)) return { error: "logo must be an https URL (use Upload)" };
    out.logoUrl = v;
  }
  if ("faviconUrl" in body) {
    const v = s(body.faviconUrl) ?? "";
    if (v !== "" && !HTTPS_URL(v)) return { error: "favicon must be an https URL (use Upload)" };
    out.faviconUrl = v;
  }
  if ("description" in body) {
    const v = s(body.description) ?? "";
    if (v.length > 2000) return { error: "description too long" };
    out.description = v;
  }
  if ("discordInvite" in body) {
    const v = s(body.discordInvite) ?? "";
    if (v !== "" && !HTTPS_URL(v)) return { error: "invalid discord invite URL" };
    out.discordInvite = v;
  }
  if ("shopUrl" in body) {
    const v = s(body.shopUrl) ?? "";
    if (v !== "" && !HTTPS_URL(v)) return { error: "invalid shop URL" };
    out.shopUrl = v;
  }
  if ("currency" in body) {
    const v = s(body.currency);
    if (!v || !["EUR", "USD", "GBP"].includes(v)) return { error: "invalid currency" };
    out.currency = v;
  }
  if ("bannerText" in body) {
    const v = s(body.bannerText) ?? "";
    if (v.length > 200) return { error: "banner text too long" };
    out.bannerText = v;
  }
  if ("bannerEnabled" in body) {
    if (typeof body.bannerEnabled !== "boolean") return { error: "invalid bannerEnabled" };
    out.bannerEnabled = body.bannerEnabled;
  }
  if ("mainPaypalEmail" in body) {
    const v = s(body.mainPaypalEmail)?.trim() ?? "";
    if (v !== "" && (!EMAIL_RE.test(v) || v.length > 254)) {
      return { error: "invalid PayPal email" };
    }
    out.mainPaypalEmail = v;
  }
  return out;
}

export async function GET() {
  try {
    const rows = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);
    return NextResponse.json({ config: rows[0]?.config ?? {} });
  } catch {
    return NextResponse.json({ config: {} });
  }
}

export async function PUT(req: NextRequest) {
  if (!hasAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = sanitize(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const rows = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);
  const merged = { ...(rows[0]?.config ?? {}), ...result };

  if (rows.length === 0) {
    await db.insert(siteConfig).values({ id: 1, config: merged });
  } else {
    await db
      .update(siteConfig)
      .set({ config: merged, updatedAt: new Date() })
      .where(eq(siteConfig.id, 1));
  }

  return NextResponse.json({ ok: true, config: merged });
}
