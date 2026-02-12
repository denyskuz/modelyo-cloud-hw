"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";
import { Info } from "lucide-react";

export type HealthCounts = {
  healthy: number;
  attention: number;
  failed: number;
};

/**
 * Health percent = healthy / total (0–100).
 * Counts must come from severityCounts(services) in summary-cards so that
 * getServiceSeverity (K8s: status + node health, Gateway: active only, Postgres: status) is the single source of truth.
 */
export function healthPercent(counts: HealthCounts): number {
  const total = counts.healthy + counts.attention + counts.failed;
  if (total === 0) return 100;
  return Math.round((counts.healthy / total) * 100);
}

/** Overall status label for display. */
export function overallHealthStatus(
  counts: HealthCounts
): "Healthy" | "Attention" | "Failed" {
  if (counts.failed > 0) return "Failed";
  if (counts.attention > 0) return "Attention";
  return "Healthy";
}

const HEALTH_EXPLANATION =
  "Health score = healthy services / total services. Click the card to filter the list by the relevant status.";

const chartConfig = {
  healthy: { label: "Healthy", color: "var(--chart-1)" },
  attention: { label: "Attention", color: "var(--chart-2)" },
  failed: { label: "Failed", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function HealthOverviewCard({
  counts,
  onClick,
}: {
  counts: HealthCounts;
  onClick?: () => void;
}) {
  const status = overallHealthStatus(counts);
  const pct = healthPercent(counts);
  const total = counts.healthy + counts.attention + counts.failed;
  const pieData = [
    { name: "healthy", value: counts.healthy },
    { name: "attention", value: counts.attention },
    { name: "failed", value: counts.failed },
  ].filter((d) => d.value > 0);

  const hasAny = total > 0;

  return (
    <TooltipProvider>
      <Card
        className={
          onClick
            ? "cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted"
            : undefined
        }
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Health overview</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
                aria-label="How is health calculated?"
              >
                <Info className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[260px]">
              <p className="whitespace-pre-line text-left text-xs">
                {HEALTH_EXPLANATION}
              </p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasAny && pieData.length > 0 ? (
            <>
              <div className="relative flex min-h-[180px] w-full items-center justify-center">
                <ChartContainer
                  config={chartConfig}
                  className="min-h-[180px] w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={1}
                      strokeWidth={0}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={`var(--color-${entry.name})`}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold tabular-nums">
                    {pct}%
                  </span>
                  <span className="text-muted-foreground text-xs font-medium">
                    {status}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs text-center">
                Healthy: {counts.healthy} · Attention: {counts.attention} ·
                Failed: {counts.failed}
              </p>
            </>
          ) : (
            <div className="flex min-h-[100px] flex-col items-center justify-center gap-1 rounded bg-muted/50 py-4">
              <span className="text-muted-foreground text-2xl font-bold">
                —
              </span>
              <span className="text-muted-foreground text-xs">No services</span>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
