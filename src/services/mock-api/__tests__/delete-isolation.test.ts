import { deleteService, listAll } from "@/services/mock-api";

describe("delete tenant isolation", () => {
  it("deleting a service in tenant A does not affect tenant B counts", async () => {
    const { services: acmeBefore } = await listAll("acme");
    const { services: globexBefore } = await listAll("globex");

    const acmeK8sId = "acme-kubernetes-1";
    await deleteService("acme", "kubernetes", acmeK8sId);

    const { services: acmeAfter } = await listAll("acme");
    const { services: globexAfter } = await listAll("globex");

    expect(acmeAfter.length).toBe(acmeBefore.length - 1);
    expect(globexAfter.length).toBe(globexBefore.length);
    expect(acmeAfter.some((s) => s.id === acmeK8sId)).toBe(false);
  });

  it("deleting unknown id throws", async () => {
    await expect(
      deleteService("acme", "kubernetes", "non-existent-id")
    ).rejects.toThrow(/Service not found/);

    await expect(
      deleteService("globex", "postgres", "acme-postgres-1")
    ).rejects.toThrow(/Service not found/);
  });
});
