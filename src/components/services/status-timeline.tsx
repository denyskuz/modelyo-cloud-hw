"use client";

import type { StatusHistoryItem } from "@/domain/common/types";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

interface StatusTimelineProps {
  items: StatusHistoryItem[];
  className?: string;
}

export function StatusTimeline({ items, className }: StatusTimelineProps) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return (
    <ul className={className}>
      {sorted.map((item) => (
        <li
          key={item.id}
          className="flex gap-3 border-l-2 border-border pl-4 pb-4 last:pb-0 last:border-l-transparent"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">
              {formatTime(item.at)}
            </span>
            <span className="text-sm">{item.message}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
