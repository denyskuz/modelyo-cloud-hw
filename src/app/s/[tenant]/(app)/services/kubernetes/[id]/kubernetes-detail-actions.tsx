"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ACTIONS } from "@/auth/permissions";
import { can } from "@/auth/ability";
import { useRole } from "@/auth/role-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActionDialog } from "@/components/services/actions/action-dialog";
import { useServiceActions } from "@/components/services/actions/use-service-actions";
import type { TenantSlug } from "@/lib/tenant";
import type { KubernetesCluster } from "@/domain/kubernetes/types";
import { InstanceType } from "@/domain/kubernetes/types";
import { RotateCw, PlusCircle, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

const HEADER_ACTIONS_ID = "detail-header-actions";

function ReadOnlyHint() {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <Eye className="size-4" />
      Read-only mode
    </p>
  );
}

const INSTANCE_TYPES = [
  InstanceType.Standard2vCPU8GB,
  InstanceType.Performance4vCPU16GB,
  InstanceType.HighMem8vCPU32GB,
];

export function KubernetesDetailActions({
  tenant,
  cluster,
  renderOverview,
  onUpdated,
}: {
  tenant: TenantSlug;
  cluster: KubernetesCluster;
  renderOverview?: (actions: {
    openScale: (pool: KubernetesCluster["nodePools"][number]) => void;
    openCordon: (pool: KubernetesCluster["nodePools"][number]) => void;
    canMutate: boolean;
  }) => React.ReactNode;
  onUpdated?: (next: KubernetesCluster) => void;
}) {
  const { runWithErrorHandling, runDelete } =
    useServiceActions<KubernetesCluster>(tenant, "kubernetes", cluster.id);
  const [restartOpen, setRestartOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addPoolOpen, setAddPoolOpen] = useState(false);
  const [scalePoolOpen, setScalePoolOpen] = useState(false);
  const [cordonOpen, setCordonOpen] = useState(false);
  const [poolToScale, setPoolToScale] = useState<
    KubernetesCluster["nodePools"][number] | null
  >(null);
  const [poolToCordon, setPoolToCordon] = useState<
    KubernetesCluster["nodePools"][number] | null
  >(null);

  const [addPoolName, setAddPoolName] = useState("");
  const [addPoolInstanceType, setAddPoolInstanceType] = useState(
    InstanceType.Standard2vCPU8GB
  );
  const [addPoolDesired, setAddPoolDesired] = useState(1);
  const [scaleDesired, setScaleDesired] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const openScale = (pool: KubernetesCluster["nodePools"][number]) => {
    setPoolToScale(pool);
    setScaleDesired(pool.desiredNodes);
    setScalePoolOpen(true);
  };

  const openCordon = (pool: KubernetesCluster["nodePools"][number]) => {
    setPoolToCordon(pool);
    setCordonOpen(true);
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("restartCluster");
      onUpdated?.(updated);
      setRestartOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPool = async () => {
    const name = addPoolName.trim() || "new-pool";
    const desired = Math.max(1, Math.floor(addPoolDesired));
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("addNodePool", {
        name,
        instanceType: addPoolInstanceType,
        desiredNodes: desired,
      });
      onUpdated?.(updated);
      toast.success("Node pool added");
      setAddPoolOpen(false);
      setAddPoolName("");
      setAddPoolDesired(1);
    } finally {
      setLoading(false);
    }
  };

  const handleScalePool = async () => {
    if (!poolToScale) return;
    const desired = Math.max(1, Math.floor(scaleDesired));
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("scalePool", {
        poolId: poolToScale.id,
        desiredNodes: desired,
      });
      onUpdated?.(updated);
      toast.success("Pool scaled");
      setScalePoolOpen(false);
      setPoolToScale(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCordon = async () => {
    if (!poolToCordon) return;
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("toggleCordon", {
        poolId: poolToCordon.id,
      });
      onUpdated?.(updated);
      toast.success(
        poolToCordon.cordoned ? "Pool uncordoned" : "Pool cordoned"
      );
      setCordonOpen(false);
      setPoolToCordon(null);
    } finally {
      setLoading(false);
    }
  };

  const role = useRole();
  const canMutate = role != null && can(role, ACTIONS.SERVICE_MUTATE);
  const headerTarget =
    mounted && typeof document !== "undefined"
      ? document.getElementById(HEADER_ACTIONS_ID)
      : null;

  const quickActionsToolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="default" size="sm" onClick={() => setRestartOpen(true)}>
        <RotateCw className="mr-1.5 size-4" />
        Restart cluster
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setAddPoolOpen(true)}
      >
        <PlusCircle className="mr-1.5 size-4" />
        Add node pool
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="mr-1.5 size-4" />
        Delete cluster
      </Button>
    </div>
  );

  return (
    <>
      {headerTarget &&
        createPortal(
          canMutate ? quickActionsToolbar : <ReadOnlyHint />,
          headerTarget
        )}
      {renderOverview?.({
        openScale,
        openCordon,
        canMutate: canMutate ?? false,
      })}

      <ActionDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        title="Restart cluster"
        description="This will restart the control plane and may cause brief disruption. Continue?"
        confirmLabel="Restart"
        variant="destructive"
        onConfirm={handleRestart}
      />
      <ActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete cluster"
        description="This will permanently remove the cluster and all its resources. This action cannot be undone. Continue?"
        confirmLabel="Delete cluster"
        variant="destructive"
        onConfirm={async () => {
          await runDelete();
          setDeleteOpen(false);
        }}
      />

      <Dialog open={addPoolOpen} onOpenChange={setAddPoolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add node pool</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Pool name</label>
              <Input
                value={addPoolName}
                onChange={(e) => setAddPoolName(e.target.value)}
                placeholder="my-pool"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Instance type</label>
              <Select
                value={addPoolInstanceType}
                onValueChange={(v) =>
                  setAddPoolInstanceType(v as typeof addPoolInstanceType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Node count (min 1)</label>
              <Input
                type="number"
                min={1}
                value={addPoolDesired}
                onChange={(e) => setAddPoolDesired(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPoolOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPool} disabled={loading}>
              {loading ? "Adding…" : "Add pool"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scalePoolOpen}
        onOpenChange={(o) => !o && setPoolToScale(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scale pool</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {poolToScale && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Desired nodes for {poolToScale.name || poolToScale.id} (min 1)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={scaleDesired}
                  onChange={(e) => setScaleDesired(Number(e.target.value) || 1)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScalePoolOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScalePool} disabled={loading}>
              {loading ? "Scaling…" : "Scale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionDialog
        open={cordonOpen}
        onOpenChange={(o) => {
          if (!o) setPoolToCordon(null);
          setCordonOpen(o);
        }}
        title={poolToCordon?.cordoned ? "Uncordon pool" : "Cordon pool"}
        description={
          poolToCordon?.cordoned
            ? "Allow new workloads to be scheduled on this pool again?"
            : "Cordoning will prevent new workloads from being scheduled on this pool. Existing workloads keep running."
        }
        confirmLabel={poolToCordon?.cordoned ? "Uncordon" : "Cordon"}
        onConfirm={handleCordon}
      />
    </>
  );
}
