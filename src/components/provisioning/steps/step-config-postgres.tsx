"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ProvisionPostgresPayload } from "@/domain/provisioning/types";
import type { Region } from "@/domain/common/types";

const REGIONS: Region[] = ["EU-West-1", "US-East-1", "EU-Central-1"];
const VERSIONS = ["14", "15", "16"] as const;
const TIERS = [
  "Small-2vCPU-4GB",
  "Medium-4vCPU-8GB",
  "Large-8vCPU-16GB",
] as const;
const HA_MODES = [
  { value: "primary_only" as const, label: "Primary-only" },
  { value: "primary_read_replica" as const, label: "Primary + Read Replica" },
] as const;

export function StepConfigPostgres({
  data,
  onChange,
  errors,
}: {
  data: Partial<ProvisionPostgresPayload>;
  onChange: (d: Partial<ProvisionPostgresPayload>) => void;
  errors: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure PostgreSQL database</CardTitle>
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
            placeholder="my-db"
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
              errors.pgVersion && "text-destructive"
            )}
          >
            PostgreSQL version
          </label>
          <Select
            value={data.pgVersion ?? "16"}
            onValueChange={(v) =>
              onChange({ ...data, pgVersion: v as (typeof VERSIONS)[number] })
            }
          >
            <SelectTrigger
              className={cn(
                errors.pgVersion &&
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
          {errors.pgVersion && (
            <p className="text-destructive text-xs">{errors.pgVersion}</p>
          )}
        </div>
        <div className="grid gap-2">
          <label
            className={cn(
              "text-sm font-medium",
              errors.tier && "text-destructive"
            )}
          >
            Tier
          </label>
          <Select
            value={data.tier ?? "Small-2vCPU-4GB"}
            onValueChange={(v) =>
              onChange({ ...data, tier: v as (typeof TIERS)[number] })
            }
          >
            <SelectTrigger
              className={cn(
                errors.tier &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <label
            className={cn(
              "text-sm font-medium",
              errors.storageAllocatedGb && "text-destructive"
            )}
          >
            Storage (GB, min 10)
          </label>
          <Input
            type="number"
            min={10}
            value={data.storageAllocatedGb ?? 20}
            onChange={(e) =>
              onChange({
                ...data,
                storageAllocatedGb: Number(e.target.value) || 10,
              })
            }
            aria-invalid={!!errors.storageAllocatedGb}
            className={cn(
              errors.storageAllocatedGb &&
                "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.storageAllocatedGb && (
            <p className="text-destructive text-xs">
              {errors.storageAllocatedGb}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <label
            className={cn(
              "text-sm font-medium",
              errors.haMode && "text-destructive"
            )}
          >
            HA mode
          </label>
          <Select
            value={data.haMode ?? "primary_only"}
            onValueChange={(v) =>
              onChange({
                ...data,
                haMode: v as (typeof HA_MODES)[number]["value"],
              })
            }
          >
            <SelectTrigger
              className={cn(
                errors.haMode &&
                  "border-destructive focus-visible:ring-destructive"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HA_MODES.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.haMode && (
            <p className="text-destructive text-xs">{errors.haMode}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
