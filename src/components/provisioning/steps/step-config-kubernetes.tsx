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
  ProvisionKubernetesPayload,
  ProvisionKubernetesNodePool,
} from "@/domain/provisioning/types";
import type { Region } from "@/domain/common/types";
import { InstanceType } from "@/domain/kubernetes/types";

const REGIONS: Region[] = ["EU-West-1", "US-East-1", "EU-Central-1"];
const VERSIONS = ["1.28", "1.29", "1.30"] as const;
const INSTANCE_TYPES = [
  InstanceType.Standard2vCPU8GB,
  InstanceType.Performance4vCPU16GB,
  InstanceType.HighMem8vCPU32GB,
];

const defaultPool = (): ProvisionKubernetesNodePool => ({
  poolName: "",
  instanceType: InstanceType.Standard2vCPU8GB,
  desiredNodes: 1,
});

export function StepConfigKubernetes({
  data,
  onChange,
  errors,
}: {
  data: Partial<ProvisionKubernetesPayload>;
  onChange: (d: Partial<ProvisionKubernetesPayload>) => void;
  errors: Record<string, string>;
}) {
  const pools = data.nodePools ?? [defaultPool()];

  const addPool = () => {
    onChange({ ...data, nodePools: [...pools, defaultPool()] });
  };

  const updatePool = (
    index: number,
    patch: Partial<ProvisionKubernetesNodePool>
  ) => {
    const next = [...pools];
    next[index] = { ...next[index], ...patch };
    onChange({ ...data, nodePools: next });
  };

  const removePool = (index: number) => {
    if (pools.length <= 1) return;
    const next = pools.filter((_, i) => i !== index);
    onChange({ ...data, nodePools: next });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Kubernetes cluster</CardTitle>
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
            placeholder="my-cluster"
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
              errors.kubernetesVersion && "text-destructive"
            )}
          >
            Kubernetes version
          </label>
          <Select
            value={data.kubernetesVersion ?? "1.29"}
            onValueChange={(v) =>
              onChange({
                ...data,
                kubernetesVersion: v as "1.28" | "1.29" | "1.30",
              })
            }
          >
            <SelectTrigger
              className={cn(
                errors.kubernetesVersion &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERSIONS.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.kubernetesVersion && (
            <p className="text-destructive text-xs">
              {errors.kubernetesVersion}
            </p>
          )}
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Node pools</span>
          <Button type="button" variant="outline" size="sm" onClick={addPool}>
            Add pool
          </Button>
        </div>
        {pools.map((pool, i) => {
          const poolNameError = errors[`nodePools.${i}.poolName`];
          const desiredNodesError = errors[`nodePools.${i}.desiredNodes`];
          return (
            <div
              key={i}
              className={cn(
                "rounded-md border p-4 space-y-2",
                (errors.nodePools || poolNameError || desiredNodesError) &&
                  "border-destructive/50"
              )}
            >
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <label
                    className={cn(
                      "text-xs text-muted-foreground",
                      poolNameError && "text-destructive"
                    )}
                  >
                    Pool name
                  </label>
                  <Input
                    value={pool.poolName}
                    onChange={(e) =>
                      updatePool(i, { poolName: e.target.value })
                    }
                    placeholder="default"
                    aria-invalid={!!poolNameError}
                    className={cn(
                      poolNameError &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {poolNameError && (
                    <p className="text-destructive text-xs">{poolNameError}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Instance type
                  </label>
                  <Select
                    value={pool.instanceType}
                    onValueChange={(v) =>
                      updatePool(i, { instanceType: v as InstanceType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTANCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    className={cn(
                      "text-xs text-muted-foreground",
                      desiredNodesError && "text-destructive"
                    )}
                  >
                    Desired nodes (min 1)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={pool.desiredNodes}
                    onChange={(e) =>
                      updatePool(i, {
                        desiredNodes: Number(e.target.value) || 1,
                      })
                    }
                    aria-invalid={!!desiredNodesError}
                    className={cn(
                      desiredNodesError &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {desiredNodesError && (
                    <p className="text-destructive text-xs">
                      {desiredNodesError}
                    </p>
                  )}
                </div>
              </div>
              {pools.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePool(i)}
                >
                  Remove pool
                </Button>
              )}
            </div>
          );
        })}
        {errors.nodePools && (
          <p className="text-destructive text-xs">{errors.nodePools}</p>
        )}
      </CardContent>
    </Card>
  );
}
