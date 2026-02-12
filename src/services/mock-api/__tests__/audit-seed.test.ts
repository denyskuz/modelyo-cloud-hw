import { listAuditLog } from "@/services/mock-api";

describe("audit log seeding", () => {
  it("listAuditLog(tenant) returns more than 0 entries on first call (seeded user actions)", async () => {
    const acme = await listAuditLog("acme");
    const globex = await listAuditLog("globex");

    expect(acme.length).toBeGreaterThan(0);
    expect(globex.length).toBeGreaterThan(0);
  });

  it("seeded entries have actorRole Admin or Viewer (user actions only)", async () => {
    const entries = await listAuditLog("acme");
    const userEntries = entries.filter(
      (e) => e.actorRole === "Admin" || e.actorRole === "Viewer"
    );
    expect(userEntries.length).toBeGreaterThan(0);
  });

  it("seeded entries reference existing services (entityType, entityId, entityName)", async () => {
    const entries = await listAuditLog("acme");
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(["kubernetes", "gateway", "postgres"]).toContain(e.entityType);
      expect(e.entityId).toBeTruthy();
      expect(e.entityName).toBeTruthy();
      expect(e.message).toBeTruthy();
    }
  });
});
