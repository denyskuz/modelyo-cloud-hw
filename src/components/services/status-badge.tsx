"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "green" | "amber" | "red" | "neutral";

const statusToVariant: Record<string, StatusVariant> = {
  green: "green",
  amber: "amber",
  red: "red",
  running: "green",
  creating: "amber",
  updating: "amber",
  deleting: "red",
  failed: "red",
  ready: "green",
  pending: "amber",
  not_ready: "red",
  draining: "amber",
  active: "green",
  inactive: "neutral",
  available: "green",
  stopped: "neutral",
  maintenance: "amber",
  backup_in_progress: "amber",
  primary_only: "neutral",
  primary_read_replica: "neutral",
  disabled: "neutral",
  enabled: "green",
};

const variantToBadge: Record<
  StatusVariant,
  "default" | "secondary" | "destructive" | "outline"
> = {
  green: "default",
  amber: "secondary",
  red: "destructive",
  neutral: "outline",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/_/g, " ");
  const variant: StatusVariant = statusToVariant[status] ?? "neutral";
  return (
    <Badge variant={variantToBadge[variant]} className={cn(className)}>
      {normalized}
    </Badge>
  );
}
