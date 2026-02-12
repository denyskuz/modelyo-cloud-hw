"use client";

import { useState } from "react";
import type { TenantSlug } from "@/lib/tenant";
import type { KubernetesCluster } from "@/domain/kubernetes/types";
import {
  totalDesiredNodes,
  totalActualNodes,
  capacitySummary,
  healthIndicator,
} from "@/domain/kubernetes/helpers";
import { DetailLayout } from "@/components/services/detail-layout";
import { StatusBadge } from "@/components/services/status-badge";
import { StatusTimeline } from "@/components/services/status-timeline";
import { KubernetesDetailOverview } from "./kubernetes-detail-overview";
import { KubernetesDetailActions } from "./kubernetes-detail-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gauge, MinusCircle, MoreHorizontal } from "lucide-react";

export function KubernetesDetailClient({
  tenant,
  initialCluster,
}: {
  tenant: TenantSlug;
  initialCluster: KubernetesCluster;
}) {
  const [cluster, setCluster] = useState<KubernetesCluster>(initialCluster);

  const desired = totalDesiredNodes(cluster);
  const actual = totalActualNodes(cluster);
  const capacity = capacitySummary(cluster);
  const health = healthIndicator(cluster);

  const overview = (
    <KubernetesDetailActions
      tenant={tenant}
      cluster={cluster}
      onUpdated={setCluster}
      renderOverview={({ openScale, openCordon, canMutate }) => (
        <KubernetesDetailOverview
          cluster={cluster}
          desired={desired}
          actual={actual}
          capacity={capacity}
          health={health}
          canMutate={canMutate}
          renderPoolActions={(pool) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal
                    className="size-4"
                    aria-label="Pool actions"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openScale(pool)}>
                  <Gauge className="mr-2 size-4" />
                  Scale pool
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openCordon(pool)}>
                  <MinusCircle className="mr-2 size-4" />
                  {pool.cordoned ? "Uncordon" : "Cordon"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      )}
    />
  );

  const activity = <StatusTimeline items={cluster.statusHistory} />;

  const badges = (
    <>
      <StatusBadge status={cluster.status} />
      <StatusBadge status={health.level} />
    </>
  );

  return (
    <DetailLayout
      title={cluster.name}
      badges={badges}
      overview={overview}
      activity={activity}
    />
  );
}
