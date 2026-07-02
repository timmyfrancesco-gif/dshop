import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import TenantCheckout from "./TenantCheckout";

export default async function TenantCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tenant;
  try {
    const rows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (rows.length === 0 || !rows[0].active) return notFound();
    tenant = rows[0];
  } catch {
    return notFound();
  }

  return (
    <TenantCheckout
      tenant={{
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        logo: tenant.logo,
        theme: tenant.theme,
        discordInvite: tenant.discordInvite ?? "",
        hasWallet: !!tenant.ltcAddress,
        paypalEmail: tenant.paypalEmail ?? null,
      }}
    />
  );
}
