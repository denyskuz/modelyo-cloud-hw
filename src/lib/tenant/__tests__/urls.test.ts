import { tenantBaseUrl, PUBLIC_PATHS, dashboardPath } from "@/lib/tenant/urls";

describe("tenant URLs", () => {
  it("dashboardPath returns public path with no /s/", () => {
    expect(dashboardPath()).toBe("/dashboard");
    expect(dashboardPath()).not.toContain("/s/");
  });

  it("PUBLIC_PATHS contain no /s/", () => {
    expect(PUBLIC_PATHS.dashboard).toBe("/dashboard");
    expect(PUBLIC_PATHS.provision).toBe("/provision");
    expect(PUBLIC_PATHS.accessDenied).toBe("/access-denied");
    expect(PUBLIC_PATHS.serviceDetail("kubernetes", "k1")).toBe(
      "/services/kubernetes/k1"
    );
    expect(PUBLIC_PATHS.serviceDetail("gateway", "g1")).toBe(
      "/services/gateway/g1"
    );
    expect(PUBLIC_PATHS.serviceDetail("postgres", "p1")).toBe(
      "/services/postgres/p1"
    );
    expect(PUBLIC_PATHS.dashboard).not.toContain("/s/");
    expect(PUBLIC_PATHS.serviceDetail("kubernetes", "k1")).not.toContain("/s/");
  });

  describe("tenantBaseUrl (client-only; no window in Jest)", () => {
    it("returns empty string when window is undefined", () => {
      expect(tenantBaseUrl("acme")).toBe("");
    });
  });
});
