import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import AdminLoansView from "@/components/dashboard/admin/AdminLoansView";

export default async function AdminLoansPage() {
  const user = await getUserSession();
  if (!user) redirect("/login");

  const role = (user as { role?: string }).role;
  if (role !== "admin") {
    redirect("/dashboard/customer/status");
  }

  return <AdminLoansView />;
}
