import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/domain/common/cost";
import {
  storageUsage,
  maskedConnectionString,
} from "@/domain/postgres/helpers";
import type { PostgresDb } from "@/domain/postgres/types";

function formatBackupTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function PostgresDetailOverview({ db }: { db: PostgresDb }) {
  const usage = storageUsage(db);
  const maskedConn = maskedConnectionString(db);
  const lastBackups = (db.backups || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Instance details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Region:</span> {db.region}
          </p>
          <p>
            <span className="text-muted-foreground">PostgreSQL version:</span>{" "}
            {db.version}
          </p>
          <p>
            <span className="text-muted-foreground">Tier:</span> {db.tier}
          </p>
          <p>
            <span className="text-muted-foreground">Monthly cost:</span>{" "}
            {formatMoney(db.monthlyCost)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          <p>
            <span className="text-muted-foreground">Host:</span> {db.host}
          </p>
          <p>
            <span className="text-muted-foreground">Port:</span> {db.port}
          </p>
          <p>
            <span className="text-muted-foreground">Database:</span> {db.dbName}
          </p>
          <p>
            <span className="text-muted-foreground">Password:</span> ••••••••
          </p>
          <p>
            <span className="text-muted-foreground">Connection string:</span>{" "}
            <span className="break-all">{maskedConn}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            {usage.usedGb} GB used / {usage.allocatedGb} GB allocated (
            {usage.percent.toFixed(0)}%)
          </p>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${Math.min(100, usage.percent)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {db.haMode === "primary_read_replica" && db.replicaStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Replica status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Read replica:{" "}
              <span className="capitalize">{db.replicaStatus}</span>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent backups (last 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {lastBackups.length === 0 ? (
            <p className="text-muted-foreground text-sm">No backups yet</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {lastBackups.map((b) => (
                <li key={b.id}>
                  {formatBackupTime(b.at)}
                  {b.sizeGb != null && ` · ${b.sizeGb} GB`}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
