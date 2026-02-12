"use client";

import { createContext, useContext } from "react";
import type { DemoRole } from "@/auth/role";

const RoleContext = createContext<DemoRole | null>(null);

export function RoleProvider({
  role,
  children,
}: {
  role: DemoRole;
  children: React.ReactNode;
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole(): DemoRole | null {
  return useContext(RoleContext);
}
