import type { TenantSlug } from "@/lib/tenant";

/**
 * Public paths (no /s/ segment). Use these for links, router.push, and redirects.
 * Middleware rewrites them to /s/[tenant]/... internally.
 */
export const PUBLIC_PATHS = {
  dashboard: "/dashboard",
  provision: "/provision",
  accessDenied: "/access-denied",
  serviceDetail: (type: "kubernetes" | "gateway" | "postgres", id: string) =>
    `/services/${type}/${id}`,
} as const;

/**
 * Client-only: build base URL for a tenant (protocol + tenant subdomain + host + port).
 * Use for full navigation (e.g. tenant switch) so the browser shows the tenant subdomain.
 * Returns e.g. "http://acme.localhost:3000" or "https://acme.example.com".
 */
export function tenantBaseUrl(tenant: TenantSlug): string {
  if (typeof window === "undefined") return "";
  const { protocol, hostname, port } = window.location;
  const portPart = port ? `:${port}` : "";
  if (hostname === "localhost") {
    return `${protocol}//${tenant}.localhost${portPart}`;
  }
  if (hostname.endsWith(".localhost")) {
    const baseHost = hostname.replace(/^[^.]+\./, "");
    return `${protocol}//${tenant}.${baseHost}${portPart}`;
  }
  const baseHost = hostname.includes(".")
    ? hostname.replace(/^[^.]+\./, "")
    : hostname;
  return `${protocol}//${tenant}.${baseHost}${portPart}`;
}

/**
 * Server-safe: return public path for dashboard. Use in redirects; middleware will rewrite.
 */
export function dashboardPath(): string {
  return PUBLIC_PATHS.dashboard;
}
