"use client";

import { authClient } from "@/lib/auth-client";
import { errorToast, successToast } from "@/lib/utils/toasts";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_ACCOUNTS = [
  {
    role: "Admin",
    email: "admin@gmail.com",
    password: "Admin@123",
  },
  {
    role: "Staff",
    email: "staff@gmail.com",
    password: "Staff@123",
  },
  {
    role: "Customer",
    email: "customer@gmail.com",
    password: "Customer@123",
  },
] as const;

const DASHBOARD_BY_ROLE: Record<string, string> = {
  customer: "/dashboard/customer/status",
  admin: "/dashboard/admin/analytics",
  "bank-staff": "/dashboard/bank-staff/operations",
};

export default function DemoAccountCards() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleQuickLogin = async (email: string, password: string, role: string) => {
    setLoadingRole(role);
    try {
      const { data, error } = await authClient.signIn.email({ email, password });

      if (error) {
        errorToast(error.message || "Could not log in.");
        setLoadingRole(null);
        return;
      }

      if (!data) {
        errorToast("Login failed. Please try again.");
        setLoadingRole(null);
        return;
      }

      successToast("Welcome back! You have logged in successfully.");
      const userRole = (data.user as { role?: string }).role ?? "customer";
      const destination = DASHBOARD_BY_ROLE[userRole] ?? DASHBOARD_BY_ROLE.customer;
      router.replace(destination);
    } catch (err) {
      errorToast(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setLoadingRole(null);
    }
  };

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-black/10" />
        <span className="text-xs font-medium tracking-widest text-black/40 uppercase">
          Reviewer Quick Access
        </span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <div className="flex flex-col gap-3">
        {DEMO_ACCOUNTS.map(({ role, email, password }) => {
          const isLoading = loadingRole === role;
          return (
            <button
              key={role}
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleQuickLogin(email, password, role)}
              className="group flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-left transition-colors duration-200 hover:bg-[#E6FB2D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-black">{role}</span>
                <span className="text-xs text-black/50">{email}</span>
                <span className="mt-0.5 text-xs tracking-widest text-black/30">
                  {"•".repeat(password.length)}
                </span>
              </div>

              <span className="ml-4 flex size-8 shrink-0 items-center justify-center rounded-full bg-black/5 transition-colors duration-200 group-hover:bg-[#2C2C2C]">
                {isLoading ? (
                  <svg
                    className="size-4 animate-spin text-[#2C2C2C] group-hover:text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4 text-black/40 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
