import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import AdminBankAccountsView from "@/components/dashboard/admin/AdminBankAccountsView";

export default async function AdminBankAccountsPage() {
  const user = await getUserSession();
  if (!user) redirect("/login");

  const role = (user as { role?: string }).role;
  if (role !== "admin") {
    redirect("/dashboard/customer/status");
  }

  return <AdminBankAccountsView />;
}
