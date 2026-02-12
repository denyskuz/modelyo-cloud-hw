import { provision, listAll } from "@/services/mock-api";

describe("provision tenant isolation", () => {
  it("provisioning in globex does not change acme service count", async () => {
    const { services: acmeBefore } = await listAll("acme");
    await provision("globex", {
      type: "postgres",
      name: "isolation-test-db",
      region: "EU-West-1",
      pgVersion: "16",
      tier: "Small-2vCPU-4GB",
      storageAllocatedGb: 10,
      haMode: "primary_only",
    });
    const { services: acmeAfter } = await listAll("acme");
    expect(acmeAfter.length).toBe(acmeBefore.length);
  });

  it("created service id exists only in correct tenant", async () => {
    const { services: globexBefore } = await listAll("globex");
    const { createdId } = await provision("globex", {
      type: "kubernetes",
      name: "unique-globex-k8s",
      region: "US-East-1",
      kubernetesVersion: "1.29",
      nodePools: [
        {
          poolName: "default",
          instanceType: "Standard-2vCPU-8GB",
          desiredNodes: 1,
        },
      ],
    });
    const { services: globexAfter } = await listAll("globex");
    const { services: acmeServices } = await listAll("acme");
    expect(globexAfter.length).toBe(globexBefore.length + 1);
    const created = globexAfter.find((s) => s.id === createdId);
    expect(created).toBeDefined();
    expect(created!.name).toBe("unique-globex-k8s");
    const inAcme = acmeServices.find((s) => s.id === createdId);
    expect(inAcme).toBeUndefined();
  });
});
