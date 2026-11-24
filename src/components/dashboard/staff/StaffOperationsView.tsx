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
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-black/40">
            Bank Staff
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Customer Operations
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-black/60">
            Register customers, open bank accounts, verify customer information,
            and review account details from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-black/70 shadow-sm transition-all hover:border-black/20 hover:text-black disabled:opacity-50"
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
            className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-black/70 shadow-sm transition-all hover:border-black/20 hover:text-black"
          >
            <UserPlus size={14} />
            Register customer
          </button>
          <button
            type="button"
            onClick={() => openCreateAccount()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
          >
            <Plus size={14} />
            Create bank account
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-3xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-black/45">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-black">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-black/40">{stat.hint}</p>
            </div>
          );
        })}
      </div>

      {/* ── Recent customers & accounts ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent customers */}
        <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-black/50" />
              <div>
                <h2 className="text-base font-bold text-black">
                  Recent customers
                </h2>
                <p className="text-[11px] text-black/40">
                  Newest customer profiles
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/bank-staff/operations/customers"
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-black/60 transition-colors hover:border-black/20 hover:text-black"
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
                  className="flex animate-pulse items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-black/5" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-black/5" />
                      <div className="h-3 w-44 rounded bg-black/5" />
                    </div>
                  </div>
                  <div className="h-5 w-16 rounded-full bg-black/5" />
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
                    className="group flex w-full items-center justify-between gap-3 py-3.5 text-left"
                  >
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

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-black/55">
                          {customer.accountCount} account
                          {customer.accountCount === 1 ? "" : "s"}
                        </p>
                        <div className="mt-0.5">
                          <VerificationBadge verified={customer.verified} />
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-black/25 transition-colors group-hover:text-black/60"
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent accounts */}
        <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-black/50" />
              <div>
                <h2 className="text-base font-bold text-black">
                  Recent bank accounts
                </h2>
                <p className="text-[11px] text-black/40">
                  Newest customer accounts
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/bank-staff/operations/accounts"
              className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-black/60 transition-colors hover:border-black/20 hover:text-black"
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
                  className="flex animate-pulse items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-black/5" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-36 rounded bg-black/5" />
                      <div className="h-3 w-28 rounded bg-black/5" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded-full bg-black/5" />
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
                    className="group flex w-full items-center justify-between gap-3 py-3.5 text-left"
                  >
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

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="flex items-center justify-end gap-1 text-sm font-bold text-black">
                          <Wallet size={12} className="text-black/35" />
                          {formatMoney(account.balance)}
                        </p>
                        <div className="mt-0.5">
                          <AccountStatusBadge status={account.status} />
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-black/25 transition-colors group-hover:text-black/60"
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
