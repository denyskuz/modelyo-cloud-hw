import type { Money, Region, StatusHistoryItem } from "@/domain/common/types";

export const ClusterStatus = {
  Creating: "creating",
  Running: "running",
  Updating: "updating",
  Deleting: "deleting",
  Failed: "failed",
} as const;
export type ClusterStatus = (typeof ClusterStatus)[keyof typeof ClusterStatus];

export const NodeStatus = {
  Pending: "pending",
  Ready: "ready",
  NotReady: "not_ready",
  Draining: "draining",
} as const;
export type NodeStatus = (typeof NodeStatus)[keyof typeof NodeStatus];

export const InstanceType = {
  Standard2vCPU8GB: "Standard-2vCPU-8GB",
  Performance4vCPU16GB: "Performance-4vCPU-16GB",
  HighMem8vCPU32GB: "HighMem-8vCPU-32GB",
} as const;
export type InstanceType = (typeof InstanceType)[keyof typeof InstanceType];

export interface KubernetesNode {
  id: string;
  status: NodeStatus;
}

export interface NodePool {
  id: string;
  name?: string;
  instanceType: InstanceType;
  desiredNodes: number;
  nodes: KubernetesNode[];
  cordoned?: boolean;
}

export type KubernetesVersion = "1.28" | "1.29" | "1.30" | (string & {});

export interface KubernetesCluster {
  id: string;
  name: string;
  type: "kubernetes";
  region: Region;
  monthlyCost: Money;
  statusHistory: StatusHistoryItem[];
  status: ClusterStatus;
  kubernetesVersion: KubernetesVersion;
  nodePools: NodePool[];
}
