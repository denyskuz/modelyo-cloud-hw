"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/domain/common/cost";
import type { KubernetesCluster } from "@/domain/kubernetes/types";

function poolStatusSummary(
  pool: KubernetesCluster["nodePools"][number]
): string {
  const ready = pool.nodes.filter((n) => n.status === "ready").length;
  const notReady = pool.nodes.filter((n) => n.status === "not_ready").length;
  const pending = pool.nodes.filter((n) => n.status === "pending").length;
  const parts: string[] = [];
  if (ready) parts.push(`${ready} Ready`);
  if (notReady) parts.push(`${notReady} NotReady`);
  if (pending) parts.push(`${pending} Pending`);
  return parts.length ? parts.join(", ") : "—";
}

function nodeStatusColor(status: string): string {
  if (status === "ready") return "bg-emerald-500";
  if (status === "pending") return "bg-amber-500";
  if (status === "not_ready") return "bg-rose-500";
  return "bg-muted-foreground";
}

function nodeStatusLabel(status: string): string {
  if (status === "ready") return "Ready";
  if (status === "pending") return "Pending";
  if (status === "not_ready") return "NotReady";
  return status.replace(/_/g, " ");
}

export function KubernetesDetailOverview({
  cluster,
  desired,
  actual,
  capacity,
  health,
  renderPoolActions,
  canMutate,
}: {
  cluster: KubernetesCluster;
  desired: number;
  actual: number;
  capacity: { totalVcpu: number; totalRamGb: number };
  health: { ready: number; total: number; level: string };
  renderPoolActions?: (
    pool: KubernetesCluster["nodePools"][number]
  ) => React.ReactNode;
  canMutate?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cluster details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Region:</span>{" "}
            {cluster.region}
          </p>
          <p>
            <span className="text-muted-foreground">Kubernetes version:</span>{" "}
            {cluster.kubernetesVersion}
          </p>
          <p>
            <span className="text-muted-foreground">Worker nodes:</span>{" "}
            {actual} / {desired} desired
          </p>
          <p>
            <span className="text-muted-foreground">Health:</span>{" "}
            {health.ready} / {health.total} nodes Ready ({health.level})
          </p>
          <p>
            <span className="text-muted-foreground">Capacity:</span>{" "}
            {capacity.totalVcpu} vCPU, {capacity.totalRamGb} GB RAM
          </p>
          <p>
            <span className="text-muted-foreground">Monthly cost:</span>{" "}
            {formatMoney(cluster.monthlyCost)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Node pools</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool name</TableHead>
                <TableHead>Instance type</TableHead>
                <TableHead>Desired</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Nodes</TableHead>
                <TableHead>Pool status</TableHead>
                {canMutate && renderPoolActions ? (
                  <TableHead className="w-[100px]">Actions</TableHead>
                ) : (
                  <TableHead></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cluster.nodePools.map((pool) => (
                <TableRow key={pool.id}>
                  <TableCell>{pool.name || pool.id}</TableCell>
                  <TableCell>{pool.instanceType}</TableCell>
                  <TableCell>{pool.desiredNodes}</TableCell>
                  <TableCell>{pool.nodes.length}</TableCell>
                  <TableCell>
                    {pool.nodes.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {pool.nodes.slice(0, 12).map((n) => (
                          <span
                            key={n.id}
                            className={`inline-block size-2 rounded-full ${nodeStatusColor(n.status)}`}
                            title={`${n.id} · ${nodeStatusLabel(n.status)}`}
                            aria-label={nodeStatusLabel(n.status)}
                          />
                        ))}
                        {pool.nodes.length > 12 && (
                          <span className="text-muted-foreground text-xs">
                            +{pool.nodes.length - 12}
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{poolStatusSummary(pool)}</TableCell>
                  <TableCell>
                    {canMutate && renderPoolActions ? (
                      renderPoolActions(pool)
                    ) : pool.cordoned ? (
                      <Badge variant="secondary">Cordoned</Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
