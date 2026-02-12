"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sumMoney } from "@/domain/common/cost";
import type { Service } from "@/domain/service/service";
import type { KubernetesCluster } from "@/domain/kubernetes/types";
import type { ApiGateway } from "@/domain/gateway/types";
import type { PostgresDb } from "@/domain/postgres/types";
import { healthIndicator } from "@/domain/kubernetes/helpers";

export type ServiceSeverity = "failed" | "attention" | "healthy";

export function getServiceSeverity(service: Service): ServiceSeverity {
  if (service.type === "kubernetes") {
    const k8s = service as KubernetesCluster;
    if (k8s.status === "failed") return "failed";
    const health = healthIndicator(k8s);
    if (health.level === "red" || health.level === "amber") return "attention";
    if (k8s.status === "updating" || k8s.status === "creating")
      return "attention";
    return "healthy";
  }
  if (service.type === "gateway") {
    const gw = service as ApiGateway;
    if (gw.status === "failed") return "failed";
    if (gw.status !== "active") return "attention";
    return "healthy";
  }
  if (service.type === "postgres") {
    const db = service as PostgresDb;
    if (db.status === "failed") return "failed";
    if (db.status === "available") return "healthy";
    return "attention";
  }
  return "healthy";
}

export type SeverityFilter = "all" | "healthy" | "attention" | "failed";

export function filterServicesBySeverity(
  services: Service[],
  filter: SeverityFilter
): Service[] {
  if (filter === "all") return services;
  return services.filter((s) => getServiceSeverity(s) === filter);
}

export function severityCounts(services: Service[]) {
  let failed = 0;
  let attention = 0;
  let healthy = 0;
  for (const s of services) {
    const sev = getServiceSeverity(s);
    if (sev === "failed") failed += 1;
    else if (sev === "attention") attention += 1;
    else healthy += 1;
  }
  return { failed, attention, healthy };
}

export type DashboardSummary = {
  totalServices: number;
  kubernetesCount: number;
  gatewayCount: number;
  postgresCount: number;
  totalMonthlySpend: { amount: number; currency: "USD" };
  warningsErrorsCount: number;
  healthLevel: "green" | "amber" | "red";
};

export function computeDashboardSummary(services: Service[]): DashboardSummary {
  const kubernetesCount = services.filter(
    (s) => s.type === "kubernetes"
  ).length;
  const gatewayCount = services.filter((s) => s.type === "gateway").length;
  const postgresCount = services.filter((s) => s.type === "postgres").length;
  const totalMonthlySpend = sumMoney(services.map((s) => s.monthlyCost));

  const counts = severityCounts(services);
  const warningsErrorsCount = counts.failed + counts.attention;
  const healthLevel: "green" | "amber" | "red" =
    counts.failed > 0 ? "red" : counts.attention > 0 ? "amber" : "green";

  return {
    totalServices: services.length,
    kubernetesCount,
    gatewayCount,
    postgresCount,
    totalMonthlySpend,
    warningsErrorsCount,
    healthLevel,
  };
}

export function SummaryCards({
  summary,
  onClickWarnings,
}: {
  summary: DashboardSummary;
  onClickWarnings?: () => void;
}) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Active services
          </CardTitle>
          <Badge variant="secondary" className="font-semibold tabular-nums">
            {summary.totalServices}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-3xl font-bold tabular-nums">
            {summary.totalServices.toLocaleString()}
          </div>
          <p className="text-sm text-foreground">
            K8s: {summary.kubernetesCount} · Gateway: {summary.gatewayCount} ·
            Postgres: {summary.postgresCount}
          </p>
          <p className="text-muted-foreground text-xs">By service type</p>
        </CardContent>
      </Card>
      <Card
        className={
          onClickWarnings
            ? "cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted"
            : undefined
        }
        onClick={onClickWarnings}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Warnings / errors
          </CardTitle>
          <Badge
            variant={
              summary.warningsErrorsCount > 0 ? "destructive" : "secondary"
            }
            className="font-semibold tabular-nums"
          >
            {summary.warningsErrorsCount}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-3xl font-bold tabular-nums">
            {summary.warningsErrorsCount.toLocaleString()}
          </div>
          <p className="text-muted-foreground text-xs">
            {summary.warningsErrorsCount > 0
              ? "Review and resolve issues"
              : "No issues reported"}
          </p>
        </CardContent>
      </Card>
    </>
  );
}
