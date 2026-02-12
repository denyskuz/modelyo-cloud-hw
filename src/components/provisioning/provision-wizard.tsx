"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRole } from "@/auth/role-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepSelectType } from "@/components/provisioning/steps/step-select-type";
import { StepConfigKubernetes } from "@/components/provisioning/steps/step-config-kubernetes";
import { StepConfigGateway } from "@/components/provisioning/steps/step-config-gateway";
import { StepConfigPostgres } from "@/components/provisioning/steps/step-config-postgres";
import { StepReview } from "@/components/provisioning/steps/step-review";
import { StepProgress } from "@/components/provisioning/steps/step-progress";
import {
  provisionKubernetesSchema,
  provisionGatewaySchema,
  provisionPostgresSchema,
} from "@/domain/provisioning/schema";
import { isUniqueServiceName } from "@/domain/provisioning/unique-name";
import { isTenantSlug, type TenantSlug } from "@/lib/tenant";
import type {
  ProvisionServiceType,
  ProvisionPayload,
} from "@/domain/provisioning/types";
import { toast } from "sonner";

const STORAGE_KEY = "provision-wizard";

/** Default config per type so region, version, etc. are pre-selected and validation passes. */
function getDefaultConfig(
  type: ProvisionServiceType
): Partial<ProvisionPayload> {
  switch (type) {
    case "kubernetes":
      return {
        region: "EU-West-1",
        kubernetesVersion: "1.29",
        nodePools: [
          { poolName: "", instanceType: "Standard-2vCPU-8GB", desiredNodes: 1 },
        ],
      };
    case "gateway":
      return {
        region: "EU-West-1",
        vpcId: "",
        rules: [
          {
            name: "",
            protocol: "https",
            externalPort: 443,
            target: "",
            pathPrefix: "/api/v1",
            tlsEnabled: true,
          },
        ],
      };
    case "postgres":
      return {
        region: "EU-West-1",
        pgVersion: "16",
        tier: "Small-2vCPU-4GB",
        storageAllocatedGb: 20,
        haMode: "primary_only",
      };
    default:
      return {};
  }
}

function mergeConfigWithDefaults(
  type: ProvisionServiceType | null,
  config: Partial<ProvisionPayload>
): Partial<ProvisionPayload> {
  if (!type) return config;
  return { ...getDefaultConfig(type), ...config };
}

type Step = 1 | 2 | 3 | 4 | 5;

function loadState(): {
  step: Step;
  type: ProvisionServiceType | null;
  config: Partial<ProvisionPayload>;
} {
  if (typeof window === "undefined") return { step: 1, type: null, config: {} };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { step: 1, type: null, config: {} };
    const parsed = JSON.parse(raw);
    return {
      step: Math.min(5, Math.max(1, Number(parsed.step) || 1)) as Step,
      type: parsed.type ?? null,
      config: parsed.config ?? {},
    };
  } catch {
    return { step: 1, type: null, config: {} };
  }
}

function saveState(
  step: Step,
  type: ProvisionServiceType | null,
  config: Partial<ProvisionPayload>
) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, type, config }));
  } catch {}
}

export function ProvisionWizard() {
  const params = useParams();
  const router = useRouter();
  const tenant = (params?.tenant as string) ?? null;
  const role = useRole();

  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<ProvisionServiceType | null>(
    null
  );
  const [config, setConfig] = useState<Partial<ProvisionPayload>>({});
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [nameUniqueError, setNameUniqueError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);

  useEffect(() => {
    const { step: s, type: t, config: c } = loadState();
    setStep(s);
    setSelectedType(t);
    setConfig(c);
  }, []);

  const persist = useCallback(() => {
    saveState(step, selectedType, config);
  }, [step, selectedType, config]);

  useEffect(() => {
    persist();
  }, [persist]);

  const tenantSlug =
    tenant && isTenantSlug(tenant) ? (tenant as TenantSlug) : null;

  if (role !== "admin" || !tenantSlug) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            You don’t have permission to provision services.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleNextFromConfig = () => {
    if (!selectedType) return;
    setConfigErrors({});

    const schema =
      selectedType === "kubernetes"
        ? provisionKubernetesSchema
        : selectedType === "gateway"
          ? provisionGatewaySchema
          : provisionPostgresSchema;

    const merged = mergeConfigWithDefaults(selectedType, config);
    const full: Record<string, unknown> = { ...merged, type: selectedType };
    const result = schema.safeParse(full);

    if (!result.success) {
      const errors: Record<string, string> = {};
      const issues =
        "issues" in result.error
          ? (
              result.error as {
                issues: { path: (string | number)[]; message: string }[];
              }
            ).issues
          : [];
      issues.forEach((e) => {
        const path = e.path.join(".");
        if (!errors[path]) errors[path] = e.message;
      });
      setConfigErrors(errors);
      const firstMessage = issues[0]?.message ?? "Invalid configuration";
      toast.error(firstMessage, {
        description: "Please fix the errors in the form.",
      });
      return;
    }
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!selectedType || !tenantSlug) return;
    const schema =
      selectedType === "kubernetes"
        ? provisionKubernetesSchema
        : selectedType === "gateway"
          ? provisionGatewaySchema
          : provisionPostgresSchema;
    const merged = mergeConfigWithDefaults(selectedType, config);
    const full: Record<string, unknown> = { ...merged, type: selectedType };
    const parsed = schema.safeParse(full);
    if (!parsed.success) {
      toast.error("Invalid configuration");
      return;
    }
    const payload = parsed.data as ProvisionPayload;
    const unique = await isUniqueServiceName(tenantSlug, payload.name);
    if (!unique) {
      setNameUniqueError(
        `A service named "${payload.name}" already exists in this tenant.`
      );
      return;
    }
    setNameUniqueError(null);
    setConfirming(true);
    try {
      const res = await fetch("/api/services/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant: tenantSlug, payload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Provisioning failed");
      }
      const { progress } = await res.json();
      setProgressMessages(progress);
      setStep(4);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      toast.success("Service created");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Provisioning failed");
    } finally {
      setConfirming(false);
    }
  };

  const stepLabels = ["Type", "Configure", "Review", "Progress"] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg border bg-card px-3 py-2 sm:px-4 sm:py-3 text-card-foreground">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const active = step === stepNum;
          const done = step > stepNum;
          return (
            <div
              key={label}
              className={`flex items-center gap-1.5 text-sm ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                }`}
              >
                {done ? "✓" : stepNum}
              </span>
              <span>{label}</span>
              {i < stepLabels.length - 1 && (
                <span className="mx-1 text-muted-foreground/50" aria-hidden>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <StepSelectType
          value={selectedType}
          onChange={(t) => {
            setSelectedType(t);
            setConfig(t ? getDefaultConfig(t) : {});
          }}
        />
      )}

      {step === 2 && Object.keys(configErrors).length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
            {Object.entries(configErrors).map(([path, msg]) => (
              <li key={path}>
                <span className="font-medium text-destructive">{path}</span>:{" "}
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 2 && selectedType === "kubernetes" && (
        <StepConfigKubernetes
          data={
            mergeConfigWithDefaults(selectedType, config) as Partial<
              import("@/domain/provisioning/types").ProvisionKubernetesPayload
            >
          }
          onChange={setConfig as (d: Partial<ProvisionPayload>) => void}
          errors={configErrors}
        />
      )}

      {step === 2 && selectedType === "gateway" && (
        <StepConfigGateway
          data={
            mergeConfigWithDefaults(selectedType, config) as Partial<
              import("@/domain/provisioning/types").ProvisionGatewayPayload
            >
          }
          onChange={setConfig as (d: Partial<ProvisionPayload>) => void}
          errors={configErrors}
        />
      )}

      {step === 2 && selectedType === "postgres" && (
        <StepConfigPostgres
          data={
            mergeConfigWithDefaults(selectedType, config) as Partial<
              import("@/domain/provisioning/types").ProvisionPostgresPayload
            >
          }
          onChange={setConfig as (d: Partial<ProvisionPayload>) => void}
          errors={configErrors}
        />
      )}

      {step === 3 && selectedType && (
        <StepReview
          payload={
            {
              ...mergeConfigWithDefaults(selectedType, config),
              type: selectedType,
            } as ProvisionPayload
          }
          nameError={nameUniqueError}
        />
      )}

      {step === 4 && (
        <StepProgress
          messages={
            progressMessages.length
              ? progressMessages
              : ["Creating…", "Provisioning…", "Ready"]
          }
        />
      )}

      {step < 4 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
            disabled={step === 1}
          >
            Back
          </Button>
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!selectedType}>
              Next
            </Button>
          )}
          {step === 2 && <Button onClick={handleNextFromConfig}>Next</Button>}
          {step === 3 && (
            <Button onClick={handleConfirm} disabled={confirming}>
              {confirming ? "Creating…" : "Create"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
