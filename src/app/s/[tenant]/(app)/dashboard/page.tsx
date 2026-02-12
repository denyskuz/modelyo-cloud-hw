import { notFound } from "next/navigation";
import Link from "next/link";
import { isTenantSlug } from "@/lib/tenant";
import type { TenantSlug } from "@/lib/tenant";
import { listAll, listAuditLog } from "@/services/mock-api";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardProvisionButton } from "@/components/dashboard/dashboard-provision-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantParam } = await params;
  if (!isTenantSlug(tenantParam)) {
    notFound();
  }
  const tenant = tenantParam as TenantSlug;

  const [{ services }, auditLog] = await Promise.all([
    listAll(tenant),
    listAuditLog(tenant),
  ]);

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Revalidate</Link>
          </Button>
          <DashboardProvisionButton />
        </div>
      </header>
      <Separator />
      <DashboardContent
        services={services}
        auditLog={auditLog}
        tenant={tenant}
      />
    </div>
  );
}
