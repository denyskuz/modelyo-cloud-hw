import type { Money, Region, StatusHistoryItem } from "@/domain/common/types";

export const GatewayStatus = {
  Creating: "creating",
  Active: "active",
  Inactive: "inactive",
  Updating: "updating",
  Deleting: "deleting",
  Failed: "failed",
} as const;
export type GatewayStatus = (typeof GatewayStatus)[keyof typeof GatewayStatus];

export const RuleProtocol = {
  Http: "http",
  Https: "https",
  Tcp: "tcp",
} as const;
export type RuleProtocol = (typeof RuleProtocol)[keyof typeof RuleProtocol];

export const RuleStatus = {
  Enabled: "enabled",
  Disabled: "disabled",
} as const;
export type RuleStatus = (typeof RuleStatus)[keyof typeof RuleStatus];

export interface ForwardingRule {
  id: string;
  name?: string;
  protocol: RuleProtocol;
  status: RuleStatus;
  path?: string;
  targetUrl?: string;
  externalPort?: number;
  tlsEnabled?: boolean;
}

export interface ApiGateway {
  id: string;
  name: string;
  type: "gateway";
  region: Region;
  monthlyCost: Money;
  statusHistory: StatusHistoryItem[];
  status: GatewayStatus;
  publicEndpointUrl: string;
  vpcId: string;
  rules: ForwardingRule[];
}
