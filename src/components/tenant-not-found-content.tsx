"use client";

import { Button } from "@/components/ui/button";
import { TENANTS, type TenantSlug } from "@/lib/tenant";

/**
 * Builds the full URL for a tenant subdomain (same origin, different host).
 * Used for full navigation so we never rewrite unknown tenants to /s/{unknown}/.
 */
function getTenantUrl(slug: TenantSlug, pathname: string): string {
  if (typeof window === "undefined") return "#";
  const { protocol, hostname, port } = window.location;
  const portPart = port ? `:${port}` : "";
  const baseHost =
    hostname === "localhost" ? "localhost" : hostname.replace(/^[^.]+\./, "");
  const host = `${slug}.${baseHost}`;
  return `${protocol}//${host}${portPart}${pathname}`;
}

export function TenantNotFoundContent({
  tenantSlug,
  fromPath,
}: {
  tenantSlug: string;
  fromPath: string;
}) {
  const pathToUse = fromPath.startsWith("/") ? fromPath : `/${fromPath}`;

  const goTo = (slug: TenantSlug) => {
    const url = getTenantUrl(slug, pathToUse);
    if (url !== "#") window.location.assign(url);
  };

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Tenant not found
      </h1>
      <p className="text-muted-foreground">
        {tenantSlug ? (
          <>
            The tenant &quot;{tenantSlug}&quot; is not recognized. Choose a
            tenant below to continue.
          </>
        ) : (
          <>No tenant was specified. Choose a tenant below to continue.</>
        )}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {TENANTS.map(({ slug, displayName }) => (
          <Button key={slug} onClick={() => goTo(slug)}>
            Open {displayName}
          </Button>
        ))}
      </div>
    </div>
  );
}
