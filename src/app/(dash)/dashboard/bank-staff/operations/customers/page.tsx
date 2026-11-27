import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import StaffCustomersView from "@/components/dashboard/staff/StaffCustomersView";

export default async function BankStaffAllCustomersPage() {
  const user = await getUserSession();
  if (!user) redirect("/login");

  const role = (user as { role?: string }).role;
  if (role !== "bank-staff" && role !== "admin") {
    redirect("/dashboard/customer/status");
  }

  return <StaffCustomersView />;
}
