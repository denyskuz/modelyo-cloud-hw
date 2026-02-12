/**
 * Tenant routing helpers for host-based multi-tenancy (e.g. acme.localhost:3000).
 * The app MUST NOT generate /s/{tenant}/... links; use public paths only.
 * Tenant switching uses full navigation (window.location.assign) to avoid cross-tenant leakage.
 */

/** True if hostname is an IPv4 or IPv6 address (no tenant subdomain possible). */
function isIpHostname(hostname: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  if (hostname.startsWith("[") && hostname.includes("]")) return true;
  if (/^[0-9a-fA-F:]+$/.test(hostname)) return true;
  return false;
}

/**
 * Extract tenant slug from hostname (subdomain).
 * - acme.localhost -> acme
 * - localhost, 127.0.0.1 -> null
 */
export function getTenantFromHost(hostname: string): string | null {
  const h = hostname?.split(":")[0] ?? "localhost";
  if (h === "localhost" || isIpHostname(h)) return null;
  const parts = h.split(".");
  if (parts.length <= 1) return null;
  return parts[0];
}

/**
 * Root hostname without tenant subdomain (for building tenant URLs).
 * - acme.localhost -> localhost
 * - acme.example.com -> example.com
 * Preserve port at call site (host header has port).
 */
export function getRootHost(hostname: string): string {
  const h = hostname?.split(":")[0] ?? "localhost";
  if (h === "localhost") return "localhost";
  const parts = h.split(".");
  return parts.slice(1).join(".") || "localhost";
}

/**
 * Build full URL for a tenant and path (client-only).
 * Uses current window protocol and port. Path must be public (e.g. /dashboard).
 * Returns "" when tenant subdomains are not possible (localhost or IP), so callers can show a toast.
 */
export function buildTenantUrl(nextTenant: string, path: string): string {
  if (typeof window === "undefined") return "";
  const { protocol, hostname, port } = window.location;
  const h = hostname?.split(":")[0] ?? "localhost";
  if (h === "localhost" || isIpHostname(h)) return "";
  const root = getRootHost(hostname);
  const portPart = port ? `:${port}` : "";
  const pathNorm = path.startsWith("/") ? path : `/${path}`;
  return `${protocol}//${nextTenant}.${root}${portPart}${pathNorm}`;
}

/**
 * Full navigation to another tenant, always landing on /dashboard.
 * Use for tenant switcher to avoid cross-tenant state/cache leakage.
 */
export function navigateToTenant(nextTenant: string): void {
  if (typeof window === "undefined") return;
  const url = buildTenantUrl(nextTenant, "/dashboard");
  if (url) window.location.assign(url);
}

/**
 * Return a public path for links (no /s/ prefix).
 * Use for all <Link href={tenantHref("/dashboard")}> and router.push(tenantHref("/dashboard")).
 * Middleware rewrites these to /s/[tenant]/... internally.
 */
export function tenantHref(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return p;
}
