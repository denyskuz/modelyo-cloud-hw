import { notFound } from "next/navigation";
import { isTenantSlug } from "@/lib/tenant";
import type { TenantSlug } from "@/lib/tenant";
import { getOne } from "@/services/mock-api";
import { KubernetesDetailClient } from "./kubernetes-detail-client";

export default async function KubernetesServiceDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: tenantParam, id } = await params;
  if (!isTenantSlug(tenantParam)) {
    notFound();
  }
  const tenant = tenantParam as TenantSlug;

  const service = await getOne(tenant, "kubernetes", id);
  if (!service || service.type !== "kubernetes") {
    notFound();
  }

  return <KubernetesDetailClient tenant={tenant} initialCluster={service} />;
}
