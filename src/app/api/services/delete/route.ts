import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { can } from "@/auth/ability";
import { ACTIONS } from "@/auth/permissions";
import { getDemoRole } from "@/auth/role";
import { isTenantSlug, type TenantSlug } from "@/lib/tenant";
import { deleteService } from "@/services/mock-api";
import type { ServiceType } from "@/domain/service/service";

const VALID_TYPES: ServiceType[] = ["kubernetes", "gateway", "postgres"];

export async function POST(request: Request) {
  const role = getDemoRole(await cookies());
  if (!can(role, ACTIONS.SERVICE_MUTATE)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { tenant?: string; type?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant, type, id } = body;
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

  try {
    await deleteService(tenant as TenantSlug, type as ServiceType, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
