import type { DemoRole } from "@/auth/role";
import type { Action } from "@/auth/permissions";

/**
 * Role–action matrix. Add new roles or actions here; default is false for unknown.
 * Admin: all mutating/provision/rule actions allowed.
 * Viewer: no mutating/provision/rule actions (read-only for these domains).
 */
const ABILITY: Record<DemoRole, Partial<Record<Action, boolean>>> = {
  admin: {
    "service.provision": true,
    "service.mutate": true,
    "gateway.rule.edit": true,
    "gateway.rule.disable": true,
  },
  viewer: {
    "service.provision": false,
    "service.mutate": false,
    "gateway.rule.edit": false,
    "gateway.rule.disable": false,
  },
};

/**
 * Returns whether the given role is allowed to perform the action.
 * Unknown role or action yields false.
 */
export function can(role: DemoRole, action: string): boolean {
  const roleAbilities = ABILITY[role];
  if (!roleAbilities) return false;
  return (roleAbilities as Record<string, boolean>)[action] === true;
}
