import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import StaffOperationsView from "@/components/dashboard/staff/StaffOperationsView";

export default async function BankStaffOperationsPage() {
  const user = await getUserSession();
  if (!user) redirect("/login");

  const role = (user as { role?: string }).role;
  if (role !== "bank-staff" && role !== "admin") {
    redirect("/dashboard/customer/status");
  }

  return <StaffOperationsView />;
}
