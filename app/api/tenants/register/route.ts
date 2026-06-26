import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `${salt}:${hash}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password, shopName, shopSlug, shopLogo, shopDescription } = body as {
      email?: string;
      username?: string;
      password?: string;
      shopName?: string;
      shopSlug?: string;
      shopLogo?: string;
      shopDescription?: string;
    };

    if (!email || !password || !shopName) {
      return NextResponse.json(
        { error: "email, password, and shopName are required" },
        { status: 400 }
      );
    }

    const resolvedUsername = username || email.split("@")[0];

    if (password.length < 8) {
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "email already registered" },
        { status: 409 }
      );
    }

    let slug = shopSlug ? slugify(shopSlug) : slugify(shopName);
    if (!slug) slug = `shop-${randomBytes(4).toString("hex")}`;

    const existingSlug = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (existingSlug.length > 0) {
      slug = `${slug}-${randomBytes(3).toString("hex")}`;
    }

    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        username: resolvedUsername,
        passwordHash: hashPassword(password),
      })
      .returning();

    const [tenant] = await db
      .insert(tenants)
      .values({
        slug,
        name: shopName,
        ownerId: user.id,
        logo: shopLogo || null,
        description: shopDescription || "",
      })
      .returning();

    return NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
