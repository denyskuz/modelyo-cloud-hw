import {
  provisionKubernetesSchema,
  provisionGatewaySchema,
  provisionPostgresSchema,
} from "@/domain/provisioning/schema";

describe("provisioning schema", () => {
  describe("gateway", () => {
    it("rejects externalPort below 1", () => {
      const result = provisionGatewaySchema.safeParse({
        type: "gateway",
        name: "my-gw",
        region: "EU-West-1",
        vpcId: "vpc-1",
        rules: [
          {
            name: "r1",
            protocol: "https",
            externalPort: 0,
            target: "host:443",
            pathPrefix: "/api",
            tlsEnabled: true,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects externalPort above 65535", () => {
      const result = provisionGatewaySchema.safeParse({
        type: "gateway",
        name: "my-gw",
        region: "EU-West-1",
        vpcId: "vpc-1",
        rules: [
          {
            name: "r1",
            protocol: "https",
            externalPort: 65536,
            target: "host:443",
            pathPrefix: "/api",
            tlsEnabled: true,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("requires at least one rule", () => {
      const result = provisionGatewaySchema.safeParse({
        type: "gateway",
        name: "my-gw",
        region: "EU-West-1",
        vpcId: "vpc-1",
        rules: [],
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid gateway payload", () => {
      const result = provisionGatewaySchema.safeParse({
        type: "gateway",
        name: "my-gateway",
        region: "EU-West-1",
        vpcId: "vpc-123",
        rules: [
          {
            name: "api",
            protocol: "https",
            externalPort: 443,
            target: "backend:8080",
            pathPrefix: "/api/v1",
            tlsEnabled: true,
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("kubernetes", () => {
    it("requires desiredNodes >= 1 per pool", () => {
      const result = provisionKubernetesSchema.safeParse({
        type: "kubernetes",
        name: "my-k8s",
        region: "EU-West-1",
        kubernetesVersion: "1.29",
        nodePools: [
          {
            poolName: "default",
            instanceType: "Standard-2vCPU-8GB",
            desiredNodes: 0,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("requires at least one node pool", () => {
      const result = provisionKubernetesSchema.safeParse({
        type: "kubernetes",
        name: "my-k8s",
        region: "EU-West-1",
        kubernetesVersion: "1.29",
        nodePools: [],
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid kubernetes payload", () => {
      const result = provisionKubernetesSchema.safeParse({
        type: "kubernetes",
        name: "my-cluster",
        region: "EU-West-1",
        kubernetesVersion: "1.29",
        nodePools: [
          {
            poolName: "default",
            instanceType: "Standard-2vCPU-8GB",
            desiredNodes: 2,
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("postgres", () => {
    it("requires storageAllocatedGb >= 10", () => {
      const result = provisionPostgresSchema.safeParse({
        type: "postgres",
        name: "my-db",
        region: "EU-West-1",
        pgVersion: "16",
        tier: "Medium-4vCPU-8GB",
        storageAllocatedGb: 5,
        haMode: "primary_only",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid postgres payload", () => {
      const result = provisionPostgresSchema.safeParse({
        type: "postgres",
        name: "my-db",
        region: "EU-West-1",
        pgVersion: "16",
        tier: "Medium-4vCPU-8GB",
        storageAllocatedGb: 50,
        haMode: "primary_only",
      });
      expect(result.success).toBe(true);
    });
  });
});
