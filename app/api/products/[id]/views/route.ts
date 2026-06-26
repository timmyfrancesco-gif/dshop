import { NextRequest, NextResponse } from "next/server";

// In-memory viewer tracking. Each entry stores session IDs with their last-seen
// timestamp. Sessions older than VIEWER_TTL_MS are considered inactive.
const VIEWER_TTL_MS = 2 * 60 * 1000; // 2 minutes
const viewers = new Map<string, Map<string, number>>();

function cleanOld(productId: string) {
  const sessions = viewers.get(productId);
  if (!sessions) return 0;
  const now = Date.now();
  for (const [sid, ts] of sessions) {
    if (now - ts > VIEWER_TTL_MS) sessions.delete(sid);
  }
  if (sessions.size === 0) viewers.delete(productId);
  return sessions.size;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const sessionId = body.sessionId || "anon";

  if (!viewers.has(id)) viewers.set(id, new Map());
  viewers.get(id)!.set(sessionId, Date.now());

  const count = cleanOld(id);
  return NextResponse.json({ viewers: count });
}
