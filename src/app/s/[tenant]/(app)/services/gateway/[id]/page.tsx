import { notFound } from "next/navigation";
import { isTenantSlug } from "@/lib/tenant";
import type { TenantSlug } from "@/lib/tenant";
import { getOne } from "@/services/mock-api";
import { GatewayDetailClient } from "./gateway-detail-client";

export default async function GatewayServiceDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: tenantParam, id } = await params;
  if (!isTenantSlug(tenantParam)) {
    notFound();
  }
  const tenant = tenantParam as TenantSlug;

  const service = await getOne(tenant, "gateway", id);
  if (!service || service.type !== "gateway") {
    notFound();
  }

  return <GatewayDetailClient tenant={tenant} initialGateway={service} />;
}
