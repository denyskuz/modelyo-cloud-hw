import { NextRequest, NextResponse } from "next/server";
import { DEMO_ROLE_COOKIE_NAME } from "@/auth/role";
import { DEFAULT_TENANT, isTenantSlug } from "@/lib/tenant";
import { getTenantFromHost, getRootHost } from "@/lib/tenant-routing";

const DEFAULT_DEMO_ROLE = "admin";

/** Demo-only: ensure role cookie exists for consistent UX and predictable RBAC. Sets demo_role=admin on response if missing. */
function ensureDemoRoleCookie(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  if (request.cookies.get(DEMO_ROLE_COOKIE_NAME)) return response;
  response.cookies.set(DEMO_ROLE_COOKIE_NAME, DEFAULT_DEMO_ROLE, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? null;
  const hostname = host?.split(":")[0] ?? "localhost";

  // Skip Next.js internals, API, static assets, and well-known paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // Global page: do not rewrite; let root app serve it (still set demo_role if missing)
  if (pathname === "/tenant-not-found") {
    return ensureDemoRoleCookie(request, NextResponse.next());
  }

  const tenant = getTenantFromHost(hostname);

  // No tenant subdomain (localhost/IP): redirect to default tenant, preserve pathname + query
  if (tenant === null) {
    const root = getRootHost(hostname);
    const newHostname =
      root === "localhost"
        ? `${DEFAULT_TENANT}.localhost`
        : `${DEFAULT_TENANT}.${root}`;
    const url = new URL(request.url);
    url.hostname = newHostname;
    return ensureDemoRoleCookie(request, NextResponse.redirect(url, 307));
  }

  // Unknown tenant subdomain: redirect to global tenant-not-found page (never rewrite to /s/{unknown}/...)
  if (!isTenantSlug(tenant)) {
    const url = new URL(request.url);
    url.pathname = "/tenant-not-found";
    url.searchParams.set("tenant", tenant);
    url.searchParams.set("from", pathname);
    return ensureDemoRoleCookie(request, NextResponse.redirect(url, 307));
  }

  // If request path is internal /s/{tenant}/..., redirect to public path so URL bar never shows /s/
  if (pathname.startsWith("/s/")) {
    const after = pathname.slice(3);
    const slash = after.indexOf("/");
    const pathTenant = slash >= 0 ? after.slice(0, slash) : after;
    const publicPath = slash >= 0 ? after.slice(slash) : "/";
    if (isTenantSlug(pathTenant)) {
      const url = new URL(request.url);
      url.pathname = publicPath || "/";
      return ensureDemoRoleCookie(request, NextResponse.redirect(url, 307));
    }
  }

  const rewriteUrl = new URL(request.url);
  rewriteUrl.pathname = `/s/${tenant}${pathname === "/" ? "" : pathname}`;
  return ensureDemoRoleCookie(request, NextResponse.rewrite(rewriteUrl));
}

export const config = {
  matcher: [
    // Skip _next (Next.js internals) and api routes
    "/((?!_next|api).*)",
  ],
};
