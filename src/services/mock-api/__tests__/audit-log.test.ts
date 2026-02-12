import {
  listAuditLog,
  listAll,
  mutate,
  provision,
  deleteService,
} from "@/services/mock-api";

describe("audit log", () => {
  it("mutate appends an audit entry for the correct tenant", async () => {
    const { services: acmeServices } = await listAll("acme");
    const cluster = acmeServices.find(
      (s) => s.type === "kubernetes" && s.id === "acme-kubernetes-1"
    );
    expect(cluster).toBeDefined();

    const logBefore = await listAuditLog("acme");
    await mutate("acme", "kubernetes", cluster!.id, "restartCluster");
    const logAfter = await listAuditLog("acme");

    expect(logAfter.length).toBe(logBefore.length + 1);
    const entry = logAfter[0];
    expect(entry.tenant).toBe("acme");
    expect(entry.action).toBe("restartCluster");
    expect(entry.entityType).toBe("kubernetes");
    expect(entry.entityId).toBe(cluster!.id);
    expect(entry.entityName).toBe(cluster!.name);
  });

  it("provision appends an audit entry for the correct tenant", async () => {
    const logBefore = await listAuditLog("globex");
    await provision("globex", {
      type: "gateway",
      name: "audit-test-gateway",
      region: "US-East-1",
      publicEndpointUrl: "https://test.example.com",
      vpcId: "vpc-test",
      rules: [
        {
          name: "Default",
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
    const entry = logAfter[0];
    expect(entry.tenant).toBe("globex");
    expect(entry.action).toBe("provision");
    expect(entry.entityType).toBe("gateway");
    expect(entry.entityName).toBe("audit-test-gateway");
  });

  it("delete appends an audit entry for the correct tenant", async () => {
    const { createdId } = await provision("globex", {
      type: "postgres",
      name: "audit-delete-test-db",
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
    const entry = logAfter[0];
    expect(entry.tenant).toBe("globex");
    expect(entry.action).toBe("delete");
    expect(entry.entityType).toBe("postgres");
    expect(entry.entityId).toBe(createdId);
    expect(entry.entityName).toBe("audit-delete-test-db");
  });

  it("audit log is tenant-scoped (no cross-tenant entries)", async () => {
    const acmeLog = await listAuditLog("acme");
    const globexLog = await listAuditLog("globex");

    acmeLog.forEach((e) => expect(e.tenant).toBe("acme"));
    globexLog.forEach((e) => expect(e.tenant).toBe("globex"));
  });
});
