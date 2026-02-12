import { z } from "zod";
import { isValidGatewayPort } from "@/lib/validation";
import type { ProvisionPayload } from "./types";

const NAME_SLUG = z
  .string()
  .min(3, "Name must be at least 3 characters")
  .max(40, "Name must be at most 40 characters")
  .regex(
    /^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/,
    "Name can only contain letters, numbers, and dashes"
  );

const REGION = z.enum(["EU-West-1", "US-East-1", "EU-Central-1"]);

const nodePoolSchema = z.object({
  poolName: z.string().min(1, "Pool name required"),
  instanceType: z.enum([
    "Standard-2vCPU-8GB",
    "Performance-4vCPU-16GB",
    "HighMem-8vCPU-32GB",
  ]),
  desiredNodes: z.number().int().min(1, "At least 1 node required"),
});

export const provisionKubernetesSchema = z.object({
  type: z.literal("kubernetes"),
  name: NAME_SLUG,
  region: REGION,
  kubernetesVersion: z.enum(["1.28", "1.29", "1.30"]),
  nodePools: z
    .array(nodePoolSchema)
    .min(1, "At least one node pool required")
    .refine(
      (pools) => new Set(pools.map((p) => p.poolName)).size === pools.length,
      "Pool names must be unique"
    ),
});

const targetHostPort = z
  .string()
  .regex(/^[^:]+:\d+$/, "Target must be host:port (e.g. backend:8080)");

const gatewayRuleSchema = z
  .object({
    name: z.string().min(1, "Rule name required"),
    protocol: z.enum(["http", "https", "tcp"]),
    externalPort: z.number().int(),
    target: targetHostPort,
    pathPrefix: z.string().min(1, "Path prefix required (e.g. /api/v1)"),
    tlsEnabled: z.boolean(),
  })
  .refine((r) => isValidGatewayPort(r.externalPort), {
    message: "Port must be between 1 and 65535",
    path: ["externalPort"],
  });

export const provisionGatewaySchema = z.object({
  type: z.literal("gateway"),
  name: NAME_SLUG,
  region: REGION,
  vpcId: z.string().min(1, "VPC ID required"),
  publicEndpointUrl: z.union([z.string().url(), z.literal("")]).optional(),
  rules: z.array(gatewayRuleSchema).min(1, "At least one rule required"),
});

export const provisionPostgresSchema = z.object({
  type: z.literal("postgres"),
  name: NAME_SLUG,
  region: REGION,
  pgVersion: z.enum(["14", "15", "16"]),
  tier: z.enum(["Small-2vCPU-4GB", "Medium-4vCPU-8GB", "Large-8vCPU-16GB"]),
  storageAllocatedGb: z
    .number()
    .int()
    .min(10, "Storage must be at least 10 GB"),
  haMode: z.enum(["primary_only", "primary_read_replica"]),
});

export type ProvisionKubernetesInput = z.infer<
  typeof provisionKubernetesSchema
>;
export type ProvisionGatewayInput = z.infer<typeof provisionGatewaySchema>;
export type ProvisionPostgresInput = z.infer<typeof provisionPostgresSchema>;

export function getSchemaForType(type: ProvisionPayload["type"]) {
  switch (type) {
    case "kubernetes":
      return provisionKubernetesSchema;
    case "gateway":
      return provisionGatewaySchema;
    case "postgres":
      return provisionPostgresSchema;
  }
}

export function validateProvisionPayload(
  payload: unknown
):
  | { success: true; data: ProvisionPayload }
  | { success: false; error: z.ZodError } {
  if (payload == null || typeof payload !== "object" || !("type" in payload)) {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", path: [], message: "Invalid payload" },
      ]),
    };
  }
  const type = (payload as { type: string }).type;
  const schema = getSchemaForType(type as ProvisionPayload["type"]);
  if (!schema) {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", path: [], message: "Unknown type" },
      ]),
    };
  }
  const result = schema.safeParse(payload);
  if (result.success)
    return { success: true, data: result.data as ProvisionPayload };
  return { success: false, error: result.error };
}
