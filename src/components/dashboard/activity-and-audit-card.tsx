"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { tenantHref } from "@/lib/tenant-routing";
import { useIsClient } from "@/hooks/use-is-client";
import type { Service } from "@/domain/service/service";
import type { ServiceType } from "@/domain/service/service";
import type { StatusHistoryItem, AuditEntry } from "@/domain/common/types";

const ACTIVITY_LIMIT = 15;
const AUDIT_LIMIT = 20;
const MAX_HEIGHT = "min(400px, 60vh)";

type ActivityItem = StatusHistoryItem & {
  serviceName: string;
  serviceType: ServiceType;
  serviceId: string;
};

function formatDateStable(iso: string): string {
  const date = new Date(iso);
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

const typeLabel: Record<ServiceType, string> = {
  kubernetes: "K8s",
  gateway: "Gateway",
  postgres: "Postgres",
};

const auditTypeLabel: Record<AuditEntry["entityType"], string> = {
  kubernetes: "K8s",
  gateway: "Gateway",
  postgres: "Postgres",
};

/** Human-readable action label for audit entries. */
function actionLabel(action: string): string {
  const map: Record<string, string> = {
    provision: "Provision",
    delete: "Delete",
    restart: "Restart",
    start: "Start",
    stop: "Stop",
    scale: "Scale",
    add_rule: "Add rule",
    edit_rule: "Edit rule",
    enable: "Enable",
    disable: "Disable",
    regenerate_tls: "Regenerate TLS",
    view: "View",
  };
  return map[action] ?? action;
}

export function ActivityAndAuditCard({
  services,
  auditLog,
}: {
  services: Service[];
  auditLog: AuditEntry[];
}) {
  const isClient = useIsClient();

  const activityItems: ActivityItem[] = [];
  for (const s of services) {
    for (const h of s.statusHistory ?? []) {
      activityItems.push({
        ...h,
        serviceName: s.name,
        serviceType: s.type,
        serviceId: s.id,
      });
    }
  }
  activityItems.sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0));
  const recentActivity = activityItems.slice(0, ACTIVITY_LIMIT);
  const recentAudit = auditLog.slice(0, AUDIT_LIMIT);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Activity &amp; Audit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="mt-3">
            <ul
              className="space-y-2 overflow-y-auto pr-1"
              style={{ maxHeight: MAX_HEIGHT }}
            >
              {recentActivity.length === 0 ? (
                <li className="text-muted-foreground text-sm">
                  No recent activity
                </li>
              ) : (
                recentActivity.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={tenantHref(
                        `/services/${item.serviceType}/${item.serviceId}`
                      )}
                      className="hover:bg-muted/50 flex flex-col gap-0.5 rounded-md p-2 text-sm transition-colors -mx-2"
                    >
                      <span className="text-muted-foreground text-xs">
                        {isClient
                          ? timeAgo(item.at)
                          : formatDateStable(item.at)}
                      </span>
                      <span className="text-foreground">{item.message}</span>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {typeLabel[item.serviceType]} · {item.serviceName}
                      </Badge>
                      <span className="text-primary text-xs font-medium">
                        View
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </TabsContent>
          <TabsContent value="audit" className="mt-3">
            <ul
              className="space-y-2 overflow-y-auto pr-1"
              style={{ maxHeight: MAX_HEIGHT }}
            >
              {recentAudit.length === 0 ? (
                <li className="text-muted-foreground text-sm">
                  No audit entries
                </li>
              ) : (
                recentAudit.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-0.5 rounded-md p-2 -mx-2"
                  >
                    <span className="text-muted-foreground text-xs">
                      {isClient
                        ? timeAgo(entry.at)
                        : formatDateStable(entry.at)}
                    </span>
                    <span className="text-foreground text-sm">
                      {entry.message}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="w-fit text-xs">
                        {auditTypeLabel[entry.entityType]} · {entry.entityName}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {entry.actorRole} · {actionLabel(entry.action)}
                      </span>
                    </div>
                    {entry.action !== "delete" && (
                      <Link
                        href={tenantHref(
                          `/services/${entry.entityType}/${entry.entityId}`
                        )}
                        className="text-primary text-xs font-medium hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </li>
                ))
              )}
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
