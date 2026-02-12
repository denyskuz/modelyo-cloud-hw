import { notFound } from "next/navigation";
import { isTenantSlug } from "@/lib/tenant";
import type { TenantSlug } from "@/lib/tenant";
import { getOne } from "@/services/mock-api";
import { PostgresDetailClient } from "./postgres-detail-client";

export default async function PostgresServiceDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: tenantParam, id } = await params;
  if (!isTenantSlug(tenantParam)) {
    notFound();
  }
  const tenant = tenantParam as TenantSlug;

  const service = await getOne(tenant, "postgres", id);
  if (!service || service.type !== "postgres") {
    notFound();
  }

  return <PostgresDetailClient tenant={tenant} initialDb={service} />;
}
