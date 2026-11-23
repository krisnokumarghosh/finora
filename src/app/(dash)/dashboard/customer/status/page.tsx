import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import CustomerDashboardView from "@/components/dashboard/customer/CustomerDashboardView";

export default async function CustomerStatusPage() {
  const user = await getUserSession();
  if (!user) {
    redirect("/login");
  }

  return (
    <CustomerDashboardView
      user={{
        name: user.name || "Customer",
        email: user.email || "",
      }}
    />
  );
}
