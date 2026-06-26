import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export async function POST(req: NextRequest) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let parsed: { method?: string; path?: string; body?: unknown };
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { method, path, body } = parsed;

  // Prevent SSRF: only allow same-origin API paths, no schemes/host/traversal.
  if (typeof path !== "string" || !path.startsWith("/api/") || /[\\]|\/\/|\.\.|:|@/.test(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const reqMethod = (method || "GET").toUpperCase();
  if (!ALLOWED_METHODS.includes(reqMethod)) {
    return NextResponse.json({ error: "Invalid method" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: reqMethod,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ error: "API unavailable" }, { status: 503 });
  }
}
