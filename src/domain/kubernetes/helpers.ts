import type { KubernetesCluster } from "./types";

const VCPU_BY_INSTANCE: Record<string, number> = {
  "Standard-2vCPU-8GB": 2,
  "Performance-4vCPU-16GB": 4,
  "HighMem-8vCPU-32GB": 8,
};

const RAM_GB_BY_INSTANCE: Record<string, number> = {
  "Standard-2vCPU-8GB": 8,
  "Performance-4vCPU-16GB": 16,
  "HighMem-8vCPU-32GB": 32,
};

export function totalDesiredNodes(cluster: KubernetesCluster): number {
  return cluster.nodePools.reduce((sum, pool) => sum + pool.desiredNodes, 0);
}

export function totalActualNodes(cluster: KubernetesCluster): number {
  return cluster.nodePools.reduce((sum, pool) => sum + pool.nodes.length, 0);
}

export function capacitySummary(cluster: KubernetesCluster): {
  totalVcpu: number;
  totalRamGb: number;
} {
  let totalVcpu = 0;
  let totalRamGb = 0;
  for (const pool of cluster.nodePools) {
    const vcpu = VCPU_BY_INSTANCE[pool.instanceType] ?? 0;
    const ramGb = RAM_GB_BY_INSTANCE[pool.instanceType] ?? 0;
    totalVcpu += pool.nodes.length * vcpu;
    totalRamGb += pool.nodes.length * ramGb;
  }
  return { totalVcpu, totalRamGb };
}

export function healthIndicator(cluster: KubernetesCluster): {
  ready: number;
  total: number;
  level: "green" | "amber" | "red";
} {
  let ready = 0;
  let total = 0;
  for (const pool of cluster.nodePools) {
    for (const node of pool.nodes) {
      total += 1;
      if (node.status === "ready") ready += 1;
    }
  }
  const ratio = total === 0 ? 1 : ready / total;
  const level = ratio >= 1 ? "green" : ratio >= 0.5 ? "amber" : "red";
  return { ready, total, level };
}
