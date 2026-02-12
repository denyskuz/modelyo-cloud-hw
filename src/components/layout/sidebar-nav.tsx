"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Palette } from "lucide-react";
import { Can } from "@/components/auth/Can";
import { ACTIONS } from "@/auth/permissions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ui", label: "UI", icon: Palette },
] as const;

/** Normalize pathname to public path for active-state comparison (middleware rewrites hide /s/[tenant]). */
function toPublicPath(pathname: string): string {
  const match = pathname.match(/^\/s\/[^/]+(\/.*)?$/);
  return match ? (match[1] ?? "/") : pathname;
}

export function SidebarNav() {
  const pathname = usePathname();
  const publicPath = toPublicPath(pathname);

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = publicPath === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <Can action={ACTIONS.SERVICE_PROVISION}>
        <Link
          href="/provision"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            publicPath === "/provision"
              ? "bg-primary/10 text-foreground"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <PlusCircle className="size-4 shrink-0" />
          Provision
        </Link>
      </Can>
    </nav>
  );
}
