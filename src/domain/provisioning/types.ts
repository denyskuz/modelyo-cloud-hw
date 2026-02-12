import type { Region } from "@/domain/common/types";
import type { InstanceType } from "@/domain/kubernetes/types";
import type { RuleProtocol } from "@/domain/gateway/types";
import type { PgVersion, DbTier, HaMode } from "@/domain/postgres/types";

export type ProvisionServiceType = "kubernetes" | "gateway" | "postgres";

export interface ProvisionKubernetesNodePool {
  poolName: string;
  instanceType: InstanceType;
  desiredNodes: number;
}

export interface ProvisionKubernetesPayload {
  type: "kubernetes";
  name: string;
  region: Region;
  kubernetesVersion: "1.28" | "1.29" | "1.30";
  nodePools: ProvisionKubernetesNodePool[];
}

export interface ProvisionGatewayRule {
  name: string;
  protocol: RuleProtocol;
  externalPort: number;
  target: string;
  pathPrefix: string;
  tlsEnabled: boolean;
}

export interface ProvisionGatewayPayload {
  type: "gateway";
  name: string;
  region: Region;
  vpcId: string;
  publicEndpointUrl?: string;
  rules: ProvisionGatewayRule[];
}

export interface ProvisionPostgresPayload {
  type: "postgres";
  name: string;
  region: Region;
  pgVersion: PgVersion;
  tier: DbTier;
  storageAllocatedGb: number;
  haMode: HaMode;
}

export type ProvisionPayload =
  | ProvisionKubernetesPayload
  | ProvisionGatewayPayload
  | ProvisionPostgresPayload;
