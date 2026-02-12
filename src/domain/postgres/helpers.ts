import type { PostgresDb } from "./types";

export function storageUsage(db: PostgresDb): {
  usedGb: number;
  allocatedGb: number;
  percent: number;
} {
  const usedGb = db.usedStorageGb;
  const allocatedGb = db.allocatedStorageGb;
  const percent =
    allocatedGb === 0 ? 0 : Math.min(100, (usedGb / allocatedGb) * 100);
  return { usedGb, allocatedGb, percent };
}

/** Returns a partially masked connection string (password hidden). */
export function maskedConnectionString(db: PostgresDb): string {
  return `postgres://user:••••••@${db.host}:${db.port}/${db.dbName}`;
}
