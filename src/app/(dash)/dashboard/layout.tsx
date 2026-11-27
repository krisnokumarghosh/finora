import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/core/session";
import DashboardSidebar from "@/components/dashboard/DashboardSideBar";
import StoreProvider from "@/lib/redux/StoreProvider";

export const instant = false;

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getUserSession();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#F3F3EE] md:bg-white text-black">
      <DashboardSidebar
        user={{
          name: user.name,
          email: user.email,
          role: (user as { role?: string }).role,
        }}
      />
      <main className="px-0 pb-28 pt-0 sm:px-4 sm:pt-6 md:pb-6 md:pl-74 md:pr-6">
        <StoreProvider>
          <div
            className="min-h-screen rounded-none bg-[#F3F3EE] p-4 sm:min-h-[calc(100svh-8.5rem)] sm:rounded-[2rem] sm:p-8 lg:p-10 md:min-h-[calc(100svh-3rem)]"
          >
            {children}
          </div>
        </StoreProvider>
      </main>
    </div>
  );
};

export default DashboardLayout;
