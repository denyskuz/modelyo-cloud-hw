import { cookies } from "next/headers";
import { getDemoRole } from "@/auth/role";
import { RoleProvider } from "@/auth/role-context";
import { TenantProvider } from "@/auth/tenant-context";
import { AppShell } from "@/components/layout/app-shell";
import type { TenantSlug } from "@/lib/tenant";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  /** Next.js 16 passes params as Promise; await before use. */
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantParam } = await Promise.resolve(params);
  const tenant = tenantParam as TenantSlug;
  const cookieStore = await cookies();
  const role = getDemoRole(cookieStore);

  return (
    <RoleProvider role={role}>
      <TenantProvider tenant={tenant}>
        <AppShell>{children}</AppShell>
      </TenantProvider>
    </RoleProvider>
  );
}
