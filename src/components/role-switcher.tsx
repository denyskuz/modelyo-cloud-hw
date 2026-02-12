"use client";

import { useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DemoRole } from "@/auth/role";

const ROLES: { value: DemoRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "viewer", label: "Viewer" },
];

export function RoleSwitcher({ currentRole }: { currentRole: DemoRole }) {
  const handleSelect = useCallback(
    async (role: DemoRole) => {
      if (role === currentRole) return;
      const res = await fetch("/api/demo/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) return;
      window.location.reload();
    },
    [currentRole]
  );

  const currentLabel =
    ROLES.find((r) => r.value === currentRole)?.label ?? currentRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[8rem] justify-between gap-2 text-muted-foreground font-normal"
          aria-label="Switch role"
        >
          <span className="truncate">Role: {currentLabel}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[8rem]">
        {ROLES.map(({ value, label }) => {
          const isCurrent = value === currentRole;
          return (
            <DropdownMenuItem
              key={value}
              disabled={isCurrent}
              onClick={() => handleSelect(value)}
            >
              {isCurrent ? (
                <Check className="mr-2 size-4 shrink-0" />
              ) : (
                <span className="mr-2 inline-block w-4 shrink-0" aria-hidden />
              )}
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
