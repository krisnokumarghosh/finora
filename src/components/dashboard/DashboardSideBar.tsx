"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UserCog,
  ArrowLeftRight,
  Landmark,
  BarChart3,
  Users,
  Building2,
  HandCoins,
  ClipboardList,
  Receipt,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  Home,
  type LucideIcon,
} from "lucide-react";
// TODO: nijer auth-client path onujayi import ta thik koro
import { authClient } from "@/lib/auth-client";
import { LogoLight } from "@/lib/utils/Logo";

type Role = "customer" | "admin" | "bank-staff";
type NavItem = { label: string; short: string; href: string; icon: LucideIcon };

// TODO: href gulo nijer real route onujayi bodle nio
const NAV: Record<Role, NavItem[]> = {
  customer: [
    {
      label: "Customer Dashboard",
      short: "Dashboard",
      href: "/dashboard/customer/status",
      icon: LayoutDashboard,
    },
    {
      label: "Account Management",
      short: "Accounts",
      href: "/dashboard/customer/accounts",
      icon: UserCog,
    },
    {
      label: "Fund Transfer",
      short: "Transfer",
      href: "/dashboard/customer/transfer",
      icon: ArrowLeftRight,
    },
    {
      label: "Deposit & Withdrawal",
      short: "Deposit",
      href: "/dashboard/customer/funds",
      icon: Landmark,
    },
  ],
  admin: [
    {
      label: "Dashboard & Analytics",
      short: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: BarChart3,
    },
    {
      label: "Customer Management",
      short: "Customers",
      href: "/dashboard/admin/customers",
      icon: Users,
    },
    {
      label: "Bank Account Management",
      short: "Bank Accounts",
      href: "/dashboard/admin/bank-accounts",
      icon: Building2,
    },
    {
      label: "Loan Management",
      short: "Loans",
      href: "/dashboard/admin/loans",
      icon: HandCoins,
    },
  ],
  "bank-staff": [
    {
      label: "Customer Operations",
      short: "Operations",
      href: "/dashboard/bank-staff/operations",
      icon: ClipboardList,
    },
    {
      label: "Transaction Management",
      short: "Transactions",
      href: "/dashboard/bank-staff/transactions",
      icon: Receipt,
    },
    {
      label: "Loan Assistance",
      short: "Loan Help",
      href: "/dashboard/bank-staff/loan-assistance",
      icon: LifeBuoy,
    },
  ],
};

type SidebarUser = { name: string; email: string; role?: string | null };

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export default function DashboardSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const role = (user.role && user.role in NAV ? user.role : "customer") as Role;
  const items = NAV[role];
  const capsuleItems = items.slice(0, 3);
  const drawerItems = items.slice(3);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/login") },
    });
  };

  const UserBlock = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6FB2D] text-sm font-bold text-[#2C2C2C]">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {user.name}
          </p>
          <p className="truncate text-xs text-white/50">{user.email}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-medium text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* ===== Desktop sidebar (full height) ===== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-70 flex-col border-r border-white/10 bg-[#1C1C1C] p-4 md:flex">
        {/* Logo */}
        <Link href="/" className="mb-8  px-2 pt-2">
          <LogoLight />
        </Link>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {items.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-[#E6FB2D]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  size={18}
                  className={
                    active
                      ? "text-[#E6FB2D]"
                      : "text-white/50 group-hover:text-white"
                  }
                />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="pt-4">{UserBlock}</div>
      </aside>

      {/* ===== Mobile capsule ===== */}
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:hidden">
        <nav className="flex w-full max-w-sm items-center justify-between gap-1 rounded-full border border-white/10 bg-[#1C1C1C]/90 p-1.5 shadow-xl backdrop-blur-xl">
          {capsuleItems.map(({ short, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  active
                    ? "flex-2 bg-white/10 px-4 text-[#E6FB2D]"
                    : "flex-1 text-white/60"
                }`}
              >
                <Icon size={18} />
                {active && <span className="truncate">{short}</span>}
              </Link>
            );
          })}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex h-11 flex-1 items-center justify-center rounded-full text-white/60"
          >
            <Menu size={20} />
          </button>
        </nav>
      </div>

      {/* ===== Mobile drawer ===== */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#1C1C1C] p-5 pb-8 transition-transform duration-300 md:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" onClick={() => setOpen(false)} aria-label="Go to home">
            <LogoLight />
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          {drawerItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${
                  active ? "bg-white/10 text-[#E6FB2D]" : "text-white/70"
                }`}
              >
                <Icon
                  size={18}
                  className={active ? "text-[#E6FB2D]" : "text-white/50"}
                />
                {label}
              </Link>
            );
          })}

          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/70"
          >
            <Home size={18} className="text-white/50" />
            Back to Home
          </Link>
        </div>

        {UserBlock}
      </div>
    </>
  );
}