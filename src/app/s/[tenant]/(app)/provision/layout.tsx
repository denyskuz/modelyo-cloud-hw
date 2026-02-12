import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoRole } from "@/auth/role";
import { can } from "@/auth/ability";
import { ACTIONS } from "@/auth/permissions";

export default async function ProvisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = getDemoRole(cookieStore);
  if (!can(role, ACTIONS.SERVICE_PROVISION)) {
    redirect("/access-denied");
  }
  return <>{children}</>;
}
