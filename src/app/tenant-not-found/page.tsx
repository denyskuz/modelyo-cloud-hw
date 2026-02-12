import type { Metadata } from "next";
import { TenantNotFoundContent } from "@/components/tenant-not-found-content";

export const metadata: Metadata = {
  title: "Tenant not found — Modelyo",
  description: "The requested tenant subdomain is not recognized.",
};

type Props = {
  searchParams: Promise<{ tenant?: string; from?: string }>;
};

export default async function TenantNotFoundPage({ searchParams }: Props) {
  const params = await searchParams;
  const tenant = params.tenant ?? "";
  const from = params.from ?? "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <TenantNotFoundContent tenantSlug={tenant} fromPath={from} />
    </div>
  );
}
