"use client";

import Link from "next/link";
import { Can } from "@/components/auth/Can";
import { ACTIONS } from "@/auth/permissions";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export function DashboardProvisionButton() {
  return (
    <Can action={ACTIONS.SERVICE_PROVISION}>
      <Button size="sm" asChild>
        <Link href="/provision">
          <PlusCircle className="mr-1.5 size-4" />
          Provision service
        </Link>
      </Button>
    </Can>
  );
}
