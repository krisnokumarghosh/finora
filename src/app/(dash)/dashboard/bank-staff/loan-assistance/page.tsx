import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import StaffLoansView from "@/components/dashboard/staff/StaffLoansView";

export default async function BankStaffLoanAssistancePage() {
  const user = await getUserSession();
  if (!user) redirect("/login");

  const role = (user as { role?: string }).role;
  if (role !== "bank-staff" && role !== "admin") {
    redirect("/dashboard/customer/status");
  }

  return <StaffLoansView />;
}
