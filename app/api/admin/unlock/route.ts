import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminSessionValue,
  constantTimeEqual,
} from "@/lib/adminSession";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");
// Temporary fallback so the dashboard is reachable immediately without
// waiting on a Vercel env var — set DASHBOARD_PASSWORD (which always wins)
// and remove this literal once that's done.
const DASHBOARD_PASSWORD =
  process.env.DASHBOARD_PASSWORD ?? process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD ?? "CIAO2025";
// Site accounts (by email) that always get dashboard access, independent of
// the bot's own "role" field — the owner shouldn't depend on the bot's user
// database being set up correctly.
const OWNER_EMAILS = (process.env.OWNER_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Establishes an httpOnly admin session cookie after verifying either the
// dashboard password (checked server-side) or an admin-role login JWT.
export async function POST(req: NextRequest) {
  const sessionValue = adminSessionValue();
  if (!sessionValue) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let body: { password?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let ok = false;

  if (body.password && DASHBOARD_PASSWORD) {
    ok = constantTimeEqual(body.password, DASHBOARD_PASSWORD);
  } else if (body.token && API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${body.token}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const user = data?.user ?? data;
        const role = user?.role;
        const email = typeof user?.email === "string" ? user.email.toLowerCase() : "";
        ok = role === "admin" || (email !== "" && OWNER_EMAILS.includes(email));
      }
    } catch {
      ok = false;
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(ADMIN_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return resp;
}
