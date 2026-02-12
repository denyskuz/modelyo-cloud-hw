"use client";

import type { DemoRole } from "@/auth/role";
import type { Action } from "@/auth/permissions";
import { can } from "@/auth/ability";
import { useRole } from "@/auth/role-context";

type CanProps = {
  action: Action;
  role?: DemoRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Renders children when the role is allowed to perform the action; otherwise renders fallback (or nothing).
 * If role is not provided, reads it from RoleProvider via useRole(). Prefer <Can action="..."> without passing role.
 */
export function Can({
  action,
  role: roleProp,
  children,
  fallback = null,
}: CanProps) {
  const roleFromContext = useRole();
  const role: DemoRole | null = roleProp ?? roleFromContext;
  if (role == null) return <>{fallback}</>;
  const allowed = can(role, action);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
