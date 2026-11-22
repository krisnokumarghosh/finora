import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import DashboardSidebar from "@/components/dashboard/DashboardSideBar";
import StoreProvider from "@/lib/redux/StoreProvider";

// cacheComponents on thakle eta lagbe (Blocking Route error ashbe na)
export const instant = false;

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getUserSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-white text-black">
      <DashboardSidebar
        user={{
          name: user.name,
          email: user.email,
          role: (user as { role?: string }).role,
        }}
      />
      <main className="px-4 pb-28 pt-6 md:pb-6 md:pl-74 md:pr-6">
        <StoreProvider>
          <div
            className="min-h-[calc(100svh-8.5rem)] rounded-[2rem] bg-[#F3F3EE] p-6 sm:p-8 lg:p-10 md:min-h-[calc(100svh-3rem)]"
          >
            {children}
          </div>
        </StoreProvider>
      </main>
    </div>
  );
};

export default DashboardLayout;
