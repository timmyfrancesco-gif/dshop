"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  theme: string;
  accentColor: string | null;
  discordInvite: string | null;
  ltcAddress: string | null;
}

const TenantContext = createContext<TenantInfo | null>(null);

export function TenantProvider({
  children,
  tenant,
}: {
  children: ReactNode;
  tenant: TenantInfo;
}) {
  return <TenantContext value={tenant}>{children}</TenantContext>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}

export function useTenantOptional() {
  return useContext(TenantContext);
}
