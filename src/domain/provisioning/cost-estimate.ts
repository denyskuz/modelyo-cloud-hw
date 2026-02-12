import type { Money } from "@/domain/common/types";
import type { ProvisionPayload } from "./types";

const K8S_COST_PER_NODE: Record<string, number> = {
  "Standard-2vCPU-8GB": 70,
  "Performance-4vCPU-16GB": 140,
  "HighMem-8vCPU-32GB": 280,
};

const GATEWAY_BASE = 30;
const GATEWAY_PER_RULE = 15;

const PG_TIER_BASE: Record<string, number> = {
  "Small-2vCPU-4GB": 80,
  "Medium-4vCPU-8GB": 160,
  "Large-8vCPU-16GB": 320,
};
const PG_STORAGE_PER_GB = 0.15;
const PG_HA_MULTIPLIER = 1.6;

export function estimateMonthlyCost(payload: ProvisionPayload): Money {
  switch (payload.type) {
    case "kubernetes": {
      let amount = 0;
      for (const pool of payload.nodePools) {
        amount +=
          (K8S_COST_PER_NODE[pool.instanceType] ?? 70) * pool.desiredNodes;
      }
      return { amount, currency: "USD" };
    }
    case "gateway": {
      const amount = GATEWAY_BASE + payload.rules.length * GATEWAY_PER_RULE;
      return { amount, currency: "USD" };
    }
    case "postgres": {
      const base = PG_TIER_BASE[payload.tier] ?? 120;
      const storage = payload.storageAllocatedGb * PG_STORAGE_PER_GB;
      const mult =
        payload.haMode === "primary_read_replica" ? PG_HA_MULTIPLIER : 1;
      const amount = Math.round((base + storage) * mult);
      return { amount, currency: "USD" };
    }
  }
}
