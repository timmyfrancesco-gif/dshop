"use client";

import { useEffect } from "react";
import PageShell from "@/components/layout/PageShell";
import Hero from "@/components/sections/Hero";
import Shop from "@/components/sections/Shop";
import Faq from "@/components/sections/Faq";
import { HomepageDataProvider } from "@/lib/contexts/HomepageDataContext";
import { SiteConfigProvider, type SiteConfig } from "@/lib/contexts/SiteConfigContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import type { ShopItem, ProductsResponse, ApiProduct } from "@/lib/types";

interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  theme: string;
  accentColor: string | null;
  discordInvite: string;
  ltcAddress: string | null;
}

interface TenantProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  comparePrice?: number | null;
  currency: string;
  stock: number;
  description: string;
  icon: string;
  image?: string | null;
  images?: string[];
  instructions?: string | null;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    stock: number;
    stockItems?: string[];
  }> | null;
  deliverableType?: string | null;
  totalSold: number;
}

function TenantThemeApplier({ theme }: { theme: string }) {
  const { setTheme, theme: currentTheme } = useTheme();
  useEffect(() => {
    const originalTheme = currentTheme;
    setTheme(theme === "heaven" ? "heaven" : "hyper", false);
    return () => {
      setTheme(originalTheme, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function TenantShell({
  tenant,
  products,
}: {
  tenant: TenantConfig;
  products: TenantProduct[];
}) {
  const siteConfig: SiteConfig = {
    name: tenant.name,
    tagline: tenant.description,
    discordInvite: tenant.discordInvite,
    shopUrl: "",
    isTenant: true,
    tenantSlug: tenant.slug,
    tenantLogo: tenant.logo,
  };

  const apiProducts: ApiProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    comparePrice: p.comparePrice ?? undefined,
    currency: p.currency,
    stock: p.stock,
    description: p.description,
    icon: p.icon,
    image: p.image ?? undefined,
    images: p.images,
    instructions: p.instructions ?? undefined,
    variants: p.variants ?? undefined,
    deliverableType: (p.deliverableType as ApiProduct["deliverableType"]) ?? undefined,
    totalSold: p.totalSold,
  }));

  const productsResponse: ProductsResponse = { products: apiProducts };

  const shopItems: ShopItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    comparePrice: p.comparePrice ?? undefined,
    currency: p.currency,
    stock: p.stock,
    description: p.description,
    icon: p.icon,
    image: p.image ?? undefined,
    images: p.images,
    instructions: p.instructions ?? undefined,
    variants: p.variants ?? undefined,
    deliverableType: (p.deliverableType as ShopItem["deliverableType"]) ?? undefined,
    totalSold: p.totalSold,
  }));

  return (
    <SiteConfigProvider config={siteConfig}>
      <TenantThemeApplier theme={tenant.theme} />
      <HomepageDataProvider
        staticData
        initialData={{
          stats: null,
          products: productsResponse,
          feedItems: [],
          ltc: null,
          reviews: null,
          smmProducts: null,
        }}
      >
        <PageShell>
          <Hero />
          <Shop />
          <Faq />
        </PageShell>
      </HomepageDataProvider>
    </SiteConfigProvider>
  );
}
