/**
 * Tenant configuration and display helpers.
 * Single source of truth for the tenant allowlist (middleware + UI + mocks).
 * Tenant identity is derived from the Host header in middleware (server-side);
 * the client never trusts a tenantId — the effective tenant is determined by
 * the subdomain of the current request.
 */

export const DEFAULT_TENANT = "acme" as const;

export const TENANTS = [
  { slug: "acme", displayName: "Acme Corp" },
  { slug: "globex", displayName: "Globex Industries" },
] as const;

export type TenantSlug = (typeof TENANTS)[number]["slug"];

export const VALID_TENANTS_SET = new Set(
  TENANTS.map((t) => t.slug) as TenantSlug[]
);

export function isTenantSlug(v: string | null | undefined): v is TenantSlug {
  return typeof v === "string" && (VALID_TENANTS_SET as Set<string>).has(v);
}

export function tenantDisplayName(slug: string): string {
  return (
    TENANTS.find((t) => t.slug === (slug as TenantSlug))?.displayName ?? slug
  );
}
