"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleSwitcher } from "@/components/role-switcher";
import { useRole } from "@/auth/role-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const role = useRole();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-2 min-w-0">
            {role != null ? (
              <RoleSwitcher currentRole={role} />
            ) : (
              <span className="text-muted-foreground text-xs">Role: —</span>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
