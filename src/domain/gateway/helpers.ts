import type { ApiGateway } from "./types";
import type { RuleProtocol } from "./types";

export function rulesSummary(gw: ApiGateway): {
  totalRules: number;
  activeRules: number;
  protocolsInUse: RuleProtocol[];
} {
  const totalRules = gw.rules.length;
  const activeRules = gw.rules.filter((r) => r.status === "enabled").length;
  const protocolSet = new Set<RuleProtocol>(gw.rules.map((r) => r.protocol));
  const protocolsInUse = Array.from(protocolSet);
  return { totalRules, activeRules, protocolsInUse };
}
