import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifySession, readSessionCookie } from "@/lib/tenant/session";

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
      feePct: tenant.feePct,
      active: tenant.active,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
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

    const body = await req.json();
    const allowedFields: Record<string, string> = {
      name: "name",
      description: "description",
      logo: "logo",
      theme: "theme",
      accentColor: "accentColor",
      discordInvite: "discordInvite",
      ltcAddress: "ltcAddress",
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, col] of Object.entries(allowedFields)) {
      if (key in body) {
        updates[col] = body[key];
      }
    }

    await db.update(tenants).set(updates).where(eq(tenants.id, tenantId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
