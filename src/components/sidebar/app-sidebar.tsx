"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle } from "lucide-react";
import { Can } from "@/components/auth/Can";
import { ACTIONS } from "@/auth/permissions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TenantSwitcher } from "../tenant-switcher";
import { useTenant } from "@/auth/tenant-context";

/** Normalize pathname to public path for active-state comparison. */
function toPublicPath(pathname: string): string {
  const match = pathname.match(/^\/s\/[^/]+(\/.*)?$/);
  return match ? (match[1] ?? "/") : pathname;
}

export function AppSidebar() {
  const pathname = usePathname();
  const publicPath = toPublicPath(pathname);
  const tenant = useTenant();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        {tenant != null ? <TenantSwitcher currentTenant={tenant} /> : null}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[state=collapsed]/sidebar:hidden">
            Application
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={publicPath === "/dashboard"}
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4 shrink-0" />
                    <span className="group-data-[state=collapsed]/sidebar:hidden">
                      Dashboard
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Can action={ACTIONS.SERVICE_PROVISION}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={publicPath === "/provision"}
                    tooltip="Provision"
                  >
                    <Link href="/provision">
                      <PlusCircle className="size-4 shrink-0" />
                      <span className="group-data-[state=collapsed]/sidebar:hidden">
                        Provision
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Can>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-muted-foreground px-2 text-xs group-data-[state=collapsed]/sidebar:hidden">
          Modelyo · Service Cloud Portal
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
