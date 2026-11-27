"use client";

import { useId, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Filter,
  Landmark,
  Plus,
  RefreshCw,
  Search,
  Snowflake,
  X,
} from "lucide-react";
import {
  useGetAdminAccountsQuery,
  useUpdateAdminAccountMutation,
  type AdminAccountStatusCounts,
  type StaffBankAccount,
} from "@/lib/redux/api";
import { errorToast, successToast } from "@/lib/utils/toasts";
import {
  AccountStatusBadge,
  AccountTypeIcon,
  formatAccNo,
  formatDateTime,
  formatMoney,
  getApiError,
} from "@/components/dashboard/staff/staffUi";
import StaffCreateAccountModal from "@/components/dashboard/staff/StaffCreateAccountModal";
import AdminAccountDetailModal from "@/components/dashboard/admin/AdminAccountDetailModal";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

const ACCOUNT_TYPES = [
  { label: "All Types", value: "all" },
  { label: "Savings", value: "savings" },
  { label: "Current", value: "current" },
  { label: "Business", value: "business" },
] as const;

const ACCOUNT_STATUSES: {
  label: string;
  value: keyof AdminAccountStatusCounts;
}[] = [
  { label: "Needs Approval", value: "needs_approval" },
  { label: "All Status", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Under Review", value: "under_review" },
  { label: "Active", value: "active" },
  { label: "Frozen", value: "frozen" },
  { label: "Rejected", value: "rejected" },
];

export default function AdminBankAccountsView() {
  const [statusFilter, setStatusFilter] =
    useState<keyof AdminAccountStatusCounts>("needs_approval");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentLimit, setCurrentLimit] = useState(15);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAccount, setSelectedAccount] =
    useState<StaffBankAccount | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const searchInputId = useId();

  const [updateAccount] = useUpdateAdminAccountMutation();

  const { data, isLoading, isFetching, refetch } = useGetAdminAccountsQuery({
    limit: currentLimit,
    offset: 0,
    type: typeFilter,
    status: statusFilter,
    search: search.trim(),
  });

  const accounts = data?.accounts || [];
  const total = data?.total || 0;
  const hasMore = data?.hasMore || false;
  const statusCounts = data?.statusCounts;

  const handleStatusChange = (value: keyof AdminAccountStatusCounts) => {
    setStatusFilter(value);
    setCurrentLimit(15);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setCurrentLimit(15);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentLimit(15);
  };

  const handleResetFilters = () => {
    setStatusFilter("needs_approval");
    setTypeFilter("all");
    setSearch("");
    setCurrentLimit(15);
  };

  const quickStatusUpdate = async (
    account: StaffBankAccount,
    status: "active" | "frozen",
    reason?: string
  ) => {
    setUpdatingId(account.id);
    try {
      const response = await updateAccount({
        accountId: account.id,
        action: "status",
        status,
        reason,
      }).unwrap();
      successToast(response.message);
    } catch (err: unknown) {
      errorToast(getApiError(err, "Failed to update the account status."));
    } finally {
      setUpdatingId(null);
    }
  };

  const hasActiveFilters =
    typeFilter !== "all" || statusFilter !== "needs_approval" || search !== "";

  return (
    <div className="space-y-5 sm:space-y-6">
      <DashboardPageHeader
        eyebrow="Admin"
        title="Bank Account Management"
        description="Review account approvals, manage statuses, update account information, and set transaction limits."
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
              onClick={() => setShowCreate(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2C2C2C] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
            >
              <Plus size={14} />
              Create bank account
            </button>
          </>
        }
      />

      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/40"
            />
            <label htmlFor={searchInputId} className="sr-only">
              Search by account number
            </label>
            <input
              id={searchInputId}
              type="text"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search by account number..."
              className="h-12 w-full rounded-2xl bg-[#F3F3EE] pl-11 pr-10 text-sm font-medium text-black outline-none placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-[#2C2C2C]"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear account search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-black/5 pt-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-black/50">
                Type:
              </span>
              {ACCOUNT_TYPES.map((item) => {
                const active = typeFilter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleTypeChange(item.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-[#2C2C2C] text-white shadow-sm"
                        : "bg-[#F3F3EE] text-black/70 hover:bg-black/10 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-bold text-black/50">
                Status:
              </span>
              {ACCOUNT_STATUSES.map((item) => {
                const active = statusFilter === item.value;
                const count = statusCounts?.[item.value];
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleStatusChange(item.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-[#2C2C2C] text-white shadow-sm"
                        : "bg-[#F3F3EE] text-black/70 hover:bg-black/10 hover:text-black"
                    }`}
                  >
                    {item.label}
                    {count !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-black/10 text-black/70"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 text-xs">
            <span className="text-black/50">Active filters:</span>
            {typeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium capitalize text-black">
                Type: <strong>{typeFilter}</strong>
                <button
                  type="button"
                  onClick={() => handleTypeChange("all")}
                  aria-label="Remove account type filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter !== "needs_approval" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Status:{" "}
                <strong className="capitalize">
                  {statusFilter.replace("_", " ")}
                </strong>
                <button
                  type="button"
                  onClick={() => handleStatusChange("needs_approval")}
                  aria-label="Remove account status filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 font-medium text-black">
                Search: <strong>&ldquo;{search}&rdquo;</strong>
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  aria-label="Remove account search filter"
                  className="hover:text-red-600"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto text-xs font-semibold text-black/60 underline hover:text-black"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex flex-col gap-2 border-b border-black/5 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-black/50" />
            <h2 className="text-base font-bold text-black sm:text-lg">
              Bank Account Records
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-black/45">
            {statusCounts && statusCounts.needs_approval > 0 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                {statusCounts.needs_approval} awaiting approval
              </span>
            )}
            <span className="text-black/50">
              {isLoading ? "Loading..." : `Showing ${accounts.length} of ${total}`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-black/5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center justify-between py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-black/5" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 rounded bg-black/5" />
                    <div className="h-3 w-48 rounded bg-black/5" />
                  </div>
                </div>
                <div className="h-5 w-20 rounded bg-black/5" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#F3F3EE] text-black/40">
              <Filter size={24} />
            </div>
            <h3 className="mt-4 text-base font-bold text-black">
              No bank accounts found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-black/50">
              {statusFilter === "needs_approval" && !search && typeFilter === "all"
                ? "There are no accounts waiting for admin approval right now."
                : "No accounts match the current search or filters. Try another account number or reset the filters."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 rounded-full bg-[#2C2C2C] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                Clear all filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#2C2C2C] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C]"
              >
                <Plus size={13} />
                Create bank account
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/5 text-[11px] font-bold uppercase tracking-wider text-black/40">
                    <th className="pb-3 pl-2">Account</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Balance</th>
                    <th className="pb-3">Limit</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Opened</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {accounts.map((account) => {
                    const created = formatDateTime(account.createdAt);
                    const isUpdating = updatingId === account.id;
                    return (
                      <tr
                        key={account.id}
                        className="transition-colors hover:bg-black/2"
                      >
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <AccountTypeIcon type={account.type} />
                            <div>
                              <span className="font-mono text-xs font-bold text-black">
                                {formatAccNo(account.accountNumber)}
                              </span>
                              <p className="max-w-36 truncate font-mono text-[10px] text-black/40">
                                {account.userId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="max-w-40">
                            <p className="truncate text-xs font-semibold text-black">
                              {account.customerName}
                            </p>
                            <p className="truncate text-[11px] text-black/45">
                              {account.customerEmail || "—"}
                            </p>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-black/60">
                            {account.type}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-bold text-black">
                            {formatMoney(account.balance)}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-semibold text-black/70">
                            {formatMoney(account.transactionLimit || 0)}
                          </span>
                        </td>
                        <td className="py-4">
                          <AccountStatusBadge status={account.status} />
                        </td>
                        <td className="py-4">
                          <p className="text-xs font-semibold text-black">
                            {created.date}
                          </p>
                          <p className="text-[11px] text-black/40">
                            {created.time}
                          </p>
                        </td>
                        <td className="py-4 pr-2">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedAccount(account)}
                              aria-label={`View account ${account.accountNumber}`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[11px] font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                            >
                              <Eye size={13} />
                              View
                            </button>

                            {(account.status === "pending" ||
                              account.status === "under_review") && (
                              <button
                                type="button"
                                onClick={() =>
                                  quickStatusUpdate(
                                    account,
                                    "active",
                                    "Approved by administrator"
                                  )
                                }
                                disabled={isUpdating}
                                aria-label={`Approve account ${account.accountNumber}`}
                                title="Approve and activate"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <RefreshCw
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle2 size={13} />
                                )}
                              </button>
                            )}

                            {account.status === "active" && (
                              <button
                                type="button"
                                onClick={() =>
                                  quickStatusUpdate(account, "frozen")
                                }
                                disabled={isUpdating}
                                aria-label={`Freeze account ${account.accountNumber}`}
                                title="Freeze account"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <RefreshCw
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Snowflake size={13} />
                                )}
                              </button>
                            )}

                            {account.status === "frozen" && (
                              <button
                                type="button"
                                onClick={() =>
                                  quickStatusUpdate(
                                    account,
                                    "active",
                                    "Unfrozen by administrator"
                                  )
                                }
                                disabled={isUpdating}
                                aria-label={`Unfreeze account ${account.accountNumber}`}
                                title="Unfreeze account"
                                className="inline-flex size-8 items-center justify-center rounded-full border border-black/10 bg-white text-black/50 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <RefreshCw
                                    size={13}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <CheckCircle2 size={13} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {accounts.map((account) => {
                const created = formatDateTime(account.createdAt);
                const isUpdating = updatingId === account.id;
                return (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-black/5 bg-[#F9F9F7] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <AccountTypeIcon type={account.type} />
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-bold text-black">
                            {formatAccNo(account.accountNumber)}
                          </p>
                          <p className="truncate text-xs text-black/50">
                            {account.customerName}
                          </p>
                        </div>
                      </div>
                      <AccountStatusBadge status={account.status} />
                    </div>

                    <div className="mt-3 space-y-1.5 border-t border-black/5 pt-2.5 text-[11px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">Balance</span>
                        <span className="font-bold text-black">
                          {formatMoney(account.balance)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">Transaction limit</span>
                        <span className="font-semibold text-black/70">
                          {formatMoney(account.transactionLimit || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-black/40">Opened</span>
                        <span className="font-semibold text-black/70">
                          {created.date}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAccount(account)}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white text-xs font-semibold text-black/70 transition-colors hover:border-black/20 hover:text-black"
                      >
                        <Eye size={14} />
                        Manage
                      </button>

                      {(account.status === "pending" ||
                        account.status === "under_review") && (
                        <button
                          type="button"
                          onClick={() =>
                            quickStatusUpdate(
                              account,
                              "active",
                              "Approved by administrator"
                            )
                          }
                          disabled={isUpdating}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2C2C2C] text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Approve
                        </button>
                      )}

                      {account.status === "active" && (
                        <button
                          type="button"
                          onClick={() => quickStatusUpdate(account, "frozen")}
                          disabled={isUpdating}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-black/15 bg-white text-xs font-semibold text-black/75 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Snowflake size={14} />
                          )}
                          Freeze
                        </button>
                      )}

                      {account.status === "frozen" && (
                        <button
                          type="button"
                          onClick={() =>
                            quickStatusUpdate(
                              account,
                              "active",
                              "Unfrozen by administrator"
                            )
                          }
                          disabled={isUpdating}
                          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2C2C2C] text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          Unfreeze
                        </button>
                      )}
                    </div>
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
                Showing {accounts.length} of {total} total accounts
              </p>
            </div>
          ) : total > 0 ? (
            <p className="text-xs font-semibold text-black/40">
              All {total} accounts loaded
            </p>
          ) : null}
        </div>
      </div>

      {showCreate && (
        <StaffCreateAccountModal
          mode="admin"
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setStatusFilter("all");
            setCurrentLimit(15);
          }}
        />
      )}

      <AdminAccountDetailModal
        key={selectedAccount?.id ?? "no-account"}
        account={selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />
    </div>
  );
}
