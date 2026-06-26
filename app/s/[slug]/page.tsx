import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tenants, tenantProducts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import TenantShell from "./TenantShell";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const rows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (rows.length === 0) return {};
    const tenant = rows[0];
    return {
      title: `${tenant.name} — Shop`,
      description: tenant.description || `Shop at ${tenant.name}`,
    };
  } catch {
    return {};
  }
}

export default async function TenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let tenant;
  let products;

  try {
    const rows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (rows.length === 0 || !rows[0].active) return notFound();
    tenant = rows[0];

    products = await db
      .select()
      .from(tenantProducts)
      .where(
        and(
          eq(tenantProducts.tenantId, tenant.id),
          eq(tenantProducts.active, true)
        )
      )
      .orderBy(tenantProducts.sortOrder);
  } catch {
    return notFound();
  }

  const tenantConfig = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    description: tenant.description ?? "",
    logo: tenant.logo,
    theme: tenant.theme,
    accentColor: tenant.accentColor,
    discordInvite: tenant.discordInvite ?? "",
    ltcAddress: tenant.ltcAddress,
  };

  const shopProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category ?? "Shop",
    price: p.price,
    comparePrice: p.comparePrice,
    currency: p.currency,
    stock: p.stock,
    description: p.description ?? "",
    icon: "shop" as const,
    image: p.image,
    images: (p.images as string[] | null) ?? [],
    instructions: p.instructions,
    variants: p.variants as Array<{
      id: string;
      title: string;
      price: number;
      stock: number;
      stockItems?: string[];
    }> | null,
    deliverableType: p.deliverableType,
    totalSold: p.totalSold,
  }));

  return (
    <TenantShell tenant={tenantConfig} products={shopProducts} />
  );
}
