export type DemoRole = "admin" | "viewer";

const COOKIE_NAME = "demo_role";

/** Cookie store from next/headers cookies() (or compatible). */
type CookieStore = { get(name: string): { value: string } | undefined };

/**
 * Reads the demo role from the cookie store (tenant-agnostic; shared across tenants).
 * Use in layouts/pages to protect routes or show role-specific UI.
 * Defense in depth: defaults to "admin" if cookie is missing or invalid (middleware also sets default at edge).
 */
export function getDemoRole(cookies: CookieStore): DemoRole {
  const value = cookies.get(COOKIE_NAME)?.value;
  if (value === "viewer") return "viewer";
  return "admin";
}

export { COOKIE_NAME as DEMO_ROLE_COOKIE_NAME };
