import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, readSessionCookie } from "@/lib/tenant/session";
import { serverError } from "@/lib/http";

const LTC_ADDRESS_RE = /^([LM3][a-km-zA-HJ-NP-Z1-9]{25,39}|ltc1[a-z0-9]{20,90})$/;
const PAYPAL_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THEMES = new Set(["heaven", "hyper"]);
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Validates and normalizes a settings patch. Returns either the sanitized
 * column updates or an error message. Any invalid field rejects the request.
 */
function validateSettings(
  body: Record<string, unknown>
): { updates: Record<string, unknown> } | { error: string } {
  const updates: Record<string, unknown> = {};

  const asString = (v: unknown) => (typeof v === "string" ? v : null);

  if ("name" in body) {
    const v = asString(body.name)?.trim();
    if (!v || v.length > 120) return { error: "invalid name" };
    updates.name = v;
  }
  if ("description" in body) {
    const v = asString(body.description);
    if (v === null || v.length > 2000) return { error: "invalid description" };
    updates.description = v;
  }
  if ("logo" in body) {
    const v = asString(body.logo);
    if (v === null) return { error: "invalid logo" };
    if (v !== "") {
      try {
        const u = new URL(v);
        if (u.protocol !== "https:" || v.length > 2048) throw new Error();
      } catch {
        return { error: "logo must be a valid https URL" };
      }
    }
    updates.logo = v || null;
  }
  if ("discordInvite" in body) {
    const v = asString(body.discordInvite);
    if (v === null) return { error: "invalid discord invite" };
    if (v !== "") {
      try {
        const u = new URL(v);
        if (u.protocol !== "https:" || v.length > 2048) throw new Error();
      } catch {
        return { error: "discord invite must be a valid https URL" };
      }
    }
    updates.discordInvite = v || null;
  }
  if ("theme" in body) {
    const v = asString(body.theme);
    if (!v || !THEMES.has(v)) return { error: "invalid theme" };
    updates.theme = v;
  }
  if ("accentColor" in body) {
    const v = asString(body.accentColor);
    if (!v || !HEX_COLOR_RE.test(v)) return { error: "invalid accent color" };
    updates.accentColor = v;
  }
  if ("ltcAddress" in body) {
    const v = asString(body.ltcAddress)?.trim();
    if (!v || !LTC_ADDRESS_RE.test(v)) {
      return { error: "invalid Litecoin address" };
    }
    updates.ltcAddress = v;
  }
  if ("paypalEmail" in body) {
    const v = asString(body.paypalEmail)?.trim() ?? null;
    if (v === null) return { error: "invalid PayPal email" };
    if (v !== "" && (!PAYPAL_EMAIL_RE.test(v) || v.length > 254)) {
      return { error: "invalid PayPal email" };
    }
    updates.paypalEmail = v || null;
  }

  return { updates };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const rows = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const tenant = rows[0];

    if (!verifySession(readSessionCookie(req), tenantId, tenant.ownerId)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      description: tenant.description,
      logo: tenant.logo,
      theme: tenant.theme,
      accentColor: tenant.accentColor,
      discordInvite: tenant.discordInvite,
      ltcAddress: tenant.ltcAddress,
      paypalEmail: tenant.paypalEmail,
      feePct: tenant.feePct,
      active: tenant.active,
    });
  } catch (e) {
    return serverError("tenants/settings GET", e);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const rows = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const tenant = rows[0];

    if (!verifySession(readSessionCookie(req), tenantId, tenant.ownerId)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const result = validateSettings(body);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await db
      .update(tenants)
      .set({ ...result.updates, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError("tenants/settings PUT", e);
  }
}
