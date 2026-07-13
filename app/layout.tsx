import type { Metadata } from "next";
import { cache } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { LocaleProvider } from "@/lib/contexts/LocaleContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { SiteConfigProvider, type SiteConfig } from "@/lib/contexts/SiteConfigContext";
import { CartProvider } from "@/lib/hooks/useCart";
import { SITE } from "@/lib/config";
import "./globals.css";

/**
 * Storefront settings saved from the admin dashboard (site_config table).
 * Loaded at render time so Configure changes are actually live on the site.
 * Wrapped in React's cache() so generateMetadata() and RootLayout share one
 * DB query per request instead of two.
 */
const loadStorefrontConfig = cache(async (): Promise<SiteConfig> => {
  const base: SiteConfig = { ...SITE, isTenant: false };
  try {
    const { db } = await import("@/lib/db");
    const { siteConfig } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(siteConfig).where(eq(siteConfig.id, 1)).limit(1);
    const c = (rows[0]?.config ?? {}) as Record<string, unknown>;
    return {
      ...base,
      name: typeof c.storeName === "string" && c.storeName ? c.storeName : base.name,
      tagline:
        typeof c.description === "string" && c.description ? c.description : base.tagline,
      discordInvite:
        typeof c.discordInvite === "string" && c.discordInvite
          ? c.discordInvite
          : base.discordInvite,
      shopUrl: typeof c.shopUrl === "string" && c.shopUrl ? c.shopUrl : base.shopUrl,
      tenantLogo: typeof c.logoUrl === "string" && c.logoUrl ? c.logoUrl : null,
      faviconUrl: typeof c.faviconUrl === "string" && c.faviconUrl ? c.faviconUrl : null,
      bannerText: typeof c.bannerText === "string" ? c.bannerText : "",
      bannerEnabled: c.bannerEnabled === true,
    };
  } catch {
    return base;
  }
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const storefront = await loadStorefrontConfig();
  return {
    title: "Dshop — Crypto Escrow, Middleman & Exchange on Discord",
    description:
      "Dshop is a Discord-based crypto trading hub offering escrow, middleman services, exchange, advertising slots, a digital shop and a casino.",
    openGraph: {
      title: "Dshop",
      description:
        "Crypto escrow, middleman, exchange, casino and more — all on Discord.",
      type: "website",
    },
    // Falls back to the file-based app/icon.svg + app/favicon.ico when no
    // custom favicon is set from the dashboard.
    icons: storefront.faviconUrl ? { icon: storefront.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storefront = await loadStorefrontConfig();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <LocaleProvider>
              <SiteConfigProvider config={storefront}>
                <CartProvider>{children}</CartProvider>
              </SiteConfigProvider>
            </LocaleProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
