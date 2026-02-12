"use client";

import { useState } from "react";
import type { TenantSlug } from "@/lib/tenant";
import type { PostgresDb } from "@/domain/postgres/types";
import { DetailLayout } from "@/components/services/detail-layout";
import { StatusBadge } from "@/components/services/status-badge";
import { StatusTimeline } from "@/components/services/status-timeline";
import { PostgresDetailOverview } from "./postgres-detail-overview";
import { PostgresDetailActions } from "./postgres-detail-actions";

export function PostgresDetailClient({
  tenant,
  initialDb,
}: {
  tenant: TenantSlug;
  initialDb: PostgresDb;
}) {
  const [db, setDb] = useState<PostgresDb>(initialDb);

  const overview = (
    <>
      <PostgresDetailOverview db={db} />
      <PostgresDetailActions tenant={tenant} db={db} onUpdated={setDb} />
    </>
  );

  const activity = <StatusTimeline items={db.statusHistory} />;

  const badges = (
    <>
      <StatusBadge status={db.status} />
      <StatusBadge status={db.haMode} />
    </>
  );

  return (
    <DetailLayout
      title={db.name}
      badges={badges}
      overview={overview}
      activity={activity}
    />
  );
}
