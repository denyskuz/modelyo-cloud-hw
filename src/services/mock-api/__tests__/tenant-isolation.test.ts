import { listAll, mutate, provision } from "@/services/mock-api";

describe("tenant isolation", () => {
  it("listAll('acme') never returns any service IDs from globex", async () => {
    const { services: globexServices } = await listAll("globex");
    const globexIds = new Set(globexServices.map((s) => s.id));

    const { services: acmeServices } = await listAll("acme");

    for (const service of acmeServices) {
      expect(globexIds.has(service.id)).toBe(false);
    }
  });

  it("mutate('acme', ...) cannot mutate globex service (throws when service not in tenant)", async () => {
    const globexK8sId = "globex-kubernetes-1";

    await expect(
      mutate("acme", "kubernetes", globexK8sId, "updateName", {
        name: "hacked",
      })
    ).rejects.toThrow(/Service not found/);

    const { services: globexServices } = await listAll("globex");
    const cluster = globexServices.find(
      (s) => s.type === "kubernetes" && s.id === globexK8sId
    );
    expect(cluster).toBeDefined();
    expect(cluster!.name).toBe("globex-us-prod");
  });

  it("provision('globex') increases globex count only", async () => {
    const { services: acmeBefore } = await listAll("acme");
    const { services: globexBefore } = await listAll("globex");

    await provision("globex", {
      type: "postgres",
      name: "test-db",
      region: "EU-West-1",
      pgVersion: "16",
      tier: "Small-2vCPU-4GB",
      storageAllocatedGb: 10,
      haMode: "primary_only",
    });

    const { services: acmeAfter } = await listAll("acme");
    const { services: globexAfter } = await listAll("globex");

    expect(acmeAfter.length).toBe(acmeBefore.length);
    expect(globexAfter.length).toBe(globexBefore.length + 1);
  });
});
