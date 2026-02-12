"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  ProvisionGatewayPayload,
  ProvisionGatewayRule,
} from "@/domain/provisioning/types";
import type { Region } from "@/domain/common/types";
import type { RuleProtocol } from "@/domain/gateway/types";

const REGIONS: Region[] = ["EU-West-1", "US-East-1", "EU-Central-1"];
const PROTOCOLS: RuleProtocol[] = ["http", "https", "tcp"];

const defaultRule = (): ProvisionGatewayRule => ({
  name: "",
  protocol: "https",
  externalPort: 443,
  target: "",
  pathPrefix: "/api/v1",
  tlsEnabled: true,
});

export function StepConfigGateway({
  data,
  onChange,
  errors,
}: {
  data: Partial<ProvisionGatewayPayload>;
  onChange: (d: Partial<ProvisionGatewayPayload>) => void;
  errors: Record<string, string>;
}) {
  const rules = data.rules ?? [defaultRule()];

  const addRule = () => {
    onChange({ ...data, rules: [...rules, defaultRule()] });
  };

  const updateRule = (index: number, patch: Partial<ProvisionGatewayRule>) => {
    const next = [...rules];
    next[index] = { ...next[index], ...patch };
    onChange({ ...data, rules: next });
  };

  const removeRule = (index: number) => {
    if (rules.length <= 1) return;
    const next = rules.filter((_, i) => i !== index);
    onChange({ ...data, rules: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure API Gateway</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label
            className={cn(
              "text-sm font-medium",
              errors.name && "text-destructive"
            )}
          >
            Name
          </label>
          <Input
            value={data.name ?? ""}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="my-gateway"
            aria-invalid={!!errors.name}
            className={cn(
              errors.name && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name}</p>
          )}
        </div>
        <div className="grid gap-2">
          <label
            className={cn(
              "text-sm font-medium",
              errors.region && "text-destructive"
            )}
          >
            Region
          </label>
          <Select
            value={data.region ?? ""}
            onValueChange={(v) => onChange({ ...data, region: v as Region })}
          >
            <SelectTrigger
              className={cn(
                errors.region &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            >
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.region && (
            <p className="text-destructive text-xs">{errors.region}</p>
          )}
        </div>
        <div className="grid gap-2">
          <label
            className={cn(
              "text-sm font-medium",
              errors.vpcId && "text-destructive"
            )}
          >
            VPC ID
          </label>
          <Input
            value={data.vpcId ?? ""}
            onChange={(e) => onChange({ ...data, vpcId: e.target.value })}
            placeholder="vpc-xxxxx"
            aria-invalid={!!errors.vpcId}
            className={cn(
              errors.vpcId &&
                "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.vpcId && (
            <p className="text-destructive text-xs">{errors.vpcId}</p>
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Public endpoint URL (optional)
          </label>
          <Input
            value={data.publicEndpointUrl ?? ""}
            onChange={(e) =>
              onChange({ ...data, publicEndpointUrl: e.target.value })
            }
            placeholder="https://api.example.com"
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Forwarding rules</span>
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            Add rule
          </Button>
        </div>
        {rules.map((rule, i) => {
          const ruleNameErr = errors[`rules.${i}.name`];
          const ruleTargetErr = errors[`rules.${i}.target`];
          const rulePortErr = errors[`rules.${i}.externalPort`];
          return (
            <div
              key={i}
              className={cn(
                "rounded-md border p-4 space-y-2",
                (errors.rules || ruleNameErr || ruleTargetErr || rulePortErr) &&
                  "border-destructive/50"
              )}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label
                    className={cn(
                      "text-xs text-muted-foreground",
                      ruleNameErr && "text-destructive"
                    )}
                  >
                    Rule name
                  </label>
                  <Input
                    value={rule.name}
                    onChange={(e) => updateRule(i, { name: e.target.value })}
                    placeholder="api"
                    aria-invalid={!!ruleNameErr}
                    className={cn(
                      ruleNameErr &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {ruleNameErr && (
                    <p className="text-destructive text-xs">{ruleNameErr}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Protocol
                  </label>
                  <Select
                    value={rule.protocol}
                    onValueChange={(v) =>
                      updateRule(i, { protocol: v as RuleProtocol })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTOCOLS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    className={cn(
                      "text-xs text-muted-foreground",
                      rulePortErr && "text-destructive"
                    )}
                  >
                    External port (1–65535)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={65535}
                    value={rule.externalPort}
                    onChange={(e) =>
                      updateRule(i, {
                        externalPort: Number(e.target.value) || 443,
                      })
                    }
                    aria-invalid={!!rulePortErr}
                    className={cn(
                      rulePortErr &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {rulePortErr && (
                    <p className="text-destructive text-xs">{rulePortErr}</p>
                  )}
                </div>
                <div>
                  <label
                    className={cn(
                      "text-xs text-muted-foreground",
                      ruleTargetErr && "text-destructive"
                    )}
                  >
                    Target (host:port)
                  </label>
                  <Input
                    value={rule.target}
                    onChange={(e) => updateRule(i, { target: e.target.value })}
                    placeholder="backend:8080"
                    aria-invalid={!!ruleTargetErr}
                    className={cn(
                      ruleTargetErr &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {ruleTargetErr && (
                    <p className="text-destructive text-xs">{ruleTargetErr}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Path prefix
                  </label>
                  <Input
                    value={rule.pathPrefix}
                    onChange={(e) =>
                      updateRule(i, { pathPrefix: e.target.value })
                    }
                    placeholder="/api/v1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">TLS</label>
                  <input
                    type="checkbox"
                    checked={rule.tlsEnabled}
                    onChange={(e) =>
                      updateRule(i, { tlsEnabled: e.target.checked })
                    }
                  />
                </div>
              </div>
              {rules.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(i)}
                >
                  Remove rule
                </Button>
              )}
            </div>
          );
        })}
        {errors.rules && (
          <p className="text-destructive text-xs">{errors.rules}</p>
        )}
      </CardContent>
    </Card>
  );
}
