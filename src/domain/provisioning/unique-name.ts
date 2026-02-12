import type { TenantSlug } from "@/lib/tenant";
import { listAll } from "@/services/mock-api";

export async function isUniqueServiceName(
  tenant: TenantSlug,
  name: string
): Promise<boolean> {
  const { services } = await listAll(tenant);
  const lower = name.trim().toLowerCase();
  return !services.some((s) => s.name.toLowerCase() === lower);
}
