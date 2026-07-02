"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SITE } from "@/lib/config";

export interface SiteConfig {
  name: string;
  tagline: string;
  discordInvite: string;
  shopUrl: string;
  isTenant: boolean;
  tenantSlug?: string;
  tenantLogo?: string | null;
  bannerText?: string;
  bannerEnabled?: boolean;
}

const defaultConfig: SiteConfig = {
  ...SITE,
  isTenant: false,
};

const SiteConfigContext = createContext<SiteConfig>(defaultConfig);

export function SiteConfigProvider({
  children,
  config,
}: {
  children: ReactNode;
  config: SiteConfig;
}) {
  return <SiteConfigContext value={config}>{children}</SiteConfigContext>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
