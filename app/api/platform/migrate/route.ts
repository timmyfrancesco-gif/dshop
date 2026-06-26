import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrate";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.PLATFORM_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await runMigrations();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
