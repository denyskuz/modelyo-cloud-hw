import type { TenantSlug } from "@/lib/tenant";
import type { Service } from "@/domain/service/service";
import type { StatusHistoryItem, AuditEntry } from "@/domain/common/types";
import type { KubernetesCluster } from "@/domain/kubernetes/types";
import type { ApiGateway } from "@/domain/gateway/types";
import type { PostgresDb } from "@/domain/postgres/types";

declare global {
  var __MODELYO_DB__: Record<TenantSlug, TenantDb> | undefined;
  var __MODELYO_SEQ__: number | undefined;
}

export type TenantDb = {
  services: Service[];
  auditLog: AuditEntry[];
  /** Set true after initial audit log seed from statusHistory (once per tenant). */
  auditSeeded?: boolean;
};

function statusHistory(prefix: string): StatusHistoryItem[] {
  const base = "2024-06-01T12:00:00.000Z";
  return [
    { id: `${prefix}-h1`, message: "Resource created", at: base },
    { id: `${prefix}-h2`, message: "Validation passed", at: base },
    { id: `${prefix}-h3`, message: "Provisioning started", at: base },
    { id: `${prefix}-h4`, message: "Infrastructure ready", at: base },
    { id: `${prefix}-h5`, message: "Operational", at: base },
  ];
}

function acmeServices(): Service[] {
  const k8s1: KubernetesCluster = {
    id: "acme-kubernetes-1",
    name: "acme-prod-cluster",
    type: "kubernetes",
    region: "EU-West-1",
    monthlyCost: { amount: 420, currency: "USD" },
    statusHistory: statusHistory("acme-k8s-1"),
    status: "running",
    kubernetesVersion: "1.29",
    nodePools: [
      {
        id: "acme-np-1a",
        name: "default-pool",
        instanceType: "Standard-2vCPU-8GB",
        desiredNodes: 3,
        nodes: [
          { id: "acme-n-1", status: "ready" },
          { id: "acme-n-2", status: "ready" },
          { id: "acme-n-3", status: "ready" },
        ],
      },
      {
        id: "acme-np-1b",
        name: "compute-pool",
        instanceType: "Performance-4vCPU-16GB",
        desiredNodes: 2,
        nodes: [
          { id: "acme-n-4", status: "ready" },
          { id: "acme-n-5", status: "ready" },
        ],
      },
    ],
  };
  const k8s2: KubernetesCluster = {
    id: "acme-kubernetes-2",
    name: "acme-staging",
    type: "kubernetes",
    region: "EU-West-1",
    monthlyCost: { amount: 180, currency: "USD" },
    statusHistory: statusHistory("acme-k8s-2"),
    status: "running",
    kubernetesVersion: "1.28",
    nodePools: [
      {
        id: "acme-np-2a",
        name: "workers",
        instanceType: "Standard-2vCPU-8GB",
        desiredNodes: 2,
        nodes: [
          { id: "acme-n-6", status: "ready" },
          { id: "acme-n-7", status: "pending" },
        ],
      },
    ],
  };
  const gw1: ApiGateway = {
    id: "acme-gateway-1",
    name: "acme-public-api",
    type: "gateway",
    region: "EU-West-1",
    monthlyCost: { amount: 95, currency: "USD" },
    statusHistory: statusHistory("acme-gw-1"),
    status: "active",
    publicEndpointUrl: "https://api.acme.example.com",
    vpcId: "vpc-acme-0a1b2c3d",
    rules: [
      {
        id: "acme-r-1",
        name: "API",
        protocol: "https",
        status: "enabled",
        path: "/api",
        targetUrl: "https://backend.acme.internal",
        externalPort: 443,
        tlsEnabled: true,
      },
      {
        id: "acme-r-2",
        name: "Webhooks",
        protocol: "http",
        status: "enabled",
        path: "/webhooks",
        externalPort: 80,
        tlsEnabled: false,
      },
      {
        id: "acme-r-3",
        name: "TCP",
        protocol: "tcp",
        status: "disabled",
        externalPort: 50051,
      },
    ],
  };
  const gw2: ApiGateway = {
    id: "acme-gateway-2",
    name: "acme-internal-gw",
    type: "gateway",
    region: "EU-Central-1",
    monthlyCost: { amount: 60, currency: "USD" },
    statusHistory: statusHistory("acme-gw-2"),
    status: "active",
    publicEndpointUrl: "https://internal.acme.example.com",
    vpcId: "vpc-acme-eu-4e5f6g7h",
    rules: [
      {
        id: "acme-r-4",
        name: "Default",
        protocol: "https",
        status: "enabled",
        externalPort: 443,
        tlsEnabled: true,
      },
    ],
  };
  const pg1: PostgresDb = {
    id: "acme-postgres-1",
    name: "acme-primary-db",
    type: "postgres",
    region: "EU-West-1",
    monthlyCost: { amount: 250, currency: "USD" },
    statusHistory: statusHistory("acme-pg-1"),
    status: "available",
    version: "16",
    tier: "Medium-4vCPU-8GB",
    haMode: "primary_read_replica",
    allocatedStorageGb: 200,
    usedStorageGb: 87,
    host: "acme-primary.xxxx.eu-west-1.rds.local",
    port: 5432,
    dbName: "acme_prod",
    replicaStatus: "healthy",
    backups: [{ id: "acme-b-1", at: "2024-06-10T03:00:00.000Z", sizeGb: 85 }],
  };
  const pg2: PostgresDb = {
    id: "acme-postgres-2",
    name: "acme-analytics-db",
    type: "postgres",
    region: "EU-West-1",
    monthlyCost: { amount: 120, currency: "USD" },
    statusHistory: statusHistory("acme-pg-2"),
    status: "available",
    version: "16",
    tier: "Small-2vCPU-4GB",
    haMode: "primary_only",
    allocatedStorageGb: 50,
    usedStorageGb: 12,
    host: "acme-analytics.xxxx.eu-west-1.rds.local",
    port: 5432,
    dbName: "acme_analytics",
  };
  return [k8s1, k8s2, gw1, gw2, pg1, pg2];
}

function globexServices(): Service[] {
  const k8s1: KubernetesCluster = {
    id: "globex-kubernetes-1",
    name: "globex-us-prod",
    type: "kubernetes",
    region: "US-East-1",
    monthlyCost: { amount: 720, currency: "USD" },
    statusHistory: statusHistory("globex-k8s-1"),
    status: "running",
    kubernetesVersion: "1.30",
    nodePools: [
      {
        id: "globex-np-1a",
        name: "high-mem-pool",
        instanceType: "HighMem-8vCPU-32GB",
        desiredNodes: 4,
        nodes: [
          { id: "globex-n-1", status: "ready" },
          { id: "globex-n-2", status: "ready" },
          { id: "globex-n-3", status: "not_ready" },
          { id: "globex-n-4", status: "ready" },
        ],
      },
    ],
  };
  const k8s2: KubernetesCluster = {
    id: "globex-kubernetes-2",
    name: "globex-eu-cluster",
    type: "kubernetes",
    region: "EU-Central-1",
    monthlyCost: { amount: 0, currency: "USD" },
    statusHistory: statusHistory("globex-k8s-2"),
    status: "creating",
    kubernetesVersion: "1.29",
    nodePools: [
      {
        id: "globex-np-2a",
        name: "workers",
        instanceType: "Performance-4vCPU-16GB",
        desiredNodes: 2,
        nodes: [],
      },
    ],
  };
  const gw1: ApiGateway = {
    id: "globex-gateway-1",
    name: "globex-edge",
    type: "gateway",
    region: "US-East-1",
    monthlyCost: { amount: 140, currency: "USD" },
    statusHistory: statusHistory("globex-gw-1"),
    status: "active",
    publicEndpointUrl: "https://edge.globex.io",
    vpcId: "vpc-globex-us-9a8b7c6d",
    rules: [
      {
        id: "globex-r-1",
        name: "API",
        protocol: "https",
        status: "enabled",
        externalPort: 443,
        tlsEnabled: true,
      },
      {
        id: "globex-r-2",
        name: "Admin",
        protocol: "https",
        status: "enabled",
        externalPort: 443,
        tlsEnabled: true,
      },
      {
        id: "globex-r-3",
        name: "TCP",
        protocol: "tcp",
        status: "enabled",
        externalPort: 50051,
      },
    ],
  };
  const gw2: ApiGateway = {
    id: "globex-gateway-2",
    name: "globex-legacy-api",
    type: "gateway",
    region: "EU-Central-1",
    monthlyCost: { amount: 45, currency: "USD" },
    statusHistory: statusHistory("globex-gw-2"),
    status: "updating",
    publicEndpointUrl: "https://legacy.globex.io",
    vpcId: "vpc-globex-eu-1a2b3c4d",
    rules: [
      {
        id: "globex-r-4",
        name: "Legacy",
        protocol: "http",
        status: "disabled",
        externalPort: 80,
        tlsEnabled: false,
      },
    ],
  };
  const pg1: PostgresDb = {
    id: "globex-postgres-1",
    name: "globex-core-db",
    type: "postgres",
    region: "US-East-1",
    monthlyCost: { amount: 480, currency: "USD" },
    statusHistory: statusHistory("globex-pg-1"),
    status: "available",
    version: "15",
    tier: "Large-8vCPU-16GB",
    haMode: "primary_read_replica",
    allocatedStorageGb: 500,
    usedStorageGb: 412,
    host: "globex-core.xxxx.us-east-1.rds.local",
    port: 5432,
    dbName: "globex_core",
    replicaStatus: "healthy",
    backups: [
      { id: "globex-b-1", at: "2024-06-11T02:00:00.000Z", sizeGb: 400 },
      { id: "globex-b-2", at: "2024-06-09T02:00:00.000Z", sizeGb: 398 },
    ],
  };
  const pg2: PostgresDb = {
    id: "globex-postgres-2",
    name: "globex-reporting",
    type: "postgres",
    region: "EU-Central-1",
    monthlyCost: { amount: 85, currency: "USD" },
    statusHistory: statusHistory("globex-pg-2"),
    status: "creating",
    version: "15",
    tier: "Small-2vCPU-4GB",
    haMode: "primary_only",
    allocatedStorageGb: 30,
    usedStorageGb: 0,
    host: "globex-reporting.xxxx.eu-central-1.rds.local",
    port: 5432,
    dbName: "globex_reporting",
  };
  return [k8s1, k8s2, gw1, gw2, pg1, pg2];
}

/** Seed audit log so the Audit tab is non-empty on first load. Tenant-isolated. */
function seedAuditLog(tenant: TenantSlug): AuditEntry[] {
  const base = tenant === "acme" ? "2024-06-02" : "2024-06-03";
  const entries: AuditEntry[] = [];
  if (tenant === "acme") {
    entries.push(
      {
        id: "acme-a1",
        at: `${base}T10:00:00.000Z`,
        actorRole: "Admin",
        tenant: "acme",
        action: "provision",
        entityType: "kubernetes",
        entityId: "acme-kubernetes-1",
        entityName: "acme-prod-cluster",
        message: "Provision confirmed",
      },
      {
        id: "acme-a2",
        at: `${base}T11:30:00.000Z`,
        actorRole: "Admin",
        tenant: "acme",
        action: "restart",
        entityType: "gateway",
        entityId: "acme-gateway-1",
        entityName: "acme-public-api",
        message: "Gateway restarted",
      },
      {
        id: "acme-a3",
        at: `${base}T14:00:00.000Z`,
        actorRole: "Viewer",
        tenant: "acme",
        action: "view",
        entityType: "postgres",
        entityId: "acme-postgres-1",
        entityName: "acme-primary-db",
        message: "Details viewed",
      }
    );
  } else {
    entries.push(
      {
        id: "globex-a1",
        at: `${base}T09:00:00.000Z`,
        actorRole: "Admin",
        tenant: "globex",
        action: "provision",
        entityType: "kubernetes",
        entityId: "globex-kubernetes-1",
        entityName: "globex-us-prod",
        message: "Provision confirmed",
      },
      {
        id: "globex-a2",
        at: `${base}T12:00:00.000Z`,
        actorRole: "Admin",
        tenant: "globex",
        action: "scale",
        entityType: "kubernetes",
        entityId: "globex-kubernetes-1",
        entityName: "globex-us-prod",
        message: "Node pool scaled",
      },
      {
        id: "globex-a3",
        at: `${base}T15:00:00.000Z`,
        actorRole: "Admin",
        tenant: "globex",
        action: "edit_rule",
        entityType: "gateway",
        entityId: "globex-gateway-1",
        entityName: "globex-edge",
        message: "Rule updated",
      }
    );
  }
  return entries;
}

function buildInitialDb(): Record<TenantSlug, TenantDb> {
  return {
    acme: { services: acmeServices(), auditLog: seedAuditLog("acme") },
    globex: { services: globexServices(), auditLog: seedAuditLog("globex") },
  };
}

/** Persist DB in globalThis so HMR/module reloads do not reset state. */
function getDb(): Record<TenantSlug, TenantDb> {
  if (typeof globalThis !== "undefined" && globalThis.__MODELYO_DB__) {
    return globalThis.__MODELYO_DB__;
  }
  const db = buildInitialDb();
  if (typeof globalThis !== "undefined") {
    globalThis.__MODELYO_DB__ = db;
  }
  return db;
}

export const DB: Record<TenantSlug, TenantDb> = getDb();
