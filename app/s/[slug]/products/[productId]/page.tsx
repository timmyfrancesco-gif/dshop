import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { tenants, tenantProducts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import TenantProductPage from "./TenantProductPage";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const { slug, productId } = await params;
  try {
    const tenantRows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (tenantRows.length === 0) return {};
    const productRows = await db
      .select()
      .from(tenantProducts)
      .where(and(eq(tenantProducts.id, productId), eq(tenantProducts.tenantId, tenantRows[0].id)))
      .limit(1);
    if (productRows.length === 0) return {};
    return {
      title: `${productRows[0].name} — ${tenantRows[0].name}`,
      description: productRows[0].description || undefined,
    };
  } catch {
    return {};
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  try {
    const tenantRows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    if (tenantRows.length === 0 || !tenantRows[0].active) return notFound();
    const tenant = tenantRows[0];

    const productRows = await db
      .select()
      .from(tenantProducts)
      .where(
        and(
          eq(tenantProducts.id, productId),
          eq(tenantProducts.tenantId, tenant.id),
          eq(tenantProducts.active, true)
        )
      )
      .limit(1);

    if (productRows.length === 0) return notFound();
    const product = productRows[0];

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

    const productData = {
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      category: product.category ?? "Shop",
      price: product.price,
      comparePrice: product.comparePrice,
      currency: product.currency,
      stock: product.stock,
      image: product.image,
      images: (product.images as string[] | null) ?? [],
      instructions: product.instructions,
      variants: product.variants as Array<{
        id: string;
        title: string;
        price: number;
        stock: number;
      }> | null,
      deliverableType: product.deliverableType,
      totalSold: product.totalSold,
    };

    return <TenantProductPage tenant={tenantConfig} product={productData} />;
  } catch {
    return notFound();
  }
}
