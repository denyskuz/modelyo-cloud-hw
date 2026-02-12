import type { KubernetesCluster } from "@/domain/kubernetes/types";
import type { ApiGateway } from "@/domain/gateway/types";
import type { PostgresDb } from "@/domain/postgres/types";

export type ServiceType = "kubernetes" | "gateway" | "postgres";

export type Service = KubernetesCluster | ApiGateway | PostgresDb;

export type ServiceId = string;
