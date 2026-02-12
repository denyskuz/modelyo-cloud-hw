"use client";

import * as React from "react";
import { ChevronsUpDown, Building2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { TENANTS, tenantDisplayName, type TenantSlug } from "@/lib/tenant";
import { buildTenantUrl, navigateToTenant } from "@/lib/tenant-routing";

const IP_HOST_TOAST_MESSAGE =
  "Tenant switching by subdomain isn't available when using an IP address (e.g. 127.0.0.1 or IPv6). Use tenant subdomains instead: acme.localhost:3000 and globex.localhost:3000 (or your production subdomains).";

export function TenantSwitcher({
  currentTenant,
}: {
  currentTenant: TenantSlug;
}) {
  const { isMobile } = useSidebar();

  const handleSelect = React.useCallback(
    (slug: TenantSlug) => {
      if (slug === currentTenant) return;
      if (typeof window === "undefined") return;
      const url = buildTenantUrl(slug, "/dashboard");
      if (!url) {
        toast.info(IP_HOST_TOAST_MESSAGE, { duration: 8000 });
        return;
      }
      navigateToTenant(slug);
    },
    [currentTenant]
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              aria-label="Switch tenant"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {tenantDisplayName(currentTenant)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentTenant}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Tenants
            </DropdownMenuLabel>
            {TENANTS.map(({ slug, displayName }, index) => {
              const isCurrent = slug === currentTenant;
              return (
                <DropdownMenuItem
                  key={slug}
                  onClick={() => handleSelect(slug)}
                  disabled={isCurrent}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Building2 className="size-3.5 shrink-0" />
                  </div>
                  {displayName}
                  {isCurrent ? (
                    <Check className="ml-auto size-4" />
                  ) : (
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2 cursor-default" disabled>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Building2 className="size-4" />
              </div>
              <span className="text-muted-foreground font-medium text-xs">
                More tenants — contact admin
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
