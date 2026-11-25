"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ClipboardCheck,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  useGetStaffAccountsQuery,
  useGetStaffCustomersQuery,
  type StaffBankAccount,
  type StaffCustomer,
} from "@/lib/redux/api";
import {
  AccountStatusBadge,
  AccountTypeIcon,
  VerificationBadge,
  formatAccNo,
  formatMoney,
  initials,
} from "@/components/dashboard/staff/staffUi";
import StaffRegisterCustomerModal from "@/components/dashboard/staff/StaffRegisterCustomerModal";
import StaffCreateAccountModal from "@/components/dashboard/staff/StaffCreateAccountModal";
import StaffCustomerDetailModal from "@/components/dashboard/staff/StaffCustomerDetailModal";
import StaffAccountDetailModal from "@/components/dashboard/staff/StaffAccountDetailModal";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

export default function StaffOperationsView() {
  const customersQuery = useGetStaffCustomersQuery({ limit: 5, offset: 0 });
  const accountsQuery = useGetStaffAccountsQuery({ limit: 5, offset: 0 });

  const [showRegister, setShowRegister] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [presetCustomer, setPresetCustomer] = useState<StaffCustomer | null>(
    null
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<StaffCustomer | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<StaffBankAccount | null>(null);

  const customers = customersQuery.data?.customers || [];
  const accounts = accountsQuery.data?.accounts || [];
  const statusCounts = accountsQuery.data?.statusCounts;

  const isRefreshing = customersQuery.isFetching || accountsQuery.isFetching;

  const refresh = () => {
    customersQuery.refetch();
    accountsQuery.refetch();
  };

  const openCreateAccount = (customer?: StaffCustomer) => {
    setPresetCustomer(customer || null);
    setSelectedCustomer(null);
    setShowCreateAccount(true);
  };

  const closeCreateAccount = () => {
    setShowCreateAccount(false);
    setPresetCustomer(null);
  };

  const stats = [
    {
      label: "Total customers",
      value: customersQuery.data?.total ?? 0,
      hint: "Registered customer profiles",
      icon: Users,
      tone: "bg-[#2C2C2C] text-white",
    },
    {
      label: "Verified customers",
      value: customersQuery.data?.verifiedCount ?? 0,
      hint: "Information checked by staff",
      icon: ShieldCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Bank accounts",
      value: accountsQuery.data?.total ?? 0,
      hint: "Across all customers",
      icon: Landmark,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Awaiting review",
      value:
        (statusCounts?.pending ?? 0) + (statusCounts?.under_review ?? 0),
      hint: "Pending and under review",
      icon: ClipboardCheck,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Bank Staff"
        title="Customer Operations"
        description="Register customers, open bank accounts, verify customer information, and review account details from one place."
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2.5">
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-black/70 shadow-sm transition-all hover:border-black/20 hover:text-black disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin text-black" : ""}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-black/70 shadow-sm transition-all hover:border-black/20 hover:text-black"
            >
              <UserPlus size={14} />
              <span className="truncate">Register customer</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateAccount()}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] sm:col-span-1"
            >
              <Plus size={14} />
              Create bank account
            </button>
          </div>
        }
      />

      {/* ── Summary cards (Unified Dark Tiles inside White Container) ── */}
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-black sm:text-lg">
              Operations Summary
            </h2>
            <p className="mt-0.5 text-xs text-black/50">
              Live customer profiles and account review queue
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#F3F3EE] px-3 py-1 text-xs font-semibold text-black/60">
            4 Metrics
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-[#2C2C2C] p-4 text-white shadow-sm transition-all duration-200 hover:shadow-md sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-[11px] font-medium text-white/70 sm:text-xs">
                    {stat.label}
                  </span>
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon size={14} className="text-[#E6FB2D]" />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 sm:mt-6">
                  <span className="text-xl font-extrabold tracking-tight text-white sm:text-2xl xl:text-3xl">
                    {stat.value}
                  </span>
                  <span className="truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70 sm:px-2.5 sm:text-[11px]">
                    {stat.hint}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent customers & accounts ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">
        {/* Recent customers */}
        <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <Users size={18} className="shrink-0 text-black/50" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-black">
                  Recent customers
                </h2>
                <p className="truncate text-[11px] text-black/40">
                  Newest customer profiles
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/bank-staff/operations/customers"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-black/60 transition-colors hover:border-black/20 hover:text-black"
            >
              See all
              <ArrowRight size={12} />
            </Link>
          </div>

          {customersQuery.isLoading ? (
            <div className="divide-y divide-black/5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center justify-between gap-3 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="size-10 shrink-0 rounded-full bg-black/5" />
                    <div className="min-w-0 space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-black/5 sm:w-32" />
                      <div className="h-3 w-32 rounded bg-black/5 sm:w-44" />
                    </div>
                  </div>
                  <div className="h-5 w-16 shrink-0 rounded-full bg-black/5" />
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/35">
                <Users size={22} />
              </div>
              <p className="mt-3 text-sm font-bold text-black">
                No customers yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-black/45">
                Register the first customer to start opening bank accounts.
              </p>
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                <UserPlus size={13} />
                Register customer
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {customers.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(customer)}
                    className="group flex w-full flex-col gap-2 py-3.5 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:flex-1">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[11px] font-bold text-white">
                          {initials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-black">
                            {customer.name}
                          </p>
                          <p className="truncate text-[11px] text-black/45">
                            {customer.email}
                          </p>
                          <p className="truncate font-mono text-[10px] text-black/35">
                            {customer.id}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-black/25 transition-colors group-hover:text-black/60 sm:hidden"
                      />
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-2 pl-13 sm:justify-end sm:pl-0">
                      <div className="flex items-center gap-2 sm:block sm:text-right">
                        <p className="text-[11px] font-semibold text-black/55">
                          {customer.accountCount} account
                          {customer.accountCount === 1 ? "" : "s"}
                        </p>
                        <div className="sm:mt-0.5">
                          <VerificationBadge verified={customer.verified} />
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="hidden text-black/25 transition-colors group-hover:text-black/60 sm:block"
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent accounts */}
        <div className="min-w-0 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <Landmark size={18} className="shrink-0 text-black/50" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-black">
                  Recent bank accounts
                </h2>
                <p className="truncate text-[11px] text-black/40">
                  Newest customer accounts
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/bank-staff/operations/accounts"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-black/60 transition-colors hover:border-black/20 hover:text-black"
            >
              See all
              <ArrowRight size={12} />
            </Link>
          </div>

          {accountsQuery.isLoading ? (
            <div className="divide-y divide-black/5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center justify-between gap-3 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="size-9 shrink-0 rounded-xl bg-black/5" />
                    <div className="min-w-0 space-y-1.5">
                      <div className="h-3.5 w-28 rounded bg-black/5 sm:w-36" />
                      <div className="h-3 w-24 rounded bg-black/5 sm:w-28" />
                    </div>
                  </div>
                  <div className="h-5 w-16 shrink-0 rounded-full bg-black/5 sm:w-20" />
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/35">
                <Landmark size={22} />
              </div>
              <p className="mt-3 text-sm font-bold text-black">
                No bank accounts yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-black/45">
                Create an account for a registered customer.
              </p>
              <button
                type="button"
                onClick={() => openCreateAccount()}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                <Plus size={13} />
                Create account
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-black/5">
              {accounts.map((account) => (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedAccount(account)}
                    className="group flex w-full flex-col gap-2 py-3.5 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:flex-1">
                      <div className="flex min-w-0 items-center gap-3">
                        <AccountTypeIcon type={account.type} />
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-bold text-black">
                            {formatAccNo(account.accountNumber)}
                          </p>
                          <p className="truncate text-[11px] text-black/45">
                            {account.customerName}
                          </p>
                          <p className="truncate font-mono text-[10px] text-black/35">
                            {account.userId}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-black/25 transition-colors group-hover:text-black/60 sm:hidden"
                      />
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-2 pl-12 sm:justify-end sm:pl-0">
                      <div className="flex flex-wrap items-center gap-2 sm:block sm:text-right">
                        <p className="flex items-center gap-1 text-sm font-bold text-black sm:justify-end">
                          <Wallet size={12} className="shrink-0 text-black/35" />
                          {formatMoney(account.balance)}
                        </p>
                        <div className="sm:mt-0.5">
                          <AccountStatusBadge status={account.status} />
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="hidden text-black/25 transition-colors group-hover:text-black/60 sm:block"
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showRegister && (
        <StaffRegisterCustomerModal onClose={() => setShowRegister(false)} />
      )}

      {showCreateAccount && (
        <StaffCreateAccountModal
          onClose={closeCreateAccount}
          presetCustomer={presetCustomer}
        />
      )}

      <StaffCustomerDetailModal
        key={selectedCustomer?.id ?? "no-customer"}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onCreateAccount={openCreateAccount}
      />

      <StaffAccountDetailModal
        key={selectedAccount?.id ?? "no-account"}
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />
    </div>
  );
}
