"use client";

import { createContext, useContext } from "react";
import type { TenantSlug } from "@/lib/tenant";

const TenantContext = createContext<TenantSlug | null>(null);

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: TenantSlug;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantSlug | null {
  return useContext(TenantContext);
}
