import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { can } from "@/auth/ability";
import { ACTIONS } from "@/auth/permissions";
import { getDemoRole } from "@/auth/role";
import { isTenantSlug, type TenantSlug } from "@/lib/tenant";
import { provision } from "@/services/mock-api";

export async function POST(request: Request) {
  const role = getDemoRole(await cookies());
  if (!can(role, ACTIONS.SERVICE_PROVISION)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { tenant?: string; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant, payload } = body;
  if (!tenant || !isTenantSlug(tenant)) {
    return NextResponse.json(
      { error: "Valid tenant required" },
      { status: 400 }
    );
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "payload required" }, { status: 400 });
  }

  try {
    const result = await provision(tenant as TenantSlug, payload);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provisioning failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
