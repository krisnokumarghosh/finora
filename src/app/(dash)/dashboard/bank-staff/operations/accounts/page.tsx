import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import StaffAccountsView from "@/components/dashboard/staff/StaffAccountsView";

export default async function BankStaffAllAccountsPage() {
  // Server-side protection: only Bank Staff and Admin can view all accounts.
  const user = await getUserSession();
  if (!user) redirect("/login");

  const role = (user as { role?: string }).role;
  if (role !== "bank-staff" && role !== "admin") {
    redirect("/dashboard/customer/status");
  }

  return <StaffAccountsView />;
}
