import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

export async function POST(req: NextRequest) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const { method, path, body } = await req.json();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: method || "GET",
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
