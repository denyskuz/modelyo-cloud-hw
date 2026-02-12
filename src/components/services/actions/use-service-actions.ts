"use client";

import { useRouter } from "next/navigation";
import type { TenantSlug } from "@/lib/tenant";
import type { Service, ServiceType } from "@/domain/service/service";
import { toast } from "sonner";

async function mutateViaApi(
  tenant: TenantSlug,
  type: ServiceType,
  id: string,
  action: string,
  payload?: unknown
): Promise<Service> {
  const res = await fetch("/api/services/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant, type, id, action, payload }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Action failed");
  }
  return (await res.json().catch(() => null)) as Service;
}

async function deleteViaApi(
  tenant: TenantSlug,
  type: ServiceType,
  id: string
): Promise<void> {
  const res = await fetch("/api/services/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant, type, id }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Delete failed");
  }
}

export function useServiceActions<T extends Service>(
  tenant: TenantSlug,
  type: ServiceType,
  id: string
) {
  const router = useRouter();

  const run = async (action: string, payload?: unknown): Promise<T> => {
    const updated = await mutateViaApi(tenant, type, id, action, payload);
    toast.success("Action completed");
    return updated as T;
  };

  const runWithErrorHandling = async (
    action: string,
    payload?: unknown
  ): Promise<T> => {
    try {
      const updated = await mutateViaApi(tenant, type, id, action, payload);
      toast.success("Action completed");
      return updated as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(message);
      throw err;
    }
  };

  const runDelete = async (): Promise<void> => {
    try {
      await deleteViaApi(tenant, type, id);
      toast.success("Service deleted");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      toast.error(message);
      throw err;
    }
  };

  return { run, runWithErrorHandling, runDelete };
}
