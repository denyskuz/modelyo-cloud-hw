import { can } from "@/auth/ability";
import type { DemoRole } from "@/auth/role";
import {
  ACTIONS,
  GATEWAY_RULE_DISABLE,
  GATEWAY_RULE_EDIT,
  SERVICE_MUTATE,
  SERVICE_PROVISION,
} from "@/auth/permissions";

describe("can(role, action)", () => {
  const allActions = [
    ACTIONS.SERVICE_PROVISION,
    ACTIONS.SERVICE_MUTATE,
    ACTIONS.GATEWAY_RULE_EDIT,
    ACTIONS.GATEWAY_RULE_DISABLE,
  ] as const;

  describe("admin", () => {
    const role: DemoRole = "admin";

    it("allows service.provision", () => {
      expect(can(role, SERVICE_PROVISION)).toBe(true);
    });

    it("allows service.mutate", () => {
      expect(can(role, SERVICE_MUTATE)).toBe(true);
    });

    it("allows gateway.rule.edit", () => {
      expect(can(role, GATEWAY_RULE_EDIT)).toBe(true);
    });

    it("allows gateway.rule.disable", () => {
      expect(can(role, GATEWAY_RULE_DISABLE)).toBe(true);
    });

    it("returns true for every defined action", () => {
      allActions.forEach((action) => {
        expect(can(role, action)).toBe(true);
      });
    });
  });

  describe("viewer", () => {
    const role: DemoRole = "viewer";

    it("denies service.provision", () => {
      expect(can(role, SERVICE_PROVISION)).toBe(false);
    });

    it("denies service.mutate", () => {
      expect(can(role, SERVICE_MUTATE)).toBe(false);
    });

    it("denies gateway.rule.edit", () => {
      expect(can(role, GATEWAY_RULE_EDIT)).toBe(false);
    });

    it("denies gateway.rule.disable", () => {
      expect(can(role, GATEWAY_RULE_DISABLE)).toBe(false);
    });

    it("returns false for every defined mutating/provision/rule action", () => {
      allActions.forEach((action) => {
        expect(can(role, action)).toBe(false);
      });
    });
  });

  describe("scalability", () => {
    it("returns false for unknown action (admin)", () => {
      expect(can("admin", "unknown.action")).toBe(false);
    });

    it("returns false for unknown action (viewer)", () => {
      expect(can("viewer", "unknown.action")).toBe(false);
    });
  });
});
