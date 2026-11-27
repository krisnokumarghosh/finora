import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import StaffTransactionsView from "@/components/dashboard/staff/StaffTransactionsView";

export default async function BankStaffTransactionsPage() {
  const user = await getUserSession();
  if (!user) redirect("/login");

  const role = (user as { role?: string }).role;
  if (role !== "bank-staff" && role !== "admin") {
    redirect("/dashboard/customer/status");
  }

  return <StaffTransactionsView />;
}
