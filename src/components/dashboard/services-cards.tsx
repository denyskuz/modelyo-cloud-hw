"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Can } from "@/components/auth/Can";
import { ACTIONS } from "@/auth/permissions";
import { ActionDialog } from "@/components/services/actions/action-dialog";
import { StatusBadge } from "@/components/services/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/domain/common/cost";
import {
  healthIndicator,
  totalActualNodes,
  totalDesiredNodes,
} from "@/domain/kubernetes/helpers";
import type { KubernetesCluster } from "@/domain/kubernetes/types";
import type { ApiGateway } from "@/domain/gateway/types";
import { storageUsage } from "@/domain/postgres/helpers";
import type { PostgresDb } from "@/domain/postgres/types";
import type { Service, ServiceType } from "@/domain/service/service";
import type { TenantSlug } from "@/lib/tenant";
import { tenantHref } from "@/lib/tenant-routing";

function serviceHref(service: Service): string {
  return tenantHref(`/services/${service.type}/${service.id}`);
}

function serviceTypeLabel(type: ServiceType): string {
  if (type === "kubernetes") return "K8s";
  if (type === "gateway") return "Gateway";
  return "Postgres";
}

function DeleteServiceButton({
  tenant,
  service,
  onDeleted,
}: {
  tenant: TenantSlug;
  service: Service;
  onDeleted?: (serviceId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch("/api/services/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant,
          type: service.type,
          id: service.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      toast.success("Service deleted");
      onDeleted?.(service.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }, [onDeleted, service.id, service.type, tenant]);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete service"
        description={`This will permanently delete "${service.name}" (${serviceTypeLabel(service.type)}).`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

function KubernetesCard({ cluster }: { cluster: KubernetesCluster }) {
  const desired = totalDesiredNodes(cluster);
  const actual = totalActualNodes(cluster);
  const health = healthIndicator(cluster);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{cluster.kubernetesVersion}</Badge>
        <Badge variant="outline">{cluster.region}</Badge>
        <StatusBadge status={cluster.status} />
        <StatusBadge status={health.level} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground">
          Nodes:{" "}
          <span className="text-foreground font-medium">
            {actual}/{desired}
          </span>
        </span>
        <span className="text-muted-foreground">
          Health:{" "}
          <span className="text-foreground font-medium">
            {health.ready}/{health.total} Ready
          </span>
        </span>
      </div>
      <div className="text-muted-foreground">
        Monthly cost:{" "}
        <span className="text-foreground font-medium">
          {formatMoney(cluster.monthlyCost)}
        </span>
      </div>
    </div>
  );
}

function GatewayCard({ gateway }: { gateway: ApiGateway }) {
  const totalRules = gateway.rules.length;
  const activeRules = gateway.rules.filter(
    (r) => r.status === "enabled"
  ).length;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{gateway.region}</Badge>
        <StatusBadge status={gateway.status} />
      </div>
      <div className="text-muted-foreground">
        Endpoint:{" "}
        <a
          href={gateway.publicEndpointUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {gateway.publicEndpointUrl}
        </a>
      </div>
      <div className="text-muted-foreground">
        Rules:{" "}
        <span className="text-foreground font-medium">
          {activeRules}/{totalRules} active
        </span>
      </div>
      <div className="text-muted-foreground">
        Monthly cost:{" "}
        <span className="text-foreground font-medium">
          {formatMoney(gateway.monthlyCost)}
        </span>
      </div>
    </div>
  );
}

function PostgresCard({ db }: { db: PostgresDb }) {
  const usage = storageUsage(db);

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">PG {db.version}</Badge>
        <Badge variant="outline">{db.region}</Badge>
        <Badge variant="outline">{db.tier}</Badge>
        <StatusBadge status={db.status} />
        {db.haMode === "primary_read_replica" ? (
          <Badge variant="secondary">HA</Badge>
        ) : null}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>
            Storage:{" "}
            <span className="text-foreground font-medium">
              {usage.usedGb}/{usage.allocatedGb} GB
            </span>
          </span>
          <span className="tabular-nums">{usage.percent.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary/70"
            style={{ width: `${Math.min(100, usage.percent)}%` }}
          />
        </div>
      </div>
      <div className="text-muted-foreground">
        Monthly cost:{" "}
        <span className="text-foreground font-medium">
          {formatMoney(db.monthlyCost)}
        </span>
      </div>
    </div>
  );
}

function ServiceCardBody({ service }: { service: Service }) {
  if (service.type === "kubernetes") {
    return <KubernetesCard cluster={service as KubernetesCluster} />;
  }
  if (service.type === "gateway") {
    return <GatewayCard gateway={service as ApiGateway} />;
  }
  return <PostgresCard db={service as PostgresDb} />;
}

export function ServicesCards({
  tenant,
  services,
  onDeleted,
}: {
  tenant: TenantSlug;
  services: Service[];
  onDeleted?: (serviceId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-sm text-muted-foreground text-center">
            No services match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Card
              key={service.id}
              className="min-w-0 relative transition-colors hover:bg-muted/40"
            >
              <Link
                href={serviceHref(service)}
                className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`Open ${service.name}`}
              >
                <span className="sr-only">Open</span>
              </Link>

              <div className="relative z-10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base min-w-0 truncate">
                    {service.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ServiceCardBody service={service} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button asChild size="sm" className="relative z-20">
                      <Link href={serviceHref(service)}>Open</Link>
                    </Button>
                    <Can action={ACTIONS.SERVICE_MUTATE}>
                      <div className="relative z-20">
                        <DeleteServiceButton
                          tenant={tenant}
                          service={service}
                          onDeleted={onDeleted}
                        />
                      </div>
                    </Can>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
