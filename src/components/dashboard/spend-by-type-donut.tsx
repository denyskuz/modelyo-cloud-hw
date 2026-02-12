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
import { formatMoney, sumMoney } from "@/domain/common/cost";
import type { Service } from "@/domain/service/service";
import { Info } from "lucide-react";

const SPEND_EXPLANATION = "Total monthly recurring cost across all services.";

const SEGMENT_ORDER = ["kubernetes", "gateway", "postgres"] as const;
const SEGMENT_LABELS: Record<(typeof SEGMENT_ORDER)[number], string> = {
  kubernetes: "Kubernetes",
  gateway: "Gateway",
  postgres: "Postgres",
};

const chartConfig = {
  kubernetes: { label: "Kubernetes", color: "var(--chart-1)" },
  gateway: { label: "Gateway", color: "var(--chart-2)" },
  postgres: { label: "Postgres", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function SpendByTypeDonut({ services }: { services: Service[] }) {
  const byType = {
    kubernetes: sumMoney(
      services.filter((s) => s.type === "kubernetes").map((s) => s.monthlyCost)
    ),
    gateway: sumMoney(
      services.filter((s) => s.type === "gateway").map((s) => s.monthlyCost)
    ),
    postgres: sumMoney(
      services.filter((s) => s.type === "postgres").map((s) => s.monthlyCost)
    ),
  };

  const total = sumMoney(SEGMENT_ORDER.map((t) => byType[t]));
  const totalAmount = total.amount;
  const hasAnySpend = totalAmount > 0;

  /** Percentages that sum to exactly 100% (round then fix remainder to avoid 99/101). */
  const percentages = ((): Record<(typeof SEGMENT_ORDER)[number], number> => {
    if (totalAmount <= 0) return { kubernetes: 0, gateway: 0, postgres: 0 };
    const exact = SEGMENT_ORDER.map((t) => ({
      type: t,
      exact: (byType[t].amount / totalAmount) * 100,
    }));
    const rounded = exact.map(({ type, exact: v }) => ({
      type,
      rounded: Math.round(v),
      fractional: v - Math.floor(v),
    }));
    const sum = rounded.reduce((s, r) => s + r.rounded, 0);
    const diff = 100 - sum;
    if (diff !== 0) {
      const byFractional = [...rounded].sort((a, b) =>
        diff > 0 ? b.fractional - a.fractional : a.fractional - b.fractional
      );
      const idx = SEGMENT_ORDER.indexOf(byFractional[0].type);
      rounded[idx].rounded += diff;
    }
    return {
      kubernetes: rounded[0].rounded,
      gateway: rounded[1].rounded,
      postgres: rounded[2].rounded,
    };
  })();

  const pieData = SEGMENT_ORDER.map((type) => ({
    name: type,
    value: byType[type].amount,
    amount: byType[type],
    pct: percentages[type],
  })).filter((d) => d.value > 0);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Spend by service type
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="What does this show?"
              >
                <Info className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[260px]">
              <p className="text-left text-xs">{SPEND_EXPLANATION}</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasAnySpend ? (
            <>
              <div className="relative flex min-h-[180px] w-full items-center justify-center">
                <ChartContainer
                  config={chartConfig}
                  className="min-h-[180px] w-full"
                >
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => {
                            const num = Number(value);
                            const pct =
                              totalAmount > 0
                                ? Math.round((num / totalAmount) * 100)
                                : 0;
                            return `${formatMoney({ amount: num, currency: "USD" })} (${pct}%)`;
                          }}
                        />
                      }
                    />
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
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-lg font-bold tabular-nums">
                      {formatMoney(total)}
                    </div>
                    <div className="text-muted-foreground text-xs">/mo</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                {SEGMENT_ORDER.map((t) => {
                  const pct = percentages[t];
                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between gap-2 text-muted-foreground"
                    >
                      <span>{SEGMENT_LABELS[t]}</span>
                      <span className="tabular-nums">
                        {formatMoney(byType[t])}
                        <span className="ml-1 font-medium text-foreground">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No spend data
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
