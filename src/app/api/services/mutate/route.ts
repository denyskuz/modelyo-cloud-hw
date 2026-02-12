import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { can } from "@/auth/ability";
import { ACTIONS } from "@/auth/permissions";
import { getDemoRole } from "@/auth/role";
import { isTenantSlug, type TenantSlug } from "@/lib/tenant";
import { mutate } from "@/services/mock-api";
import type { ServiceType } from "@/domain/service/service";

const VALID_TYPES: ServiceType[] = ["kubernetes", "gateway", "postgres"];

export async function POST(request: Request) {
  let body: {
    tenant?: string;
    type?: string;
    id?: string;
    action?: string;
    payload?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant, type, id, action, payload } = body;

  const role = getDemoRole(await cookies());
  const required =
    type === "gateway" && (action === "add_rule" || action === "edit_rule")
      ? ACTIONS.GATEWAY_RULE_EDIT
      : type === "gateway" && (action === "enable" || action === "disable")
        ? ACTIONS.GATEWAY_RULE_DISABLE
        : ACTIONS.SERVICE_MUTATE;
  if (!can(role, required)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!tenant || !isTenantSlug(tenant)) {
    return NextResponse.json(
      { error: "Valid tenant required" },
      { status: 400 }
    );
  }
  if (!type || !VALID_TYPES.includes(type as ServiceType)) {
    return NextResponse.json(
      { error: "type must be kubernetes, gateway, or postgres" },
      { status: 400 }
    );
  }
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  try {
    const updated = await mutate(
      tenant as TenantSlug,
      type as ServiceType,
      id,
      action,
      payload
    );
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mutation failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
