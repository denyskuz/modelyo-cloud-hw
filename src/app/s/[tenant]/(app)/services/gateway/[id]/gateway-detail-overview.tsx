"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/domain/common/cost";
import type { ApiGateway, ForwardingRule } from "@/domain/gateway/types";

export function GatewayDetailOverview({
  gateway,
  summary,
  renderRuleActions,
  canMutate,
}: {
  gateway: ApiGateway;
  summary: {
    totalRules: number;
    activeRules: number;
    protocolsInUse: string[];
  };
  renderRuleActions?: (rule: ForwardingRule) => React.ReactNode;
  canMutate?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gateway details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Region:</span>{" "}
            {gateway.region}
          </p>
          <p>
            <span className="text-muted-foreground">VPC ID:</span>{" "}
            {gateway.vpcId}
          </p>
          <p>
            <span className="text-muted-foreground">Public endpoint:</span>{" "}
            <a
              href={gateway.publicEndpointUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {gateway.publicEndpointUrl}
            </a>
          </p>
          <p>
            <span className="text-muted-foreground">Traffic:</span>{" "}
            {summary.activeRules} / {summary.totalRules} rules active ·
            Protocols: {summary.protocolsInUse.join(", ") || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Monthly cost:</span>{" "}
            {formatMoney(gateway.monthlyCost)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forwarding rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule name</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Target / path</TableHead>
                <TableHead>TLS</TableHead>
                <TableHead>Status</TableHead>
                {canMutate && renderRuleActions ? (
                  <TableHead className="w-[100px]">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateway.rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.name || rule.id}</TableCell>
                  <TableCell>{rule.protocol}</TableCell>
                  <TableCell>{rule.externalPort ?? "—"}</TableCell>
                  <TableCell>{rule.targetUrl || rule.path || "—"}</TableCell>
                  <TableCell>
                    {rule.tlsEnabled ? (
                      <Badge variant="default">TLS</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rule.status === "enabled" ? "default" : "secondary"
                      }
                    >
                      {rule.status}
                    </Badge>
                  </TableCell>
                  {canMutate && renderRuleActions ? (
                    <TableCell>{renderRuleActions(rule)}</TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
