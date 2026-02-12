import type { TenantSlug } from "@/lib/tenant";
import type { Service, ServiceType } from "@/domain/service/service";
import { DB } from "@/mocks/db";
import type {
  KubernetesCluster,
  NodePool,
  InstanceType,
} from "@/domain/kubernetes/types";
import type {
  ApiGateway,
  ForwardingRule,
  RuleProtocol,
} from "@/domain/gateway/types";
import type { PostgresDb, DbTier } from "@/domain/postgres/types";
import type { StatusHistoryItem, AuditEntry } from "@/domain/common/types";
import type {
  ProvisionPayload,
  ProvisionKubernetesPayload,
  ProvisionGatewayPayload,
  ProvisionPostgresPayload,
} from "@/domain/provisioning/types";
import { estimateMonthlyCost } from "@/domain/provisioning/cost-estimate";
import { validateProvisionPayload } from "@/domain/provisioning/schema";

const delayMs = (): number => 300 + Math.floor(Math.random() * (900 - 300 + 1));

function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, delayMs()));
}

export function findServiceOrThrow(
  tenant: TenantSlug,
  id: string,
  type: ServiceType
): Service {
  const db = DB[tenant];
  const service = db.services.find((s) => s.id === id && s.type === type);
  if (!service) {
    throw new Error(`Service not found: ${type}/${id}`);
  }
  return service;
}

export async function listAll(
  tenant: TenantSlug
): Promise<{ services: Service[] }> {
  await delay();
  const db = DB[tenant];
  return { services: [...db.services] };
}

export async function getOne(
  tenant: TenantSlug,
  type: Service["type"],
  id: string
): Promise<Service | null> {
  await delay();
  const db = DB[tenant];
  const service = db.services.find((s) => s.id === id && s.type === type);
  return service ?? null;
}

function appendAudit(
  tenant: TenantSlug,
  action: string,
  entityType: ServiceType,
  entityId: string,
  entityName: string,
  message: string,
  actorRole: "Admin" | "Viewer" | "system" = "Admin"
): void {
  const db = DB[tenant];
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actorRole,
    tenant,
    action,
    entityType,
    entityId,
    entityName,
    message,
  };
  db.auditLog.push(entry);
}

export async function mutate(
  tenant: TenantSlug,
  type: Service["type"],
  id: string,
  action: string,
  payload?: unknown
): Promise<Service> {
  await delay();
  const db = DB[tenant];
  const index = db.services.findIndex((s) => s.id === id && s.type === type);
  if (index === -1) {
    throw new Error(`Service not found: ${type}/${id}`);
  }
  const current = db.services[index];
  const updated = applyMutate(current, action, payload);
  db.services[index] = updated;
  const lastMessage =
    updated.statusHistory[updated.statusHistory.length - 1]?.message ?? action;
  appendAudit(tenant, action, type, id, current.name, lastMessage);
  return updated;
}

export async function deleteService(
  tenant: TenantSlug,
  type: Service["type"],
  id: string
): Promise<void> {
  await delay();
  const db = DB[tenant];
  const index = db.services.findIndex((s) => s.id === id && s.type === type);
  if (index === -1) {
    throw new Error(`Service not found: ${type}/${id}`);
  }
  const service = db.services[index];
  const actionLabel =
    type === "kubernetes"
      ? "Delete cluster"
      : type === "gateway"
        ? "Delete gateway"
        : "Delete database";
  appendAudit(
    tenant,
    "delete",
    type,
    id,
    service.name,
    `${actionLabel}: ${service.name} removed`
  );
  db.services.splice(index, 1);
}

const SEED_HISTORY_ITEMS_PER_SERVICE = 3;

/** Seed audit log from existing service statusHistory once per tenant (actorRole "system"). */
function seedAuditLogFromStatusHistory(tenant: TenantSlug): void {
  const db = DB[tenant];
  if (db.auditSeeded || db.auditLog.length > 0) return;
  const entries: AuditEntry[] = [];
  for (const service of db.services) {
    const items = (service.statusHistory ?? []).slice(
      0,
      SEED_HISTORY_ITEMS_PER_SERVICE
    );
    for (const item of items) {
      entries.push({
        id: crypto.randomUUID(),
        at: item.at,
        actorRole: "system",
        tenant,
        action: "system_seed",
        entityType: service.type,
        entityId: service.id,
        entityName: service.name,
        message: item.message,
      });
    }
  }
  entries.sort((a, b) => (a.at > b.at ? 1 : a.at < b.at ? -1 : 0));
  db.auditLog.push(...entries);
  db.auditSeeded = true;
}

export async function listAuditLog(tenant: TenantSlug): Promise<AuditEntry[]> {
  await delay();
  const db = DB[tenant];
  seedAuditLogFromStatusHistory(tenant);
  return [...db.auditLog].sort((a, b) =>
    b.at > a.at ? 1 : b.at < a.at ? -1 : 0
  );
}

function appendHistory(service: Service, message: string): StatusHistoryItem[] {
  const item: StatusHistoryItem = {
    id: crypto.randomUUID(),
    message,
    at: new Date().toISOString(),
  };
  return [...service.statusHistory, item];
}

function applyMutate(
  service: Service,
  action: string,
  payload?: unknown
): Service {
  const p =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : undefined;

  if (action === "updateName" && p?.name && typeof p.name === "string") {
    return {
      ...service,
      name: p.name,
      statusHistory: appendHistory(service, `Renamed to ${p.name}`),
    };
  }

  if (service.type === "kubernetes") {
    const cluster = service as KubernetesCluster;
    if (action === "restartCluster") {
      return {
        ...cluster,
        status: "updating",
        statusHistory: appendHistory(service, "Cluster restart initiated"),
      } as Service;
    }
    if (
      action === "addNodePool" &&
      p?.name &&
      p?.instanceType &&
      typeof p.desiredNodes === "number"
    ) {
      const pool: NodePool = {
        id: crypto.randomUUID(),
        name: String(p.name),
        instanceType: p.instanceType as InstanceType,
        desiredNodes: Math.max(1, Math.floor(p.desiredNodes)),
        nodes: [],
      };
      return {
        ...cluster,
        nodePools: [...cluster.nodePools, pool],
        statusHistory: appendHistory(service, `Node pool "${pool.name}" added`),
      } as Service;
    }
    if (
      action === "scalePool" &&
      p?.poolId &&
      typeof p.desiredNodes === "number"
    ) {
      const desired = Math.max(1, Math.floor(p.desiredNodes));
      const poolId = String(p.poolId);
      const nodePools = cluster.nodePools.map((pool) =>
        pool.id === poolId ? { ...pool, desiredNodes: desired } : pool
      );
      return {
        ...cluster,
        nodePools,
        statusHistory: appendHistory(
          service,
          `Pool scaled to ${desired} nodes`
        ),
      } as Service;
    }
    if (action === "toggleCordon" && p?.poolId) {
      const poolId = String(p.poolId);
      const nodePools = cluster.nodePools.map((pool) =>
        pool.id === poolId ? { ...pool, cordoned: !pool.cordoned } : pool
      );
      const cordoned = cluster.nodePools.find((x) => x.id === poolId)?.cordoned;
      return {
        ...cluster,
        nodePools,
        statusHistory: appendHistory(
          service,
          cordoned ? "Pool uncordoned" : "Pool cordoned"
        ),
      } as Service;
    }
  }

  if (service.type === "gateway") {
    const gw = service as ApiGateway;
    if (action === "activateGateway") {
      return {
        ...gw,
        status: "active",
        statusHistory: appendHistory(service, "Gateway activated"),
      } as Service;
    }
    if (action === "deactivateGateway") {
      return {
        ...gw,
        status: "inactive",
        statusHistory: appendHistory(service, "Gateway deactivated"),
      } as Service;
    }
    if (action === "regenerateTls") {
      return {
        ...gw,
        statusHistory: appendHistory(
          service,
          "TLS certificate regeneration started"
        ),
      } as Service;
    }
    if (action === "addRule" && p) {
      const rule: ForwardingRule = {
        id: crypto.randomUUID(),
        name: (p.name as string) || "Rule",
        protocol: (p.protocol as RuleProtocol) || "https",
        status: "enabled",
        externalPort: typeof p.externalPort === "number" ? p.externalPort : 443,
        tlsEnabled: p.tlsEnabled === true,
        path: p.path as string | undefined,
        targetUrl: p.targetUrl as string | undefined,
      };
      return {
        ...gw,
        rules: [...gw.rules, rule],
        statusHistory: appendHistory(service, `Rule "${rule.name}" added`),
      } as Service;
    }
    if (action === "editRule" && p?.ruleId) {
      const ruleId = String(p.ruleId);
      const rules = gw.rules.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              ...(p.name !== undefined && { name: String(p.name) }),
              ...(p.protocol !== undefined && {
                protocol: p.protocol as RuleProtocol,
              }),
              ...(p.externalPort !== undefined && {
                externalPort: Number(p.externalPort),
              }),
              ...(p.path !== undefined && { path: String(p.path) }),
              ...(p.targetUrl !== undefined && {
                targetUrl: String(p.targetUrl),
              }),
              ...(p.tlsEnabled !== undefined && {
                tlsEnabled: Boolean(p.tlsEnabled),
              }),
            }
          : r
      );
      return {
        ...gw,
        rules,
        statusHistory: appendHistory(service, "Rule updated"),
      } as Service;
    }
    if (action === "toggleRule" && p?.ruleId) {
      const ruleId = String(p.ruleId);
      const rules = gw.rules.map((r) =>
        r.id === ruleId
          ? { ...r, status: r.status === "enabled" ? "disabled" : "enabled" }
          : r
      );
      const rule = gw.rules.find((x) => x.id === ruleId);
      return {
        ...gw,
        rules,
        statusHistory: appendHistory(
          service,
          rule?.status === "enabled" ? "Rule disabled" : "Rule enabled"
        ),
      } as Service;
    }
  }

  if (service.type === "postgres") {
    const db = service as PostgresDb;
    if (action === "startDb") {
      return {
        ...db,
        status: "available",
        statusHistory: appendHistory(service, "Database started"),
      } as Service;
    }
    if (action === "stopDb") {
      return {
        ...db,
        status: "stopped",
        statusHistory: appendHistory(service, "Database stopped"),
      } as Service;
    }
    if (action === "restartDb") {
      return {
        ...db,
        status: "updating",
        statusHistory: appendHistory(service, "Database restart initiated"),
      } as Service;
    }
    if (action === "createBackup") {
      const backups = [...(db.backups || [])];
      backups.unshift({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        sizeGb: Math.round(db.usedStorageGb * 0.95),
      });
      return {
        ...db,
        status: "backup_in_progress",
        backups: backups.slice(0, 10),
        statusHistory: appendHistory(service, "Manual backup started"),
      } as Service;
    }
    if (action === "resizeDb" && p?.tier !== undefined) {
      const tier = (p.tier as DbTier) || db.tier;
      const allocatedStorageGb = Math.max(
        10,
        Math.floor(Number(p.allocatedStorageGb) || db.allocatedStorageGb)
      );
      return {
        ...db,
        tier,
        allocatedStorageGb,
        statusHistory: appendHistory(
          service,
          `Instance resized: tier ${tier}, storage ${allocatedStorageGb} GB`
        ),
      } as Service;
    }
  }

  return service;
}

export async function provision(
  tenant: TenantSlug,
  payload: unknown
): Promise<{ progress: string[]; createdId: string }> {
  await delay();
  const validated = validateProvisionPayload(payload);
  if (!validated.success) {
    const msg =
      validated.error.issues?.map((e) => e.message).join("; ") ??
      validated.error.message ??
      "Validation failed";
    throw new Error(msg);
  }
  const p = validated.data;
  const progress: string[] = [
    "Provision requested",
    "Resources allocated",
    "Provisioning…",
    "Service ready",
  ];
  const createdId = `${tenant}-${p.type}-${Date.now()}`;
  const now = new Date().toISOString();
  const statusHistory: StatusHistoryItem[] = [
    { id: `${createdId}-h1`, message: "Provision requested", at: now },
    { id: `${createdId}-h2`, message: "Resources allocated", at: now },
    { id: `${createdId}-h3`, message: "Provisioning", at: now },
    { id: `${createdId}-h4`, message: "In progress", at: now },
    { id: `${createdId}-h5`, message: "Service ready", at: now },
  ];
  const monthlyCost = estimateMonthlyCost(p);
  const db = DB[tenant];
  const newService = buildServiceFromPayload(
    p,
    createdId,
    statusHistory,
    monthlyCost
  );
  db.services.push(newService);
  appendAudit(
    tenant,
    "provision",
    p.type,
    createdId,
    p.name,
    `Provisioned ${p.type} ${p.name} in ${p.region}`
  );
  return { progress, createdId };
}

function buildServiceFromPayload(
  p: ProvisionPayload,
  id: string,
  statusHistory: StatusHistoryItem[],
  monthlyCost: { amount: number; currency: "USD" }
): Service {
  const common = {
    id,
    name: p.name,
    region: p.region,
    monthlyCost,
    statusHistory,
  };
  if (p.type === "kubernetes") {
    const pl = p as ProvisionKubernetesPayload;
    const nodePools = pl.nodePools.map((np, i) => ({
      id: `${id}-pool-${i + 1}`,
      name: np.poolName,
      instanceType: np.instanceType,
      desiredNodes: np.desiredNodes,
      nodes: [] as {
        id: string;
        status: "pending" | "ready" | "not_ready" | "draining";
      }[],
    }));
    return {
      ...common,
      type: "kubernetes",
      status: "running",
      kubernetesVersion: pl.kubernetesVersion,
      nodePools,
    } as KubernetesCluster;
  }
  if (p.type === "gateway") {
    const pl = p as ProvisionGatewayPayload;
    const rules = pl.rules.map((r, i) => ({
      id: `${id}-rule-${i + 1}`,
      name: r.name,
      protocol: r.protocol,
      status: "enabled" as const,
      path: r.pathPrefix,
      targetUrl: r.target,
      externalPort: r.externalPort,
      tlsEnabled: r.tlsEnabled,
    }));
    return {
      ...common,
      type: "gateway",
      status: "active",
      publicEndpointUrl:
        pl.publicEndpointUrl ?? `https://${pl.name}.gateway.example.com`,
      vpcId: pl.vpcId,
      rules,
    } as ApiGateway;
  }
  const pl = p as ProvisionPostgresPayload;
  const slug = pl.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return {
    ...common,
    type: "postgres",
    status: "available",
    version: pl.pgVersion,
    tier: pl.tier,
    haMode: pl.haMode,
    allocatedStorageGb: pl.storageAllocatedGb,
    usedStorageGb: 0,
    host: `${slug}.postgres.${pl.region.toLowerCase()}.internal`,
    port: 5432,
    dbName: slug,
    ...(pl.haMode === "primary_read_replica" && {
      replicaStatus: "healthy" as const,
    }),
  } as PostgresDb;
}
