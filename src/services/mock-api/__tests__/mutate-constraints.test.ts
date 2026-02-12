import { mutate } from "@/services/mock-api";

describe("mutate tenant isolation and constraints", () => {
  it("scalePool with wrong tenant (globex pool id in acme) throws", async () => {
    const globexK8sId = "globex-kubernetes-1";
    await expect(
      mutate("acme", "kubernetes", globexK8sId, "scalePool", {
        poolId: "globex-np-1a",
        desiredNodes: 5,
      })
    ).rejects.toThrow(/Service not found/);
  });

  it("addNodePool enforces min 1 node", async () => {
    const acmeK8sId = "acme-kubernetes-1";
    const result = await mutate(
      "acme",
      "kubernetes",
      acmeK8sId,
      "addNodePool",
      {
        name: "test-pool",
        instanceType: "Standard-2vCPU-8GB",
        desiredNodes: 0,
      }
    );
    expect(result.type).toBe("kubernetes");
    const cluster =
      result as import("@/domain/kubernetes/types").KubernetesCluster;
    const added = cluster.nodePools.find((p) => p.name === "test-pool");
    expect(added).toBeDefined();
    expect(added!.desiredNodes).toBe(1);
  });
});
