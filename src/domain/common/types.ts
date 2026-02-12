export type Money = { amount: number; currency: "USD" };

export type Region = "EU-West-1" | "US-East-1" | "EU-Central-1";

export type ISODate = string;

export type StatusHistoryItem = { id: string; message: string; at: ISODate };

/** Audit log entry for dashboard; tenant-scoped. */
export type AuditEntry = {
  id: string;
  at: ISODate;
  actorRole: "Admin" | "Viewer" | "system";
  tenant: string;
  action: string;
  entityType: "kubernetes" | "gateway" | "postgres";
  entityId: string;
  entityName: string;
  message: string;
};
