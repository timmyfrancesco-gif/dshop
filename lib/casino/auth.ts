import { db } from "@/lib/db";
import { casinoBalances } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const API_BASE = (process.env.NEXT_PUBLIC_ASTRO_API_URL ?? "").replace(/\/+$/, "");

export interface CasinoUser {
  id: string;
  username: string | null;
}

/**
 * Verifies the caller's main-site bearer token against the bot's /api/auth/me
 * and returns the trusted user id. Balance operations key off this id, so a
 * client can never spend as another user without that user's real token.
 */
export async function getCasinoUser(req: Request): Promise<CasinoUser | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !API_BASE) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const u = data?.user ?? data;
    const id = u?.id;
    if (typeof id !== "string") return null;
    return { id, username: typeof u?.username === "string" ? u.username : null };
  } catch {
    return null;
  }
}

/** Current balance in cents (row auto-created at 0 on first read). */
export async function getBalanceCents(user: CasinoUser): Promise<number> {
  const rows = await db
    .select({ balanceCents: casinoBalances.balanceCents })
    .from(casinoBalances)
    .where(eq(casinoBalances.userId, user.id))
    .limit(1);
  if (rows.length === 0) {
    await db
      .insert(casinoBalances)
      .values({ userId: user.id, username: user.username, balanceCents: 0 })
      .onConflictDoNothing();
    return 0;
  }
  return rows[0].balanceCents;
}

/**
 * Atomically debits `amountCents`. Returns the new balance, or null if funds
 * are insufficient (the conditional UPDATE simply matches no row then).
 */
export async function debitBalance(user: CasinoUser, amountCents: number): Promise<number | null> {
  await getBalanceCents(user); // ensure the row exists
  const updated = await db
    .update(casinoBalances)
    .set({ balanceCents: sql`${casinoBalances.balanceCents} - ${amountCents}`, updatedAt: new Date() })
    .where(
      sql`${casinoBalances.userId} = ${user.id} AND ${casinoBalances.balanceCents} >= ${amountCents}`
    )
    .returning({ balanceCents: casinoBalances.balanceCents });
  return updated.length > 0 ? updated[0].balanceCents : null;
}

/** Atomically credits `amountCents`, returns the new balance. */
export async function creditBalance(user: CasinoUser, amountCents: number): Promise<number> {
  await getBalanceCents(user);
  const updated = await db
    .update(casinoBalances)
    .set({ balanceCents: sql`${casinoBalances.balanceCents} + ${amountCents}`, updatedAt: new Date() })
    .where(eq(casinoBalances.userId, user.id))
    .returning({ balanceCents: casinoBalances.balanceCents });
  return updated[0].balanceCents;
}
