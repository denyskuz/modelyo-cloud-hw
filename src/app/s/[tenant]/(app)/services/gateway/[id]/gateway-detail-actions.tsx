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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionDialog } from "@/components/services/actions/action-dialog";
import { useServiceActions } from "@/components/services/actions/use-service-actions";
import { isValidGatewayPort } from "@/lib/validation";
import type { TenantSlug } from "@/lib/tenant";
import type {
  ApiGateway,
  ForwardingRule,
  RuleProtocol,
} from "@/domain/gateway/types";
import {
  Power,
  PowerOff,
  ShieldAlert,
  PlusCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const PROTOCOLS: RuleProtocol[] = ["http", "https", "tcp"];
const HEADER_ACTIONS_ID = "detail-header-actions";

function ReadOnlyHint() {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <Eye className="size-4" />
      Read-only mode
    </p>
  );
}

export function GatewayDetailActions({
  tenant,
  gateway,
  renderOverview,
  onUpdated,
}: {
  tenant: TenantSlug;
  gateway: ApiGateway;
  renderOverview?: (actions: {
    openEdit: (rule: ForwardingRule) => void;
    openToggle: (rule: ForwardingRule) => void;
    canMutate: boolean;
  }) => React.ReactNode;
  onUpdated?: (next: ApiGateway) => void;
}) {
  const { runWithErrorHandling, runDelete } = useServiceActions<ApiGateway>(
    tenant,
    "gateway",
    gateway.id
  );
  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tlsOpen, setTlsOpen] = useState(false);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [editRuleOpen, setEditRuleOpen] = useState(false);
  const [toggleRuleOpen, setToggleRuleOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<ForwardingRule | null>(null);
  const [ruleToToggle, setRuleToToggle] = useState<ForwardingRule | null>(null);

  const [addName, setAddName] = useState("");
  const [addProtocol, setAddProtocol] = useState<RuleProtocol>("https");
  const [addPort, setAddPort] = useState(443);
  const [addTarget, setAddTarget] = useState("");
  const [addPath, setAddPath] = useState("/api/v1");
  const [addTlsEnabled, setAddTlsEnabled] = useState(true);
  const [editName, setEditName] = useState("");
  const [editProtocol, setEditProtocol] = useState<RuleProtocol>("https");
  const [editPort, setEditPort] = useState(443);
  const [editTarget, setEditTarget] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editTlsEnabled, setEditTlsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const openEdit = (rule: ForwardingRule) => {
    setRuleToEdit(rule);
    setEditName(rule.name || "");
    setEditProtocol(rule.protocol);
    setEditPort(rule.externalPort ?? 443);
    setEditTarget(rule.targetUrl ?? "");
    setEditPath(rule.path ?? "");
    setEditTlsEnabled(rule.tlsEnabled ?? rule.protocol === "https");
    setEditRuleOpen(true);
  };

  const openToggle = (rule: ForwardingRule) => {
    setRuleToToggle(rule);
    setToggleRuleOpen(true);
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("activateGateway");
      onUpdated?.(updated);
      setActivateOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("deactivateGateway");
      onUpdated?.(updated);
      setDeactivateOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateTls = async () => {
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("regenerateTls");
      onUpdated?.(updated);
      setTlsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    const port = Number(addPort);
    if (!isValidGatewayPort(port)) {
      toast.error("Port must be between 1 and 65535");
      return;
    }
    const target = addTarget.trim();
    if (!/^[^:]+:\d+$/.test(target)) {
      toast.error("Target must be host:port (e.g. backend:8080)");
      return;
    }
    const path = addPath.trim();
    if (!path) {
      toast.error("Path prefix is required (e.g. /api/v1)");
      return;
    }
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("addRule", {
        name: addName.trim() || "New rule",
        protocol: addProtocol,
        externalPort: port,
        targetUrl: target,
        path,
        tlsEnabled: addTlsEnabled,
      });
      onUpdated?.(updated);
      toast.success("Rule added");
      setAddRuleOpen(false);
      setAddName("");
      setAddProtocol("https");
      setAddPort(443);
      setAddTarget("");
      setAddPath("/api/v1");
      setAddTlsEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRule = async () => {
    if (!ruleToEdit) return;
    const port = Number(editPort);
    if (!isValidGatewayPort(port)) {
      toast.error("Port must be between 1 and 65535");
      return;
    }
    const target = editTarget.trim();
    if (!/^[^:]+:\d+$/.test(target)) {
      toast.error("Target must be host:port (e.g. backend:8080)");
      return;
    }
    const path = editPath.trim();
    if (!path) {
      toast.error("Path prefix is required (e.g. /api/v1)");
      return;
    }
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("editRule", {
        ruleId: ruleToEdit.id,
        name: editName.trim() || ruleToEdit.name,
        protocol: editProtocol,
        externalPort: port,
        targetUrl: target,
        path,
        tlsEnabled: editTlsEnabled,
      });
      onUpdated?.(updated);
      toast.success("Rule updated");
      setEditRuleOpen(false);
      setRuleToEdit(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async () => {
    if (!ruleToToggle) return;
    setLoading(true);
    try {
      const updated = await runWithErrorHandling("toggleRule", {
        ruleId: ruleToToggle.id,
      });
      onUpdated?.(updated);
      toast.success(
        ruleToToggle.status === "enabled" ? "Rule disabled" : "Rule enabled"
      );
      setToggleRuleOpen(false);
      setRuleToToggle(null);
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
      {gateway.status === "active" ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeactivateOpen(true)}
        >
          <PowerOff className="mr-1.5 size-4" />
          Deactivate gateway
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={() => setActivateOpen(true)}
        >
          <Power className="mr-1.5 size-4" />
          Activate gateway
        </Button>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setAddRuleOpen(true)}
      >
        <PlusCircle className="mr-1.5 size-4" />
        Add rule
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setTlsOpen(true)}>
        <ShieldAlert className="mr-1.5 size-4" />
        Regenerate TLS
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="mr-1.5 size-4" />
        Delete gateway
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
        openEdit,
        openToggle,
        canMutate: canMutate ?? false,
      })}

      <ActionDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate gateway"
        description="Enable traffic through this gateway. Continue?"
        confirmLabel="Activate"
        onConfirm={handleActivate}
      />
      <ActionDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate gateway"
        description="Traffic will stop being routed. Continue?"
        confirmLabel="Deactivate"
        variant="destructive"
        onConfirm={handleDeactivate}
      />
      <ActionDialog
        open={tlsOpen}
        onOpenChange={setTlsOpen}
        title="Regenerate TLS certificate"
        description="A new certificate will be issued. Existing connections may need to reconnect. Continue?"
        confirmLabel="Regenerate"
        onConfirm={handleRegenerateTls}
      />
      <ActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete gateway"
        description="This will permanently remove the gateway and all its rules. This action cannot be undone. Continue?"
        confirmLabel="Delete gateway"
        variant="destructive"
        onConfirm={async () => {
          await runDelete();
          setDeleteOpen(false);
        }}
      />

      <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Rule name</label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="my-rule"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Protocol</label>
              <Select
                value={addProtocol}
                onValueChange={(v) => {
                  const next = v as RuleProtocol;
                  setAddProtocol(next);
                  if (next !== "https") setAddTlsEnabled(false);
                  else setAddTlsEnabled(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROTOCOLS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                External port (1–65535)
              </label>
              <Input
                type="number"
                min={1}
                max={65535}
                value={addPort}
                onChange={(e) => setAddPort(Number(e.target.value) || 443)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Target (host:port)</label>
              <Input
                value={addTarget}
                onChange={(e) => setAddTarget(e.target.value)}
                placeholder="backend:8080"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Path prefix</label>
              <Input
                value={addPath}
                onChange={(e) => setAddPath(e.target.value)}
                placeholder="/api/v1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">TLS termination</label>
              <input
                type="checkbox"
                checked={addTlsEnabled}
                disabled={addProtocol !== "https"}
                onChange={(e) => setAddTlsEnabled(e.target.checked)}
              />
              {addProtocol !== "https" && (
                <span className="text-muted-foreground text-xs">
                  TLS is only applicable for HTTPS rules
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRule} disabled={loading}>
              {loading ? "Adding…" : "Add rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editRuleOpen}
        onOpenChange={(o) => !o && setRuleToEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {ruleToEdit && (
              <>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Rule name</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Protocol</label>
                  <Select
                    value={editProtocol}
                    onValueChange={(v) => {
                      const next = v as RuleProtocol;
                      setEditProtocol(next);
                      if (next !== "https") setEditTlsEnabled(false);
                      else setEditTlsEnabled(true);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTOCOLS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    External port (1–65535)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    value={editPort}
                    onChange={(e) => setEditPort(Number(e.target.value) || 443)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Target (host:port)
                  </label>
                  <Input
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    placeholder="backend:8080"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Path prefix</label>
                  <Input
                    value={editPath}
                    onChange={(e) => setEditPath(e.target.value)}
                    placeholder="/api/v1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">TLS termination</label>
                  <input
                    type="checkbox"
                    checked={editTlsEnabled}
                    disabled={editProtocol !== "https"}
                    onChange={(e) => setEditTlsEnabled(e.target.checked)}
                  />
                  {editProtocol !== "https" && (
                    <span className="text-muted-foreground text-xs">
                      TLS is only applicable for HTTPS rules
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRule} disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionDialog
        open={toggleRuleOpen}
        onOpenChange={(o) => {
          if (!o) setRuleToToggle(null);
          setToggleRuleOpen(o);
        }}
        title={
          ruleToToggle?.status === "enabled" ? "Disable rule" : "Enable rule"
        }
        description={
          ruleToToggle?.status === "enabled"
            ? "Traffic will no longer match this rule. Continue?"
            : "Traffic will start matching this rule. Continue?"
        }
        confirmLabel={ruleToToggle?.status === "enabled" ? "Disable" : "Enable"}
        variant={ruleToToggle?.status === "enabled" ? "destructive" : "default"}
        onConfirm={handleToggleRule}
      />
    </>
  );
}
