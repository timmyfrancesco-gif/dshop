import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";

export type TenantRow = typeof tenants.$inferSelect;

const cache = new Map<string, { tenant: TenantRow | null; ts: number }>();
const TTL = 60_000;

export async function resolveTenant(
  slug: string
): Promise<TenantRow | null> {
  const now = Date.now();
  const cached = cache.get(slug);
  if (cached && now - cached.ts < TTL) return cached.tenant;

  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  const tenant = rows[0] ?? null;
  cache.set(slug, { tenant, ts: now });
  return tenant;
}

export function extractSlugFromHost(host: string, baseDomain: string): string | null {
  const h = host.toLowerCase().replace(/:\d+$/, "");
  const base = baseDomain.toLowerCase();

  if (h === base || h === `www.${base}`) return null;

  if (h.endsWith(`.${base}`)) {
    const sub = h.slice(0, -(base.length + 1));
    if (sub && !sub.includes(".") && sub !== "www" && sub !== "api") {
      return sub;
    }
  }

  return null;
}

export function invalidateSlug(slug: string) {
  cache.delete(slug);
}
