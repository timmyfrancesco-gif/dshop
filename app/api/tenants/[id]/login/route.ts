import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { signSession } from "@/lib/tenant/session";

function verifyPassword(stored: string, input: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const inputHash = createHash("sha256")
    .update(salt + input)
    .digest("hex");
  return hash === inputHash;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenantId } = await params;

  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password required" },
        { status: 400 }
      );
    }

    const tenantRows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (tenantRows.length === 0) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (userRows.length === 0) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const user = userRows[0];
    if (!verifyPassword(user.passwordHash, password)) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    if (tenantRows[0].ownerId !== user.id) {
      return NextResponse.json({ error: "not authorized" }, { status: 403 });
    }

    let sessionToken: string;
    try {
      sessionToken = signSession(tenantId, user.id);
    } catch {
      return NextResponse.json(
        { error: "server misconfigured" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, username: user.username },
    });

    response.cookies.set("tenant_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
