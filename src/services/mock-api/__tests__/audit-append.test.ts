import {
  listAuditLog,
  listAll,
  mutate,
  provision,
  deleteService,
} from "@/services/mock-api";

describe("audit append (mutate / provision / delete)", () => {
  it("mutate appends an audit entry for the correct tenant only", async () => {
    const { services: acmeServices } = await listAll("acme");
    const cluster = acmeServices.find(
      (s) => s.type === "kubernetes" && s.id === "acme-kubernetes-1"
    );
    expect(cluster).toBeDefined();

    const logBefore = await listAuditLog("acme");
    const globexBefore = await listAuditLog("globex");
    await mutate("acme", "kubernetes", cluster!.id, "restartCluster");
    const logAfter = await listAuditLog("acme");
    const globexAfter = await listAuditLog("globex");

    expect(logAfter.length).toBe(logBefore.length + 1);
    expect(globexAfter.length).toBe(globexBefore.length);
    const entry = logAfter[0];
    expect(entry.tenant).toBe("acme");
    expect(entry.action).toBe("restartCluster");
  });

  it("provision appends an audit entry for the correct tenant only", async () => {
    const logBefore = await listAuditLog("globex");
    await provision("globex", {
      type: "gateway",
      name: "append-test-gw",
      region: "US-East-1",
      publicEndpointUrl: "https://test.example.com",
      vpcId: "vpc-x",
      rules: [
        {
          name: "R1",
          protocol: "https",
          pathPrefix: "/",
          target: "backend:8080",
          externalPort: 443,
          tlsEnabled: true,
        },
      ],
    });
    const logAfter = await listAuditLog("globex");
    expect(logAfter.length).toBe(logBefore.length + 1);
    expect(logAfter[0].tenant).toBe("globex");
    expect(logAfter[0].action).toBe("provision");
    expect(logAfter[0].message).toContain("Provisioned");
    expect(logAfter[0].message).toContain("append-test-gw");
  });

  it("delete appends an audit entry then removes the entity", async () => {
    const { createdId } = await provision("globex", {
      type: "postgres",
      name: "delete-audit-test",
      region: "EU-West-1",
      pgVersion: "16",
      tier: "Small-2vCPU-4GB",
      storageAllocatedGb: 10,
      haMode: "primary_only",
    });
    const logBefore = await listAuditLog("globex");
    await deleteService("globex", "postgres", createdId);
    const logAfter = await listAuditLog("globex");
    expect(logAfter.length).toBe(logBefore.length + 1);
    expect(logAfter[0].action).toBe("delete");
    expect(logAfter[0].tenant).toBe("globex");
  });
});
