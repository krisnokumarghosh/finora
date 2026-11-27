"use client";

import { useId, useState } from "react";
import {
  Eye,
  Filter,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  useGetStaffCustomersQuery,
  type StaffCustomer,
} from "@/lib/redux/api";
import {
  VerificationBadge,
  formatDateTime,
  formatMoney,
  initials,
} from "@/components/dashboard/staff/staffUi";
import StaffRegisterCustomerModal from "@/components/dashboard/staff/StaffRegisterCustomerModal";
import StaffCustomerDetailModal from "@/components/dashboard/staff/StaffCustomerDetailModal";
import StaffCreateAccountModal from "@/components/dashboard/staff/StaffCreateAccountModal";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

export default function StaffCustomersView() {
  const [search, setSearch] = useState("");
  const [currentLimit, setCurrentLimit] = useState(15);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<StaffCustomer | null>(null);
  const [createFor, setCreateFor] = useState<StaffCustomer | null>(null);
  const searchInputId = useId();

  const { data, isLoading, isFetching, refetch } = useGetStaffCustomersQuery({
    limit: currentLimit,
    offset: 0,
    search: search.trim(),
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const verifiedCount = data?.verifiedCount || 0;
  const hasMore = data?.hasMore || false;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentLimit(15);
  };

  const handleCreateAccount = (customer: StaffCustomer) => {
    setSelectedCustomer(null);
    setCreateFor(customer);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Bank Staff"
        title="All Customers"
        description="View registered customer profiles and search by user ID."
        actions={
          <>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-black/70 shadow-sm transition-all hover:border-black/20 hover:text-black disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isFetching ? "animate-spin text-black" : ""}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
            >
              <UserPlus size={14} />
              Register customer
            </button>
          </>
        }
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="relative w-full">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
          />
          <label htmlFor={searchInputId} className="sr-only">
            Search by user ID
          </label>
          <input
            id={searchInputId}
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by user ID (e.g. 6a86...)"
            className="h-12 w-full rounded-2xl bg-[#F3F3EE] pl-11 pr-10 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label="Clear user ID search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-black/40">
          <span>
            Search matches the customer&apos;s user ID. No other filters are
            applied.
          </span>
          {data && (
            <span className="font-semibold text-black/50">
              {verifiedCount} verified of {data.total} total customers
            </span>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-black/50" />
            <h2 className="text-base font-bold text-black sm:text-lg">
              Customer Records
            </h2>
          </div>
          <span className="text-xs font-semibold text-black/50">
            {isLoading ? "Loading..." : `Showing ${customers.length} of ${total}`}
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-black/5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-black/5" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 rounded bg-black/5" />
                    <div className="h-3 w-48 rounded bg-black/5" />
                  </div>
                </div>
                <div className="h-5 w-20 rounded bg-black/5" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/40">
              <Filter size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-black">
              No customers found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-black/50">
              {search
                ? "No customer matches this user ID. Check the ID and try again."
                : "No customers have been registered yet."}
            </p>
            {search ? (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="mt-4 rounded-full bg-[#2C2C2C] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#2C2C2C] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                <UserPlus size={13} />
                Register customer
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    <th className="pb-3 pl-2">Customer</th>
                    <th className="pb-3">User ID</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3">Accounts</th>
                    <th className="pb-3">Total Balance</th>
                    <th className="pb-3">Verification</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {customers.map((customer) => {
                    const joined = formatDateTime(customer.createdAt);
                    return (
                      <tr
                        key={customer.id}
                        className="transition-colors hover:bg-black/[0.02]"
                      >
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[10px] font-bold text-white">
                              {initials(customer.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-44 truncate text-xs font-bold text-black">
                                {customer.name}
                              </p>
                              <p className="max-w-44 truncate text-[11px] text-black/45">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="block max-w-40 truncate font-mono text-[11px] font-semibold text-black/60">
                            {customer.id}
                          </span>
                        </td>
                        <td className="py-4">
                          <p className="text-xs font-semibold text-black">
                            {joined.date}
                          </p>
                          <p className="text-[11px] text-black/40">
                            {joined.time}
                          </p>
                        </td>
                        <td className="py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-black/60">
                            {customer.accountCount}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-bold text-black">
                            {formatMoney(customer.totalBalance)}
                          </span>
                        </td>
                        <td className="py-4">
                          <VerificationBadge verified={customer.verified} />
                        </td>
                        <td className="py-4 pr-2">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(customer)}
                              aria-label={`View ${customer.name}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[11px] font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                            >
                              <Eye size={13} />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {customers.map((customer) => {
                const joined = formatDateTime(customer.createdAt);
                return (
                  <div
                    key={customer.id}
                    className="rounded-2xl border border-black/5 bg-[#F9F9F7] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[11px] font-bold text-white">
                          {initials(customer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-black">
                            {customer.name}
                          </p>
                          <p className="truncate text-xs text-black/50">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                      <VerificationBadge verified={customer.verified} />
                    </div>

                    <div className="mt-3 space-y-1.5 border-t border-black/5 pt-2.5 text-[11px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">User ID</span>
                        <span className="truncate font-mono font-semibold text-black/60">
                          {customer.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">Joined</span>
                        <span className="font-semibold text-black/70">
                          {joined.date}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">Accounts</span>
                        <span className="font-semibold text-black/70">
                          {customer.accountCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">Total balance</span>
                        <span className="font-bold text-black">
                          {formatMoney(customer.totalBalance)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(customer)}
                      className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                    >
                      <Eye size={14} />
                      View customer
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-center border-t border-black/5 pt-6 text-center">
          {hasMore ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentLimit((previous) => previous + 15)}
                disabled={isFetching}
                className="inline-flex h-12 min-w-50 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-8 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
              >
                {isFetching ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Loading more...
                  </>
                ) : (
                  "Load More (15 more)"
                )}
              </button>
              <p className="text-xs text-black/40">
                Showing {customers.length} of {total} total customers
              </p>
            </div>
          ) : total > 0 ? (
            <p className="text-xs font-semibold text-black/40">
              All {total} customers loaded
            </p>
          ) : null}
        </div>
      </div>

      {showRegister && (
        <StaffRegisterCustomerModal onClose={() => setShowRegister(false)} />
      )}

      <StaffCustomerDetailModal
        key={selectedCustomer?.id ?? "no-customer"}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onCreateAccount={handleCreateAccount}
      />

      {createFor && (
        <StaffCreateAccountModal
          presetCustomer={createFor}
          onClose={() => setCreateFor(null)}
        />
      )}
    </div>
  );
}
