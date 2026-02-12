import type {
  Money,
  Region,
  StatusHistoryItem,
  ISODate,
} from "@/domain/common/types";

export const DbStatus = {
  Creating: "creating",
  Available: "available",
  Updating: "updating",
  Maintenance: "maintenance",
  BackupInProgress: "backup_in_progress",
  Stopped: "stopped",
  Deleting: "deleting",
  Failed: "failed",
} as const;
export type DbStatus = (typeof DbStatus)[keyof typeof DbStatus];

export const PgVersion = {
  V14: "14",
  V15: "15",
  V16: "16",
} as const;
export type PgVersion = (typeof PgVersion)[keyof typeof PgVersion];

export const DbTier = {
  Small2vCPU4GB: "Small-2vCPU-4GB",
  Medium4vCPU8GB: "Medium-4vCPU-8GB",
  Large8vCPU16GB: "Large-8vCPU-16GB",
} as const;
export type DbTier = (typeof DbTier)[keyof typeof DbTier];

export const HaMode = {
  PrimaryOnly: "primary_only",
  PrimaryReadReplica: "primary_read_replica",
} as const;
export type HaMode = (typeof HaMode)[keyof typeof HaMode];

export interface BackupItem {
  id: string;
  at: ISODate;
  sizeGb?: number;
}

export interface PostgresDb {
  id: string;
  name: string;
  type: "postgres";
  region: Region;
  monthlyCost: Money;
  statusHistory: StatusHistoryItem[];
  status: DbStatus;
  version: PgVersion;
  tier: DbTier;
  haMode: HaMode;
  allocatedStorageGb: number;
  usedStorageGb: number;
  host: string;
  port: number;
  dbName: string;
  backups?: BackupItem[];
  /** Mock: read replica status when haMode === "primary_read_replica" */
  replicaStatus?: "healthy" | "replicating" | "lagging";
}
