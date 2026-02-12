"use client";

import { useCallback, useMemo, useState } from "react";
import {
  SummaryCards,
  computeDashboardSummary,
  filterServicesBySeverity,
  severityCounts,
  type SeverityFilter,
} from "@/components/dashboard/summary-cards";
import { HealthOverviewCard } from "@/components/dashboard/health-overview";
import { SpendByTypeDonut } from "@/components/dashboard/spend-by-type-donut";
import { ActivityAndAuditCard } from "@/components/dashboard/activity-and-audit-card";
import { ServicesCards } from "@/components/dashboard/services-cards";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Service } from "@/domain/service/service";
import type { ServiceType } from "@/domain/service/service";
import type { AuditEntry } from "@/domain/common/types";
import type { TenantSlug } from "@/lib/tenant";

export function DashboardContent({
  services,
  auditLog,
  tenant,
}: {
  services: Service[];
  auditLog: AuditEntry[];
  tenant: TenantSlug;
}) {
  const [servicesState, setServicesState] = useState<Service[]>(services);
  const [typeFilter, setTypeFilter] = useState<"all" | ServiceType>("all");
  const [healthFilter, setHealthFilter] = useState<SeverityFilter>("all");

  const summary = computeDashboardSummary(servicesState);
  const counts = severityCounts(servicesState);

  const filteredServices = useMemo(() => {
    let out = servicesState;
    if (typeFilter !== "all") out = out.filter((s) => s.type === typeFilter);
    return filterServicesBySeverity(out, healthFilter);
  }, [healthFilter, servicesState, typeFilter]);

  const handleClickWarnings = useCallback(() => {
    document
      .getElementById("services-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleClickHealth = useCallback(() => {
    document
      .getElementById("services-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleDeleted = useCallback((serviceId: string) => {
    setServicesState((prev) => prev.filter((s) => s.id !== serviceId));
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCards
            summary={summary}
            onClickWarnings={handleClickWarnings}
          />
          <HealthOverviewCard counts={counts} onClick={handleClickHealth} />
          <SpendByTypeDonut services={servicesState} />
        </div>
        <section id="services-section" className="flex min-w-0 flex-col gap-4">
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground">
                  Services
                </h2>
                <p className="text-xs text-muted-foreground">
                  Filter by service type and health.
                </p>
              </div>

              <Tabs
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as "all" | ServiceType)}
              >
                <div className="min-w-0 overflow-x-auto overflow-y-hidden -mx-1 px-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <TabsList className="inline-flex w-max min-w-full h-9 flex-nowrap sm:min-w-0 sm:w-auto">
                    <TabsTrigger
                      value="all"
                      className="shrink-0 px-2.5 text-xs sm:px-2 sm:text-sm"
                    >
                      <span className="sm:inline">All</span>
                      <span className="tabular-nums">
                        {" "}
                        ({summary.totalServices})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="kubernetes"
                      className="shrink-0 px-2.5 text-xs sm:px-2 sm:text-sm"
                    >
                      <span className="sm:hidden">K8s</span>
                      <span className="hidden sm:inline">Kubernetes</span>
                      <span className="tabular-nums">
                        {" "}
                        ({summary.kubernetesCount})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="gateway"
                      className="shrink-0 px-2.5 text-xs sm:px-2 sm:text-sm"
                    >
                      <span className="hidden sm:inline">API Gateways</span>
                      <span className="sm:hidden">Gateways</span>
                      <span className="tabular-nums">
                        {" "}
                        ({summary.gatewayCount})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="postgres"
                      className="shrink-0 px-2.5 text-xs sm:px-2 sm:text-sm"
                    >
                      <span className="hidden sm:inline">PostgreSQL</span>
                      <span className="sm:hidden">PG</span>
                      <span className="tabular-nums">
                        {" "}
                        ({summary.postgresCount})
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-muted-foreground shrink-0 text-xs">
                Health:
              </span>
              <div className="min-w-0 overflow-x-auto overflow-y-hidden -mx-1 px-1 sm:mx-0 sm:px-0">
                <div className="inline-flex w-max min-w-full sm:min-w-0 flex-nowrap rounded-md border border-input bg-muted/30 sm:w-auto">
                  {(
                    [
                      {
                        value: "all" as const,
                        label: "All",
                        count: servicesState.length,
                        dot: "bg-muted-foreground",
                      },
                      {
                        value: "healthy" as const,
                        label: "Healthy",
                        count: counts.healthy,
                        dot: "bg-emerald-500",
                      },
                      {
                        value: "attention" as const,
                        label: "Attention",
                        count: counts.attention,
                        dot: "bg-amber-500",
                      },
                      {
                        value: "failed" as const,
                        label: "Failed",
                        count: counts.failed,
                        dot: "bg-destructive",
                      },
                    ] as const
                  ).map(({ value, label, count, dot }, i) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setHealthFilter(value)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md sm:px-3",
                        healthFilter === value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                        i > 0 ? "border-l border-input" : ""
                      )}
                    >
                      <span
                        className={cn("size-1.5 shrink-0 rounded-full", dot)}
                        aria-hidden
                      />
                      {label} ({count})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ServicesCards
            services={filteredServices}
            tenant={tenant}
            onDeleted={handleDeleted}
          />
        </section>
        <div className="xl:hidden order-last">
          <ActivityAndAuditCard services={servicesState} auditLog={auditLog} />
        </div>
      </div>
      <aside className="hidden xl:block">
        <div className="sticky top-4">
          <ActivityAndAuditCard services={servicesState} auditLog={auditLog} />
        </div>
      </aside>
    </div>
  );
}
