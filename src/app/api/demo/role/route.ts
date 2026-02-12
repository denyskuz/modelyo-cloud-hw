import { NextResponse } from "next/server";
import type { DemoRole } from "@/auth/role";
import { DEMO_ROLE_COOKIE_NAME } from "@/auth/role";

const VALID_ROLES: DemoRole[] = ["admin", "viewer"];

export async function POST(request: Request) {
  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = body.role;
  if (!role || !VALID_ROLES.includes(role as DemoRole)) {
    return NextResponse.json(
      { error: "role must be 'admin' or 'viewer'" },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEMO_ROLE_COOKIE_NAME, role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    httpOnly: false, // so client can show current role without round-trip; still set server-side for protection
  });
  return res;
}
