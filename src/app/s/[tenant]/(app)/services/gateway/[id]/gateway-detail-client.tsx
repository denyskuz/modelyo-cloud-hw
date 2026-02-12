"use client";

import { useState } from "react";
import type { TenantSlug } from "@/lib/tenant";
import type { ApiGateway, ForwardingRule } from "@/domain/gateway/types";
import { rulesSummary } from "@/domain/gateway/helpers";
import { DetailLayout } from "@/components/services/detail-layout";
import { StatusBadge } from "@/components/services/status-badge";
import { StatusTimeline } from "@/components/services/status-timeline";
import { GatewayDetailActions } from "./gateway-detail-actions";
import { GatewayDetailOverview } from "./gateway-detail-overview";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";

export function GatewayDetailClient({
  tenant,
  initialGateway,
}: {
  tenant: TenantSlug;
  initialGateway: ApiGateway;
}) {
  const [gateway, setGateway] = useState<ApiGateway>(initialGateway);
  const summary = rulesSummary(gateway);

  const overview = (
    <GatewayDetailActions
      tenant={tenant}
      gateway={gateway}
      onUpdated={setGateway}
      renderOverview={({ openEdit, openToggle, canMutate }) => (
        <GatewayDetailOverview
          gateway={gateway}
          summary={summary}
          canMutate={canMutate}
          renderRuleActions={(rule: ForwardingRule) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal
                    className="size-4"
                    aria-label="Rule actions"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(rule)}>
                  <Pencil className="mr-2 size-4" />
                  Edit rule
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openToggle(rule)}
                  className={
                    rule.status === "enabled" ? "text-destructive" : undefined
                  }
                >
                  {rule.status === "enabled" ? (
                    <PowerOff className="mr-2 size-4" />
                  ) : (
                    <Power className="mr-2 size-4" />
                  )}
                  {rule.status === "enabled" ? "Disable" : "Enable"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      )}
    />
  );

  const activity = <StatusTimeline items={gateway.statusHistory} />;
  const badges = <StatusBadge status={gateway.status} />;

  return (
    <DetailLayout
      title={gateway.name}
      badges={badges}
      overview={overview}
      activity={activity}
    />
  );
}
