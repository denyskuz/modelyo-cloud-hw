"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ACTIONS } from "@/auth/permissions";
import { can } from "@/auth/ability";
import { useRole } from "@/auth/role-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ActionDialog } from "@/components/services/actions/action-dialog";
import { useServiceActions } from "@/components/services/actions/use-service-actions";
import type { TenantSlug } from "@/lib/tenant";
import type { PostgresDb, DbTier } from "@/domain/postgres/types";
import { DbTier as DbTierConst } from "@/domain/postgres/types";
import {
  Play,
  Square,
  RotateCw,
  Database,
  Maximize2,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const TIERS: DbTier[] = [
  DbTierConst.Small2vCPU4GB,
  DbTierConst.Medium4vCPU8GB,
  DbTierConst.Large8vCPU16GB,
];
const HEADER_ACTIONS_ID = "detail-header-actions";

function ReadOnlyHint() {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <Eye className="size-4" />
      Read-only mode
    </p>
  );
}

export function PostgresDetailActions({
  tenant,
  db,
  onUpdated,
}: {
  tenant: TenantSlug;
  db: PostgresDb;
  onUpdated?: (next: PostgresDb) => void;
}) {
  const { runWithErrorHandling, runDelete } = useServiceActions<PostgresDb>(
    tenant,
    "postgres",
    db.id
  );
  const [stopOpen, setStopOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);
  const [resizeTier, setResizeTier] = useState<DbTier>(db.tier);
  const [resizeStorage, setResizeStorage] = useState(db.allocatedStorageGb);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleStop = async () => {
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("stopDb");
      onUpdated?.(updated);
      setStopOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("restartDb");
      onUpdated?.(updated);
      setRestartOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("createBackup");
      onUpdated?.(updated);
      toast.success("Backup created");
      setBackupOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResize = async () => {
    const storage = Math.max(10, Math.floor(resizeStorage));
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("resizeDb", {
        tier: resizeTier,
        allocatedStorageGb: storage,
      });
      onUpdated?.(updated);
      toast.success("Instance resized");
      setResizeOpen(false);
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

  const startOrRestartButton =
    db.status === "stopped" ? (
      <Button
        variant="default"
        size="sm"
        onClick={async () => {
          setLoading(true);
          try {
            const updated = await runWithErrorHandling("startDb");
            onUpdated?.(updated);
            toast.success("Database started");
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        <Play className="mr-1.5 size-4" />
        {loading ? "Starting…" : "Start"}
      </Button>
    ) : (
      <Button variant="default" size="sm" onClick={() => setRestartOpen(true)}>
        <RotateCw className="mr-1.5 size-4" />
        Restart
      </Button>
    );

  const quickActionsToolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {startOrRestartButton}
      {db.status === "available" && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setStopOpen(true)}
        >
          <Square className="mr-1.5 size-4" />
          Stop
        </Button>
      )}
      <Button variant="secondary" size="sm" onClick={() => setBackupOpen(true)}>
        <Database className="mr-1.5 size-4" />
        Backup
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setResizeOpen(true)}>
        <Maximize2 className="mr-1.5 size-4" />
        Resize
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="mr-1.5 size-4" />
        Delete database
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

      <ActionDialog
        open={stopOpen}
        onOpenChange={setStopOpen}
        title="Stop database"
        description="The database will become unavailable. All connections will be closed. Continue?"
        confirmLabel="Stop"
        variant="destructive"
        onConfirm={handleStop}
      />
      <ActionDialog
        open={restartOpen}
        onOpenChange={setRestartOpen}
        title="Restart database"
        description="Brief downtime is expected. Continue?"
        confirmLabel="Restart"
        variant="destructive"
        onConfirm={handleRestart}
      />
      <ActionDialog
        open={backupOpen}
        onOpenChange={setBackupOpen}
        title="Create manual backup"
        description="A full backup will be created. This may take a few minutes. Continue?"
        confirmLabel="Create backup"
        onConfirm={handleBackup}
      />
      <ActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete database"
        description="This will permanently remove the database and all its data. This action cannot be undone. Continue?"
        confirmLabel="Delete database"
        variant="destructive"
        onConfirm={async () => {
          await runDelete();
          setDeleteOpen(false);
        }}
      />

      <Dialog open={resizeOpen} onOpenChange={setResizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resize instance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tier</label>
              <Select
                value={resizeTier}
                onValueChange={(v) => setResizeTier(v as DbTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Storage (GB, min 10)
              </label>
              <Input
                type="number"
                min={10}
                value={resizeStorage}
                onChange={(e) => setResizeStorage(Number(e.target.value) || 10)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResizeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResize} disabled={loading}>
              {loading ? "Resizing…" : "Resize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
