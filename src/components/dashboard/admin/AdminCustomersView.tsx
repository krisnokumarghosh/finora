"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  Filter,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  UserX,
  Users,
  X,
} from "lucide-react";
import {
  useGetAdminCustomersQuery,
  type AdminCustomer,
  type UserStatus,
} from "@/lib/redux/api";
import {
  VerificationBadge,
  formatDateTime,
  formatMoney,
  initials,
} from "@/components/dashboard/staff/staffUi";
import AdminCustomerDetailModal from "@/components/dashboard/admin/AdminCustomerDetailModal";
import AdminCustomerTransactionsModal from "@/components/dashboard/admin/AdminCustomerTransactionsModal";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

export default function AdminCustomersView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentLimit, setCurrentLimit] = useState(15);
  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminCustomer | null>(null);
  const [txCustomer, setTxCustomer] = useState<AdminCustomer | null>(null);
  const searchInputId = useId();

  const { data, isLoading, isFetching, refetch } = useGetAdminCustomersQuery({
    limit: currentLimit,
    offset: 0,
    search: search.trim(),
    status: statusFilter,
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const verifiedCount = data?.verifiedCount || 0;
  const hasMore = data?.hasMore || false;
  const statusCounts = data?.statusCounts;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentLimit(15);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentLimit(15);
  };

  const handleOpenTransactions = (customer: AdminCustomer) => {
    setSelectedCustomer(null);
    setTxCustomer(customer);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Admin"
        title="Customer Management"
        description="View, search, monitor, activate, deactivate, or block customer accounts."
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push("/dashboard/admin/transactions")}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
            >
              <Receipt size={14} />
              Transactions
            </button>
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
          </>
        }
      />

      {/* ── Search & Filter card ── */}
      <div className="space-y-4 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        {/* Search input */}
        <div className="relative w-full">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
          />
          <label htmlFor={searchInputId} className="sr-only">
            Search customers by name, email, or user ID
          </label>
          <input
            id={searchInputId}
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by name, email, or user ID..."
            className="h-12 w-full rounded-2xl bg-[#F3F3EE] pl-11 pr-10 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-col gap-3 border-t border-black/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-black/40">
              Filter by status:
            </span>
            {(
              [
                { label: "All Status", value: "all", count: statusCounts?.all },
                {
                  label: "Active",
                  value: "active",
                  count: statusCounts?.active,
                },
                {
                  label: "Inactive",
                  value: "inactive",
                  count: statusCounts?.inactive,
                },
                {
                  label: "Blocked",
                  value: "blocked",
                  count: statusCounts?.blocked,
                },
              ] as const
            ).map((filter) => {
              const active = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => handleStatusFilterChange(filter.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#2C2C2C] text-white shadow-sm"
                      : "bg-[#F3F3EE] text-black/60 hover:bg-black/10 hover:text-black"
                  }`}
                >
                  {filter.label}
                  {filter.count !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-black/10 text-black/70"
                      }`}
                    >
                      {filter.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-black/40 sm:text-right">
            {data && (
              <span className="font-semibold text-black/50">
                {verifiedCount} verified of {data.total} total customers
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Customer list card ── */}
      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-black/50" />
            <h2 className="text-base font-bold text-black sm:text-lg">
              Customer Records
            </h2>
          </div>
          <span className="text-xs font-semibold text-black/50">
            {isLoading
              ? "Loading..."
              : `Showing ${customers.length} of ${total}`}
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
              {search || statusFilter !== "all"
                ? "No customers match the current search or status filter. Try clearing filters."
                : "No customers have registered in the platform yet."}
            </p>
            {(search || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCurrentLimit(15);
                }}
                className="mt-4 rounded-full bg-[#2C2C2C] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    <th className="pb-3 pl-2">Customer</th>
                    <th className="pb-3">User ID</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3">Accounts</th>
                    <th className="pb-3">Total Balance</th>
                    <th className="pb-3">Status</th>
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
                        onClick={() => setSelectedCustomer(customer)}
                        className="cursor-pointer transition-colors hover:bg-black/[0.02]"
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
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              customer.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : customer.status === "blocked"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {customer.status === "active" ? (
                              <CheckCircle2 size={12} />
                            ) : customer.status === "blocked" ? (
                              <ShieldAlert size={12} />
                            ) : (
                              <UserX size={12} />
                            )}
                            {customer.status.charAt(0).toUpperCase() +
                              customer.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4">
                          <VerificationBadge verified={customer.verified} />
                        </td>
                        <td className="py-4 pr-2">
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Transaction Button */}
                            <button
                              type="button"
                              onClick={() => setTxCustomer(customer)}
                              aria-label={`View transactions of ${customer.name}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#2C2C2C] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                            >
                              <Receipt size={13} />
                              Transaction
                            </button>

                            {/* View Button */}
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

            {/* Mobile cards */}
            <div className="space-y-3 lg:hidden">
              {customers.map((customer) => {
                const joined = formatDateTime(customer.createdAt);
                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer rounded-2xl border border-black/5 bg-[#F9F9F7] p-4 transition-colors hover:border-black/20"
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
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          customer.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : customer.status === "blocked"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {customer.status}
                      </span>
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
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">Verification</span>
                        <VerificationBadge verified={customer.verified} />
                      </div>
                    </div>

                    <div
                      className="mt-3 grid grid-cols-2 gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setTxCustomer(customer)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2C2C2C] text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
                      >
                        <Receipt size={14} />
                        Transaction
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Load more */}
        <div className="mt-8 flex flex-col items-center justify-center border-t border-black/5 pt-6 text-center">
          {hasMore ? (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentLimit((prev) => prev + 15)}
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

      {/* ── Modals ── */}
      <AdminCustomerDetailModal
        key={selectedCustomer?.id ?? "no-customer"}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onViewTransactions={handleOpenTransactions}
      />

      <AdminCustomerTransactionsModal
        key={txCustomer?.id ? `tx-${txCustomer.id}` : "no-tx"}
        customer={txCustomer}
        onClose={() => setTxCustomer(null)}
      />
    </div>
  );
}
