/**
 * Action constants for RBAC. Add new actions here as the app grows.
 */

export const SERVICE_PROVISION = "service.provision" as const;
export const SERVICE_MUTATE = "service.mutate" as const; // start / stop / restart / scale / delete
export const GATEWAY_RULE_EDIT = "gateway.rule.edit" as const;
export const GATEWAY_RULE_DISABLE = "gateway.rule.disable" as const;

export const ACTIONS = {
  SERVICE_PROVISION,
  SERVICE_MUTATE,
  GATEWAY_RULE_EDIT,
  GATEWAY_RULE_DISABLE,
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
